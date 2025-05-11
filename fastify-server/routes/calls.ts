import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { calls, insertCallSchema } from '../../shared/schema';
import { makeOutboundCall, getCallStatus, endCall, sendSms } from './twilio-service';

// Define request body schema
const callSchema = z.object({
  contactId: z.number(),
  campaignId: z.number().optional(),
  phoneNumber: z.string(),
  script: z.string().optional(),
  language: z.string().optional(),
  recordingEnabled: z.boolean().optional(),
});

const smsSchema = z.object({
  contactId: z.number(),
  phoneNumber: z.string(),
  message: z.string(),
});

export default async function(fastify: FastifyInstance) {
  // Get all calls for the authenticated user
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Get all calls for the user
      const userCalls = await fastify.db.select()
        .from(calls)
        .where(eq(calls.userId, user.id))
        .orderBy(desc(calls.createdAt));
      
      return reply.send(userCalls);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get calls' });
    }
  });
  
  // Get calls by contact
  fastify.get('/contact/:contactId', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { contactId: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const contactId = parseInt(request.params.contactId);
      
      if (isNaN(contactId)) {
        return reply.code(400).send({ message: 'Invalid contact ID' });
      }
      
      // Get all calls for the contact
      const contactCalls = await fastify.db.select()
        .from(calls)
        .where(
          and(
            eq(calls.userId, user.id),
            eq(calls.contactId, contactId)
          )
        )
        .orderBy(desc(calls.createdAt));
      
      return reply.send(contactCalls);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get calls for contact' });
    }
  });
  
  // Get calls by campaign
  fastify.get('/campaign/:campaignId', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { campaignId: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const campaignId = parseInt(request.params.campaignId);
      
      if (isNaN(campaignId)) {
        return reply.code(400).send({ message: 'Invalid campaign ID' });
      }
      
      // Get all calls for the campaign
      const campaignCalls = await fastify.db.select()
        .from(calls)
        .where(
          and(
            eq(calls.userId, user.id),
            eq(calls.campaignId, campaignId)
          )
        )
        .orderBy(desc(calls.createdAt));
      
      return reply.send(campaignCalls);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get calls for campaign' });
    }
  });
  
  // Make a call
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = callSchema.parse(request.body);
      
      // Check if the user has enough credits
      const creditsRequired = 10; // Cost per call
      const hasCredits = await fastify.useCredits(user.id, creditsRequired);
      
      if (!hasCredits) {
        return reply.code(402).send({ message: 'Insufficient credits' });
      }
      
      // Make the call using Twilio
      const callbackUrl = `${request.protocol}://${request.hostname}/api/calls/status`;
      
      const callResult = await makeOutboundCall(body.phoneNumber, {
        userId: user.id,
        contactId: body.contactId,
        campaignId: body.campaignId,
        script: body.script,
        language: body.language,
        recordingEnabled: body.recordingEnabled,
        callbackUrl
      });
      
      // Store the call in the database
      const [call] = await fastify.db.insert(calls)
        .values({
          userId: user.id,
          contactId: body.contactId,
          campaignId: body.campaignId,
          phoneNumber: body.phoneNumber,
          status: callResult.status,
          direction: 'outbound',
          duration: 0,
          twilioSid: callResult.sid,
          script: body.script,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return reply.code(201).send({
        ...call,
        twilioStatus: callResult.status
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : err.message || 'Failed to make call' 
      });
    }
  });
  
  // Get call status
  fastify.get('/:sid', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { sid: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const { sid } = request.params;
      
      if (!sid) {
        return reply.code(400).send({ message: 'Call SID is required' });
      }
      
      // Get the call from the database
      const [call] = await fastify.db.select()
        .from(calls)
        .where(
          and(
            eq(calls.userId, user.id),
            eq(calls.twilioSid, sid)
          )
        )
        .limit(1);
      
      if (!call) {
        return reply.code(404).send({ message: 'Call not found' });
      }
      
      // Get the call status from Twilio
      const callStatus = await getCallStatus(sid);
      
      // Update the call in the database if status changed
      if (callStatus.status !== call.status || callStatus.duration !== call.duration) {
        await fastify.db.update(calls)
          .set({
            status: callStatus.status,
            duration: callStatus.duration,
            updatedAt: new Date(),
          })
          .where(eq(calls.id, call.id));
      }
      
      return reply.send({
        ...call,
        twilioStatus: callStatus.status,
        twilioDuration: callStatus.duration,
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ message: err.message || 'Failed to get call status' });
    }
  });
  
  // End a call
  fastify.post('/:sid/end', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { sid: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const { sid } = request.params;
      
      if (!sid) {
        return reply.code(400).send({ message: 'Call SID is required' });
      }
      
      // Get the call from the database
      const [call] = await fastify.db.select()
        .from(calls)
        .where(
          and(
            eq(calls.userId, user.id),
            eq(calls.twilioSid, sid)
          )
        )
        .limit(1);
      
      if (!call) {
        return reply.code(404).send({ message: 'Call not found' });
      }
      
      // End the call using Twilio
      const result = await endCall(sid);
      
      if (result.success) {
        // Update the call in the database
        await fastify.db.update(calls)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(calls.id, call.id));
      }
      
      return reply.send({ success: result.success });
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ message: err.message || 'Failed to end call' });
    }
  });
  
  // Send SMS
  fastify.post('/sms', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = smsSchema.parse(request.body);
      
      // Check if the user has enough credits
      const creditsRequired = 1; // Cost per SMS
      const hasCredits = await fastify.useCredits(user.id, creditsRequired);
      
      if (!hasCredits) {
        return reply.code(402).send({ message: 'Insufficient credits' });
      }
      
      // Send the SMS using Twilio
      const result = await sendSms(body.phoneNumber, body.message);
      
      // Store the SMS in the database (using calls table for now)
      const [sms] = await fastify.db.insert(calls)
        .values({
          userId: user.id,
          contactId: body.contactId,
          phoneNumber: body.phoneNumber,
          status: 'completed',
          direction: 'outbound',
          duration: 0,
          twilioSid: result.sid,
          type: 'sms',
          message: body.message,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return reply.code(201).send({
        ...sms,
        success: result.success
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(err.statusCode || 500).send({ message: err.message || 'Failed to send SMS' });
    }
  });
  
  // Handle call status callback (webhook)
  fastify.post('/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Extract callback data from Twilio
      const callbackData = request.body as any;
      
      if (!callbackData || !callbackData.CallSid) {
        return reply.code(400).send({ message: 'Invalid callback data' });
      }
      
      // Find the call in the database
      const [call] = await fastify.db.select()
        .from(calls)
        .where(eq(calls.twilioSid, callbackData.CallSid))
        .limit(1);
      
      if (!call) {
        return reply.code(404).send({ message: 'Call not found' });
      }
      
      // Update the call status
      await fastify.db.update(calls)
        .set({
          status: callbackData.CallStatus,
          duration: parseInt(callbackData.CallDuration || '0'),
          updatedAt: new Date(),
        })
        .where(eq(calls.id, call.id));
      
      return reply.send({ success: true });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to process callback' });
    }
  });
}