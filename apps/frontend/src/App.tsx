import { useEffect, useRef } from 'react';
import { useStore } from './store';
import { authAPI, minerAPI } from './api';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ReferralPage from './pages/ReferralPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  const {
    token, activeTab, incomePerHour,
    setToken, setUser, setBalance, setIncomePerHour,
    setPendingIncome, setFarms, setLevel, setLoading, setActiveTab, tickPending,
  } = useStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Auth & load ──────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const initData = window.Telegram?.WebApp?.initData || '';
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref') || undefined;

        let currentToken = token;
        if (!currentToken || currentToken === 'null') {
          const res = await authAPI.login(initData);
          currentToken = res.data.token;
          setToken(currentToken!);
          setUser(res.data.user);
        }

        const statusRes = await minerAPI.getStatus();
        const s = statusRes.data;
        setBalance(s.balance);
        setIncomePerHour(s.incomePerHour);
        setPendingIncome(s.pendingIncome);
        setFarms(s.farms);
        setLevel(s.level, s.xp);
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ─── Live counter ─────────────────────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const perSecond = incomePerHour / 3600;
    intervalRef.current = setInterval(() => tickPending(perSecond), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [incomePerHour]);

  const tabs = [
    { key: 'home', icon: '⛏', label: 'Майнинг' },
    { key: 'shop', icon: '🛒', label: 'Магазин' },
    { key: 'ref', icon: '👥', label: 'Рефералы' },
    { key: 'lb', icon: '🏆', label: 'Рейтинг' },
    { key: 'prof', icon: '👤', label: 'Профиль' },
  ];

  const pages: Record<string, React.ReactNode> = {
    home: <HomePage />,
    shop: <ShopPage />,
    ref: <ReferralPage />,
    lb: <LeaderboardPage />,
    prof: <ProfilePage />,
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050510', maxWidth: 480, margin: '0 auto', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 8px', background: 'rgba(5,5,16,.95)', borderBottom: '1px solid rgba(59,130,246,.15)', flexShrink: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1E3A5F,#312E81)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⛏</div>
          <div>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 14, fontWeight: 900, background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>HashNova</div>
            <div style={{ fontSize: 10, color: '#8B5CF6', fontFamily: 'Space Mono,monospace' }}>MINER</div>
          </div>
        </div>
        <div style={{ padding: '5px 12px', background: 'rgba(6,182,212,.08)', border: '1px solid rgba(6,182,212,.25)', borderRadius: 18, fontSize: 10, color: '#06B6D4', fontFamily: 'Space Mono,monospace', display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#06B6D4', animation: 'pulse 2s infinite' }} />
          TON Connected
        </div>
      </div>

      {/* Tab bar (top) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 3, padding: '7px 12px 0', background: 'rgba(5,5,16,.9)', flexShrink: 0 }}>
        {tabs.map((t) => (
          <div
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '7px 2px', textAlign: 'center', fontSize: 8, fontWeight: 700,
              letterSpacing: '.5px', cursor: 'pointer', borderRadius: 7,
              textTransform: 'uppercase', fontFamily: 'Orbitron,sans-serif',
              color: activeTab === t.key ? '#3B82F6' : '#475569',
              background: activeTab === t.key ? 'rgba(59,130,246,.12)' : 'transparent',
              boxShadow: activeTab === t.key ? 'inset 0 0 0 1px rgba(59,130,246,.25)' : 'none',
              transition: 'all .2s',
            }}
          >
            {t.icon}<br />{t.label}
          </div>
        ))}
      </div>

      {/* Page content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {pages[activeTab]}
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', background: 'rgba(5,5,16,.97)', borderTop: '1px solid rgba(42,42,72,.6)', flexShrink: 0 }}>
        {tabs.map((t, i) => (
          <div
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              padding: '8px 4px 10px', cursor: 'pointer',
              color: activeTab === t.key ? '#8B5CF6' : '#475569',
              position: 'relative', transition: 'all .2s',
            }}
          >
            {activeTab === t.key && (
              <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: '#8B5CF6', borderRadius: '0 0 3px 3px', boxShadow: '0 0 8px #8B5CF6' }} />
            )}
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{ fontSize: 8, fontWeight: 700, fontFamily: 'Orbitron,sans-serif', marginTop: 2, textTransform: 'uppercase' }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
