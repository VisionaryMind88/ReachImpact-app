import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { ScriptPrompts } from '../../shared/types';

// Check for required environment variables
if (!process.env.OPENAI_API_KEY) {
  console.warn('OpenAI API key not found in environment variables. OpenAI functionality will be limited.');
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: ChatMessage;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LanguagePreference {
  conversationLanguage: string; // The language to use for the conversation
  responseLanguage: string;     // The language to use for the AI response
  translateUserInput: boolean;  // Whether to translate user input to the conversation language
}

export class OpenAIService {
  private client: OpenAI;
  private languageNames: Map<string, string>;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize language names
    this.languageNames = new Map([
      ['en', 'English'],
      ['es', 'Spanish'],
      ['fr', 'French'],
      ['de', 'German'],
      ['it', 'Italian'],
      ['pt', 'Portuguese'],
      ['nl', 'Dutch'],
      ['ru', 'Russian'],
      ['zh', 'Chinese'],
      ['ja', 'Japanese'],
      ['ko', 'Korean'],
      ['ar', 'Arabic'],
      ['hi', 'Hindi'],
      ['bn', 'Bengali'],
      ['ur', 'Urdu'],
      ['tr', 'Turkish'],
      ['pl', 'Polish'],
      ['uk', 'Ukrainian'],
      ['cs', 'Czech'],
      ['sv', 'Swedish'],
      ['no', 'Norwegian'],
      ['da', 'Danish'],
      ['fi', 'Finnish'],
      ['he', 'Hebrew'],
      ['id', 'Indonesian'],
      ['ms', 'Malay'],
      ['th', 'Thai'],
      ['vi', 'Vietnamese'],
    ]);
  }

  /**
   * Get the full language name from a language code
   */
  getLanguageName(code: string): string {
    return this.languageNames.get(code) || code;
  }

  /**
   * Send a chat message to OpenAI
   */
  async chat(messages: ChatMessage[], model: string = 'gpt-4o'): Promise<ChatResponse> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: model,
        messages,
      });

      const responseMessage = response.choices[0].message;
      
      return {
        message: {
          role: responseMessage.role,
          content: responseMessage.content || '',
        },
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('OpenAI chat error:', error);
      throw new Error(`Failed to process chat: ${error.message}`);
    }
  }

  /**
   * Send a multilingual chat message to OpenAI
   */
  async multilingualChat(
    messages: ChatMessage[], 
    model: string = 'gpt-4o',
    languagePreference: LanguagePreference
  ): Promise<ChatResponse> {
    try {
      const { conversationLanguage, responseLanguage, translateUserInput } = languagePreference;
      
      // If languages are the same, just use regular chat
      if (conversationLanguage === responseLanguage && !translateUserInput) {
        return this.chat(messages, model);
      }
      
      let processedMessages = [...messages];
      
      // Add a system message to handle the language translation
      if (responseLanguage !== conversationLanguage) {
        const langName = this.getLanguageName(responseLanguage);
        processedMessages.unshift({
          role: 'system',
          content: `You are a helpful assistant. Regardless of the language the user writes in, always respond in ${langName}.`,
        });
      }
      
      // Translate user messages if needed
      if (translateUserInput && conversationLanguage !== 'en') {
        const conversationLangName = this.getLanguageName(conversationLanguage);
        
        // Process user messages for translation
        for (let i = 0; i < processedMessages.length; i++) {
          if (processedMessages[i].role === 'user') {
            // Translate the user message
            const translatedContent = await this.translateText(
              processedMessages[i].content,
              conversationLanguage,
              'auto'
            );
            
            processedMessages[i].content = translatedContent.translatedText;
          }
        }
      }
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: model,
        messages: processedMessages,
      });

      const responseMessage = response.choices[0].message;
      
      return {
        message: {
          role: responseMessage.role,
          content: responseMessage.content || '',
        },
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('OpenAI multilingual chat error:', error);
      throw new Error(`Failed to process multilingual chat: ${error.message}`);
    }
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<{
    sentiment: string;
    score: number;
    confidence: number;
    analysis: string;
  }> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a sentiment analysis expert. Analyze the sentiment of the following text and respond with JSON in this format:
            {
              "sentiment": "positive|negative|neutral",
              "score": <number between -1 and 1>,
              "confidence": <number between 0 and 1>,
              "analysis": <brief explanation>
            }`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI sentiment analysis error:', error);
      throw new Error(`Failed to analyze sentiment: ${error.message}`);
    }
  }

  /**
   * Parse contact data from text
   */
  async parseContactData(text: string): Promise<{
    contacts: Array<{
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      company?: string;
      jobTitle?: string;
      confidence: number;
    }>;
  }> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a contact information extraction expert. Extract contact information from the following text and respond with JSON in this format:
            {
              "contacts": [
                {
                  "firstName": "string or null if not found",
                  "lastName": "string or null if not found",
                  "email": "string or null if not found",
                  "phone": "string or null if not found",
                  "company": "string or null if not found",
                  "jobTitle": "string or null if not found",
                  "confidence": <number between 0 and 1>
                }
              ]
            }
            Only include fields that are actually present in the text.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content || '{"contacts":[]}');
    } catch (error) {
      console.error('OpenAI contact parsing error:', error);
      throw new Error(`Failed to parse contacts: ${error.message}`);
    }
  }

  /**
   * Translate text
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<{
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
  }> {
    try {
      const sourceLangName = sourceLanguage && sourceLanguage !== 'auto' 
        ? this.getLanguageName(sourceLanguage)
        : 'the source language';
      const targetLangName = this.getLanguageName(targetLanguage);
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. Only respond with the translated text, nothing else.`,
          },
          {
            role: 'user',
            content: text,
          },
        ],
      });

      return {
        originalText: text,
        translatedText: response.choices[0].message.content || '',
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
      };
    } catch (error) {
      console.error('OpenAI translation error:', error);
      throw new Error(`Failed to translate text: ${error.message}`);
    }
  }

  /**
   * Generate call script
   */
  async generateCallScript(
    prompts: ScriptPrompts,
    language: string = 'en'
  ): Promise<{
    script: string;
    openingLine: string;
    objectionHandling: Array<{ objection: string; response: string }>;
    closingStatement: string;
  }> {
    try {
      const languageName = this.getLanguageName(language);
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert sales script writer. Create a professional call script in ${languageName} based on the provided details.
            Respond with JSON in this format:
            {
              "script": "full script text",
              "openingLine": "attention-grabbing opening line",
              "objectionHandling": [
                {
                  "objection": "potential objection",
                  "response": "effective response"
                }
              ],
              "closingStatement": "effective closing"
            }`,
          },
          {
            role: 'user',
            content: `Create a call script with the following details:
            Campaign Type: ${prompts.campaignType}
            Industry: ${prompts.industry}
            Target Audience: ${prompts.target}
            Key Points: ${prompts.keyPoints.join(', ')}
            Tone: ${prompts.tone}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI script generation error:', error);
      throw new Error(`Failed to generate script: ${error.message}`);
    }
  }

  /**
   * Transcribe audio file
   */
  async transcribeAudio(audioFilePath: string): Promise<{
    text: string;
    duration: number;
  }> {
    try {
      const fileStream = fs.createReadStream(audioFilePath);
      
      const transcription = await this.client.audio.transcriptions.create({
        file: fileStream,
        model: 'whisper-1',
      });

      return {
        text: transcription.text,
        duration: 0, // OpenAI API doesn't return duration, would need to be calculated separately
      };
    } catch (error) {
      console.error('OpenAI transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    } finally {
      // Clean up the uploaded file
      try {
        fs.unlinkSync(audioFilePath);
      } catch (err) {
        console.error('Error deleting temporary audio file:', err);
      }
    }
  }
}