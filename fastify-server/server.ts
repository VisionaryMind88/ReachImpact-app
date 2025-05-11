import Fastify, { FastifyInstance } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import pino from 'pino';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import contactRoutes from './routes/contacts';
import campaignRoutes from './routes/campaigns';
import callRoutes from './routes/calls';
import chatRoutes from './routes/chat';
import openaiRoutes from './routes/openai';
import twilioRoutes from './routes/twilio';

// Import plugins
import { dbPlugin } from './plugins/db';
import { jwtPlugin } from './plugins/jwt';

// Environment configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

// Create Fastify instance
const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = Fastify({
  logger: pino({
    level: 'info',
    transport: !isProd ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    } : undefined,
  }),
  disableRequestLogging: isProd,
});

// Register plugins
async function registerPlugins() {
  // CORS
  await server.register(cors, {
    origin: true, // Allow all origins in development, restrict in production
    credentials: true,
  });
  
  // Database
  await server.register(dbPlugin);
  
  // JWT Authentication
  await server.register(jwtPlugin);
  
  // Static file serving
  if (isProd) {
    await server.register(fastifyStatic, {
      root: path.join(__dirname, '../client/dist'),
      prefix: '/',
    });
  }
}

// Register routes
async function registerRoutes() {
  // Auth routes
  server.register(authRoutes, { prefix: '/api/auth' });
  
  // User routes
  server.register(userRoutes, { prefix: '/api/user' });
  
  // Contact routes
  server.register(contactRoutes, { prefix: '/api/contacts' });
  
  // Campaign routes
  server.register(campaignRoutes, { prefix: '/api/campaigns' });
  
  // Call routes
  server.register(callRoutes, { prefix: '/api/calls' });
  
  // Chat routes
  server.register(chatRoutes, { prefix: '/api/chat' });
  
  // OpenAI routes
  server.register(openaiRoutes, { prefix: '/api/openai' });
  
  // Twilio routes
  server.register(twilioRoutes, { prefix: '/api/twilio' });
  
  // Serve SPA for any unmatched routes in production
  if (isProd) {
    server.get('*', (request, reply) => {
      reply.sendFile('index.html');
    });
  }
}

// Start server
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();
    
    await server.listen({ port: PORT as number, host: '0.0.0.0' });
    
    console.log(`Server is running on http://localhost:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

start();

export default server;