export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/config';
import { computeAppBaseUrl } from '@/lib/stripe';
import { provisionIncomingNumber } from '@/lib/twilio';
import { getProvisioningForUser, linkTwilioNumber, markProvisioningFailure, markProvisioningPending } from '@/lib/userStore';

function json(status, body) {
  return NextResponse.json(body, { status });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return json(401, { error: 'Unauthorized' });
  }

  const userId = session.user.id;

  try {
    await markProvisioningPending(userId);

    const baseUrl = computeAppBaseUrl();
    const provisioned = await provisionIncomingNumber({ userId, baseUrl });
    await linkTwilioNumber({
      userId,
      incomingNumberSid: provisioned.sid,
      phoneNumber: provisioned.phoneNumber,
    });

    return json(200, {
      status: 'active',
      phoneNumber: provisioned.phoneNumber,
      sid: provisioned.sid,
    });
  } catch (err) {
    console.error('[provisioning/retry] failed', err?.message || err);
    await markProvisioningFailure({ userId, error: err?.message || 'Provisioning failed' });
    return json(500, { error: err?.message || 'Provisioning failed' });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return json(401, { error: 'Unauthorized' });
  }
  const provisioning = await getProvisioningForUser(session.user.id);
  return json(200, { provisioning });
}
