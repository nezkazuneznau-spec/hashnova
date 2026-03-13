import { useStore } from '../store';
import { minerAPI, dailyAPI } from '../api/index';
import { DAILY_REWARDS, xpForLevel } from '../shared';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const { balance, incomePerHour, pendingIncome, farms, level, xp, setBalance, setPendingIncome, setLevel } = useStore();
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState('');
  const [dailyStatus, setDailyStatus] = useState<{ canClaim: boolean; streak: number; nextReward: number } | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  // Load daily status
  useEffect(() => {
    dailyAPI.getStatus()
      .then((r) => setDailyStatus(r.data))
      .catch(() => setDailyStatus({ canClaim: false, streak: 0, nextReward: DAILY_REWARDS[0] }));
  }, []);

  const handleClaim = async () => {
    if (claiming || pendingIncome < 1) return;
    setClaiming(true);
    try {
      const res = await minerAPI.claim();
      setBalance(res.data.newBalance);
      setPendingIncome(0);
      if (res.data.levelUp) setLevel(res.data.newLevel, res.data.newXp);
      showToast(`🎉 +${Math.floor(res.data.claimed).toLocaleString('ru-RU')} HNV!`);
    } catch (e: any) {
      showToast('⚠️ ' + (e.response?.data?.error || 'Ошибка'));
    } finally {
      setClaiming(false);
    }
  };

  const handleDaily = async () => {
    if (!dailyStatus?.canClaim) return;
    try {
      const res = await dailyAPI.claim();
      setBalance(res.data.newBalance);
      setDailyStatus({ canClaim: false, streak: res.data.newStreak, nextReward: DAILY_REWARDS[Math.min(res.data.newStreak, DAILY_REWARDS.length - 1)] });
      showToast(`🎁 +${res.data.reward} HNV! День ${res.data.newStreak}/7`);
    } catch (e: any) {
      showToast('⚠️ ' + (e.response?.data?.error || 'Уже получено'));
    }
  };

  const xpRequired = xpForLevel(level + 1);
  const xpPct = Math.min((xp / xpRequired) * 100, 100);
  const streak = dailyStatus?.streak ?? 0;

  return (
    <div style={{ padding: '12px 14px 100px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 65, left: '50%', transform: 'translateX(-50%)', background: 'rgba(16,185,129,.92)', color: '#fff', padding: '9px 20px', borderRadius: 22, fontSize: 12, fontWeight: 700, zIndex: 999, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Balance */}
      <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,.07),rgba(139,92,246,.07))', border: '1px solid rgba(59,130,246,.18)', borderRadius: 20, padding: '20px 18px 17px', marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: '#475569', letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Space Mono,monospace', marginBottom: 7 }}>⛏ HASHNOVA BALANCE</div>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 36, fontWeight: 900, background: 'linear-gradient(90deg,#F59E0B,#FDE68A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {Math.floor(balance).toLocaleString('ru-RU')}
        </div>
        <div style={{ fontSize: 11, color: '#475569', fontFamily: 'Space Mono,monospace', marginTop: 4 }}>≈ ${(Math.floor(balance) * 0.0001).toFixed(2)} USD</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 11, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 18, padding: '5px 13px' }}>
          <span style={{ color: '#10B981', fontFamily: 'Space Mono,monospace', fontSize: 11 }}>▲ +{incomePerHour.toLocaleString('ru-RU')} HNV/ч</span>
        </div>
      </div>

      {/* Pending & claim */}
      <div style={{ textAlign: 'center', fontSize: 10, color: '#64748B', fontFamily: 'Space Mono,monospace', marginBottom: 6 }}>
        ⏱ Накоплено: <span style={{ color: '#F59E0B', fontWeight: 700 }}>+{Math.floor(pendingIncome).toLocaleString('ru-RU')} HNV</span>
      </div>
      <button
        onClick={handleClaim}
        disabled={claiming}
        style={{ width: '100%', padding: '15px 20px', border: 'none', cursor: claiming ? 'not-allowed' : 'pointer', borderRadius: 15, fontSize: 13, fontWeight: 900, letterSpacing: '1.2px', textTransform: 'uppercase', fontFamily: 'Orbitron,sans-serif', color: '#fff', background: 'linear-gradient(135deg,#3B82F6,#7C3AED,#A855F7)', boxShadow: '0 4px 24px rgba(124,58,237,.45)', marginBottom: 14, opacity: claiming ? .7 : 1 }}
      >
        {claiming ? '⏳ СБОР...' : '⚡ СОБРАТЬ МОНЕТЫ'}
      </button>

      {/* Daily rewards — динамические на основе streak */}
      <div style={{ fontSize: 9, color: '#475569', letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Space Mono,monospace', marginBottom: 8 }}>
        🎁 Ежедневная награда {dailyStatus ? `• Стрик: ${streak}/7` : ''}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, marginBottom: 15 }}>
        {DAILY_REWARDS.map((reward, i) => {
          // i < streak  → уже получено (зелёное)
          // i === streak → сегодняшний день (активный)
          // i > streak  → будущий (серый)
          const done = i < streak;
          const active = i === streak;
          const canClick = active && dailyStatus?.canClaim;

          return (
            <div
              key={i}
              onClick={canClick ? handleDaily : undefined}
              style={{
                borderRadius: 9, padding: '7px 2px', textAlign: 'center',
                background: done ? 'rgba(16,185,129,.07)' : active ? 'rgba(245,158,11,.1)' : 'rgba(20,20,42,.7)',
                border: `1px solid ${done ? 'rgba(16,185,129,.3)' : active ? '#F59E0B' : 'rgba(42,42,72,.8)'}`,
                cursor: canClick ? 'pointer' : 'default',
                opacity: !done && !active ? 0.5 : 1,
              }}
            >
              <div style={{ fontSize: 7, color: '#475569', fontFamily: 'Space Mono,monospace' }}>{i + 1}</div>
              <div style={{ fontSize: 14, margin: '2px 0' }}>
                {done ? '✅' : active && !dailyStatus?.canClaim ? '⏳' : active ? '🎁' : '🔒'}
              </div>
              <div style={{ fontSize: 7, fontWeight: 700, color: done ? '#10B981' : active ? '#F59E0B' : '#475569' }}>
                {reward >= 1000 ? `${reward / 1000}K` : reward}
              </div>
            </div>
          );
        })}
      </div>

      {/* XP bar */}
      <div style={{ marginBottom: 15 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 5 }}>
          <span>LVL {level} → {level + 1}</span>
          <span style={{ fontFamily: 'Space Mono,monospace', fontSize: 10 }}>{Math.floor(xp).toLocaleString()} / {xpRequired.toLocaleString()} XP</span>
        </div>
        <div style={{ height: 4, background: 'rgba(40,40,70,.9)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)', width: `${xpPct}%`, transition: 'width .5s' }} />
        </div>
      </div>

      {/* Farms */}
      <div style={{ fontSize: 9, color: '#475569', letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Space Mono,monospace', marginBottom: 8 }}>🏭 Мои фермы</div>
      {farms.length === 0 && (
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: '20px 0' }}>Нет ферм — купи в Магазине!</div>
      )}
      {farms.map((farm: any) => (
        <div key={farm.id} style={{ background: 'rgba(20,20,42,.8)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 14, padding: '12px 14px', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(139,92,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
            {farm.farmType === 'GPU_RIG' ? '🖥️' : farm.farmType === 'ASIC_MINER' ? '⚡' : farm.farmType === 'SERVER_FARM' ? '🏭' : '🚀'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{farm.farmType.replace(/_/g, ' ')}</div>
            <div style={{ fontSize: 10, color: '#475569', fontFamily: 'Space Mono,monospace' }}>Уровень {farm.level}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981', fontFamily: 'Space Mono,monospace' }}>+{farm.incomePerHour.toLocaleString()}/ч</div>
            <div style={{ fontSize: 9, color: '#8B5CF6', border: '1px solid rgba(139,92,246,.3)', borderRadius: 4, padding: '1px 5px', fontFamily: 'Space Mono,monospace', display: 'inline-block', marginTop: 2 }}>LVL {farm.level}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
