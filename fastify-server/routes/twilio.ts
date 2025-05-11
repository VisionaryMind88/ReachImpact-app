import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import twilio from 'twilio';
import { calls } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Create Twilio VoiceResponse
const VoiceResponse = twilio.twiml.VoiceResponse;

// Define request schemas
const twimlSchema = z.object({
  script: z.string().optional(),
  language: z.string().optional(),
});

export default async function(fastify: FastifyInstance) {
  // Generate TwiML for calls
  fastify.get('/twiml', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Parse query parameters
      const query = twimlSchema.parse(request.query);
      
      // Create TwiML response
      const twiml = new VoiceResponse();
      
      if (query.script) {
        // If script is provided, use it
        twiml.say({
          voice: 'Polly.Joanna',
          language: query.language || 'en-US',
        }, query.script);
        
        // Pause for a moment
        twiml.pause({ length: 1 });
        
        // Record the call
        twiml.record({
          action: '/api/twilio/recording-status',
          transcribe: true,
          transcribeCallback: '/api/twilio/transcription',
          timeout: 10,
          maxLength: 300,
        });
      } else {
        // Default welcome message if no script is provided
        twiml.say({
          voice: 'Polly.Joanna',
          language: 'en-US',
        }, 'Hello, this is a call from ReachImpact. If you received this message, our system is working correctly.');
      }
      
      // Set response headers and return TwiML
      reply.header('Content-Type', 'text/xml');
      return reply.send(twiml.toString());
    } catch (err) {
      fastify.log.error(err);
      
      // Even on error, return valid TwiML
      const errorTwiml = new VoiceResponse();
      errorTwiml.say('Sorry, there was an error processing your call.');
      
      reply.header('Content-Type', 'text/xml');
      return reply.send(errorTwiml.toString());
    }
  });
  
  // Handle recording status callback
  fastify.post('/recording-status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callbackData = request.body as any;
      
      if (callbackData && callbackData.CallSid && callbackData.RecordingSid) {
        // Find the call in the database
        const [call] = await fastify.db.select()
          .from(calls)
          .where(eq(calls.twilioSid, callbackData.CallSid))
          .limit(1);
        
        if (call) {
          // Update the call with recording information
          await fastify.db.update(calls)
            .set({
              recordingSid: callbackData.RecordingSid,
              recordingUrl: callbackData.RecordingUrl,
              updatedAt: new Date(),
            })
            .where(eq(calls.id, call.id));
        }
      }
      
      return reply.send({ success: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Failed to process recording status' });
    }
  });
  
  // Handle transcription callback
  fastify.post('/transcription', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const callbackData = request.body as any;
      
      if (callbackData && callbackData.CallSid && callbackData.TranscriptionText) {
        // Find the call in the database
        const [call] = await fastify.db.select()
          .from(calls)
          .where(eq(calls.twilioSid, callbackData.CallSid))
          .limit(1);
        
        if (call) {
          // Update the call with transcription information
          await fastify.db.update(calls)
            .set({
              transcription: callbackData.TranscriptionText,
              transcriptionSid: callbackData.TranscriptionSid,
              updatedAt: new Date(),
            })
            .where(eq(calls.id, call.id));
        }
      }
      
      return reply.send({ success: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.code(500).send({ message: 'Failed to process transcription' });
    }
  });
  
  // Generate conference call TwiML
  fastify.get('/conference/:roomName', async (request: FastifyRequest<{ Params: { roomName: string } }>, reply: FastifyReply) => {
    try {
      const { roomName } = request.params;
      
      // Create TwiML response
      const twiml = new VoiceResponse();
      
      // Add the caller to a conference room
      twiml.dial().conference({
        startConferenceOnEnter: true,
        endConferenceOnExit: true,
        waitUrl: 'https://twimlets.com/holdmusic?Bucket=com.twilio.music.classical',
        waitMethod: 'GET',
      }, roomName);
      
      // Set response headers and return TwiML
      reply.header('Content-Type', 'text/xml');
      return reply.send(twiml.toString());
    } catch (err) {
      fastify.log.error(err);
      
      // Even on error, return valid TwiML
      const errorTwiml = new VoiceResponse();
      errorTwiml.say('Sorry, there was an error joining the conference.');
      
      reply.header('Content-Type', 'text/xml');
      return reply.send(errorTwiml.toString());
    }
  });
}