import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import minerRoutes from './routes/miner';
import shopRoutes from './routes/shop';
import { referralRoutes, leaderboardRoutes } from './routes/referral';
import dailyRoutes from './routes/daily';
import tonRoutes from './routes/ton';
import adminRoutes from './routes/admin';

import { startPassiveIncomeJob } from './jobs/passiveIncome';
import { startBot } from './bot';

export const prisma = new PrismaClient();

const app = Fastify({ logger: process.env.NODE_ENV !== 'production' });

async function main() {
  await app.register(cors, {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      /\.railway\.app$/,
      /\.vercel\.app$/,
    ],
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  });

  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  app.register(authRoutes,        { prefix: '/api/auth' });
  app.register(minerRoutes,       { prefix: '/api/miner' });
  app.register(shopRoutes,        { prefix: '/api/shop' });
  app.register(referralRoutes,    { prefix: '/api/referral' });
  app.register(leaderboardRoutes, { prefix: '/api/leaderboard' });
  app.register(dailyRoutes,       { prefix: '/api/daily' });
  app.register(tonRoutes,         { prefix: '/api/ton' });
  app.register(adminRoutes,       { prefix: '/api/admin' });

  app.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

  const port = Number(process.env.PORT) || 3001;
  await app.listen({ port, host: '0.0.0.0' });
  console.log(`✅ Server started on port ${port}`);

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
