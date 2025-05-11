import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from 'fastify-jwt';
import { User } from '../../shared/schema';

// Generate a secure JWT secret or use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'reachimpact-secret-key-change-in-production';

interface JwtPluginOptions {
  // Customize by plugin options if needed
}

/**
 * This plugin adds JWT authentication support to the Fastify instance
 */
export const jwtPlugin = fp(async function (fastify: FastifyInstance, opts: JwtPluginOptions) {
  // Register the fastify-jwt plugin
  fastify.register(fastifyJwt, {
    secret: JWT_SECRET,
    sign: {
      expiresIn: '7d' // Token expires in 7 days
    },
  });

  // Add a decorator to verify if user is authenticated
  fastify.decorate('authenticate', async function(request: FastifyRequest, reply: FastifyReply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ message: 'Unauthorized' });
    }
  });

  // Add a utility to get the current user
  fastify.decorate('getCurrentUser', async function(request: FastifyRequest): Promise<User | null> {
    try {
      await request.jwtVerify();
      const userId = request.user.id;
      
      // Query the user from database
      const [user] = await fastify.db.select()
        .from(fastify.db.users)
        .where(fastify.db.eq(fastify.db.users.id, userId))
        .limit(1);
      
      return user || null;
    } catch (err) {
      return null;
    }
  });
}, {
  name: 'jwt-plugin',
  dependencies: ['db-plugin']
});

// Define type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    getCurrentUser: (request: FastifyRequest) => Promise<User | null>;
  }
}

// Define type augmentation for JWT payload
declare module 'fastify-jwt' {
  interface FastifyJWT {
    payload: {
      id: number;
      email: string;
    };
    user: {
      id: number;
      email: string;
    };
  }
}