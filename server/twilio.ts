import twilio from 'twilio';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Configure Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Create Twilio client
const client = twilio(accountSid, authToken);

// Validate Twilio configuration
if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Missing Twilio configuration. Please check your environment variables.');
}

/**
 * Make an outbound call to a phone number
 * @param to The phone number to call (E.164 format)
 * @param options Additional options for the call
 */
export async function makeOutboundCall(to: string, options: {
  callbackUrl?: string;
  statusCallback?: string;
  transcribeCallback?: string;
  record?: boolean;
  language?: string;
  timeLimit?: number;
  callerName?: string;
}) {
  try {
    // Validate phone number (basic check)
    if (!to.startsWith('+')) {
      throw new Error('Phone number must be in E.164 format (e.g., +15551234567)');
    }

    // Configure call options
    const callOptions: any = {
      to,
      from: twilioPhoneNumber,
      record: options.record !== undefined ? options.record : true,
      statusCallback: options.statusCallback,
      transcribeCallback: options.transcribeCallback,
    };

    // Add TwiML instructions if a callback URL is provided
    if (options.callbackUrl) {
      callOptions.url = options.callbackUrl;
    } else {
      // Default TwiML to say a message and hang up
      callOptions.twiml = `
        <Response>
          <Say language="${options.language || 'en-US'}">
            Hello, this is an automated call from ReachImpact. 
            Our AI assistant will be with you shortly.
          </Say>
          <Pause length="2"/>
        </Response>
      `;
    }

    // Make the call
    const call = await client.calls.create(callOptions);
    
    return {
      sid: call.sid,
      status: call.status,
      duration: 0,
      direction: 'outbound-api',
      from: call.from,
      to: call.to,
      startTime: call.startTime,
      endTime: call.endTime,
    };
  } catch (error) {
    console.error('Error making outbound call:', error);
    throw error;
  }
}

/**
 * Get the status of a call
 * @param callSid The Twilio Call SID
 */
export async function getCallStatus(callSid: string) {
  try {
    const call = await client.calls(callSid).fetch();
    
    return {
      sid: call.sid,
      status: call.status,
      duration: parseInt(call.duration || '0'),
      direction: call.direction as 'outbound-api' | 'inbound',
      from: call.from,
      to: call.to,
      startTime: call.startTime?.toISOString(),
      endTime: call.endTime?.toISOString(),
    };
  } catch (error) {
    console.error('Error getting call status:', error);
    throw error;
  }
}

/**
 * End an active call
 * @param callSid The Twilio Call SID
 */
export async function endCall(callSid: string) {
  try {
    await client.calls(callSid).update({ status: 'completed' });
    return { success: true };
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
}

/**
 * Send an SMS message
 * @param to The phone number to send SMS to (E.164 format)
 * @param message The message content
 */
export async function sendSms(to: string, message: string) {
  try {
    // Validate phone number (basic check)
    if (!to.startsWith('+')) {
      throw new Error('Phone number must be in E.164 format (e.g., +15551234567)');
    }

    const sms = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to,
    });
    
    return {
      success: true,
      sid: sms.sid,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}