import { apiRequest } from "./queryClient";

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

// Send a message to the OpenAI API
export async function sendChatMessage(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<ChatResponse> {
  try {
    const response = await apiRequest('POST', '/api/chat', {
      messages,
      model: options?.model || 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 500,
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

// Analyze sentiment of a conversation
export async function analyzeSentiment(text: string): Promise<{
  rating: number;
  confidence: number;
}> {
  try {
    const response = await apiRequest('POST', '/api/analyze-sentiment', { text });
    return await response.json();
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    throw error;
  }
}

// Parse contact data from CSV/Excel content
export async function parseContactData(content: string, fileType: 'csv' | 'excel'): Promise<any[]> {
  try {
    const response = await apiRequest('POST', '/api/parse-contacts', { content, fileType });
    return await response.json();
  } catch (error) {
    console.error('Error parsing contact data:', error);
    throw error;
  }
}

export default {
  sendChatMessage,
  analyzeSentiment,
  parseContactData,
};
