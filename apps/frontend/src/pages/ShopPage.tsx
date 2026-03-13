import { useEffect, useState } from 'react';
import { shopAPI } from '../api';
import { useStore } from '../store';

export default function ShopPage() {
  const { setBalance, setIncomePerHour } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    shopAPI.getItems()
      .then((r) => { setItems(r.data.items); setLoading(false); })
      .catch((e) => {
        setError('Не удалось загрузить магазин. ' + (e.response?.data?.error || 'Проверь подключение.'));
        setLoading(false);
      });
  }, []);

  const handleBuy = async (farmType: string, name: string) => {
    try {
      const res = await shopAPI.buy(farmType);
      setBalance(res.data.newBalance);
      setIncomePerHour(res.data.newIncomePerHour);
      setItems((prev) =>
        prev.map((i) =>
          i.type === farmType
            ? { ...i, owned: true, currentLevel: res.data.farm.level, currentIncome: res.data.farm.incomePerHour, upgradeCost: res.data.nextUpgradeCost ?? i.upgradeCost }
            : i
        )
      );
      showToast(`⚡ ${name} улучшена до LVL ${res.data.farm.level}!`);
    } catch (e: any) {
      showToast('⚠️ ' + (e.response?.data?.error || 'Ошибка'));
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(59,130,246,.2)', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#475569', fontSize: 12 }}>Загрузка магазина...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{error}</div>
      <button onClick={() => { setError(''); setLoading(true); shopAPI.getItems().then((r) => { setItems(r.data.items); setLoading(false); }).catch(() => setLoading(false)); }}
        style={{ padding: '9px 20px', background: '#3B82F6', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
        Попробовать снова
      </button>
    </div>
  );

  return (
    <div style={{ padding: '12px 14px 100px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 65, left: '50%', transform: 'translateX(-50%)', background: 'rgba(16,185,129,.92)', color: '#fff', padding: '9px 20px', borderRadius: 22, fontSize: 12, fontWeight: 700, zIndex: 999 }}>{toast}</div>
      )}
      <div style={{ height: 10 }} />
      {items.map((item) => (
        <div key={item.type} style={{ background: 'rgba(20,20,42,.8)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 14, padding: 14, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 12, opacity: item.isUnlocked ? 1 : .45 }}>
          <div style={{ width: 50, height: 50, borderRadius: 13, background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
            {item.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</div>
            <div style={{ fontSize: 11, color: '#10B981', fontFamily: 'Space Mono,monospace' }}>
              +{item.nextIncome.toLocaleString()}/ч {item.owned ? `(LVL ${item.currentLevel} → ${item.currentLevel + 1})` : '(новое)'}
            </div>
            {!item.isUnlocked && (
              <div style={{ fontSize: 9, color: '#F59E0B', fontFamily: 'Space Mono,monospace' }}>🔒 Требуется LVL {item.unlockLevel}</div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
            <button
              onClick={() => item.isUnlocked && item.canAfford && handleBuy(item.type, item.name)}
              style={{
                padding: '7px 14px', borderRadius: 9, fontSize: 10, fontWeight: 700,
                cursor: item.isUnlocked && item.canAfford ? 'pointer' : 'not-allowed',
                fontFamily: 'Orbitron,sans-serif', border: 'none',
                background: !item.isUnlocked ? 'rgba(60,60,80,.4)' : item.canAfford ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(60,60,80,.4)',
                color: item.canAfford && item.isUnlocked ? '#fff' : '#475569',
              }}
            >
              {!item.isUnlocked ? 'LOCKED' : item.owned ? 'UPGRADE' : 'КУПИТЬ'}
            </button>
            <div style={{ fontSize: 9, color: '#F59E0B', fontFamily: 'Space Mono,monospace' }}>💰 {item.upgradeCost.toLocaleString()} HNV</div>
          </div>
        </div>
      ))}

      <div style={{ fontSize: 9, color: '#475569', letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Space Mono,monospace', marginBottom: 8, marginTop: 8 }}>💎 TON Бустеры</div>
      <div style={{ background: 'linear-gradient(135deg,rgba(6,182,212,.06),rgba(59,130,246,.06))', border: '1px solid rgba(6,182,212,.2)', borderRadius: 14, padding: 16 }}>
        {[
          { name: '⚡ Майнинг ×2', desc: 'Удвоить доход на 24 часа', price: '1 TON' },
          { name: '🛡 Офлайн ×3', desc: 'Хранилище 24ч → 72ч', price: '2 TON' },
          { name: '🌟 VIP Статус', desc: '+20% к рефералам навсегда', price: '5 TON' },
        ].map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderTop: i > 0 ? '1px solid rgba(6,182,212,.1)' : 'none' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{b.name}</div>
              <div style={{ fontSize: 10, color: '#06B6D4', fontFamily: 'Space Mono,monospace' }}>{b.desc}</div>
            </div>
            <button style={{ padding: '8px 14px', borderRadius: 9, fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Orbitron,sans-serif', border: 'none', background: 'linear-gradient(135deg,#06B6D4,#3B82F6)', color: '#fff' }}>
              {b.price}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
