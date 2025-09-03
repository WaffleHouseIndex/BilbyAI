import twilio, { Twilio, jwt } from 'twilio';

// Twilio configuration and utilities for BilbyAI
export class TwilioService {
  private client: Twilio | null = null;

  private getClient(): Twilio {
    if (this.client) return this.client;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in environment variables.');
    }

    this.client = twilio(accountSid, authToken);
    return this.client;
  }

  /**
   * Generate an access token for Twilio Voice SDK
   * Used for WebRTC client initialization
   */
  generateAccessToken(identity: string, outgoingApplicationSid?: string): string {
    const { VoiceGrant } = jwt.AccessToken;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;

    if (!accountSid || !apiKey || !apiSecret) {
      throw new Error('Twilio API credentials missing. Please set TWILIO_ACCOUNT_SID, TWILIO_API_KEY and TWILIO_API_SECRET.');
    }

    const accessToken = new jwt.AccessToken(
      accountSid,
      apiKey,
      apiSecret,
      { identity, ttl: 3600 }
    );

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: outgoingApplicationSid || process.env.TWILIO_TWIML_APP_SID,
      incomingAllow: true
    });

    accessToken.addGrant(voiceGrant);
    return accessToken.toJwt();
  }

  /**
   * Create a new call record in Twilio
   * Used for outbound calls through the dashboard
   */
  async initiateCall(
    to: string,
    from: string,
    twimlUrl: string
  ): Promise<{ callSid: string; status: string | null; to: string | null; from: string | null }> {
    try {
      const baseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL;
      const call = await this.getClient().calls.create({
        to: to,
        from: from,
        url: twimlUrl,
        record: false, // We'll handle recording based on consent
        statusCallback: baseUrl ? `${baseUrl}/api/twilio/status` : undefined,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      });

      return {
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from
      };
    } catch (error) {
      console.error('Error initiating call:', error);
      throw error;
    }
  }

  /**
   * Update call recording status based on consent
   */
  async updateRecordingStatus(callSid: string, record: boolean): Promise<void> {
    try {
      if (record) {
        const baseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL;
        await this.getClient().calls(callSid).recordings.create({
          recordingStatusCallback: baseUrl ? `${baseUrl}/api/twilio/recording-status` : undefined,
          recordingStatusCallbackEvent: ['completed']
        });
      }
    } catch (error) {
      console.error('Error updating recording status:', error);
      throw error;
    }
  }

  /**
   * Get Australian phone number formatting
   */
  static formatAustralianNumber(number: string): string {
    // Remove all non-numeric characters
    const cleanNumber = number.replace(/\D/g, '');
    
    // Add +61 prefix for Australian numbers if not present
    if (cleanNumber.startsWith('61')) {
      return `+${cleanNumber}`;
    } else if (cleanNumber.startsWith('0')) {
      return `+61${cleanNumber.substring(1)}`;
    } else if (cleanNumber.length === 9) {
      return `+61${cleanNumber}`;
    }
    
    return `+${cleanNumber}`;
  }

  /**
   * Validate Australian phone number
   */
  static isValidAustralianNumber(number: string): boolean {
    const cleanNumber = number.replace(/\D/g, '');
    
    // Check if it's a valid Australian mobile (04xx xxx xxx) or landline format
    if (cleanNumber.startsWith('61')) {
      const nationalNumber = cleanNumber.substring(2);
      return nationalNumber.length >= 8 && nationalNumber.length <= 9;
    }
    
    return false;
  }
}

export function isMockMode(): boolean {
  const mockFlag = process.env.MOCK_MODE === 'true' || process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  const hasCreds = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  return mockFlag || !hasCreds;
}

let singleton: TwilioService | null = null;
export function getTwilioService(): TwilioService {
  if (!singleton) {
    singleton = new TwilioService();
  }
  return singleton;
}
