// ─── USER TYPES ───────────────────────────────────────────────────────────
export interface User {
  id: number;
  telegramId: string;
  username: string | null;
  firstName: string;
  lastName: string | null;
  balance: number;
  totalEarned: number;
  incomePerHour: number;
  level: number;
  xp: number;
  referralCode: string;
  referredBy: string | null;
  lastOnline: Date;
  lastClaim: Date;
  dailyStreak: number;
  lastDailyBonus: Date | null;
  tonAddress: string | null;
  totalDeposited: number;
  isBlocked: boolean;
  createdAt: Date;
}

export interface Farm {
  id: number;
  userId: number;
  farmType: FarmType;
  level: number;
  incomePerHour: number;
  purchasedAt: Date;
  lastUpgrade: Date | null;
}

export interface TonTransaction {
  id: number;
  userId: number;
  type: 'deposit' | 'withdrawal';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  txHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── FARM TYPES ───────────────────────────────────────────────────────────
export type FarmType = 'GPU_RIG' | 'ASIC_MINER' | 'SERVER_FARM' | 'QUANTUM_RIG';

export interface FarmConfig {
  type: FarmType;
  name: string;
  emoji: string;
  baseIncome: number;       // HNV per hour at level 1
  basePrice: number;        // cost to buy
  upgradeMultiplier: number; // cost multiplier per level
  incomeMultiplier: number;  // income multiplier per level
  unlockLevel: number;       // player level required
  maxLevel: number;
}

export const FARM_CONFIGS: Record<FarmType, FarmConfig> = {
  GPU_RIG: {
    type: 'GPU_RIG',
    name: 'GPU Rig',
    emoji: '🖥️',
    baseIncome: 50,
    basePrice: 1000,
    upgradeMultiplier: 1.8,
    incomeMultiplier: 1.6,
    unlockLevel: 1,
    maxLevel: 20,
  },
  ASIC_MINER: {
    type: 'ASIC_MINER',
    name: 'ASIC Miner',
    emoji: '⚡',
    baseIncome: 200,
    basePrice: 8000,
    upgradeMultiplier: 1.9,
    incomeMultiplier: 1.7,
    unlockLevel: 3,
    maxLevel: 20,
  },
  SERVER_FARM: {
    type: 'SERVER_FARM',
    name: 'Server Farm',
    emoji: '🏭',
    baseIncome: 1000,
    basePrice: 40000,
    upgradeMultiplier: 2.0,
    incomeMultiplier: 1.8,
    unlockLevel: 7,
    maxLevel: 20,
  },
  QUANTUM_RIG: {
    type: 'QUANTUM_RIG',
    name: 'Quantum Rig',
    emoji: '🚀',
    baseIncome: 10000,
    basePrice: 500000,
    upgradeMultiplier: 2.2,
    incomeMultiplier: 2.0,
    unlockLevel: 15,
    maxLevel: 20,
  },
};

// ─── DAILY REWARDS ────────────────────────────────────────────────────────
export const DAILY_REWARDS = [100, 250, 500, 750, 1000, 1500, 2000];

// ─── LEVEL SYSTEM ─────────────────────────────────────────────────────────
export const LEVEL_TITLES: Record<number, string> = {
  1: 'ROOKIE', 2: 'MINER', 3: 'DIGGER', 4: 'PROSPECTOR',
  5: 'ENGINEER', 6: 'TECHNICIAN', 7: 'SPECIALIST', 8: 'EXPERT',
  9: 'MASTER', 10: 'GRANDMASTER', 11: 'LEGEND', 12: 'MYTHIC',
  13: 'DIVINE', 14: 'ETERNAL', 15: 'QUANTUM', 16: 'NOVA',
  17: 'SUPERNOVA', 18: 'GALAXY', 19: 'UNIVERSE', 20: 'INFINITY',
};

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function calcFarmIncome(type: FarmType, level: number): number {
  const cfg = FARM_CONFIGS[type];
  return Math.floor(cfg.baseIncome * Math.pow(cfg.incomeMultiplier, level - 1));
}

export function calcUpgradeCost(type: FarmType, currentLevel: number): number {
  const cfg = FARM_CONFIGS[type];
  return Math.floor(cfg.basePrice * Math.pow(cfg.upgradeMultiplier, currentLevel));
}

export function calcPendingIncome(
  incomePerHour: number,
  lastClaim: Date,
  maxOfflineHours = 8
): number {
  const now = Date.now();
  const elapsed = (now - new Date(lastClaim).getTime()) / 3600000;
  const capped = Math.min(elapsed, maxOfflineHours);
  return Math.floor(incomePerHour * capped);
}

// ─── GAME CONSTANTS ───────────────────────────────────────────────────────
export const HNV_TO_TON_RATE = 100_000;  // 1 TON = 100,000 HNV
export const DEPOSIT_BONUS_RATE = 1.1;   // +10% HNV on deposit
export const REFERRAL_BONUS_HNV = 500;   // HNV for inviting friend
export const REFERRAL_INCOME_PCT = 5;    // % of friend's income
export const WITHDRAW_FEE_PCT = 10;      // % fee on withdrawal
export const MIN_WITHDRAW_TON = 1;
export const MIN_DEPOSIT_TON = 0.5;
export const OFFLINE_MAX_HOURS = 8;
