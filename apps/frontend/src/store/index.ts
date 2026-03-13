import { create } from 'zustand';

interface UserState {
  user: any | null;
  token: string | null;
  balance: number;
  incomePerHour: number;
  pendingIncome: number;
  level: number;
  xp: number;
  farms: any[];
  isLoading: boolean;
  activeTab: string;

  setUser: (user: any) => void;
  setToken: (token: string) => void;
  setBalance: (balance: number) => void;
  setIncomePerHour: (income: number) => void;
  setPendingIncome: (pending: number) => void;
  setFarms: (farms: any[]) => void;
  setLevel: (level: number, xp: number) => void;
  setLoading: (loading: boolean) => void;
  setActiveTab: (tab: string) => void;
  tickPending: (perSecond: number) => void;
}

export const useStore = create<UserState>((set) => ({
  user: null,
  token: localStorage.getItem('hn_token'),
  balance: 0,
  incomePerHour: 0,
  pendingIncome: 0,
  level: 1,
  xp: 0,
  farms: [],
  isLoading: true,
  activeTab: 'home',

  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('hn_token', token);
    set({ token });
  },
  setBalance: (balance) => set({ balance }),
  setIncomePerHour: (incomePerHour) => set({ incomePerHour }),
  setPendingIncome: (pendingIncome) => set({ pendingIncome }),
  setFarms: (farms) => set({ farms }),
  setLevel: (level, xp) => set({ level, xp }),
  setLoading: (isLoading) => set({ isLoading }),
  setActiveTab: (activeTab) => set({ activeTab }),
  tickPending: (perSecond) =>
    set((s) => ({ pendingIncome: s.pendingIncome + perSecond })),
}));
