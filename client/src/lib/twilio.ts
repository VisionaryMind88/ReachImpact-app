import { apiRequest } from "./queryClient";

// Types
export interface CallStatus {
  sid: string;
  status: 'queued' | 'ringing' | 'in-progress' | 'completed' | 'busy' | 'failed' | 'no-answer' | 'canceled';
  duration: number;
  direction: 'outbound-api' | 'inbound';
  from: string;
  to: string;
  startTime?: string;
  endTime?: string;
}

export interface CallOptions {
  userId: number;
  contactId: number;
  campaignId?: number;
  phoneNumber: string;
  script?: string;
  language?: string;
  callbackUrl?: string;
}

// Call a contact using Twilio
export async function makeCall(options: CallOptions): Promise<CallStatus> {
  try {
    const response = await apiRequest('POST', '/api/call', options);
    return await response.json();
  } catch (error) {
    console.error('Error making call:', error);
    throw error;
  }
}

// Get status of a call
export async function getCallStatus(callSid: string): Promise<CallStatus> {
  try {
    const response = await apiRequest('GET', `/api/call/${callSid}`);
    return await response.json();
  } catch (error) {
    console.error('Error getting call status:', error);
    throw error;
  }
}

// End an ongoing call
export async function endCall(callSid: string): Promise<{ success: boolean }> {
  try {
    const response = await apiRequest('POST', `/api/call/${callSid}/end`);
    return await response.json();
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
}

// Send SMS to a contact
export async function sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; sid: string }> {
  try {
    const response = await apiRequest('POST', '/api/sms', { phoneNumber, message });
    return await response.json();
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

export default {
  makeCall,
  getCallStatus,
  endCall,
  sendSMS,
};
