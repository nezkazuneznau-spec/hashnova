import { useState, useEffect, useCallback } from 'react';
import { shopAPI } from '../api';
import { useStore } from '../store';

export default function ShopPage() {
  const { setBalance, setIncomePerHour } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [toast, setToast] = useState('');
  const [buyingType, setBuyingType] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const load = useCallback(() => {
    setStatus('loading');
    setErrMsg('');
    // Small delay to ensure token is in localStorage
    setTimeout(() => {
      shopAPI.getItems()
        .then((r) => {
          setItems(r.data?.items ?? []);
          setStatus('ok');
        })
        .catch((e) => {
          const msg = typeof e?.response?.data?.error === 'string'
            ? e.response.data.error
            : typeof e?.message === 'string'
            ? e.message
            : 'Ошибка сети';
          setErrMsg(msg);
          setStatus('error');
        });
    }, 300);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBuy = async (farmType: string, name: string) => {
    if (buyingType) return;
    setBuyingType(farmType);
    try {
      const res = await shopAPI.buy(farmType);
      setBalance(res.data.newBalance);
      setIncomePerHour(res.data.newIncomePerHour);
      showToast(`⚡ ${name} → LVL ${res.data.farm.level}!`);
      load();
    } catch (e: any) {
      const msg = typeof e?.response?.data?.error === 'string'
        ? e.response.data.error
        : e?.message ?? 'Ошибка';
      showToast('⚠️ ' + msg);
    } finally {
      setBuyingType('');
    }
  };

  return (
    <div style={{ padding: '12px 14px 100px' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 65, left: '50%', transform: 'translateX(-50%)', background: 'rgba(16,185,129,.92)', color: '#fff', padding: '9px 20px', borderRadius: 22, fontSize: 12, fontWeight: 700, zIndex: 999, pointerEvents: 'none' }}>
          {toast}
        </div>
      )}

      {status === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, gap: 14 }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(59,130,246,.15)', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ color: '#64748B', fontSize: 13 }}>Загрузка магазина...</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>⚠️</div>
          <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
            Не удалось загрузить магазин<br />
            <span style={{ fontSize: 11, color: '#94A3B8' }}>{errMsg}</span>
          </div>
          <button
            onClick={load}
            style={{ padding: '11px 28px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'Orbitron,sans-serif', fontSize: 12, letterSpacing: 1 }}>
            ПОВТОРИТЬ
          </button>
        </div>
      )}

      {status === 'ok' && (
        <>
          <div style={{ height: 10 }} />
          {items.map((item) => {
            const isBuying = buyingType === item.type;
            const canBuy = item.isUnlocked && item.canAfford && !buyingType;
            return (
              <div key={item.type} style={{ background: 'rgba(20,20,42,.8)', border: `1px solid ${item.isUnlocked ? 'rgba(59,130,246,.2)' : 'rgba(42,42,72,.5)'}`, borderRadius: 14, padding: 14, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 12, opacity: item.isUnlocked ? 1 : .5 }}>
                <div style={{ width: 50, height: 50, borderRadius: 13, background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                  {item.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#10B981', fontFamily: 'Space Mono,monospace' }}>
                    +{(item.nextIncome ?? 0).toLocaleString()}/ч
                    {item.owned ? ` · LVL ${item.currentLevel}→${item.currentLevel + 1}` : ' · новое'}
                  </div>
                  {!item.isUnlocked && (
                    <div style={{ fontSize: 9, color: '#F59E0B' }}>🔒 Нужен LVL {item.unlockLevel}</div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
                  <button
                    onClick={() => canBuy && handleBuy(item.type, item.name)}
                    style={{
                      padding: '8px 14px', borderRadius: 9, fontSize: 10, fontWeight: 700,
                      cursor: canBuy ? 'pointer' : 'not-allowed',
                      fontFamily: 'Orbitron,sans-serif', border: 'none', minWidth: 80,
                      background: isBuying ? 'rgba(60,60,80,.6)' : canBuy ? 'linear-gradient(135deg,#3B82F6,#8B5CF6)' : 'rgba(50,50,70,.6)',
                      color: canBuy ? '#fff' : '#475569',
                    }}>
                    {isBuying ? '...' : !item.isUnlocked ? '🔒 LOCK' : item.owned ? 'UPGRADE' : 'КУПИТЬ'}
                  </button>
                  <div style={{ fontSize: 9, color: '#F59E0B', fontFamily: 'Space Mono,monospace' }}>
                    {(item.upgradeCost ?? 0).toLocaleString()} HNV
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ fontSize: 9, color: '#475569', letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Space Mono,monospace', marginBottom: 8, marginTop: 6 }}>💎 TON Бустеры</div>
          <div style={{ background: 'linear-gradient(135deg,rgba(6,182,212,.06),rgba(59,130,246,.06))', border: '1px solid rgba(6,182,212,.2)', borderRadius: 14, padding: 16 }}>
            {[
              { name: '⚡ Майнинг ×2', desc: 'Удвоить доход на 24 ч', price: '1 TON' },
              { name: '🛡 Офлайн ×3', desc: 'Хранилище до 72 ч', price: '2 TON' },
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
        </>
      )}
    </div>
  );
}
