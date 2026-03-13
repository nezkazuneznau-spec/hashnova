import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

// Simple admin key check (replace with proper auth in production)
function requireAdmin(request: any, reply: any, done: Function) {
  const key = request.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY && process.env.NODE_ENV === 'production') {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  done();
}

export default async function adminRoutes(app: FastifyInstance) {
  // GET /api/admin/stats
  app.get('/stats', { preHandler: requireAdmin }, async (_req, reply) => {
    const [totalUsers, activeToday, pendingWithdrawals, totalTon] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastOnline: { gte: new Date(Date.now() - 86400000) } } }),
      prisma.tonTransaction.count({ where: { type: 'withdrawal', status: 'pending' } }),
      prisma.tonTransaction.aggregate({ where: { type: 'deposit', status: 'completed' }, _sum: { amount: true } }),
    ]);
    return reply.send({ totalUsers, activeToday, pendingWithdrawals, totalTonDeposited: totalTon._sum.amount || 0 });
  });

  // GET /api/admin/users
  app.get('/users', { preHandler: requireAdmin }, async (request, reply) => {
    const { page = '1', limit = '50', search } = request.query as any;
    const skip = (Number(page) - 1) * Number(limit);
    const where = search
      ? { OR: [{ username: { contains: search } }, { firstName: { contains: search } }] }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    return reply.send({ users, total, page: Number(page) });
  });

  // POST /api/admin/users/:id/block
  app.post('/users/:id/block', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.update({ where: { id: Number(id) }, data: { isBlocked: true } });
    return reply.send({ user });
  });

  // POST /api/admin/users/:id/unblock
  app.post('/users/:id/unblock', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const user = await prisma.user.update({ where: { id: Number(id) }, data: { isBlocked: false } });
    return reply.send({ user });
  });

  // POST /api/admin/users/:id/credit
  app.post('/users/:id/credit', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { amount } = request.body as { amount: number };
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: { balance: { increment: amount }, totalEarned: { increment: amount } },
    });
    return reply.send({ user, credited: amount });
  });

  // GET /api/admin/withdrawals
  app.get('/withdrawals', { preHandler: requireAdmin }, async (request, reply) => {
    const { status = 'pending' } = request.query as { status?: string };
    const txs = await prisma.tonTransaction.findMany({
      where: { type: 'withdrawal', status },
      include: { user: { select: { username: true, firstName: true, tonAddress: true, totalDeposited: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send({ withdrawals: txs });
  });

  // POST /api/admin/withdrawals/:id/approve
  app.post('/withdrawals/:id/approve', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tx = await prisma.tonTransaction.update({
      where: { id: Number(id) },
      data: { status: 'completed', updatedAt: new Date() },
    });
    return reply.send({ transaction: tx });
  });

  // POST /api/admin/withdrawals/:id/reject
  app.post('/withdrawals/:id/reject', { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const tx = await prisma.tonTransaction.findUnique({ where: { id: Number(id) } });
    if (!tx) return reply.status(404).send({ error: 'Not found' });

    // Refund HNV
    const hnvRate = Number(process.env.HNV_TO_TON_RATE) || 100_000;
    await prisma.user.update({
      where: { id: tx.userId },
      data: { balance: { increment: tx.hnvAmount || tx.amount * hnvRate } },
    });

    const updated = await prisma.tonTransaction.update({
      where: { id: Number(id) },
      data: { status: 'rejected', updatedAt: new Date() },
    });
    return reply.send({ transaction: updated });
  });
}
