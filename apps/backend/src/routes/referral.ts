import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { telegramAuthMiddleware } from '../middleware/telegram';

export default async function referralRoutes(app: FastifyInstance) {
  app.get('/status', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: 'Not found' });

    const referrals = await prisma.user.findMany({
      where: { referredBy: user.referralCode },
      select: {
        id: true, username: true, firstName: true,
        incomePerHour: true, level: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const refPct = Number(process.env.REFERRAL_PCT) || 5;
    const passiveBonus = referrals.reduce(
      (sum, r) => sum + Math.floor(r.incomePerHour * refPct / 100), 0
    );

    return reply.send({
      referralCode: user.referralCode,
      referralLink: `https://t.me/${process.env.BOT_USERNAME}?start=ref_${user.referralCode}`,
      count: referrals.length,
      passiveBonus,
      referrals,
    });
  });
}

export async function leaderboardRoutes(app: FastifyInstance) {
  app.get('/top', async (_request, reply) => {
    const top = await prisma.user.findMany({
      where: { isBlocked: false },
      orderBy: { totalEarned: 'desc' },
      take: 50,
      select: {
        id: true, username: true, firstName: true,
        totalEarned: true, incomePerHour: true, level: true,
      },
    });
    return reply.send({ leaderboard: top });
  });

  app.get('/rank', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: 'Not found' });

    const rank = await prisma.user.count({
      where: { totalEarned: { gt: user.totalEarned }, isBlocked: false },
    });

    return reply.send({ rank: rank + 1, totalEarned: user.totalEarned });
  });
}
