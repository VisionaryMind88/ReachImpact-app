import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../../shared/schema';

// Configure neon to use the websocket constructor
neonConfig.webSocketConstructor = ws;

interface DbPluginOptions {
  // Customize by plugin options if needed
}

/**
 * This plugins creates a database connection using Drizzle ORM and PostgreSQL
 */
export const dbPlugin = fp(async function (fastify: FastifyInstance, opts: DbPluginOptions) {
  // Validate that we have a database URL
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set');
  }

  // Create database pool and client
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });

  // Handle application teardown
  fastify.addHook('onClose', async (instance) => {
    await pool.end();
  });

  // Decorate fastify instance with db
  fastify.decorate('db', db);
  fastify.decorate('pool', pool);

  fastify.log.info('Database connection established');
}, {
  name: 'db-plugin',
});

// Define type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle<typeof schema>>;
    pool: Pool;
  }
}