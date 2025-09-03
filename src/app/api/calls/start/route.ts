import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';
import { getTwilioService, isMockMode } from '@/lib/twilio';
import { formatAustralianNumber } from '@/lib/phone';

type StartCallBody = {
  to: string;
  from?: string;
  callerName?: string;
  callerType?: 'FAMILY' | 'RESIDENT' | 'STAFF' | 'EXTERNAL' | 'OUTBOUND';
  clientId?: string;
  clientName?: string;
  consentGiven?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StartCallBody;

    if (!body?.to) {
      return NextResponse.json({ error: 'Missing required field: to' }, { status: 400 });
    }

    const to = formatAustralianNumber(body.to);
    const fromEnv = process.env.TWILIO_PHONE_NUMBER;
    const from = body.from ?? fromEnv;
    if (!from) {
      return NextResponse.json({ error: 'Missing caller ID (TWILIO_PHONE_NUMBER or from)' }, { status: 400 });
    }

    const baseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL;
    const twimlUrl = `${baseUrl}/api/twilio/voice`;

    // If in mock mode, simulate the call without contacting Twilio
    if (isMockMode()) {
      const call = await prisma.call.create({
        data: {
          callerName: body.callerName ?? 'Coordinator',
          callerType: body.callerType ?? 'OUTBOUND',
          clientName: body.clientName ?? null,
          consentGiven: Boolean(body.consentGiven),
          status: 'ACTIVE',
          twilioSid: `MOCK-${Date.now()}`,
          toNumber: to,
          fromNumber: from,
          twilioStatus: 'in-progress',
        },
      });

      return NextResponse.json({
        callId: call.id,
        twilioSid: call.twilioSid,
        status: call.status,
        to: call.toNumber,
        from: call.fromNumber,
        mock: true,
      });
    }

    // Real Twilio call
    const result = await getTwilioService().initiateCall(to, from, twimlUrl);

    const createData: Record<string, unknown> = {
      callerName: body.callerName ?? 'Coordinator',
      callerType: body.callerType ?? 'OUTBOUND',
      clientName: body.clientName ?? null,
      consentGiven: Boolean(body.consentGiven),
      status: 'ACTIVE',
      twilioSid: result.callSid,
      toNumber: result.to,
      fromNumber: result.from,
      twilioStatus: String(result.status ?? ''),
    };

    const call = await prisma.call.create({
      data: createData as unknown as Prisma.CallCreateInput,
    });

    return NextResponse.json({
      callId: call.id,
      twilioSid: call.twilioSid,
      status: call.status,
      to: call.toNumber,
      from: call.fromNumber,
    });
  } catch (error) {
    console.error('Error starting call:', error);
    return NextResponse.json({ error: 'Failed to start call' }, { status: 500 });
  }
}
