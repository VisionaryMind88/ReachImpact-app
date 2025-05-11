import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { OpenAIService } from './openai-service';

// Create OpenAI service
const openaiService = new OpenAIService();

// Define request body schemas
const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});

const chatSchema = z.object({
  messages: z.array(chatMessageSchema),
  model: z.string().default('gpt-4o'),
});

const multilingualChatSchema = z.object({
  messages: z.array(chatMessageSchema),
  model: z.string().default('gpt-4o'),
  conversationLanguage: z.string(),
  responseLanguage: z.string(),
  translateUserInput: z.boolean().default(true),
});

const translateSchema = z.object({
  text: z.string(),
  sourceLanguage: z.string().optional(),
  targetLanguage: z.string(),
});

const sentimentSchema = z.object({
  text: z.string(),
});

const parseContactsSchema = z.object({
  text: z.string(),
});

const scriptGenerationSchema = z.object({
  campaignType: z.string(),
  industry: z.string(),
  target: z.string(),
  keyPoints: z.array(z.string()),
  tone: z.string(),
  language: z.string().default('en'),
});

export default async function(fastify: FastifyInstance) {
  // Chat completion
  fastify.post('/chat', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = chatSchema.parse(request.body);
      
      // Check if the user has enough credits
      const creditsRequired = 1; // Base cost for chat
      const hasCredits = await fastify.useCredits(user.id, creditsRequired);
      
      if (!hasCredits) {
        return reply.code(402).send({ message: 'Insufficient credits' });
      }
      
      // Call OpenAI API
      const response = await openaiService.chat(body.messages, body.model);
      
      return reply.send(response);
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : err.message || 'Failed to process chat request' 
      });
    }
  });
  
  // Multilingual chat
  fastify.post('/multilingual-chat', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = multilingualChatSchema.parse(request.body);
      
      // Check if the user has enough credits
      const creditsRequired = 2; // Higher cost for multilingual chat
      const hasCredits = await fastify.useCredits(user.id, creditsRequired);
      
      if (!hasCredits) {
        return reply.code(402).send({ message: 'Insufficient credits' });
      }
      
      // Call OpenAI API for multilingual chat
      const response = await openaiService.multilingualChat(
        body.messages,
        body.model,
        {
          conversationLanguage: body.conversationLanguage,
          responseLanguage: body.responseLanguage,
          translateUserInput: body.translateUserInput,
        }
      );
      
      return reply.send(response);
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : err.message || 'Failed to process multilingual chat request' 
      });
    }
  });
  
  // Translate text
  fastify.post('/translate', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = translateSchema.parse(request.body);
      
      // Check if the user has enough credits
      const creditsRequired = 1; // Cost per translation
      const hasCredits = await fastify.useCredits(user.id, creditsRequired);
      
      if (!hasCredits) {
        return reply.code(402).send({ message: 'Insufficient credits' });
      }
      
      // Call OpenAI API for translation
      const response = await openaiService.translateText(
        body.text,
        body.targetLanguage,
        body.sourceLanguage
      );
      
      return reply.send(response);
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : err.message || 'Failed to translate text' 
      });
    }
  });
  
  // Sentiment analysis
  fastify.post('/analyze-sentiment', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = sentimentSchema.parse(request.body);
      
      // Check if the user has enough credits
      const creditsRequired = 1; // Cost for sentiment analysis
      const hasCredits = await fastify.useCredits(user.id, creditsRequired);
      
      if (!hasCredits) {
        return reply.code(402).send({ message: 'Insufficient credits' });
      }
      
      // Call OpenAI API for sentiment analysis
      const response = await openaiService.analyzeSentiment(body.text);
      
      return reply.send(response);
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : err.message || 'Failed to analyze sentiment' 
      });
    }
  });
  
  // Parse contacts from text
  fastify.post('/parse-contacts', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = parseContactsSchema.parse(request.body);
      
      // Check if the user has enough credits
      const creditsRequired = 2; // Cost for contact parsing
      const hasCredits = await fastify.useCredits(user.id, creditsRequired);
      
      if (!hasCredits) {
        return reply.code(402).send({ message: 'Insufficient credits' });
      }
      
      // Call OpenAI API for contact parsing
      const response = await openaiService.parseContactData(body.text);
      
      return reply.send(response);
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : err.message || 'Failed to parse contacts' 
      });
    }
  });
  
  // Generate call script
  fastify.post('/generate-script', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = scriptGenerationSchema.parse(request.body);
      
      // Check if the user has enough credits
      const creditsRequired = 3; // Cost for script generation
      const hasCredits = await fastify.useCredits(user.id, creditsRequired);
      
      if (!hasCredits) {
        return reply.code(402).send({ message: 'Insufficient credits' });
      }
      
      // Call OpenAI API for script generation
      const response = await openaiService.generateCallScript({
        campaignType: body.campaignType,
        industry: body.industry,
        target: body.target,
        keyPoints: body.keyPoints,
        tone: body.tone,
      }, body.language);
      
      return reply.send(response);
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : err.message || 'Failed to generate script' 
      });
    }
  });
  
  // Transcribe audio
  fastify.post('/transcribe', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Make sure we have an audio file
      if (!request.file) {
        return reply.code(400).send({ message: 'Audio file is required' });
      }
      
      // Check if the user has enough credits
      const creditsRequired = 5; // Cost for audio transcription
      const hasCredits = await fastify.useCredits(user.id, creditsRequired);
      
      if (!hasCredits) {
        return reply.code(402).send({ message: 'Insufficient credits' });
      }
      
      // Call OpenAI API for transcription
      const response = await openaiService.transcribeAudio(request.file.path);
      
      return reply.send(response);
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ 
        message: err.message || 'Failed to transcribe audio' 
      });
    }
  });
}