# ⛏ HashNova — Telegram Mini App

Пассивный idle-майнер в Telegram. Строй фермы, накапливай HNV, выводи TON.

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Node.js + Fastify + Prisma |
| Database | PostgreSQL |
| Bot | Telegraf |
| Blockchain | TON |

## Структура

```
hashnova/
├── apps/
│   ├── frontend/     ← React Mini App (5 экранов)
│   └── backend/      ← REST API + Telegram Bot
└── packages/
    └── shared/       ← Общие типы, константы, формулы
```

## Быстрый старт (локально)

```bash
# 1. Установи зависимости
npm install

# 2. Настрой .env
cp apps/backend/.env.example apps/backend/.env
# Заполни BOT_TOKEN, DATABASE_URL, JWT_SECRET

# 3. Запусти базу (Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=hashnova postgres:15

# 4. Мигрируй базу
cd apps/backend && npx prisma migrate dev

# 5. Запусти всё
cd ../.. && npm run dev
```

## Деплой на Railway

См. `HashNova_Railway_Deploy.docx`

## Игровые механики

- **Фермы**: GPU Rig → ASIC Miner → Server Farm → Quantum Rig
- **Офлайн доход**: накапливается до 8 часов
- **Рефералы**: +500 HNV + 5% от дохода рефа навсегда
- **Стрик**: 7 дней [100, 250, 500, 750, 1000, 1500, 2000 HNV]
- **TON вывод**: 1 TON = 100 000 HNV, комиссия 10%
- **Депозит**: обязателен для разблокировки вывода
