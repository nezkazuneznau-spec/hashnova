import { useEffect, useState } from 'react';
import { referralAPI, leaderboardAPI, tonAPI } from '../api';
import { useStore } from '../store';

// ─── REFERRAL ─────────────────────────────────────────────────────────────
export function ReferralPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    referralAPI.getStatus()
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.error || 'Ошибка загрузки. Попробуй позже.'));
  }, []);

  if (!data && !error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(59,130,246,.2)', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#475569', fontSize: 12 }}>Загрузка рефералов...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
      <div style={{ color: '#EF4444', fontSize: 13, marginBottom: 16 }}>{error}</div>
      <button onClick={() => { setError(''); referralAPI.getStatus().then((r) => setData(r.data)).catch((e) => setError(e.message)); }}
        style={{ padding: '9px 20px', background: '#3B82F6', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
        Попробовать снова
      </button>
    </div>
  );

  return (
    <div style={{ padding: '12px 14px 100px' }}>
      {toast && <div style={{ position: 'fixed', top: 65, left: '50%', transform: 'translateX(-50%)', background: 'rgba(16,185,129,.92)', color: '#fff', padding: '9px 20px', borderRadius: 22, fontSize: 12, fontWeight: 700, zIndex: 999 }}>{toast}</div>}
      <div style={{ height: 10 }} />
      <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,.09),rgba(139,92,246,.09))', border: '1px solid rgba(59,130,246,.18)', borderRadius: 20, padding: '20px 16px', marginBottom: 13, textAlign: 'center' }}>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 17, fontWeight: 900, marginBottom: 6 }}>Пригласи друзей</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 14, lineHeight: 1.5 }}>+500 HNV за реферала<br />+ 5% от его дохода навсегда</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div style={{ background: 'rgba(10,10,30,.7)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 11, padding: 12, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 20, fontWeight: 900, color: '#3B82F6' }}>{data.count}</div>
            <div style={{ fontSize: 9, color: '#475569', fontFamily: 'Space Mono,monospace', marginTop: 2 }}>Рефералов</div>
          </div>
          <div style={{ background: 'rgba(10,10,30,.7)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 11, padding: 12, textAlign: 'center' }}>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 20, fontWeight: 900, color: '#10B981' }}>+{data.passiveBonus.toLocaleString()}/ч</div>
            <div style={{ fontSize: 9, color: '#475569', fontFamily: 'Space Mono,monospace', marginTop: 2 }}>Пасс. бонус</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(10,10,30,.8)', border: '1px solid rgba(59,130,246,.2)', borderRadius: 11, padding: '10px 12px' }}>
          <div style={{ flex: 1, fontSize: 10, color: '#94A3B8', fontFamily: 'Space Mono,monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{data.referralLink}</div>
          <button
            onClick={() => { navigator.clipboard?.writeText(data.referralLink); showToast('🔗 Скопировано!'); }}
            style={{ padding: '5px 12px', background: 'rgba(59,130,246,.14)', border: '1px solid rgba(59,130,246,.3)', borderRadius: 8, fontSize: 10, color: '#3B82F6', cursor: 'pointer', fontFamily: 'Orbitron,sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>
            COPY
          </button>
        </div>
      </div>

      <div style={{ fontSize: 9, color: '#475569', letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Space Mono,monospace', marginBottom: 8 }}>👥 Мои рефералы</div>
      {data.referrals.length === 0 && <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: '20px 0' }}>Пока нет рефералов. Поделись ссылкой!</div>}
      {data.referrals.map((r: any) => (
        <div key={r.id} style={{ background: 'rgba(20,20,42,.8)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 12, padding: '11px 14px', marginBottom: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#1E3A5F,#1D4ED8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
              {(r.username || r.firstName)?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{r.username ? `@${r.username}` : r.firstName}</div>
              <div style={{ fontSize: 9, color: '#475569', fontFamily: 'Space Mono,monospace' }}>LVL {r.level}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', fontFamily: 'Space Mono,monospace' }}>+{Math.floor(r.incomePerHour * 5 / 100).toLocaleString()}/ч</div>
        </div>
      ))}
    </div>
  );
}

export default ReferralPage;

// ─── LEADERBOARD ──────────────────────────────────────────────────────────
export function LeaderboardPage() {
  const [data, setData] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      leaderboardAPI.getTop(),
      leaderboardAPI.getMyRank().catch(() => null),
    ]).then(([top, rank]) => {
      setData(top.data.leaderboard);
      if (rank) setMyRank(rank.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(59,130,246,.2)', borderTop: '3px solid #3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ color: '#475569', fontSize: 12 }}>Загрузка рейтинга...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div style={{ padding: '12px 14px 100px' }}>
      <div style={{ height: 10 }} />
      {myRank && (
        <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,.09),rgba(251,191,36,.04))', border: '1px solid rgba(245,158,11,.28)', borderRadius: 14, padding: '14px 16px', marginBottom: 13, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 26, fontWeight: 900, color: '#F59E0B', minWidth: 46 }}>#{myRank.rank}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Моя позиция</div>
            <div style={{ fontSize: 10, color: '#F59E0B', fontFamily: 'Space Mono,monospace' }}>⭐ Рейтинг HashNova</div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 15, fontWeight: 900, color: '#F59E0B' }}>{(myRank.totalEarned / 1e6).toFixed(2)}M</div>
            <div style={{ fontSize: 9, color: '#F59E0B', fontFamily: 'Space Mono,monospace' }}>HNV</div>
          </div>
        </div>
      )}
      <div style={{ fontSize: 9, color: '#475569', letterSpacing: 3, textTransform: 'uppercase', fontFamily: 'Space Mono,monospace', marginBottom: 8 }}>🏆 Топ майнеры</div>
      {data.length === 0 && <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: '20px 0' }}>Пока никого нет. Будь первым!</div>}
      {data.map((u, i) => (
        <div key={u.id} style={{ background: 'rgba(20,20,42,.8)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 12, padding: '10px 14px', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 12, fontWeight: 900, minWidth: 26, color: i === 0 ? '#F59E0B' : i === 1 ? '#94A3B8' : i === 2 ? '#CD7F32' : '#475569' }}>
            {i < 3 ? medals[i] : i + 1}
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1A2A4A,#2D1B69)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
            {(u.username || u.firstName)?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{u.username ? `@${u.username}` : u.firstName}</div>
            <div style={{ fontSize: 9, color: '#475569', fontFamily: 'Space Mono,monospace' }}>+{u.incomePerHour.toLocaleString()}/ч</div>
          </div>
          <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>
            {u.totalEarned >= 1e6 ? `${(u.totalEarned / 1e6).toFixed(1)}M` : `${(u.totalEarned / 1e3).toFixed(0)}K`}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { balance, incomePerHour, level, setBalance } = useStore();
  const [tonData, setTonData] = useState<any>(null);
  const [wdAmt, setWdAmt] = useState('');
  const [depAmt, setDepAmt] = useState('');
  const [walletAddr, setWalletAddr] = useState('');
  const [showWalletInput, setShowWalletInput] = useState(false);
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    tonAPI.getStatus()
      .then((r) => setTonData(r.data))
      .catch(() => setTonData({ availableTon: 0, totalDeposited: 0, hasDeposit: false, canWithdraw: false, depositRequired: true, minWithdraw: 1, minDeposit: 0.5, feePct: 10, tonAddress: null, transactions: [] }));
  }, []);

  const handleConnectWallet = async () => {
    const addr = walletAddr.trim();
    if (!addr || addr.length < 10) return showToast('⚠️ Введи адрес TON кошелька');
    try {
      await tonAPI.connectWallet(addr);
      setTonData((prev: any) => ({ ...prev, tonAddress: addr }));
      setShowWalletInput(false);
      setWalletAddr('');
      showToast('✅ Кошелёк подключён!');
    } catch (e: any) {
      showToast('⚠️ ' + (e.response?.data?.error || 'Ошибка'));
    }
  };

  const handleWithdraw = async () => {
    const v = parseFloat(wdAmt);
    if (!v || v < 1) return showToast('⚠️ Минимум 1 TON');
    try {
      await tonAPI.withdraw(v);
      showToast(`💎 Вывод ${v} TON отправлен на проверку!`);
      setWdAmt('');
      tonAPI.getStatus().then((r) => setTonData(r.data));
    } catch (e: any) {
      showToast('⚠️ ' + (e.response?.data?.error || 'Ошибка'));
    }
  };

  const handleDeposit = async () => {
    const v = parseFloat(depAmt);
    if (!v || v < 0.5) return showToast('⚠️ Минимум 0.5 TON');
    try {
      const res = await tonAPI.deposit(v);
      setBalance(balance + res.data.hnvCredited);
      showToast(`✅ +${res.data.hnvCredited.toLocaleString()} HNV!`);
      setDepAmt('');
      tonAPI.getStatus().then((r) => setTonData(r.data));
    } catch (e: any) {
      showToast('⚠️ ' + (e.response?.data?.error || 'Ошибка'));
    }
  };

  return (
    <div style={{ padding: '12px 14px 100px' }}>
      {toast && <div style={{ position: 'fixed', top: 65, left: '50%', transform: 'translateX(-50%)', background: 'rgba(16,185,129,.92)', color: '#fff', padding: '9px 20px', borderRadius: 22, fontSize: 12, fontWeight: 700, zIndex: 999 }}>{toast}</div>}
      <div style={{ height: 10 }} />

      {/* Profile card */}
      <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,.07),rgba(139,92,246,.07))', border: '1px solid rgba(59,130,246,.18)', borderRadius: 20, padding: '20px 16px', marginBottom: 12, textAlign: 'center' }}>
        <div style={{ width: 74, height: 74, borderRadius: '50%', margin: '0 auto 11px', background: 'linear-gradient(135deg,#1E3A5F,#312E81)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, border: '2px solid rgba(59,130,246,.35)' }}>⛏</div>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 16, fontWeight: 900, marginBottom: 4 }}>HashNova Miner</div>
        <div style={{ fontSize: 11, color: '#8B5CF6', fontFamily: 'Space Mono,monospace' }}>УРОВЕНЬ {level}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
          {[
            { val: `${(Math.floor(balance) / 1e6).toFixed(2)}M`, lbl: 'HNV баланс' },
            { val: `${(incomePerHour / 1000).toFixed(1)}K`, lbl: 'HNV/час', color: '#10B981' },
            { val: tonData?.totalDeposited?.toFixed(2) ?? '0', lbl: 'TON депозит', color: '#06B6D4' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(10,10,28,.7)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 15, fontWeight: 900, color: s.color || '#3B82F6' }}>{s.val}</div>
              <div style={{ fontSize: 9, color: '#475569', fontFamily: 'Space Mono,monospace', marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet connect */}
      <div style={{ background: 'rgba(20,20,42,.8)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 10 }}>🔗 TON Кошелёк</div>
        {tonData?.tonAddress ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 9, padding: '10px 12px', marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 10, color: '#10B981', fontFamily: 'Space Mono,monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tonData.tonAddress}</div>
            </div>
            <button onClick={() => setShowWalletInput(true)} style={{ padding: '7px 14px', background: 'rgba(59,130,246,.1)', border: '1px solid rgba(59,130,246,.25)', borderRadius: 9, fontSize: 10, color: '#3B82F6', cursor: 'pointer', fontFamily: 'Orbitron,sans-serif', fontWeight: 700 }}>
              СМЕНИТЬ АДРЕС
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 10 }}>Введи адрес TON кошелька для вывода средств</div>
          </div>
        )}
        {(!tonData?.tonAddress || showWalletInput) && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              value={walletAddr}
              onChange={(e) => setWalletAddr(e.target.value)}
              placeholder="EQ... или UQ... адрес кошелька"
              style={{ flex: 1, background: 'rgba(8,8,24,.9)', border: '1px solid rgba(59,130,246,.22)', borderRadius: 9, padding: '9px 12px', color: '#E2E8F0', fontSize: 12, fontFamily: 'Space Mono,monospace', outline: 'none' }}
            />
            <button
              onClick={handleConnectWallet}
              style={{ padding: '9px 14px', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'Orbitron,sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              CONNECT
            </button>
          </div>
        )}
      </div>

      {/* Withdraw */}
      <div style={{ background: 'rgba(20,20,42,.8)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 12 }}>💎 Вывод TON</div>
        {tonData && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: '#475569', fontFamily: 'Space Mono,monospace', marginBottom: 3 }}>Доступно</div>
                <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 20, fontWeight: 700, color: '#06B6D4' }}>{(tonData.availableTon ?? 0).toFixed(4)} TON</div>
              </div>
              <div style={{ fontSize: 10, color: '#475569', fontFamily: 'Space Mono,monospace', textAlign: 'right' }}>
                1 TON = 100 000 HNV<br />
                <span style={{ color: '#EF4444' }}>комиссия {tonData.feePct}%</span>
              </div>
            </div>
            {tonData.depositRequired && !tonData.hasDeposit && (
              <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.25)', borderRadius: 9, padding: '9px 11px', fontSize: 11, color: '#EF4444', fontFamily: 'Space Mono,monospace', marginBottom: 11, lineHeight: 1.5 }}>
                ⚠️ Для вывода нужен депозит мин. {tonData.minDeposit} TON
              </div>
            )}
            {tonData.depositRequired && tonData.hasDeposited && (
              <div style={{ background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.2)', borderRadius: 9, padding: '9px 11px', fontSize: 11, color: '#10B981', fontFamily: 'Space Mono,monospace', marginBottom: 11 }}>
                ✅ Депозит подтверждён — вывод разрешён
              </div>
            )}
          </>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={wdAmt} onChange={(e) => setWdAmt(e.target.value)} type="number" placeholder="Сумма TON (мин. 1)"
            style={{ flex: 1, background: 'rgba(8,8,24,.9)', border: '1px solid rgba(59,130,246,.22)', borderRadius: 9, padding: '9px 12px', color: '#E2E8F0', fontSize: 13, fontFamily: 'Rajdhani,sans-serif', outline: 'none' }} />
          <button onClick={handleWithdraw}
            style={{ padding: '9px 14px', background: 'linear-gradient(135deg,#06B6D4,#3B82F6)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'Orbitron,sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ВЫВЕСТИ
          </button>
        </div>
      </div>

      {/* Deposit */}
      <div style={{ background: 'rgba(20,20,42,.8)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 8 }}>💰 Пополнить TON → HNV</div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 11 }}>Курс: 1 TON = 110 000 HNV (+10% бонус)</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={depAmt} onChange={(e) => setDepAmt(e.target.value)} type="number" placeholder="Сумма TON (мин. 0.5)"
            style={{ flex: 1, background: 'rgba(8,8,24,.9)', border: '1px solid rgba(59,130,246,.22)', borderRadius: 9, padding: '9px 12px', color: '#E2E8F0', fontSize: 13, fontFamily: 'Rajdhani,sans-serif', outline: 'none' }} />
          <button onClick={handleDeposit}
            style={{ padding: '9px 14px', background: 'linear-gradient(135deg,#10B981,#059669)', border: 'none', borderRadius: 9, color: '#fff', fontSize: 10, fontWeight: 700, fontFamily: 'Orbitron,sans-serif', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ПОПОЛНИТЬ
          </button>
        </div>
      </div>

      {/* TX History */}
      {tonData?.transactions?.length > 0 && (
        <div style={{ background: 'rgba(20,20,42,.8)', border: '1px solid rgba(42,42,72,.8)', borderRadius: 14, padding: 14 }}>
          <div style={{ fontFamily: 'Orbitron,sans-serif', fontSize: 11, fontWeight: 700, color: '#94A3B8', marginBottom: 12 }}>📊 История транзакций</div>
          {tonData.transactions.slice(0, 5).map((tx: any) => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.035)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{tx.type === 'deposit' ? '⬇️ Депозит' : '⬆️ Вывод'}</div>
                <div style={{ fontSize: 9, color: tx.status === 'completed' ? '#10B981' : tx.status === 'pending' ? '#F59E0B' : '#EF4444', fontFamily: 'Space Mono,monospace' }}>
                  {tx.status === 'completed' ? '✅ Выполнено' : tx.status === 'pending' ? '⏳ Ожидает' : '❌ Отклонено'}
                  {' · '}{new Date(tx.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
              <div style={{ fontFamily: 'Space Mono,monospace', fontSize: 12, fontWeight: 700, color: tx.type === 'deposit' ? '#10B981' : '#EF4444' }}>
                {tx.type === 'deposit' ? '+' : '-'}{tx.amount.toFixed(3)} TON
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
