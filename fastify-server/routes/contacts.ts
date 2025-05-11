import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { contacts, insertContactSchema } from '../../shared/schema';

// Define request body schema
const contactSchema = insertContactSchema.extend({
  // Add any additional validation
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// Define bulk import schema
const bulkImportSchema = z.object({
  contacts: z.array(contactSchema)
});

export default async function(fastify: FastifyInstance) {
  // Get all contacts for the authenticated user
  fastify.get('/', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Get all contacts for the user
      const userContacts = await fastify.db.select()
        .from(contacts)
        .where(eq(contacts.userId, user.id))
        .orderBy(desc(contacts.createdAt));
      
      return reply.send(userContacts);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get contacts' });
    }
  });
  
  // Get a specific contact
  fastify.get('/:id', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const contactId = parseInt(request.params.id);
      
      if (isNaN(contactId)) {
        return reply.code(400).send({ message: 'Invalid contact ID' });
      }
      
      // Get the contact
      const [contact] = await fastify.db.select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, contactId),
            eq(contacts.userId, user.id)
          )
        )
        .limit(1);
      
      if (!contact) {
        return reply.code(404).send({ message: 'Contact not found' });
      }
      
      return reply.send(contact);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to get contact' });
    }
  });
  
  // Create a new contact
  fastify.post('/', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = contactSchema.parse(request.body);
      
      // Create the contact
      const [contact] = await fastify.db.insert(contacts)
        .values({
          ...body,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      return reply.code(201).send(contact);
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : 'Failed to create contact' 
      });
    }
  });
  
  // Bulk import contacts
  fastify.post('/bulk', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      // Validate request body
      const body = bulkImportSchema.parse(request.body);
      
      if (body.contacts.length === 0) {
        return reply.code(400).send({ message: 'No contacts to import' });
      }
      
      // Prepare contacts for insertion
      const contactsToInsert = body.contacts.map(contact => ({
        ...contact,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      // Insert all contacts
      const newContacts = await fastify.db.insert(contacts)
        .values(contactsToInsert)
        .returning();
      
      return reply.code(201).send(newContacts);
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : 'Failed to import contacts' 
      });
    }
  });
  
  // Update a contact
  fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const contactId = parseInt(request.params.id);
      
      if (isNaN(contactId)) {
        return reply.code(400).send({ message: 'Invalid contact ID' });
      }
      
      // Validate request body
      const body = contactSchema.partial().parse(request.body);
      
      // Make sure the contact exists and belongs to the user
      const [existingContact] = await fastify.db.select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, contactId),
            eq(contacts.userId, user.id)
          )
        )
        .limit(1);
      
      if (!existingContact) {
        return reply.code(404).send({ message: 'Contact not found' });
      }
      
      // Update the contact
      const [updatedContact] = await fastify.db.update(contacts)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(eq(contacts.id, contactId))
        .returning();
      
      return reply.send(updatedContact);
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : 'Failed to update contact' 
      });
    }
  });
  
  // Delete a contact
  fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const contactId = parseInt(request.params.id);
      
      if (isNaN(contactId)) {
        return reply.code(400).send({ message: 'Invalid contact ID' });
      }
      
      // Make sure the contact exists and belongs to the user
      const [existingContact] = await fastify.db.select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, contactId),
            eq(contacts.userId, user.id)
          )
        )
        .limit(1);
      
      if (!existingContact) {
        return reply.code(404).send({ message: 'Contact not found' });
      }
      
      // Delete the contact
      await fastify.db.delete(contacts)
        .where(eq(contacts.id, contactId));
      
      return reply.send({ success: true });
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to delete contact' });
    }
  });
  
  // Search contacts
  fastify.get('/search', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest<{ Querystring: { q: string } }>, reply: FastifyReply) => {
    try {
      const user = await fastify.getCurrentUser(request);
      
      if (!user) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
      
      const searchQuery = request.query.q || '';
      
      if (!searchQuery) {
        return reply.code(400).send({ message: 'Search query is required' });
      }
      
      // Search contacts
      const searchResults = await fastify.db.select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, user.id),
            sql`(
              ${contacts.firstName} ILIKE ${`%${searchQuery}%`} OR
              ${contacts.lastName} ILIKE ${`%${searchQuery}%`} OR
              ${contacts.email} ILIKE ${`%${searchQuery}%`} OR
              ${contacts.phone} ILIKE ${`%${searchQuery}%`} OR
              ${contacts.company} ILIKE ${`%${searchQuery}%`}
            )`
          )
        )
        .orderBy(desc(contacts.createdAt));
      
      return reply.send(searchResults);
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ message: 'Failed to search contacts' });
    }
  });
}