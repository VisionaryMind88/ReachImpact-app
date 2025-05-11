/**
 * Prompts for generating call scripts
 */
export interface ScriptPrompts {
  campaignType: string;   // e.g., "cold outreach", "follow-up", "appointment booking"
  industry: string;       // e.g., "technology", "healthcare", "finance"
  target: string;         // e.g., "small business owners", "IT decision makers"
  keyPoints: string[];    // Key points to include in the script
  tone: string;           // e.g., "friendly", "professional", "direct"
}

/**
 * Response for script generation
 */
export interface ScriptResponse {
  script: string;
  openingLine: string;
  objectionHandling: Array<{ objection: string; response: string }>;
  closingStatement: string;
}

/**
 * Chat message format
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Chat response format
 */
export interface ChatResponse {
  message: ChatMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Language preference for multilingual chat
 */
export interface LanguagePreference {
  conversationLanguage: string; // The language to use for the conversation
  responseLanguage: string;     // The language to use for the AI response
  translateUserInput: boolean;  // Whether to translate user input to the conversation language
}

/**
 * Call status from Twilio
 */
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

/**
 * Options for making a call
 */
export interface CallOptions {
  userId: number;
  contactId: number;
  campaignId?: number;
  phoneNumber: string;
  script?: string;
  language?: string;
  callbackUrl?: string;
  recordingEnabled?: boolean;
}

/**
 * Options for sending SMS
 */
export interface SmsOptions {
  contactId: number;
  phoneNumber: string;
  message: string;
}

/**
 * Authentication token response
 */
export interface AuthTokenResponse {
  token: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    companyName?: string;
    role: string;
    credits: number;
  };
}