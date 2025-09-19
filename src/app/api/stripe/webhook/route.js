export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

import { computeAppBaseUrl, getStripeClient } from '@/lib/stripe';
import { getProvisioningForUser, linkStripeCustomer, linkTwilioNumber, markProvisioningFailure, markProvisioningPending } from '@/lib/userStore';
import { scrubValue } from '@/lib/persistence/secureStore';
import { provisionIncomingNumber } from '@/lib/twilio';

function json(status, body) {
  return NextResponse.json(body, { status });
}

export async function POST(request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe/webhook] missing STRIPE_WEBHOOK_SECRET');
    return json(500, { error: 'Webhook secret not configured' });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return json(400, { error: 'Missing stripe-signature header' });
  }

  const stripe = getStripeClient();
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed', err?.message || err);
    return json(400, { error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data?.object;
        const customerId = session?.customer;
        const email = session?.customer_details?.email || session?.customer_email || null;
        const linkedUserId = session?.metadata?.appUserId || null;

        console.info('[stripe/webhook] checkout.session.completed', {
          customer: scrubValue(customerId || ''),
          email: scrubValue(email || ''),
          linkedUserId: scrubValue(linkedUserId || ''),
        });

        if (linkedUserId && customerId) {
          await linkStripeCustomer({ userId: linkedUserId, customerId });
          const provisioning = await getProvisioningForUser(linkedUserId);
          if (!provisioning?.twilioNumberSid) {
            try {
              await markProvisioningPending(linkedUserId);
              const baseUrl = computeAppBaseUrl();
              const provisioned = await provisionIncomingNumber({ userId: linkedUserId, baseUrl });
              await linkTwilioNumber({
                userId: linkedUserId,
                incomingNumberSid: provisioned.sid,
                phoneNumber: provisioned.phoneNumber,
              });
              console.info('[stripe/webhook] provisioned twilio number', {
                userId: scrubValue(linkedUserId),
                sid: scrubValue(provisioned.sid),
                phoneNumber: scrubValue(provisioned.phoneNumber),
              });
            } catch (provisionErr) {
              console.error('[stripe/webhook] provisioning failed', provisionErr?.message || provisionErr);
              await markProvisioningFailure({ userId: linkedUserId, error: provisionErr?.message || 'Provisioning failed' });
            }
          }
        }

        // TODO: trigger Twilio number provisioning workflow here.
        break;
      }
      default: {
        if (!event.type?.startsWith('charge.') && !event.type?.startsWith('invoice.')) {
          console.debug('[stripe/webhook] unhandled event', event.type);
        }
        break;
      }
    }

    return json(200, { received: true });
  } catch (err) {
    console.error('[stripe/webhook] handler error', err?.message || err);
    return json(500, { error: 'Webhook handler failure' });
  }
}

export async function GET() {
  return json(405, { error: 'Method not allowed' });
}
