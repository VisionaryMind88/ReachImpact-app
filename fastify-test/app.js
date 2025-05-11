// Import Fastify framework
import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

// Define a route
fastify.get('/', async (request, reply) => {
  return "Hello from Fastify on Fly.io!";
});

// Run the server
const start = async () => {
  try {
    // Listen on 0.0.0.0 to accept connections on all interfaces
    // Port 3000 as specified in requirements
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();