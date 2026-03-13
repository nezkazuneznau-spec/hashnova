import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE,
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── AUTH ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (initData: string) => api.post('/auth/login', { initData }),
  start: (initData: string, refCode?: string) =>
    api.post('/auth/start', { initData, refCode }),
};

// ─── MINER ────────────────────────────────────────────────────────────────
export const minerAPI = {
  getStatus: () => api.get('/miner/status'),
  claim: () => api.post('/miner/claim'),
};

// ─── SHOP ─────────────────────────────────────────────────────────────────
export const shopAPI = {
  getItems: () => api.get('/shop/items'),
  buy: (farmType: string) => api.post('/shop/buy', { farmType }),
};

// ─── DAILY ────────────────────────────────────────────────────────────────
export const dailyAPI = {
  getStatus: () => api.get('/daily/status'),
  claim: () => api.post('/daily/claim'),
};

// ─── REFERRAL ─────────────────────────────────────────────────────────────
export const referralAPI = {
  getStatus: () => api.get('/referral/status'),
};

// ─── LEADERBOARD ─────────────────────────────────────────────────────────
export const leaderboardAPI = {
  getTop: () => api.get('/leaderboard/top'),
  getMyRank: () => api.get('/leaderboard/rank'),
};

// ─── TON ──────────────────────────────────────────────────────────────────
export const tonAPI = {
  getStatus: () => api.get('/ton/status'),
  connectWallet: (address: string) => api.post('/ton/connect-wallet', { address }),
  deposit: (amount: number, txHash?: string) => api.post('/ton/deposit', { amount, txHash }),
  withdraw: (amount: number) => api.post('/ton/withdraw', { amount }),
};

export default api;
