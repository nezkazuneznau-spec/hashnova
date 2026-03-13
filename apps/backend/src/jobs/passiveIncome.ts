import cron from 'node-cron';
import { prisma } from '../index';

export function startPassiveIncomeJob() {
  // Every 5 minutes: update incomePerHour for all users based on their farms
  cron.schedule('*/5 * * * *', async () => {
    try {
      const users = await prisma.user.findMany({
        where: { isBlocked: false },
        include: { farms: true },
      });

      for (const user of users) {
        const totalIncome = user.farms.reduce((sum, f) => sum + f.incomePerHour, 0);
        if (totalIncome !== user.incomePerHour) {
          await prisma.user.update({
            where: { id: user.id },
            data: { incomePerHour: totalIncome },
          });
        }
      }
    } catch (err) {
      console.error('Passive income job error:', err);
    }
  });
}
