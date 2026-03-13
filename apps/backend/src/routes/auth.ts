import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { validateTelegramInitData } from '../middleware/telegram';
import { z } from 'zod';
import * as crypto from 'crypto';

const AuthSchema = z.object({
  initData: z.string().min(10),
});

function generateReferralCode(): string {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
}

export default async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const body = AuthSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: 'Invalid initData' });

    const botToken = process.env.BOT_TOKEN!;
    const telegramUser = validateTelegramInitData(body.data.initData, botToken);

    if (!telegramUser && process.env.NODE_ENV === 'production') {
      return reply.status(401).send({ error: 'Invalid Telegram auth' });
    }

    // Dev fallback
    const tgId = telegramUser?.id?.toString() || 'dev_user_1';
    const firstName = telegramUser?.first_name || 'Dev';
    const lastName = telegramUser?.last_name || null;
    const username = telegramUser?.username || null;

    // Upsert user
    let user = await prisma.user.findUnique({ where: { telegramId: tgId } });

    if (!user) {
      let referralCode = generateReferralCode();
      while (await prisma.user.findUnique({ where: { referralCode } })) {
        referralCode = generateReferralCode();
      }

      user = await prisma.user.create({
        data: {
          telegramId: tgId,
          firstName,
          lastName,
          username,
          referralCode,
          lastOnline: new Date(),
          lastClaim: new Date(),
        },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastOnline: new Date(), firstName, lastName, username },
      });
    }

    if (user.isBlocked) {
      return reply.status(403).send({ error: 'Account blocked' });
    }

    const token = app.jwt.sign(
      { userId: user.id, telegramId: tgId },
      { expiresIn: '7d' }
    );

    return reply.send({ token, user });
  });

  // POST /api/auth/start?ref=CODE  (from bot deep link)
  app.post('/start', async (request, reply) => {
    const { initData, refCode } = request.body as { initData: string; refCode?: string };

    const botToken = process.env.BOT_TOKEN!;
    const telegramUser = validateTelegramInitData(initData, botToken);
    if (!telegramUser && process.env.NODE_ENV === 'production') {
      return reply.status(401).send({ error: 'Invalid auth' });
    }

    const tgId = telegramUser?.id?.toString() || 'dev_user';
    let user = await prisma.user.findUnique({ where: { telegramId: tgId } });

    if (!user) {
      let referralCode = generateReferralCode();
      while (await prisma.user.findUnique({ where: { referralCode } })) {
        referralCode = generateReferralCode();
      }

      user = await prisma.user.create({
        data: {
          telegramId: tgId,
          firstName: telegramUser?.first_name || 'User',
          lastName: telegramUser?.last_name || null,
          username: telegramUser?.username || null,
          referralCode,
          referredBy: refCode || null,
          lastOnline: new Date(),
          lastClaim: new Date(),
        },
      });

      // Give referral bonus
      if (refCode) {
        const referrer = await prisma.user.findUnique({ where: { referralCode: refCode } });
        if (referrer) {
          const bonusHNV = Number(process.env.REFERRAL_BONUS) || 500;
          await prisma.user.update({
            where: { id: referrer.id },
            data: { balance: { increment: bonusHNV }, totalEarned: { increment: bonusHNV } },
          });
        }
      }
    }

    const token = app.jwt.sign({ userId: user.id, telegramId: tgId }, { expiresIn: '7d' });
    return reply.send({ token, user });
  });
}
