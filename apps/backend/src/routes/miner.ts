import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { telegramAuthMiddleware } from '../middleware/telegram';
import { calcPendingIncome, xpForLevel } from '@hashnova/shared';

export default async function minerRoutes(app: FastifyInstance) {
  // GET /api/miner/status — get current balance + pending income
  app.get('/status', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farms: true },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const maxOfflineHours = Number(process.env.OFFLINE_MAX_HOURS) || 8;
    const pendingIncome = calcPendingIncome(user.incomePerHour, user.lastClaim, maxOfflineHours);

    return reply.send({
      balance: user.balance,
      totalEarned: user.totalEarned,
      incomePerHour: user.incomePerHour,
      pendingIncome,
      level: user.level,
      xp: user.xp,
      xpRequired: xpForLevel(user.level + 1),
      farms: user.farms,
      lastClaim: user.lastClaim,
    });
  });

  // POST /api/miner/claim — claim pending income
  app.post('/claim', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const maxOfflineHours = Number(process.env.OFFLINE_MAX_HOURS) || 8;
    const pendingIncome = calcPendingIncome(user.incomePerHour, user.lastClaim, maxOfflineHours);

    if (pendingIncome < 1) {
      return reply.status(400).send({ error: 'Nothing to claim' });
    }

    // XP = 1 per 100 HNV
    const xpGained = Math.floor(pendingIncome / 100);
    let newXp = user.xp + xpGained;
    let newLevel = user.level;

    while (newXp >= xpForLevel(newLevel + 1)) {
      newXp -= xpForLevel(newLevel + 1);
      newLevel++;
    }

    // Referral passive income: give 5% to referrer
    if (user.referredBy) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: user.referredBy } });
      if (referrer) {
        const refPct = Number(process.env.REFERRAL_PCT) || 5;
        const refBonus = Math.floor(pendingIncome * refPct / 100);
        if (refBonus > 0) {
          await prisma.user.update({
            where: { id: referrer.id },
            data: { balance: { increment: refBonus }, totalEarned: { increment: refBonus } },
          });
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: pendingIncome },
        totalEarned: { increment: pendingIncome },
        lastClaim: new Date(),
        xp: newXp,
        level: newLevel,
      },
    });

    return reply.send({
      claimed: pendingIncome,
      newBalance: updated.balance,
      newLevel: updated.level,
      newXp: updated.xp,
      levelUp: newLevel > user.level,
    });
  });
}
