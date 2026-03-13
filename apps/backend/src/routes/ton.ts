import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { telegramAuthMiddleware } from '../middleware/telegram';

export default async function tonRoutes(app: FastifyInstance) {
  const MIN_WITHDRAW = Number(process.env.MIN_WITHDRAW_TON) || 1;
  const MIN_DEPOSIT = Number(process.env.MIN_DEPOSIT_TON) || 0.5;
  const FEE_PCT = Number(process.env.WITHDRAW_FEE_PCT) || 10;
  const HNV_RATE = Number(process.env.HNV_TO_TON_RATE) || 100_000;
  const DEPOSIT_REQUIRED = process.env.DEPOSIT_REQUIRED === 'true';

  // GET /api/ton/status
  app.get('/status', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: 'Not found' });

    const availableTon = user.balance / HNV_RATE;
    const hasDeposit = user.totalDeposited >= MIN_DEPOSIT;
    const canWithdraw = !DEPOSIT_REQUIRED || hasDeposit;

    const recentTx = await prisma.tonTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return reply.send({
      balance: user.balance,
      availableTon,
      totalDeposited: user.totalDeposited,
      hasDeposit,
      canWithdraw,
      depositRequired: DEPOSIT_REQUIRED,
      minWithdraw: MIN_WITHDRAW,
      minDeposit: MIN_DEPOSIT,
      feePct: FEE_PCT,
      tonAddress: user.tonAddress,
      transactions: recentTx,
    });
  });

  // POST /api/ton/connect-wallet
  app.post('/connect-wallet', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const { address } = request.body as { address: string };

    if (!address || address.length < 10) {
      return reply.status(400).send({ error: 'Invalid TON address' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { tonAddress: address },
    });

    return reply.send({ tonAddress: updated.tonAddress });
  });

  // POST /api/ton/deposit — simulate deposit (in real app: verify on-chain)
  app.post('/deposit', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const { amount, txHash } = request.body as { amount: number; txHash?: string };

    if (!amount || amount < MIN_DEPOSIT) {
      return reply.status(400).send({ error: `Minimum deposit: ${MIN_DEPOSIT} TON` });
    }

    const bonusRate = 1.1; // +10% HNV bonus
    const hnvAmount = Math.floor(amount * HNV_RATE * bonusRate);

    const [tx] = await prisma.$transaction([
      prisma.tonTransaction.create({
        data: {
          userId,
          type: 'deposit',
          amount,
          hnvAmount,
          status: 'completed',
          txHash: txHash || null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          balance: { increment: hnvAmount },
          totalEarned: { increment: hnvAmount },
          totalDeposited: { increment: amount },
        },
      }),
    ]);

    return reply.send({ transaction: tx, hnvCredited: hnvAmount });
  });

  // POST /api/ton/withdraw
  app.post('/withdraw', { preHandler: telegramAuthMiddleware }, async (request, reply) => {
    const { userId } = request.user as { userId: number };
    const { amount } = request.body as { amount: number };

    if (!amount || amount < MIN_WITHDRAW) {
      return reply.status(400).send({ error: `Minimum withdrawal: ${MIN_WITHDRAW} TON` });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return reply.status(404).send({ error: 'Not found' });

    // Check deposit requirement
    if (DEPOSIT_REQUIRED && user.totalDeposited < MIN_DEPOSIT) {
      return reply.status(400).send({
        error: `Deposit required: minimum ${MIN_DEPOSIT} TON before withdrawing`,
      });
    }

    if (!user.tonAddress) {
      return reply.status(400).send({ error: 'Connect TON wallet first' });
    }

    const hnvRequired = Math.ceil(amount * HNV_RATE);
    if (user.balance < hnvRequired) {
      return reply.status(400).send({ error: 'Insufficient HNV balance' });
    }

    const feeAmount = amount * FEE_PCT / 100;
    const netAmount = amount - feeAmount;

    const tx = await prisma.tonTransaction.create({
      data: {
        userId,
        type: 'withdrawal',
        amount: netAmount,
        hnvAmount: hnvRequired,
        status: 'pending',
        note: `Fee: ${feeAmount.toFixed(4)} TON (${FEE_PCT}%)`,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: hnvRequired } },
    });

    return reply.send({
      transaction: tx,
      requested: amount,
      fee: feeAmount,
      net: netAmount,
      hnvDeducted: hnvRequired,
      message: 'Withdrawal pending admin approval',
    });
  });
}
