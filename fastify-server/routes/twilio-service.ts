import twilio from 'twilio';

// Check for required environment variables
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
  console.warn('Twilio credentials not found in environment variables. Twilio functionality will be limited.');
}

// Initialize Twilio client
const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Define interface for call options
interface CallOptions {
  userId: number;
  contactId: number;
  campaignId?: number;
  script?: string;
  language?: string;
  recordingEnabled?: boolean;
  callbackUrl?: string;
}

/**
 * Make an outbound call to a phone number
 * @param to The phone number to call (E.164 format)
 * @param options Additional options for the call
 */
export async function makeOutboundCall(to: string, options: CallOptions) {
  if (!client) {
    throw new Error('Twilio client not initialized. Check your environment variables.');
  }

  try {
    // Normalize phone number to E.164 format if needed
    const normalizedPhone = normalizePhoneNumber(to);
    
    // Create call
    const call = await client.calls.create({
      to: normalizedPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: buildTwimlUrl(options.script, options.language),
      statusCallback: options.callbackUrl,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: options.recordingEnabled === true,
    });

    return {
      sid: call.sid,
      status: call.status,
      direction: 'outbound-api',
      from: call.from,
      to: call.to,
    };
  } catch (error) {
    console.error('Error making Twilio call:', error);
    throw new Error(`Failed to make call: ${error.message}`);
  }
}

/**
 * Get the status of a call
 * @param callSid The Twilio Call SID
 */
export async function getCallStatus(callSid: string) {
  if (!client) {
    throw new Error('Twilio client not initialized. Check your environment variables.');
  }

  try {
    const call = await client.calls(callSid).fetch();
    
    return {
      sid: call.sid,
      status: call.status,
      duration: parseInt(call.duration) || 0,
      direction: call.direction,
      from: call.from,
      to: call.to,
      startTime: call.startTime,
      endTime: call.endTime,
    };
  } catch (error) {
    console.error('Error getting Twilio call status:', error);
    throw new Error(`Failed to get call status: ${error.message}`);
  }
}

/**
 * End an active call
 * @param callSid The Twilio Call SID
 */
export async function endCall(callSid: string) {
  if (!client) {
    throw new Error('Twilio client not initialized. Check your environment variables.');
  }

  try {
    await client.calls(callSid).update({ status: 'completed' });
    return { success: true };
  } catch (error) {
    console.error('Error ending Twilio call:', error);
    throw new Error(`Failed to end call: ${error.message}`);
  }
}

/**
 * Send an SMS message
 * @param to The phone number to send SMS to (E.164 format)
 * @param message The message content
 */
export async function sendSms(to: string, message: string) {
  if (!client) {
    throw new Error('Twilio client not initialized. Check your environment variables.');
  }

  try {
    // Normalize phone number to E.164 format if needed
    const normalizedPhone = normalizePhoneNumber(to);
    
    const sms = await client.messages.create({
      to: normalizedPhone,
      from: process.env.TWILIO_PHONE_NUMBER,
      body: message,
    });

    return {
      sid: sms.sid,
      status: sms.status,
      success: true,
    };
  } catch (error) {
    console.error('Error sending Twilio SMS:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

/**
 * Helper function to normalize phone numbers to E.164 format
 */
function normalizePhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if needed
  if (digits.length === 10) {
    return `+1${digits}`; // Assume US number if 10 digits
  } else if (digits.startsWith('1') && digits.length === 11) {
    return `+${digits}`;
  } else if (digits.startsWith('+')) {
    return digits;
  } else {
    return `+${digits}`;
  }
}

/**
 * Helper function to build TwiML URL for call scripts
 */
function buildTwimlUrl(script?: string, language?: string): string {
  // In a real implementation, this would generate a URL to a TwiML endpoint
  // For now, we'll use a placeholder URL
  const baseUrl = process.env.BASE_URL || 'https://reachimpact.io';
  return `${baseUrl}/api/twilio/twiml?script=${encodeURIComponent(script || '')}&language=${language || 'en'}`;
}