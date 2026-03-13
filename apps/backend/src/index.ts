import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import minerRoutes from './routes/miner';
import shopRoutes from './routes/shop';
import referralRoutes, { leaderboardRoutes } from './routes/referral';
import dailyRoutes from './routes/daily';
import tonRoutes from './routes/ton';
import adminRoutes from './routes/admin';

import { startPassiveIncomeJob } from './jobs/passiveIncome';
import { startBot } from './bot';

export const prisma = new PrismaClient();

const app = Fastify({ logger: true });

async function main() {
  // Plugins — must be awaited
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  });

  await app.register(rateLimit, { max: 200, timeWindow: '1 minute' });

  // Routes — must be awaited so they register before listen()
  await app.register(authRoutes,        { prefix: '/api/auth' });
  await app.register(minerRoutes,       { prefix: '/api/miner' });
  await app.register(shopRoutes,        { prefix: '/api/shop' });
  await app.register(referralRoutes,    { prefix: '/api/referral' });
  await app.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
  await app.register(dailyRoutes,       { prefix: '/api/daily' });
  await app.register(tonRoutes,         { prefix: '/api/ton' });
  await app.register(adminRoutes,       { prefix: '/api/admin' });

  app.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  // Print all registered routes for debugging
  app.ready(() => {
    console.log('📋 Registered routes:');
    console.log(app.printRoutes());
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`✅ Server running on port ${port}`);

  startPassiveIncomeJob();

  if (process.env.BOT_TOKEN) {
    startBot();
    console.log(`🤖 Bot @${process.env.BOT_USERNAME} started`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
