import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { campaigns, insertCampaignSchema } from '../../shared/schema';

// Define request body schema
const campaignSchema = insertCampaignSchema.extend({
  // Add any additional validation
  contactIds: z.array(z.number()).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
});

export default async function(fastify: FastifyInstance) {
  // Get all campaigns for the authenticated user
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Get all campaigns for the user
      const userCampaigns = await fastify.db.select()
        .from(campaigns)
        .where(eq(campaigns.userId, user.id))
        .orderBy(desc(campaigns.createdAt));
      
      return reply.send(userCampaigns);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get campaigns' });
    }
  });
  
  // Get a specific campaign
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const campaignId = parseInt(request.params.id);
      
      if (isNaN(campaignId)) {
        return reply.code(400).send({ message: 'Invalid campaign ID' });
      }
      
      // Get the campaign
      const [campaign] = await fastify.db.select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, campaignId),
            eq(campaigns.userId, user.id)
          )
        )
        .limit(1);
      
      if (!campaign) {
        return reply.code(404).send({ message: 'Campaign not found' });
      }
      
      return reply.send(campaign);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get campaign' });
    }
  });
  
  // Create a new campaign
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = campaignSchema.parse(request.body);
      
      // Check if the user has enough credits
      const creditsRequired = 5; // Base cost for creating a campaign
      const hasCredits = await fastify.useCredits(user.id, creditsRequired);
      
      if (!hasCredits) {
        return reply.code(402).send({ message: 'Insufficient credits' });
      }
      
      // Create the campaign
      const [campaign] = await fastify.db.insert(campaigns)
        .values({
          ...body,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return reply.code(201).send(campaign);
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : 'Failed to create campaign' 
      });
    }
  });
  
  // Update a campaign
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const campaignId = parseInt(request.params.id);
      
      if (isNaN(campaignId)) {
        return reply.code(400).send({ message: 'Invalid campaign ID' });
      }
      
      // Validate request body
      const body = campaignSchema.partial().parse(request.body);
      
      // Make sure the campaign exists and belongs to the user
      const [existingCampaign] = await fastify.db.select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, campaignId),
            eq(campaigns.userId, user.id)
          )
        )
        .limit(1);
      
      if (!existingCampaign) {
        return reply.code(404).send({ message: 'Campaign not found' });
      }
      
      // Update the campaign
      const [updatedCampaign] = await fastify.db.update(campaigns)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, campaignId))
        .returning();
      
      return reply.send(updatedCampaign);
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : 'Failed to update campaign' 
      });
    }
  });
  
  // Delete a campaign
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const campaignId = parseInt(request.params.id);
      
      if (isNaN(campaignId)) {
        return reply.code(400).send({ message: 'Invalid campaign ID' });
      }
      
      // Make sure the campaign exists and belongs to the user
      const [existingCampaign] = await fastify.db.select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, campaignId),
            eq(campaigns.userId, user.id)
          )
        )
        .limit(1);
      
      if (!existingCampaign) {
        return reply.code(404).send({ message: 'Campaign not found' });
      }
      
      // Delete the campaign
      await fastify.db.delete(campaigns)
        .where(eq(campaigns.id, campaignId));
      
      return reply.send({ success: true });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to delete campaign' });
    }
  });
  
  // Start a campaign
  fastify.post('/:id/start', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const campaignId = parseInt(request.params.id);
      
      if (isNaN(campaignId)) {
        return reply.code(400).send({ message: 'Invalid campaign ID' });
      }
      
      // Make sure the campaign exists and belongs to the user
      const [existingCampaign] = await fastify.db.select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, campaignId),
            eq(campaigns.userId, user.id)
          )
        )
        .limit(1);
      
      if (!existingCampaign) {
        return reply.code(404).send({ message: 'Campaign not found' });
      }
      
      // Update the campaign status
      const [updatedCampaign] = await fastify.db.update(campaigns)
        .set({
          status: 'active',
          startDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, campaignId))
        .returning();
      
      return reply.send(updatedCampaign);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to start campaign' });
    }
  });
  
  // Pause a campaign
  fastify.post('/:id/pause', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const campaignId = parseInt(request.params.id);
      
      if (isNaN(campaignId)) {
        return reply.code(400).send({ message: 'Invalid campaign ID' });
      }
      
      // Make sure the campaign exists and belongs to the user
      const [existingCampaign] = await fastify.db.select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, campaignId),
            eq(campaigns.userId, user.id)
          )
        )
        .limit(1);
      
      if (!existingCampaign) {
        return reply.code(404).send({ message: 'Campaign not found' });
      }
      
      // Update the campaign status
      const [updatedCampaign] = await fastify.db.update(campaigns)
        .set({
          status: 'paused',
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, campaignId))
        .returning();
      
      return reply.send(updatedCampaign);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to pause campaign' });
    }
  });
  
  // Complete a campaign
  fastify.post('/:id/complete', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const campaignId = parseInt(request.params.id);
      
      if (isNaN(campaignId)) {
        return reply.code(400).send({ message: 'Invalid campaign ID' });
      }
      
      // Make sure the campaign exists and belongs to the user
      const [existingCampaign] = await fastify.db.select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.id, campaignId),
            eq(campaigns.userId, user.id)
          )
        )
        .limit(1);
      
      if (!existingCampaign) {
        return reply.code(404).send({ message: 'Campaign not found' });
      }
      
      // Update the campaign status
      const [updatedCampaign] = await fastify.db.update(campaigns)
        .set({
          status: 'completed',
          endDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, campaignId))
        .returning();
      
      return reply.send(updatedCampaign);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to complete campaign' });
    }
  });
}