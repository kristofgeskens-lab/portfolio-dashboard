'use client';
import { useState, useEffect, useCallback } from 'react';

const SIGNAL_CONFIG = {
  'STRONG BUY':  { color: '#16a34a', bg: '#052e16', label: '⬆⬆ STRONG BUY'  },
  'BUY':         { color: '#22c55e', bg: '#0f1e0f', label: '⬆ BUY'           },
  'HOLD':        { color: '#f59e0b', bg: '#1c1506', label: '◆ HOLD'          },
  'SELL':        { color: '#f97316', bg: '#1c0a02', label: '⬇ SELL'          },
  'STRONG SELL': { color: '#ef4444', bg: '#1c0505', label: '⬇⬇ STRONG SELL' },
};

const SECTOR_COLORS = {
  'Tech':        { color: '#60a5fa', bg: '#0c1a33' },
  'Healthcare':  { color: '#a78bfa', bg: '#1a0c33' },
  'Energie':     { color: '#fbbf24', bg: '#2a1f00' },
  'Consumer':    { color: '#34d399', bg: '#002a1a' },
  'Financials':  { color: '#f472b6', bg: '#2a0c1a' },
  'Industrials': { color: '#fb923c', bg: '#2a1000' },
  'Defensief':   { color: '#94a3b8', bg: '#0f172a' },
  'Groei':       { color: '#4ade80', bg: '#002a10' },
};

const pc  = v => v == null ? '#475569' : v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#94a3b8';
const ps  = v => v > 0 ? '+' : '';
const fmt = v => v == null ? '—' : `${ps(v)}${v.toFixed(2)}%`;

function SignalBadge({ signal }) {
  if (!signal) return <span style={{ color:'#334155', fontSize:10, fontFamily:'monospace' }}>—</span>;
  const cfg = SIGNAL_CONFIG[signal];
  return (
    <span style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}44`, borderRadius:6, padding:'3px 8px', fontSize:10, fontFamily:'monospace', fontWeight:700, letterSpacing:'0.04em', whiteSpace:'nowrap' }}>
      {cfg.label}
    </span>
  );
}

function SectorBadge({ sector }) {
  const cfg = SECTOR_COLORS[sector] || { color:'#94a3b8', bg:'#0f172a' };
  return (
    <span style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}33`, borderRadius:4, padding:'2px 7px', fontSize:9, fontFamily:'monospace', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
      {sector}
    </span>
  );
}

function MetricRow({ label, value, color, sub }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #1a2035' }}>
      <span style={{ fontSize:11, color:'#64748b', fontFamily:'monospace' }}>{label}</span>
      <div style={{ textAlign:'right' }}>
        <span style={{ fontSize:12, fontWeight:700, color:color||'#e2e8f0', fontFamily:'monospace' }}>{value}</span>
        {sub && <span style={{ fontSize:10, color:'#475569', marginLeft:6, fontFamily:'monospace' }}>{sub}</span>}
      </div>
    </div>
  );
}

