import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { insertUserSchema, users } from '../../shared/schema';

// Define request body schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  companyName: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Route plugin
export default async function(fastify: FastifyInstance) {
  // Register route
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const body = registerSchema.parse(request.body);
      
      // Check if user already exists
      const existingUser = await fastify.db.select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);
      
      if (existingUser.length > 0) {
        return reply.code(400).send({ message: 'User with this email already exists' });
      }
      
      // Hash password
      const hashedPassword = await argon2.hash(body.password);
      
      // Create new user
      const [newUser] = await fastify.db.insert(users)
        .values({
          email: body.email,
          password: hashedPassword,
          fullName: body.fullName,
          companyName: body.companyName || '',
          role: body.role || 'user',
          phone: body.phone || '',
          credits: 50, // Give new users 50 credits
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      // Generate JWT token
      const token = fastify.jwt.sign({ 
        id: newUser.id, 
        email: newUser.email 
      });
      
      return reply.code(201).send({ 
        ...userWithoutPassword,
        token
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : 'Invalid registration data' 
      });
    }
  });
  
  // Login route
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const body = loginSchema.parse(request.body);
      
      // Find user
      const [user] = await fastify.db.select()
        .from(users)
        .where(eq(users.email, body.email))
        .limit(1);
      
      if (!user) {
        return reply.code(401).send({ message: 'Invalid email or password' });
      }
      
      // Verify password
      const isValidPassword = await argon2.verify(user.password, body.password);
      
      if (!isValidPassword) {
        return reply.code(401).send({ message: 'Invalid email or password' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Generate JWT token
      const token = fastify.jwt.sign({ 
        id: user.id, 
        email: user.email 
      });
      
      return reply.send({ 
        ...userWithoutPassword,
        token
      });
    } catch (err) {
      request.log.error(err);
      return reply.code(400).send({ 
        message: err instanceof z.ZodError 
          ? err.errors.map(e => e.message).join(', ') 
          : 'Invalid login data' 
      });
    }
  });
  
  // Logout route (for future session management)
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    // With JWT, logout is primarily handled client-side by removing the token
    // This endpoint exists for future session revocation if needed
    return reply.send({ message: 'Logged out successfully' });
  });
  
  // Verify token route
  fastify.get('/verify', { preHandler: [fastify.authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    // This route is protected by the authenticate handler
    // If we reach here, the token is valid
    
    const user = await fastify.getCurrentUser(request);
    
    if (!user) {
      return reply.code(401).send({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return reply.send(userWithoutPassword);
  });
}