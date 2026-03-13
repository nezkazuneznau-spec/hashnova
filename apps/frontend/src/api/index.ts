import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE, timeout: 15000 });

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hn_token');
  if (token && token !== 'null') config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Log all errors to console for debugging
api.interceptors.response.use(
  (r) => r,
  (error) => {
    console.error('[API ERROR]', error.config?.url, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// Helper: extract readable error string from any axios error
export function getErrMsg(e: any): string {
  if (typeof e?.response?.data?.error === 'string') return e.response.data.error;
  if (typeof e?.response?.data?.message === 'string') return e.response.data.message;
  if (typeof e?.message === 'string') return e.message;
  return 'Неизвестная ошибка';
}

export const authAPI = {
  login: (initData: string) => api.post('/auth/login', { initData }),
  start: (initData: string, refCode?: string) => api.post('/auth/start', { initData, refCode }),
};
export const minerAPI = {
  getStatus: () => api.get('/miner/status'),
  claim: () => api.post('/miner/claim'),
};
export const shopAPI = {
  getItems: () => api.get('/shop/items'),
  buy: (farmType: string) => api.post('/shop/buy', { farmType }),
};
export const dailyAPI = {
  getStatus: () => api.get('/daily/status'),
  claim: () => api.post('/daily/claim'),
};
export const referralAPI = {
  getStatus: () => api.get('/referral/status'),
};
export const leaderboardAPI = {
  getTop: () => api.get('/leaderboard/top'),
  getMyRank: () => api.get('/leaderboard/rank'),
};
export const tonAPI = {
  getStatus: () => api.get('/ton/status'),
  connectWallet: (address: string) => api.post('/ton/connect-wallet', { address }),
  deposit: (amount: number, txHash?: string) => api.post('/ton/deposit', { amount, txHash }),
  withdraw: (amount: number) => api.post('/ton/withdraw', { amount }),
};

export default api;
