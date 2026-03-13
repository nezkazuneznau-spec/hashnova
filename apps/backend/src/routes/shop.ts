import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { telegramAuthMiddleware } from '../middleware/telegram';
import {
  FARM_CONFIGS,
  FarmType,
  calcFarmIncome,
  calcUpgradeCost,
} from '@hashnova/shared';

export default async function shopRoutes(app: FastifyInstance) {
  // GET /api/shop/items — list all farms with player's current state
  app.get('/items', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farms: true },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    const items = Object.values(FARM_CONFIGS).map((cfg) => {
      const owned = user.farms.find((f) => f.farmType === cfg.type);
      const currentLevel = owned?.level || 0;
      const upgradeCost = owned
        ? calcUpgradeCost(cfg.type, currentLevel)
        : cfg.basePrice;
      const nextIncome = calcFarmIncome(cfg.type, (currentLevel || 0) + 1);
      const canAfford = user.balance >= upgradeCost;
      const isUnlocked = user.level >= cfg.unlockLevel;

      return {
        ...cfg,
        owned: !!owned,
        currentLevel,
        currentIncome: owned?.incomePerHour || 0,
        upgradeCost,
        nextIncome,
        canAfford,
        isUnlocked,
      };
    });

    return reply.send({ items });
  });

  // POST /api/shop/buy — buy or upgrade a farm
  app.post('/buy', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const { farmType } = request.body as { farmType: FarmType };

    if (!FARM_CONFIGS[farmType]) {
      return reply.status(400).send({ error: 'Invalid farm type' });
    }

    const cfg = FARM_CONFIGS[farmType];
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { farms: true },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });

    if (user.level < cfg.unlockLevel) {
      return reply.status(400).send({ error: `Requires level ${cfg.unlockLevel}` });
    }

    const existingFarm = user.farms.find((f) => f.farmType === farmType);
    const currentLevel = existingFarm?.level || 0;

    if (currentLevel >= cfg.maxLevel) {
      return reply.status(400).send({ error: 'Farm already at max level' });
    }

    const cost = existingFarm
      ? calcUpgradeCost(farmType, currentLevel)
      : cfg.basePrice;

    if (user.balance < cost) {
      return reply.status(400).send({ error: 'Insufficient balance' });
    }

    const newLevel = currentLevel + 1;
    const newIncome = calcFarmIncome(farmType, newLevel);

    // Tx: deduct balance + upsert farm + update total income
    const incomeChange = newIncome - (existingFarm?.incomePerHour || 0);

    const [updatedUser, updatedFarm] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: cost },
          incomePerHour: { increment: incomeChange },
        },
      }),
      prisma.farm.upsert({
        where: { userId_farmType: { userId, farmType } },
        create: { userId, farmType, level: newLevel, incomePerHour: newIncome },
        update: { level: newLevel, incomePerHour: newIncome, lastUpgrade: new Date() },
      }),
    ]);

    return reply.send({
      farm: updatedFarm,
      newBalance: updatedUser.balance,
      newIncomePerHour: updatedUser.incomePerHour,
      costPaid: cost,
    });
  });
}
