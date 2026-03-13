import { useEffect, useState } from 'react';
import { referralAPI, leaderboardAPI, tonAPI, getErrMsg } from '../api/index';
import { useStore } from '../store';

// ─── SHARED HELPERS ────────────────────────────────────────────────────────
function Spinner({ text }: { text: string }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:12 }}>
      <div style={{ width:36, height:36, border:'3px solid rgba(59,130,246,.2)', borderTop:'3px solid #3B82F6', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <div style={{ color:'#64748B', fontSize:12 }}>{text}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ErrorBox({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div style={{ padding:'30px 20px', textAlign:'center' }}>
      <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
      <div style={{ color:'#EF4444', fontSize:13, marginBottom:20 }}>{msg}</div>
      <button onClick={onRetry} style={{ padding:'10px 24px', background:'#3B82F6', border:'none', borderRadius:10, color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'Orbitron,sans-serif', fontSize:11 }}>ПОВТОРИТЬ</button>
    </div>
  );
}

function Toast({ msg }: { msg: string }) {
  if (!msg) return null;
  return <div style={{ position:'fixed', top:65, left:'50%', transform:'translateX(-50%)', background:'rgba(16,185,129,.92)', color:'#fff', padding:'9px 20px', borderRadius:22, fontSize:12, fontWeight:700, zIndex:999, pointerEvents:'none', whiteSpace:'nowrap' }}>{msg}</div>;
}

// ─── REFERRAL ─────────────────────────────────────────────────────────────
export function ReferralPage() {
  const [state, setState] = useState<'loading'|'ok'|'error'>('loading');
  const [data, setData] = useState<any>({count:0, passiveBonus:0, referralLink:'', referrals:[]});
  const [errMsg, setErrMsg] = useState('');
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(()=>setToast(''),2500); };

  function load() {
    setState('loading');
    referralAPI.getStatus()
      .then(r => { setData(r.data ?? {}); setState('ok'); })
      .catch(e => { setErrMsg(getErrMsg(e)); setState('error'); });
  }
  useEffect(load, []);

  if (state === 'loading') return <Spinner text="Загрузка рефералов..." />;
  if (state === 'error')   return <ErrorBox msg={errMsg} onRetry={load} />;

  const count       = data?.count       ?? 0;
  const bonus       = data?.passiveBonus ?? 0;
  const link        = data?.referralLink ?? '';
  const referrals   = data?.referrals   ?? [];

  return (
    <div style={{ padding:'12px 14px 100px' }}>
      <Toast msg={toast} />
      <div style={{ height:10 }} />
      <div style={{ background:'linear-gradient(135deg,rgba(59,130,246,.09),rgba(139,92,246,.09))', border:'1px solid rgba(59,130,246,.18)', borderRadius:20, padding:'20px 16px', marginBottom:13, textAlign:'center' }}>
        <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:17, fontWeight:900, marginBottom:6 }}>Пригласи друзей</div>
        <div style={{ fontSize:12, color:'#94A3B8', marginBottom:14, lineHeight:1.5 }}>+500 HNV за реферала<br/>+5% от его дохода навсегда</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
          <div style={{ background:'rgba(10,10,30,.7)', border:'1px solid rgba(42,42,72,.8)', borderRadius:11, padding:12 }}>
            <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:20, fontWeight:900, color:'#3B82F6' }}>{count}</div>
            <div style={{ fontSize:9, color:'#475569', fontFamily:'Space Mono,monospace', marginTop:2 }}>Рефералов</div>
          </div>
          <div style={{ background:'rgba(10,10,30,.7)', border:'1px solid rgba(42,42,72,.8)', borderRadius:11, padding:12 }}>
            <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:20, fontWeight:900, color:'#10B981' }}>+{bonus.toLocaleString()}/ч</div>
            <div style={{ fontSize:9, color:'#475569', fontFamily:'Space Mono,monospace', marginTop:2 }}>Пасс. бонус</div>
          </div>
        </div>
        {link ? (
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(10,10,30,.8)', border:'1px solid rgba(59,130,246,.2)', borderRadius:11, padding:'10px 12px' }}>
            <div style={{ flex:1, fontSize:10, color:'#94A3B8', fontFamily:'Space Mono,monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{link}</div>
            <button onClick={()=>{ try{navigator.clipboard.writeText(link);}catch{} showToast('🔗 Скопировано!'); }}
              style={{ padding:'5px 12px', background:'rgba(59,130,246,.14)', border:'1px solid rgba(59,130,246,.3)', borderRadius:8, fontSize:10, color:'#3B82F6', cursor:'pointer', fontWeight:700, whiteSpace:'nowrap' }}>
              COPY
            </button>
          </div>
        ) : (
          <div style={{ fontSize:11, color:'#475569' }}>Ссылка загружается...</div>
        )}
      </div>

      <div style={{ fontSize:9, color:'#475569', letterSpacing:3, textTransform:'uppercase', fontFamily:'Space Mono,monospace', marginBottom:8 }}>👥 Мои рефералы ({count})</div>
      {referrals.length === 0
        ? <div style={{ textAlign:'center', color:'#475569', fontSize:12, padding:'20px 0' }}>Пока нет рефералов. Поделись ссылкой!</div>
        : referrals.map((r: any) => (
          <div key={r.id} style={{ background:'rgba(20,20,42,.8)', border:'1px solid rgba(42,42,72,.8)', borderRadius:12, padding:'11px 14px', marginBottom:7, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
              <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#1E3A5F,#1D4ED8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>
                {String(r.username || r.firstName || '?')[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>{r.username ? `@${r.username}` : r.firstName}</div>
                <div style={{ fontSize:9, color:'#475569', fontFamily:'Space Mono,monospace' }}>LVL {r.level ?? 1}</div>
              </div>
            </div>
            <div style={{ fontSize:11, fontWeight:700, color:'#10B981', fontFamily:'Space Mono,monospace' }}>
              +{Math.floor((r.incomePerHour ?? 0) * 5 / 100).toLocaleString()}/ч
            </div>
          </div>
        ))
      }
    </div>
  );
}
export default ReferralPage;

// ─── LEADERBOARD ──────────────────────────────────────────────────────────
export function LeaderboardPage() {
  const [state, setState] = useState<'loading'|'ok'|'error'>('loading');
  const [top, setTop] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<any>(null);

  function load() {
    setState('loading');
    Promise.all([
      leaderboardAPI.getTop(),
      leaderboardAPI.getMyRank().catch(() => null),
    ]).then(([r, rank]) => {
      setTop(r.data?.leaderboard ?? []);
      if (rank) setMyRank(rank.data);
      setState('ok');
    }).catch(e => setState('error'));
  }
  useEffect(load, []);

  if (state === 'loading') return <Spinner text="Загрузка рейтинга..." />;
  if (state === 'error')   return <ErrorBox msg="Не удалось загрузить рейтинг" onRetry={load} />;

  const medals = ['🥇','🥈','🥉'];
  return (
    <div style={{ padding:'12px 14px 100px' }}>
      <div style={{ height:10 }} />
      {myRank && (
        <div style={{ background:'linear-gradient(135deg,rgba(245,158,11,.09),rgba(251,191,36,.04))', border:'1px solid rgba(245,158,11,.28)', borderRadius:14, padding:'14px 16px', marginBottom:13, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:26, fontWeight:900, color:'#F59E0B' }}>#{myRank.rank}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>Моя позиция</div>
            <div style={{ fontSize:10, color:'#F59E0B', fontFamily:'Space Mono,monospace' }}>⭐ Рейтинг HashNova</div>
          </div>
          <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:15, fontWeight:900, color:'#F59E0B' }}>
            {((myRank.totalEarned ?? 0) / 1e6).toFixed(2)}M HNV
          </div>
        </div>
      )}
      <div style={{ fontSize:9, color:'#475569', letterSpacing:3, textTransform:'uppercase', fontFamily:'Space Mono,monospace', marginBottom:8 }}>🏆 Топ майнеры</div>
      {top.length === 0
        ? <div style={{ textAlign:'center', color:'#475569', fontSize:12, padding:'20px 0' }}>Пока никого нет. Будь первым!</div>
        : top.map((u, i) => (
          <div key={u.id} style={{ background:'rgba(20,20,42,.8)', border:'1px solid rgba(42,42,72,.8)', borderRadius:12, padding:'10px 14px', marginBottom:7, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:12, fontWeight:900, minWidth:26, color: i===0?'#F59E0B':i===1?'#94A3B8':i===2?'#CD7F32':'#475569' }}>{i<3?medals[i]:i+1}</div>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#1A2A4A,#2D1B69)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff' }}>
              {String(u.username||u.firstName||'?')[0].toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.username?`@${u.username}`:u.firstName}</div>
              <div style={{ fontSize:9, color:'#475569', fontFamily:'Space Mono,monospace' }}>+{(u.incomePerHour??0).toLocaleString()}/ч</div>
            </div>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:12, fontWeight:700, color:'#F59E0B' }}>
              {(u.totalEarned??0)>=1e6?`${((u.totalEarned)/1e6).toFixed(1)}M`:`${((u.totalEarned??0)/1e3).toFixed(0)}K`}
            </div>
          </div>
        ))
      }
    </div>
  );
}

