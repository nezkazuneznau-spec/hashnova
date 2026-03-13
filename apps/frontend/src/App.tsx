import { useEffect, useRef, lazy, Suspense } from 'react';
import { useStore } from './store';
import { authAPI, minerAPI } from './api';

// Lazy load — каждая страница рендерится только когда она активна
const HomePage     = lazy(() => import('./pages/HomePage'));
const ShopPage     = lazy(() => import('./pages/ShopPage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ProfilePage  = lazy(() => import('./pages/ProfilePage'));

const Spinner = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
    <div style={{ width: 36, height: 36, border: '3px solid rgba(59,130,246,.2)', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function App() {
  const {
    token, activeTab, incomePerHour, isLoading,
    setToken, setUser, setBalance, setIncomePerHour,
    setPendingIncome, setFarms, setLevel, setLoading, setActiveTab, tickPending,
  } = useStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const initData = window.Telegram?.WebApp?.initData || '';
        let currentToken = token;
        if (!currentToken || currentToken === 'null') {
          const res = await authAPI.login(initData);
          currentToken = res.data.token;
          setToken(currentToken!);
          setUser(res.data.user);
        }
        const s = (await minerAPI.getStatus()).data;
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

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const perSecond = incomePerHour / 3600;
    intervalRef.current = setInterval(() => tickPending(perSecond), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [incomePerHour]);

  const tabs = [
    { key: 'home', icon: '⛏', label: 'Майнинг' },
    { key: 'shop', icon: '🛒', label: 'Магазин' },
    { key: 'ref',  icon: '👥', label: 'Рефералы' },
    { key: 'lb',   icon: '🏆', label: 'Рейтинг' },
    { key: 'prof', icon: '👤', label: 'Профиль' },
  ];

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
        <div style={{ padding: '5px 12px', background: 'rgba(6,182,212,.08)', border: '1px solid rgba(6,182,212,.25)', borderRadius: 18, fontSize: 10, color: '#06B6D4', fontFamily: 'Space Mono,monospace' }}>
          {isLoading ? '⏳ Загрузка...' : '● ONLINE'}
        </div>
      </div>

      {/* Tab bar top */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 3, padding: '7px 12px 0', background: 'rgba(5,5,16,.9)', flexShrink: 0 }}>
        {tabs.map((t) => (
          <div key={t.key} onClick={() => setActiveTab(t.key)} style={{ padding: '7px 2px', textAlign: 'center', fontSize: 8, fontWeight: 700, cursor: 'pointer', borderRadius: 7, textTransform: 'uppercase', fontFamily: 'Orbitron,sans-serif', color: activeTab === t.key ? '#3B82F6' : '#475569', background: activeTab === t.key ? 'rgba(59,130,246,.12)' : 'transparent', boxShadow: activeTab === t.key ? 'inset 0 0 0 1px rgba(59,130,246,.25)' : 'none' }}>
            {t.icon}<br />{t.label}
          </div>
        ))}
      </div>

      {/* Pages — рендерим только активную */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {isLoading ? <Spinner /> : (
          <Suspense fallback={<Spinner />}>
            {activeTab === 'home' && <HomePage />}
            {activeTab === 'shop' && <ShopPage />}
            {activeTab === 'ref'  && <ReferralPage />}
            {activeTab === 'lb'   && <LeaderboardPage />}
            {activeTab === 'prof' && <ProfilePage />}
          </Suspense>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', background: 'rgba(5,5,16,.97)', borderTop: '1px solid rgba(42,42,72,.6)', flexShrink: 0 }}>
        {tabs.map((t) => (
          <div key={t.key} onClick={() => setActiveTab(t.key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px 10px', cursor: 'pointer', color: activeTab === t.key ? '#8B5CF6' : '#475569', position: 'relative' }}>
            {activeTab === t.key && <div style={{ position: 'absolute', top: 0, left: '25%', right: '25%', height: 2, background: '#8B5CF6', borderRadius: '0 0 3px 3px' }} />}
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{ fontSize: 8, fontWeight: 700, fontFamily: 'Orbitron,sans-serif', marginTop: 2, textTransform: 'uppercase' }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
