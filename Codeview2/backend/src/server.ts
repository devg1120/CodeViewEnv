import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { initDatabase } from './database/init.js';
import { registerRoutes } from './routes/index.js';

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
});

// Register CORS
/*
await fastify.register(cors, {
  origin: ['http://localhost:5170', 'http://localhost:5171', 'http://localhost:5200'],
  credentials: true
});
*/
await fastify.register(cors, {
  origin: ['*'],   //GUSA
  credentials: true
});

// Register multipart for file uploads
await fastify.register(multipart);

// Initialize database
const db = initDatabase();
fastify.decorate('db', db);

// Register routes
await registerRoutes(fastify);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '7900', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
