import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';
import { getTwilioService, isMockMode } from '@/lib/twilio';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { consent } = (await request.json()) as { consent: boolean };

    if (typeof consent !== 'boolean') {
      return NextResponse.json({ error: 'Missing consent boolean' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { consentGiven: consent };
    const call = await prisma.call.update({
      where: { id },
      data: updateData as unknown as Prisma.CallUpdateInput,
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
