import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const duration = formData.get('CallDuration') as string;

    console.log('Twilio call status update:', {
      callSid,
      callStatus,
      from,
      to,
      duration
    });

    // Persist/update call lifecycle in database
    const now = new Date();
    const toUpdate: Prisma.CallUpdateInput = {
      twilioStatus: callStatus,
    } as any;

    // Map Twilio status to app status
    // initiated/ringing/queued => PROCESSING; answered/in-progress => ACTIVE; completed => COMPLETED
    const normalized = (callStatus || '').toLowerCase();
    if (['initiated', 'ringing', 'queued'].includes(normalized)) {
      (toUpdate as any).status = 'PROCESSING';
    } else if (['in-progress', 'answered'].includes(normalized)) {
      (toUpdate as any).status = 'ACTIVE';
    } else if (normalized === 'completed') {
      (toUpdate as any).status = 'COMPLETED';
      (toUpdate as any).endTime = now;
      if (duration) (toUpdate as any).duration = String(duration);
    }

    (toUpdate as any).toNumber = to ?? undefined;
    (toUpdate as any).fromNumber = from ?? undefined;

    try {
      await prisma.call.update({
        where: { twilioSid: callSid },
        data: toUpdate,
      });
    } catch (e) {
      // If the call doesn't exist yet, create a minimal record
      await prisma.call.upsert({
        where: { twilioSid: callSid },
        update: toUpdate,
        create: {
          callerName: 'Coordinator',
          callerType: 'OUTBOUND',
          clientName: null,
          status: 'PROCESSING',
          twilioSid: callSid,
          toNumber: to ?? undefined,
          fromNumber: from ?? undefined,
          twilioStatus: callStatus ?? undefined,
          startTime: now,
        } as any,
      });
    }

    // Twilio expects a 200 OK response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Twilio status webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process status update' },
      { status: 500 }
    );
  }
}
