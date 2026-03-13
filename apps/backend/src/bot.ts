import { Telegraf, Markup } from 'telegraf';
import { prisma } from './index';

let bot: Telegraf;

export function startBot() {
  const token = process.env.BOT_TOKEN!;
  const frontendUrl = process.env.FRONTEND_URL!;

  bot = new Telegraf(token);

  bot.start(async (ctx) => {
    const refCode = ctx.startPayload?.replace('ref_', '');
    const tgUser = ctx.from;

    // Register/update user
    try {
      let user = await prisma.user.findUnique({
        where: { telegramId: String(tgUser.id) },
      });

      if (!user) {
        const crypto = await import('crypto');
        let referralCode = crypto.randomBytes(5).toString('hex').toUpperCase();
        while (await prisma.user.findUnique({ where: { referralCode } })) {
          referralCode = crypto.randomBytes(5).toString('hex').toUpperCase();
        }

        user = await prisma.user.create({
          data: {
            telegramId: String(tgUser.id),
            firstName: tgUser.first_name,
            lastName: tgUser.last_name || null,
            username: tgUser.username || null,
            referralCode,
            referredBy: refCode || null,
            lastOnline: new Date(),
            lastClaim: new Date(),
          },
        });

        // Referral bonus
        if (refCode) {
          const referrer = await prisma.user.findUnique({ where: { referralCode: refCode } });
          if (referrer) {
            const bonus = Number(process.env.REFERRAL_BONUS) || 500;
            await prisma.user.update({
              where: { id: referrer.id },
              data: { balance: { increment: bonus }, totalEarned: { increment: bonus } },
            });
            await ctx.telegram.sendMessage(
              referrer.telegramId,
              `🎉 Ваш реферал ${tgUser.first_name} присоединился!\n+${bonus} HNV начислено!`
            );
          }
        }
      }
    } catch (err) {
      console.error('Bot start error:', err);
    }

    await ctx.replyWithHTML(
      `⛏ <b>Добро пожаловать в HashNova!</b>\n\n` +
      `🚀 Строй фермы, майни HNV, выводи TON!\n\n` +
      `• GPU Rig, ASIC Miner, Server Farm, Quantum Rig\n` +
      `• Рефералы: +500 HNV + 5% от дохода\n` +
      `• Ежедневные бонусы\n\n` +
      `Нажми кнопку ниже чтобы начать 👇`,
      Markup.inlineKeyboard([
        [Markup.button.webApp('⛏ Играть в HashNova', frontendUrl)],
        [Markup.button.callback('📊 Мой баланс', 'balance')],
        [Markup.button.callback('👥 Реферальная ссылка', 'reflink')],
      ])
    );
  });

  bot.action('balance', async (ctx) => {
    const user = await prisma.user.findUnique({
      where: { telegramId: String(ctx.from?.id) },
    });
    if (!user) return ctx.answerCbQuery('Сначала запусти /start');

    const ton = (user.balance / 100_000).toFixed(4);
    await ctx.editMessageText(
      `💰 <b>Твой баланс</b>\n\n` +
      `⛏ HNV: <code>${Math.floor(user.balance).toLocaleString('ru-RU')}</code>\n` +
      `💎 TON: <code>${ton}</code>\n` +
      `📈 Доход: <code>${user.incomePerHour.toLocaleString('ru-RU')} HNV/ч</code>\n` +
      `⭐ Уровень: <code>${user.level}</code>`,
      { parse_mode: 'HTML' }
    );
    await ctx.answerCbQuery();
  });

  bot.action('reflink', async (ctx) => {
    const user = await prisma.user.findUnique({
      where: { telegramId: String(ctx.from?.id) },
    });
    if (!user) return ctx.answerCbQuery('Сначала запусти /start');

    const botUsername = process.env.BOT_USERNAME || 'HashNovaBot';
    const link = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;
    const refCount = await prisma.user.count({ where: { referredBy: user.referralCode } });

    await ctx.editMessageText(
      `👥 <b>Реферальная программа</b>\n\n` +
      `Твоя ссылка:\n<code>${link}</code>\n\n` +
      `👤 Рефералов: <b>${refCount}</b>\n` +
      `💰 Бонус за реферала: <b>+500 HNV</b>\n` +
      `📈 Пассивный бонус: <b>5% от дохода</b>`,
      { parse_mode: 'HTML' }
    );
    await ctx.answerCbQuery();
  });

  bot.command('help', async (ctx) => {
    await ctx.replyWithHTML(
      `<b>HashNova — Команды</b>\n\n` +
      `/start — Запустить игру\n` +
      `/help — Помощь\n\n` +
      `По вопросам: @HashNovaSupport`
    );
  });

  bot.launch({
    allowedUpdates: ['message', 'callback_query'],
  });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
