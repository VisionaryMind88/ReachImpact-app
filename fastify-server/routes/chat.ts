import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { messages } from './chat-schema';

// Define request body schemas
const messageSchema = z.object({
  content: z.string().min(1),
  recipientId: z.number().optional(),
  type: z.enum(['text', 'image', 'file']).default('text'),
  metadata: z.record(z.string(), z.any()).optional(),
});

const roomSchema = z.object({
  name: z.string().min(1),
  participants: z.array(z.number()),
  type: z.enum(['direct', 'group', 'campaign']).default('direct'),
  metadata: z.record(z.string(), z.any()).optional(),
});

export default async function(fastify: FastifyInstance) {
  // Create chat schema if it doesn't exist
  fastify.addHook('onReady', async () => {
    try {
      // We would typically create tables here if using a separate schema for chat
      // But we're assuming the tables exist via our migration process
      fastify.log.info('Chat service initialized');
    } catch (err) {
      fastify.log.error('Failed to initialize chat service:', err);
    }
  });
  
  // Get all messages for a user
  fastify.get('/messages', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Get all messages where the user is either sender or recipient
      const userMessages = await fastify.db.select()
        .from(messages)
        .where(
          fastify.db.or(
            eq(messages.senderId, user.id),
            eq(messages.recipientId, user.id)
          )
        )
        .orderBy(desc(messages.createdAt));
      
      return reply.send(userMessages);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get messages' });
    }
  });
  
  // Get messages between two users
  fastify.get('/messages/:recipientId', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { recipientId: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const recipientId = parseInt(request.params.recipientId);
      
      if (isNaN(recipientId)) {
        return reply.code(400).send({ message: 'Invalid recipient ID' });
      }
      
      // Get all messages between the two users
      const conversationMessages = await fastify.db.select()
        .from(messages)
        .where(
          fastify.db.or(
            fastify.db.and(
              eq(messages.senderId, user.id),
              eq(messages.recipientId, recipientId)
            ),
            fastify.db.and(
              eq(messages.senderId, recipientId),
              eq(messages.recipientId, user.id)
            )
          )
        )
        .orderBy(desc(messages.createdAt));
      
      return reply.send(conversationMessages);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get conversation messages' });
    }
  });
  
  // Send a message
  fastify.post('/messages', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = messageSchema.parse(request.body);
      
      // Create the message
      const [message] = await fastify.db.insert(messages)
        .values({
          content: body.content,
          senderId: user.id,
          recipientId: body.recipientId,
          type: body.type,
          metadata: body.metadata || {},
          read: false,
          createdAt: new Date(),
        })
        .returning();
      
      return reply.code(201).send(message);
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : 'Failed to send message' 
      });
    }
  });
  
  // Mark messages as read
  fastify.put('/messages/read/:senderId', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { senderId: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const senderId = parseInt(request.params.senderId);
      
      if (isNaN(senderId)) {
        return reply.code(400).send({ message: 'Invalid sender ID' });
      }
      
      // Mark all messages from the sender to this user as read
      await fastify.db.update(messages)
        .set({
          read: true,
        })
        .where(
          and(
            eq(messages.senderId, senderId),
            eq(messages.recipientId, user.id),
            eq(messages.read, false)
          )
        );
      
      return reply.send({ success: true });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to mark messages as read' });
    }
  });
  
  // Delete a message (only sender can delete)
  fastify.delete('/messages/:id', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const messageId = parseInt(request.params.id);
      
      if (isNaN(messageId)) {
        return reply.code(400).send({ message: 'Invalid message ID' });
      }
      
      // Find the message
      const [message] = await fastify.db.select()
        .from(messages)
        .where(eq(messages.id, messageId))
        .limit(1);
      
      if (!message) {
        return reply.code(404).send({ message: 'Message not found' });
      }
      
      // Verify ownership
      if (message.senderId !== user.id) {
        return reply.code(403).send({ message: 'Cannot delete messages sent by others' });
      }
      
      // Delete the message
      await fastify.db.delete(messages)
        .where(eq(messages.id, messageId));
      
      return reply.send({ success: true });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to delete message' });
    }
  });
  
  // Get unread message count
  fastify.get('/messages/unread/count', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Count unread messages
      const result = await fastify.db
        .select({ count: fastify.db.sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.recipientId, user.id),
            eq(messages.read, false)
          )
        );
      
      return reply.send({ count: result[0]?.count || 0 });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get unread message count' });
    }
  });
}