// ─── PROFILE ──────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { balance, incomePerHour, level, setBalance } = useStore();
  const [tonData, setTonData] = useState<any>(null);
  const [walletInput, setWalletInput] = useState('');
  const [wdAmt, setWdAmt] = useState('');
  const [depAmt, setDepAmt] = useState('');
  const [busy, setBusy] = useState('');
  const [toast, setToast] = useState('');
  const showToast = (m: string) => { setToast(m); setTimeout(()=>setToast(''),2500); };

  function refreshTon() {
    tonAPI.getStatus()
      .then(r => setTonData(r.data))
      .catch(() => setTonData({ availableTon:0, totalDeposited:0, hasDeposit:false, depositRequired:true, minDeposit:0.5, feePct:10, tonAddress:null, transactions:[] }));
  }
  useEffect(refreshTon, []);

  async function connectWallet() {
    const addr = walletInput.trim();
    if (addr.length < 10) return showToast('⚠️ Введи адрес кошелька (EQ... или UQ...)');
    setBusy('wallet');
    try {
      await tonAPI.connectWallet(addr);
      setWalletInput('');
      showToast('✅ Кошелёк подключён!');
      refreshTon();
    } catch(e:any) {
      showToast('⚠️ ' + getErrMsg(e));
    } finally {
      setBusy('');
    }
  }

  async function withdraw() {
    const v = parseFloat(wdAmt);
    if (!v || v < 1) return showToast('⚠️ Минимум 1 TON');
    if (!tonData?.tonAddress) return showToast('⚠️ Сначала подключи кошелёк');
    setBusy('wd');
    try {
      await tonAPI.withdraw(v);
      showToast('💎 Заявка на вывод отправлена!');
      setWdAmt('');
      refreshTon();
    } catch(e:any) {
      showToast('⚠️ ' + getErrMsg(e));
    } finally {
      setBusy('');
    }
  }

  async function deposit() {
    const v = parseFloat(depAmt);
    if (!v || v < 0.5) return showToast('⚠️ Минимум 0.5 TON');
    setBusy('dep');
    try {
      const res = await tonAPI.deposit(v);
      setBalance(balance + (res.data?.hnvCredited ?? 0));
      showToast(`✅ +${(res.data?.hnvCredited ?? 0).toLocaleString()} HNV зачислено!`);
      setDepAmt('');
      refreshTon();
    } catch(e:any) {
      showToast('⚠️ ' + getErrMsg(e));
    } finally {
      setBusy('');
    }
  }

  const hasWallet = !!tonData?.tonAddress;
  const inputStyle: React.CSSProperties = { flex:1, background:'rgba(8,8,24,.9)', border:'1px solid rgba(59,130,246,.22)', borderRadius:9, padding:'10px 12px', color:'#E2E8F0', fontSize:13, outline:'none', minWidth:0 };
  const btnStyle = (color: string, disabled?: boolean): React.CSSProperties => ({
    padding:'10px 16px', background: disabled ? 'rgba(60,60,80,.5)' : color,
    border:'none', borderRadius:9, color: disabled ? '#475569' : '#fff',
    fontSize:10, fontWeight:700, fontFamily:'Orbitron,sans-serif',
    cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace:'nowrap', flexShrink:0,
  });

  return (
    <div style={{ padding:'12px 14px 100px' }}>
      <Toast msg={toast} />
      <div style={{ height:10 }} />

      {/* Stats */}
      <div style={{ background:'linear-gradient(135deg,rgba(59,130,246,.07),rgba(139,92,246,.07))', border:'1px solid rgba(59,130,246,.18)', borderRadius:20, padding:'20px 16px', marginBottom:12, textAlign:'center' }}>
        <div style={{ width:70, height:70, borderRadius:'50%', margin:'0 auto 11px', background:'linear-gradient(135deg,#1E3A5F,#312E81)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, border:'2px solid rgba(59,130,246,.35)' }}>⛏</div>
        <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:15, fontWeight:900, marginBottom:4 }}>HashNova Miner</div>
        <div style={{ fontSize:11, color:'#8B5CF6', fontFamily:'Space Mono,monospace', marginBottom:14 }}>УРОВЕНЬ {level}</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {[
            { v:`${(balance/1e6).toFixed(2)}M`, l:'HNV баланс', c:'#3B82F6' },
            { v:`${(incomePerHour/1e3).toFixed(1)}K`, l:'HNV/час', c:'#10B981' },
            { v:`${(tonData?.totalDeposited??0).toFixed(2)}`, l:'TON депозит', c:'#06B6D4' },
          ].map((s,i) => (
            <div key={i} style={{ background:'rgba(10,10,28,.7)', border:'1px solid rgba(42,42,72,.8)', borderRadius:10, padding:'10px 6px' }}>
              <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:14, fontWeight:900, color:s.c }}>{s.v}</div>
              <div style={{ fontSize:9, color:'#475569', fontFamily:'Space Mono,monospace', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet */}
      <div style={{ background:'rgba(20,20,42,.8)', border:'1px solid rgba(42,42,72,.8)', borderRadius:14, padding:14, marginBottom:10 }}>
        <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:10 }}>🔗 TON Кошелёк</div>
        {hasWallet && (
          <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(16,185,129,.06)', border:'1px solid rgba(16,185,129,.2)', borderRadius:9, padding:'9px 12px', marginBottom:10 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#10B981', flexShrink:0 }} />
            <div style={{ flex:1, fontSize:10, color:'#10B981', fontFamily:'Space Mono,monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tonData.tonAddress}</div>
          </div>
        )}
        <div style={{ fontSize:11, color:'#94A3B8', marginBottom:8 }}>
          {hasWallet ? 'Сменить адрес:' : 'Введи адрес TON кошелька:'}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input
            value={walletInput}
            onChange={e => setWalletInput(e.target.value)}
            placeholder="EQ... или UQ... адрес"
            style={inputStyle}
          />
          <button
            onClick={connectWallet}
            disabled={busy === 'wallet'}
            style={btnStyle('linear-gradient(135deg,#3B82F6,#8B5CF6)', busy==='wallet')}
          >
            {busy === 'wallet' ? '...' : hasWallet ? 'СМЕНИТЬ' : 'CONNECT'}
          </button>
        </div>
      </div>

      {/* Withdraw */}
      <div style={{ background:'rgba(20,20,42,.8)', border:'1px solid rgba(42,42,72,.8)', borderRadius:14, padding:14, marginBottom:10 }}>
        <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:10 }}>💎 Вывод TON</div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
          <div>
            <div style={{ fontSize:9, color:'#475569', fontFamily:'Space Mono,monospace', marginBottom:2 }}>Доступно</div>
            <div style={{ fontFamily:'Space Mono,monospace', fontSize:18, fontWeight:700, color:'#06B6D4' }}>{(tonData?.availableTon??0).toFixed(4)} TON</div>
          </div>
          <div style={{ fontSize:10, color:'#475569', textAlign:'right' }}>
            1 TON = 100 000 HNV<br/>
            <span style={{ color:'#EF4444' }}>комиссия {tonData?.feePct??10}%</span>
          </div>
        </div>
        {tonData?.depositRequired && !tonData?.hasDeposit && (
          <div style={{ background:'rgba(239,68,68,.08)', border:'1px solid rgba(239,68,68,.25)', borderRadius:9, padding:'9px 11px', fontSize:11, color:'#EF4444', marginBottom:10 }}>
            ⚠️ Для вывода нужен депозит мин. {tonData?.minDeposit??0.5} TON
          </div>
        )}
        <div style={{ display:'flex', gap:8 }}>
          <input value={wdAmt} onChange={e=>setWdAmt(e.target.value)} type="number" placeholder="Сумма TON (мин. 1)" style={inputStyle} />
          <button onClick={withdraw} disabled={busy==='wd'} style={btnStyle('linear-gradient(135deg,#06B6D4,#3B82F6)', busy==='wd')}>
            {busy==='wd'?'...':'ВЫВЕСТИ'}
          </button>
        </div>
      </div>

      {/* Deposit */}
      <div style={{ background:'rgba(20,20,42,.8)', border:'1px solid rgba(42,42,72,.8)', borderRadius:14, padding:14, marginBottom:10 }}>
        <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:8 }}>💰 Пополнить TON → HNV</div>
        <div style={{ fontSize:11, color:'#94A3B8', marginBottom:10 }}>1 TON = 110 000 HNV (+10% бонус)</div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={depAmt} onChange={e=>setDepAmt(e.target.value)} type="number" placeholder="Сумма TON (мин. 0.5)" style={inputStyle} />
          <button onClick={deposit} disabled={busy==='dep'} style={btnStyle('linear-gradient(135deg,#10B981,#059669)', busy==='dep')}>
            {busy==='dep'?'...':'ПОПОЛНИТЬ'}
          </button>
        </div>
      </div>

      {/* History */}
      {(tonData?.transactions?.length ?? 0) > 0 && (
        <div style={{ background:'rgba(20,20,42,.8)', border:'1px solid rgba(42,42,72,.8)', borderRadius:14, padding:14 }}>
          <div style={{ fontFamily:'Orbitron,sans-serif', fontSize:11, fontWeight:700, color:'#94A3B8', marginBottom:12 }}>📊 История</div>
          {tonData.transactions.slice(0,5).map((tx:any) => (
            <div key={tx.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
              <div>
                <div style={{ fontSize:12, fontWeight:600 }}>{tx.type==='deposit'?'⬇️ Депозит':'⬆️ Вывод'}</div>
                <div style={{ fontSize:9, fontFamily:'Space Mono,monospace', color: tx.status==='completed'?'#10B981':tx.status==='pending'?'#F59E0B':'#EF4444' }}>
                  {tx.status==='completed'?'✅ Готово':tx.status==='pending'?'⏳ Ожидает':'❌ Отклонено'}
                  {' · '}{new Date(tx.createdAt).toLocaleDateString('ru-RU')}
                </div>
              </div>
              <div style={{ fontFamily:'Space Mono,monospace', fontSize:12, fontWeight:700, color:tx.type==='deposit'?'#10B981':'#EF4444' }}>
                {tx.type==='deposit'?'+':'-'}{(tx.amount??0).toFixed(3)} TON
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
