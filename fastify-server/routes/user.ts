import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { users } from '../../shared/schema';

// Define request body schema for profile update
const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  companyName: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
});

export default async function(fastify: FastifyInstance) {
  // Get user profile
  fastify.get('/profile', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return reply.send(userWithoutPassword);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get user profile' });
    }
  });
  
  // Update user profile
  fastify.put('/profile', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'User not found' });
      }
      
      // Validate request body
      const body = updateProfileSchema.parse(request.body);
      
      // Update user
      const [updatedUser] = await fastify.db.update(users)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
        .returning();
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      return reply.send(userWithoutPassword);
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : 'Failed to update user profile' 
      });
    }
  });
  
  // Get user credits
  fastify.get('/credits', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'User not found' });
      }
      
      return reply.send({ credits: user.credits });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get user credits' });
    }
  });
  
  // Add credits to user
  fastify.post('/credits', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'User not found' });
      }
      
      // Validate request body
      const body = z.object({
        amount: z.number().int().positive()
      }).parse(request.body);
      
      // Add credits
      const [updatedUser] = await fastify.db.update(users)
        .set({
          credits: user.credits + body.amount,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
        .returning();
      
      return reply.send({ credits: updatedUser.credits });
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : 'Failed to add credits' 
      });
    }
  });
  
  // Use credits (internal function for other routes)
  fastify.decorate('useCredits', async function(userId: number, amount: number): Promise<boolean> {
    try {
      // Get current user
      const [user] = await fastify.db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (!user || user.credits < amount) {
        return false;
      }
      
      // Deduct credits
      await fastify.db.update(users)
        .set({
          credits: user.credits - amount,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      return true;
    } catch (err) {
      fastify.log.error(err);
      return false;
    }
  });
}

// Define type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    useCredits: (userId: number, amount: number) => Promise<boolean>;
  }
}