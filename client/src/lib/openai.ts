import { apiRequest } from "./queryClient";
import { supportedLanguages } from "./i18n";

// OpenAI API integration for chat functionality
// Note: The actual API calls will be sent to the backend server
// which will forward them to OpenAI for security reasons

// Chat message type
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Chat response type
export interface ChatResponse {
  message: ChatMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Language preferences for AI conversations
export interface LanguagePreference {
  conversationLanguage: string; // The language to use for the conversation
  responseLanguage: string;     // The language to use for the AI response
  translateUserInput: boolean;  // Whether to translate user input to the conversation language
}

// Get the language name from language code
export function getLanguageName(code: string): string {
  const language = supportedLanguages.find(lang => lang.code === code);
  return language ? language.name : "English";
}

// Send a message to the OpenAI API
export async function sendChatMessage(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    language?: string; // Language code for the conversation
  }
): Promise<ChatResponse> {
  try {
    const response = await apiRequest('POST', '/api/chat', {
      messages,
      model: options?.model || 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 500,
      language: options?.language || 'en',
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

// Send a message to the OpenAI API with language handling
export async function sendMultilingualChatMessage(
  messages: ChatMessage[],
  languagePreference: LanguagePreference,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<ChatResponse> {
  try {
    const response = await apiRequest('POST', '/api/multilingual-chat', {
      messages,
      language_preference: languagePreference,
      model: options?.model || 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 500,
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending multilingual chat message:', error);
    throw error;
  }
}

// Analyze sentiment of a conversation
export async function analyzeSentiment(
  text: string, 
  language?: string
): Promise<{
  rating: number;
  confidence: number;
}> {
  try {
    const response = await apiRequest('POST', '/api/analyze-sentiment', { 
      text,
      language: language || 'en'
    });
    return await response.json();
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw error;
  }
}

// Parse contact data from CSV/Excel content
export async function parseContactData(
  content: string, 
  fileType: 'csv' | 'excel',
  language?: string
): Promise<any[]> {
  try {
    const response = await apiRequest('POST', '/api/parse-contacts', { 
      content, 
      fileType,
      language: language || 'en'
    });
    return await response.json();
  } catch (error) {
    console.error('Error parsing contact data:', error);
    throw error;
  }
}

// Translate text from one language to another
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/translate', {
      text,
      source_language: sourceLanguage,
      target_language: targetLanguage
    });
    
    const data = await response.json();
    return data.translatedText;
  } catch (error) {
    console.error('Error translating text:', error);
    throw error;
  }
}

// Generate call script based on campaign information and language
export async function generateCallScript(
  campaignInfo: {
    name: string;
    industry: string;
    description: string;
  },
  language: string = 'en'
): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/generate-script', {
      campaign_info: campaignInfo,
      language
    });
    
    const data = await response.json();
    return data.script;
  } catch (error) {
    console.error('Error generating call script:', error);
    throw error;
  }
}

export default {
  sendChatMessage,
  sendMultilingualChatMessage,
  analyzeSentiment,
  parseContactData,
  translateText,
  generateCallScript,
  getLanguageName
};
