import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTwilioService, isMockMode } from '@/lib/twilio';

type Params = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const { consent } = (await request.json()) as { consent: boolean };

    if (typeof consent !== 'boolean') {
      return NextResponse.json({ error: 'Missing consent boolean' }, { status: 400 });
    }

    const call = await prisma.call.update({
      where: { id },
      data: { consentGiven: consent } as any,
    });

    if (!isMockMode() && consent && call.twilioSid) {
      await getTwilioService().updateRecordingStatus(call.twilioSid, true);
    }

    return NextResponse.json({ id: call.id, consentGiven: call.consentGiven });
  } catch (error) {
    console.error('Error updating consent/recording:', error);
    return NextResponse.json({ error: 'Failed to update consent' }, { status: 500 });
  }
}