function RSIBar({ rsi }) {
  if (!rsi) return null;
  const color = rsi<30?'#22c55e':rsi>70?'#ef4444':'#f59e0b';
  const zone  = rsi<30?'Oversold 🟢':rsi>70?'Overbought 🔴':'Neutraal 🟡';
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <div style={{ flex:1, height:6, background:'#1e293b', borderRadius:3, position:'relative' }}>
          <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${rsi}%`, background:color, borderRadius:3 }} />
          <div style={{ position:'absolute', left:'30%', top:-3, width:1, height:12, background:'#475569' }} />
          <div style={{ position:'absolute', left:'70%', top:-3, width:1, height:12, background:'#475569' }} />
        </div>
        <span style={{ fontFamily:'monospace', fontSize:11, color, minWidth:30 }}>{rsi}</span>
      </div>
      <span style={{ fontSize:10, color, fontFamily:'monospace' }}>{zone}</span>
    </div>
  );
}

function Week52Bar({ pos52, high52, low52 }) {
  if (pos52==null) return null;
  const color = pos52>75?'#22c55e':pos52<25?'#ef4444':'#f59e0b';
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
        <div style={{ flex:1, height:6, background:'#1e293b', borderRadius:3, position:'relative' }}>
          <div style={{ position:'absolute', left:`${pos52}%`, top:-2, width:10, height:10, background:color, borderRadius:'50%', transform:'translateX(-50%)' }} />
        </div>
        <span style={{ fontFamily:'monospace', fontSize:11, color, minWidth:36 }}>{pos52}%</span>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontSize:10, color:'#475569', fontFamily:'monospace' }}>L: {low52?.toFixed(2)}</span>
        <span style={{ fontSize:10, color:'#475569', fontFamily:'monospace' }}>H: {high52?.toFixed(2)}</span>
      </div>
    </div>
  );
}

function AIConclusion({ symbol, name, data, returnPct, isWatchlist, reason }) {
  if (!data?.signal) return null;

  // Statische analyse op basis van metrics - geen API nodig
  const cfg = SIGNAL_CONFIG[data.signal] || SIGNAL_CONFIG['HOLD'];
  const rsiZone = !data.rsi ? '' : data.rsi < 30 ? 'RSI oversold — mogelijke koopkans.' : data.rsi > 70 ? 'RSI overbought — voorzichtigheid geboden.' : 'RSI neutraal.';
  const maStatus = data.ma50 && data.price
    ? (data.price > data.ma50 ? 'Koers boven 50D MA' : 'Koers onder 50D MA')
    + (data.ma200 ? (data.price > data.ma200 ? ' en boven 200D MA — bullish trend.' : ' maar onder 200D MA — zwakke trend.') : '.')
    : '';
  const cross = data.ma50 && data.ma200
    ? data.ma50 > data.ma200 ? ' Golden Cross actief.' : ' Death Cross actief.'
    : '';
  const pos = data.pos52 != null
    ? data.pos52 > 75 ? ' Dicht bij 52-weeks high.' : data.pos52 < 25 ? ' Dicht bij 52-weeks low — mogelijke instapzone.' : ''
    : '';
  const advies = data.signal === 'STRONG BUY' ? (isWatchlist||reason?'Technisch sterk instapmoment.':'Positie bijhouden of uitbreiden.') :
                 data.signal === 'BUY'         ? (isWatchlist||reason?'Gunstig instapmoment.':'Positie bijhouden.') :
                 data.signal === 'HOLD'        ? (isWatchlist||reason?'Afwachten op duidelijker signaal.':'Positie behouden, geen actie vereist.') :
                 data.signal === 'SELL'        ? (isWatchlist||reason?'Nog niet instappen.':'Overweeg deels af te bouwen.') :
                 (isWatchlist||reason?'Niet instappen, momentum negatief.':'Overweeg positie te verkopen.');

  return (
    <div style={{ background:'#0a1628', border:'1px solid #1e3a5f', borderRadius:8, padding:'12px 14px', marginTop:12 }}>
      <div style={{ fontSize:9, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'monospace', marginBottom:8 }}>📊 Technische Analyse</div>
      <div style={{ color:'#cbd5e1', fontSize:13, lineHeight:1.7 }}>
        {maStatus}{cross}{pos} {rsiZone}
        <span style={{ color:cfg.color, fontWeight:600 }}> {advies}</span>
      </div>
    </div>
  );
}

function PeriodBadge({ label, value }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:50 }}>
      <span style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace', marginBottom:2 }}>{label}</span>
      <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:600, color:pc(value) }}>{fmt(value)}</span>
    </div>
  );
}

function DetailPanel({ d, row, isWatchlist, returnPct, reason }) {
  return (
    <div style={{ background:'#0d1117', borderBottom:'1px solid #1e293b', padding:'14px 16px' }}>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace', marginBottom:6 }}>RSI (14)</div>
        <RSIBar rsi={d.rsi} />
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace', marginBottom:6 }}>52-WEEK POSITIE</div>
        <Week52Bar pos52={d.pos52} high52={d.high52} low52={d.low52} />
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:'monospace', marginBottom:6 }}>TECHNISCHE METRICS</div>
        {d.ma50&&d.price&&<MetricRow label="vs 50D MA" value={d.price>d.ma50?'▲ Boven':'▼ Onder'} color={d.price>d.ma50?'#22c55e':'#ef4444'} sub={`MA: ${d.ma50?.toFixed(2)}`} />}
        {d.ma200&&d.price&&<MetricRow label="vs 200D MA" value={d.price>d.ma200?'▲ Boven':'▼ Onder'} color={d.price>d.ma200?'#22c55e':'#ef4444'} sub={`MA: ${d.ma200?.toFixed(2)}`} />}
        {d.ma50&&d.ma200&&<MetricRow label="Golden/Death Cross" value={d.ma50>d.ma200?'✦ Golden Cross':'✖ Death Cross'} color={d.ma50>d.ma200?'#22c55e':'#ef4444'} />}
        {d.vol&&<MetricRow label="Volatiliteit" value={d.vol<15?'🟢 Laag':d.vol<30?'🟡 Gemiddeld':'🔴 Hoog'} color={d.vol<15?'#22c55e':d.vol<30?'#f59e0b':'#ef4444'} sub={`${d.vol}% ann.`} />}
        {d.volTrend!=null&&<MetricRow label="Volume trend" value={d.volTrend>20?'📈 Stijgend':d.volTrend<-20?'📉 Dalend':'→ Stabiel'} color={d.volTrend>20?'#22c55e':d.volTrend<-20?'#ef4444':'#f59e0b'} sub={`${ps(d.volTrend)}${d.volTrend}%`} />}
        {row?.['Buy Price']&&!isWatchlist&&!reason&&<MetricRow label="Aankoopprijs" value={`${parseFloat(row['Buy Price']).toFixed(2)} ${row.Currency}`} color="#94a3b8" />}
      </div>
      <AIConclusion symbol={row?.Symbol||row?.symbol} name={row?.Name||row?.name} data={d} returnPct={returnPct} isWatchlist={isWatchlist} reason={reason} />
    </div>
  );
}

// ─── PORTFOLIO & WATCHLIST ───────────────────────────────────────────────────

function PortfolioTab() {
  const [data, setData]         = useState({ portfolio:[], watchlist:[], prices:{} });
  const [loading, setLoading]   = useState(false);
  const [updated, setUpdated]   = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [subTab, setSubTab]     = useState('portfolio');
  const [sortBy, setSortBy]     = useState('signal');
  const [filterSig, setFilterSig] = useState(null);
  const SIGNAL_ORDER = { 'STRONG BUY':0,'BUY':1,'HOLD':2,'SELL':3,'STRONG SELL':4 };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const r=await fetch('/api/prices'); setData(await r.json()); setUpdated(new Date()); }
    catch {} finally { setLoading(false); }
  }, []);
  useEffect(()=>{ fetchData(); },[fetchData]);

  const { portfolio, watchlist, prices } = data;
  const sortFn = (a,b) => {
    const da=prices[a.Symbol]||{}, db=prices[b.Symbol]||{};
    if(sortBy==='signal') return (SIGNAL_ORDER[da.signal]??5)-(SIGNAL_ORDER[db.signal]??5);
    if(sortBy==='1d') return (db['1d']??-999)-(da['1d']??-999);
    if(sortBy==='1m') return (db['1m']??-999)-(da['1m']??-999);
    if(sortBy==='6m') return (db['6m']??-999)-(da['6m']??-999);
    return 0;
  };
  const filterFn = r => !filterSig||(prices[r.Symbol]||{}).signal===filterSig;
  const activeRows=(subTab==='portfolio'?portfolio:watchlist).filter(filterFn).sort(sortFn);
  const sigCounts={};
  (subTab==='portfolio'?portfolio:watchlist).forEach(r=>{ const s=(prices[r.Symbol]||{}).signal; if(s) sigCounts[s]=(sigCounts[s]||0)+1; });
  const winners=portfolio.filter(r=>{ const d=prices[r.Symbol]||{}; const bp=parseFloat(r['Buy Price']); return bp&&d.price&&d.price>bp; }).length;

  const btn = a=>({ background:a?'#1e3a5f':'#111827', color:a?'#60a5fa':'#64748b', border:`1px solid ${a?'#2563eb44':'#1e293b'}`, borderRadius:6, padding:'5px 10px', fontSize:11, fontFamily:'monospace', cursor:'pointer', whiteSpace:'nowrap' });
  const stab = a=>({ flex:1, padding:'10px', background:a?'#1e3a5f':'transparent', color:a?'#60a5fa':'#64748b', border:'none', borderBottom:`2px solid ${a?'#3b82f6':'transparent'}`, fontSize:12, fontFamily:'monospace', fontWeight:600, cursor:'pointer' });

  return (
    <div>
      <div style={{ background:'linear-gradient(180deg,#111827,#0a0e1a)', padding:'52px 20px 16px', borderBottom:'1px solid #1e293b' }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>Portfolio Momentum</div>
        <div style={{ fontSize:28, fontWeight:700, color:'#f1f5f9' }}>{portfolio.length>0?`${portfolio.length} posities`:'Laden...'}</div>
        <div style={{ fontSize:12, color:'#475569', fontFamily:'monospace', marginTop:4 }}>Live via Google Sheets · {updated?updated.toLocaleTimeString('nl-BE',{hour:'2-digit',minute:'2-digit'}):'—'}</div>
        <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap' }}>
          {[{l:'Portfolio',v:portfolio.length,c:'#f1f5f9'},{l:'Watchlist',v:watchlist.length,c:'#60a5fa'},{l:'Winnaars',v:winners,c:'#22c55e'},{l:'Verliezers',v:portfolio.length-winners,c:'#ef4444'}].map(s=>(
            <div key={s.l} style={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:8, padding:'8px 14px' }}>
              <div style={{ fontSize:9, color:'#475569', textTransform:'uppercase', fontFamily:'monospace' }}>{s.l}</div>
              <div style={{ fontSize:18, fontWeight:700, color:s.c, fontFamily:'monospace' }}>{s.v}</div>
            </div>
          ))}
        </div>
        {Object.keys(sigCounts).length>0&&(
          <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
            {Object.entries(SIGNAL_CONFIG).map(([sig,cfg])=>sigCounts[sig]?(
              <button key={sig} onClick={()=>setFilterSig(filterSig===sig?null:sig)} style={{ background:filterSig===sig?cfg.bg:'#0f172a', color:cfg.color, border:`1px solid ${cfg.color}${filterSig===sig?'88':'33'}`, borderRadius:6, padding:'4px 10px', fontSize:10, fontFamily:'monospace', fontWeight:700, cursor:'pointer' }}>{sigCounts[sig]}× {sig}</button>
            ):null)}
          </div>
        )}
      </div>
      <div style={{ display:'flex', borderBottom:'1px solid #1e293b', background:'#0f172a' }}>
        <button onClick={()=>{setSubTab('portfolio');setFilterSig(null);}} style={stab(subTab==='portfolio')}>📊 Portfolio ({portfolio.length})</button>
        <button onClick={()=>{setSubTab('watchlist');setFilterSig(null);}} style={stab(subTab==='watchlist')}>👁 Watchlist ({watchlist.length})</button>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', gap:8, overflowX:'auto' }}>
        <div style={{ display:'flex', gap:6 }}>
          {[{k:'signal',l:'Signaal'},{k:'1d',l:'1D'},{k:'1m',l:'1M'},{k:'6m',l:'6M'}].map(s=>(
            <button key={s.k} onClick={()=>setSortBy(s.k)} style={btn(sortBy===s.k)}>{s.l}</button>
          ))}
        </div>
        <button onClick={fetchData} disabled={loading} style={{...btn(false),color:loading?'#334155':'#93c5fd',flexShrink:0}}>{loading?'...':'⟳'}</button>
      </div>
      {loading&&activeRows.length===0
        ? <div style={{ textAlign:'center', padding:60, color:'#334155', fontFamily:'monospace', animation:'pulse 1.5s infinite' }}>Laden via Google Sheets...</div>
        : activeRows.length===0
          ? <div style={{ textAlign:'center', padding:60, color:'#334155', fontFamily:'monospace' }}>{subTab==='watchlist'?'Voeg aandelen toe aan Watchlist tabblad in Google Sheets':'Geen posities gevonden'}</div>
          : activeRows.map(row => {
              const d=prices[row.Symbol]||{};
              const isOpen=expanded===row.Symbol;
              const isWatchlist=subTab==='watchlist';
              const bp=parseFloat(row['Buy Price']);
              const returnPct=bp&&d.price?+((d.price-bp)/bp*100).toFixed(2):null;
              return (
                <div key={row.Symbol}>
                  <div onClick={()=>setExpanded(isOpen?null:row.Symbol)} style={{ padding:'14px 16px', borderBottom:'1px solid #111827', background:isOpen?'#111827':'transparent', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                      <div style={{ flex:1, paddingRight:8 }}>
                        <div style={{ fontWeight:600, fontSize:14, color:'#f1f5f9' }}>{row.Name}</div>
                        <div style={{ fontFamily:'monospace', fontSize:10, color:'#475569', marginTop:2 }}>{row.Symbol}{!isWatchlist&&` · ${row.Shares} st.`}{row.Notes&&` · ${row.Notes}`}</div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        {d.price&&<div style={{ fontFamily:'monospace', fontSize:13, color:'#cbd5e1', fontWeight:500 }}>{d.price.toFixed(2)} {row.Currency}</div>}
                        {returnPct!=null&&<div style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:pc(returnPct), marginTop:2 }}>{ps(returnPct)}{returnPct}%</div>}
                      </div>
                    </div>
                    <div style={{ marginBottom:10 }}><SignalBadge signal={d.signal} /></div>
                    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                      {[['1D','1d'],['7D','7d'],['1M','1m'],['3M','3m'],['6M','6m']].map(([l,k])=>(
                        <PeriodBadge key={k} label={l} value={d[k]} />
                      ))}
                    </div>
                  </div>
                  {isOpen&&<DetailPanel d={d} row={row} isWatchlist={isWatchlist} returnPct={returnPct} />}
                </div>
              );
            })
      }
    </div>
  );
}

// ─── AI PICKS ────────────────────────────────────────────────────────────────

function AIPicksTab() {
  const [data, setData]         = useState({ picks:[], prices:{}, generated:null });
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [sector, setSector]     = useState(null);
  const [error, setError]       = useState(null);

  const fetchPicks = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res=await fetch('/api/ai-picks');
      const json=await res.json();
      if(json.error){setError(json.error);return;}
      setData(json);
    } catch { setError('Kon AI picks niet ophalen.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(()=>{ fetchPicks(); },[fetchPicks]);

  const { picks, prices, generated } = data;
  const sectors=[...new Set(picks.map(p=>p.sector))];
  const filtered=sector?picks.filter(p=>p.sector===sector):picks;
  const sigCounts={};
  picks.forEach(p=>{ const s=(prices[p.symbol]||{}).signal; if(s) sigCounts[s]=(sigCounts[s]||0)+1; });

  const btn = a=>({ background:a?'#1e3a5f':'#111827', color:a?'#60a5fa':'#64748b', border:`1px solid ${a?'#2563eb44':'#1e293b'}`, borderRadius:6, padding:'5px 10px', fontSize:11, fontFamily:'monospace', cursor:'pointer', whiteSpace:'nowrap' });

  return (
    <div>
      <div style={{ background:'linear-gradient(180deg,#111827,#0a0e1a)', padding:'52px 20px 16px', borderBottom:'1px solid #1e293b' }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>AI Generated</div>
        <div style={{ fontSize:28, fontWeight:700, color:'#f1f5f9' }}>🤖 Aandelen in de kijker</div>
        <div style={{ fontSize:12, color:'#475569', fontFamily:'monospace', marginTop:4 }}>{generated?`Gegenereerd op ${generated}`:'Live via AI + web search · Yahoo Finance, Bloomberg, Motley Fool'}</div>
        {Object.keys(sigCounts).length>0&&(
          <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
            {Object.entries(SIGNAL_CONFIG).map(([sig,cfg])=>sigCounts[sig]?(
              <div key={sig} style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}33`, borderRadius:6, padding:'4px 10px', fontSize:10, fontFamily:'monospace', fontWeight:700 }}>{sigCounts[sig]}× {sig}</div>
            ):null)}
          </div>
        )}
      </div>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #111827' }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
          <button onClick={()=>setSector(null)} style={btn(!sector)}>Alles</button>
          {sectors.map(s=><button key={s} onClick={()=>setSector(sector===s?null:s)} style={btn(sector===s)}>{s}</button>)}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#334155', fontFamily:'monospace' }}>{picks.length} aandelen · dagelijks vernieuwd</span>
          <button onClick={fetchPicks} disabled={loading} style={{...btn(false),color:loading?'#334155':'#93c5fd'}}>{loading?'...':'⟳ Nieuwe picks'}</button>
        </div>
      </div>
      {loading&&picks.length===0?(
        <div style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:32, marginBottom:16 }}>🤖</div>
          <div style={{ color:'#475569', fontFamily:'monospace', fontSize:13, animation:'pulse 1.5s infinite', marginBottom:8 }}>AI zoekt in Yahoo Finance, Bloomberg,<br/>Motley Fool, Seeking Alpha, De Tijd...</div>
          <div style={{ color:'#334155', fontFamily:'monospace', fontSize:11 }}>Dit duurt ~15 seconden</div>
        </div>
      ):error?(
        <div style={{ margin:20, background:'#1c0505', border:'1px solid #7f1d1d', borderRadius:8, padding:16, color:'#fca5a5', fontFamily:'monospace', fontSize:13 }}>
          ⚠️ {error}
          <button onClick={fetchPicks} style={{...btn(false),marginLeft:12,color:'#93c5fd'}}>Opnieuw</button>
        </div>
      ):filtered.map(pick=>{
        const d=prices[pick.symbol]||{};
        const isOpen=expanded===pick.symbol;
        return (
          <div key={pick.symbol}>
            <div onClick={()=>setExpanded(isOpen?null:pick.symbol)} style={{ padding:'14px 16px', borderBottom:'1px solid #111827', background:isOpen?'#111827':'transparent', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ flex:1, paddingRight:8 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#f1f5f9', marginBottom:4 }}>{pick.name}</div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                    <span style={{ fontFamily:'monospace', fontSize:10, color:'#475569' }}>{pick.symbol}</span>
                    <SectorBadge sector={pick.sector} />
                  </div>
                </div>
                {d.price&&<div style={{ fontFamily:'monospace', fontSize:13, color:'#cbd5e1', fontWeight:500, flexShrink:0 }}>{d.price.toFixed(2)} {pick.currency}</div>}
              </div>
              <div style={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:6, padding:'8px 10px', marginBottom:10, fontSize:12, color:'#94a3b8', lineHeight:1.5 }}>
                <span style={{ color:'#475569', fontSize:9, fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.08em' }}>📰 {pick.source} · </span>
                {pick.reason}
              </div>
              <div style={{ marginBottom:10 }}><SignalBadge signal={d.signal} /></div>
              <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                {[['1D','1d'],['7D','7d'],['1M','1m'],['3M','3m'],['6M','6m']].map(([l,k])=>(
                  <PeriodBadge key={k} label={l} value={d[k]} />
                ))}
              </div>
            </div>
            {isOpen&&<DetailPanel d={d} row={{Symbol:pick.symbol,Name:pick.name,Currency:pick.currency}} isWatchlist={true} reason={pick.reason} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

export default function Page() {
  const [tab, setTab] = useState('portfolio');
  const tabBtn = a=>({
    flex:1, padding:'12px 8px',
    background:a?'#0f172a':'transparent',
    color:a?'#f1f5f9':'#64748b',
    border:'none',
    borderTop:`2px solid ${a?'#3b82f6':'transparent'}`,
    fontSize:11, fontFamily:'monospace', fontWeight:a?700:400, cursor:'pointer',
  });
  return (
    <div style={{ fontFamily:"'SF Pro Display',-apple-system,sans-serif", background:'#0a0e1a', minHeight:'100vh', color:'#e2e8f0' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div style={{ paddingBottom:70 }}>
        {tab==='portfolio' && <PortfolioTab />}
        {tab==='ai'        && <AIPicksTab />}
      </div>
      <div style={{ position:'fixed', bottom:0, left:0, right:0, background:'#0f172a', borderTop:'1px solid #1e293b', display:'flex', zIndex:100, paddingBottom:'env(safe-area-inset-bottom)' }}>
        <button onClick={()=>setTab('portfolio')} style={tabBtn(tab==='portfolio')}>📊<br/>Portfolio</button>
        <button onClick={()=>setTab('ai')}        style={tabBtn(tab==='ai')}>🤖<br/>AI Picks</button>
      </div>
    </div>
  );
}

