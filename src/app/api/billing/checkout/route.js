export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/config';
import { getStripeClient, getCheckoutSuccessUrl, getCheckoutCancelUrl } from '@/lib/stripe';
import { getUserById } from '@/lib/userStore';

function normalizeEmail(value) {
  return (value || '').trim().toLowerCase();
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const payload = await request.json().catch(() => ({}));
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
    }

    const rawEmail = payload.email || session?.user?.email;
    const email = normalizeEmail(rawEmail);
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const lineItems = [{ price: priceId, quantity: 1 }];
    const mode = process.env.STRIPE_CHECKOUT_MODE || 'subscription';

    const metadata = {
      appUserId: session?.user?.id || '',
      flow: 'bilbyai-alpha',
    };

    const params = {
      mode,
      line_items: lineItems,
      allow_promotion_codes: true,
      success_url: getCheckoutSuccessUrl(),
      cancel_url: getCheckoutCancelUrl(),
      metadata,
    };

    let linkedCustomerId = session?.user?.stripeCustomerId || null;
    if (session?.user?.id && !linkedCustomerId) {
      const stored = await getUserById(session.user.id);
      linkedCustomerId = stored?.stripeCustomerId || null;
    }

    if (linkedCustomerId) {
      params.customer = linkedCustomerId;
    } else {
      params.customer_email = email;
    }

    if (process.env.STRIPE_TAX_RATE_ID) {
      params.line_items = lineItems.map((item) => ({
        ...item,
        tax_rates: [process.env.STRIPE_TAX_RATE_ID],
      }));
    }

    const checkout = await stripe.checkout.sessions.create(params);
    return NextResponse.json({ sessionId: checkout.id, url: checkout.url }, { status: 200 });
  } catch (err) {
    const message = err?.message || 'Failed to create checkout session';
    console.error('[billing/checkout] error', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
