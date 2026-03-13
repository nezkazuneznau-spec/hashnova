import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { telegramAuthMiddleware } from '../middleware/telegram';
import { DAILY_REWARDS } from '@hashnova/shared';

// ─── DAILY ────────────────────────────────────────────────────────────────
export default async function dailyRoutes(app: FastifyInstance) {
  app.get('/status', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: 'Not found' });

    const now = new Date();
    const lastBonus = user.lastDailyBonus;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastBonusDay = lastBonus
      ? new Date(lastBonus.getFullYear(), lastBonus.getMonth(), lastBonus.getDate())
      : null;

    const canClaim = !lastBonusDay || lastBonusDay < today;
    const streak = user.dailyStreak;
    const nextReward = DAILY_REWARDS[Math.min(streak, DAILY_REWARDS.length - 1)];

    return reply.send({ canClaim, streak, nextReward, rewards: DAILY_REWARDS });
  });

  app.post('/claim', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: 'Not found' });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastBonus = user.lastDailyBonus;
    const lastBonusDay = lastBonus
      ? new Date(lastBonus.getFullYear(), lastBonus.getMonth(), lastBonus.getDate())
      : null;

    if (lastBonusDay && lastBonusDay >= today) {
      return reply.status(400).send({ error: 'Already claimed today' });
    }

    // Check if streak continues (claimed yesterday) or resets
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const streakContinues = lastBonusDay
      ? lastBonusDay.getTime() === yesterday.getTime()
      : false;

    const newStreak = streakContinues ? user.dailyStreak + 1 : 1;
    const rewardIdx = Math.min(newStreak - 1, DAILY_REWARDS.length - 1);
    const reward = DAILY_REWARDS[rewardIdx];

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        balance: { increment: reward },
        totalEarned: { increment: reward },
        dailyStreak: newStreak,
        lastDailyBonus: now,
      },
    });

    return reply.send({ reward, newStreak, newBalance: updated.balance });
  });
}
