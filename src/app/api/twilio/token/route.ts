import { NextRequest, NextResponse } from 'next/server';
import { getTwilioService, isMockMode } from '@/lib/twilio';

export async function POST(request: NextRequest) {
  try {
    const { identity } = await request.json();

    if (!identity) {
      return NextResponse.json(
        { error: 'Identity is required for token generation' },
        { status: 400 }
      );
    }

    // Mock mode or missing credentials guard
    if (isMockMode()) {
      return NextResponse.json(
        { error: 'Twilio disabled in mock mode' },
        { status: 501 }
      );
    }

    // Generate Twilio access token for the user
    const token = getTwilioService().generateAccessToken(identity);

    return NextResponse.json({ 
      token,
      identity,
      expires: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    });
  } catch (error) {
    console.error('Error generating Twilio token:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}
