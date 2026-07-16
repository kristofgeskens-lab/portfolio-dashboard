'use client';
import { useState, useEffect, useCallback } from 'react';
import AIPicks from './ai-picks';

const SIGNAL_CONFIG = {
  'STRONG BUY':  { color: '#16a34a', bg: '#052e16', label: '⬆⬆ STRONG BUY'  },
  'BUY':         { color: '#22c55e', bg: '#0f1e0f', label: '⬆ BUY'           },
  'HOLD':        { color: '#f59e0b', bg: '#1c1506', label: '◆ HOLD'          },
  'SELL':        { color: '#f97316', bg: '#1c0a02', label: '⬇ SELL'          },
  'STRONG SELL': { color: '#ef4444', bg: '#1c0505', label: '⬇⬇ STRONG SELL' },
};

const pc  = v => v == null ? '#475569' : v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#94a3b8';
const ps  = v => v > 0 ? '+' : '';
const fmt = v => v == null ? '—' : `${ps(v)}${v.toFixed(2)}%`;

function SignalBadge({ signal }) {
  if (!signal) return <span style={{ color:'#334155', fontSize:10, fontFamily:'monospace' }}>—</span>;
  const cfg = SIGNAL_CONFIG[signal];
  return (
    <span style={{
      background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.color}44`,
      borderRadius:6, padding:'3px 8px', fontSize:10, fontFamily:'monospace',
      fontWeight:700, letterSpacing:'0.04em', whiteSpace:'nowrap',
    }}>{cfg.label}</span>
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

function AIConclusion({ symbol, name, data, returnPct, isWatchlist }) {
  const [text, setText]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data?.signal) return;
    setLoading(true); setText(null);
    const context = isWatchlist ? 'Dit is een WATCHLIST positie.' : `Rendement sinds aankoop: ${returnPct}%.`;
    const prompt = `Je bent een beknopte portfolioadviseur voor een Belgische belegger. Geef voor ${name} (${symbol}) EXACT 2 zinnen in het Nederlands.
Metrics: Signaal: ${data.signal}, RSI: ${data.rsi??'—'}, 1M: ${data['1m']??'—'}%, 6M: ${data['6m']??'—'}%, vs 50D MA: ${data.ma50&&data.price?(data.price>data.ma50?'boven':'onder'):'—'}, vs 200D MA: ${data.ma200&&data.price?(data.price>data.ma200?'boven':'onder'):'—'}, 52W: ${data.pos52??'—'}%. ${context}
Zin 1: Technische situatie. Zin 2: ${isWatchlist?'Instapmoment?':'Bijhouden/bijkopen/afbouwen/verkopen met reden.'}
Geen disclaimers. Start direct.`;

    fetch('https://api.anthropic.com/v1/messages', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:1000, messages:[{role:'user',content:prompt}] }),
    })
      .then(r=>r.json())
      .then(d=>setText(d.content?.find(b=>b.type==='text')?.text||'Kon geen conclusie genereren.'))
      .catch(()=>setText('Kon geen conclusie genereren.'))
      .finally(()=>setLoading(false));
  }, [symbol, data?.signal]);

  if (!data?.signal) return null;
  return (
    <div style={{ background:'#0a1628', border:'1px solid #1e3a5f', borderRadius:8, padding:'12px 14px', marginTop:12 }}>
      <div style={{ fontSize:9, color:'#3b82f6', textTransform:'uppercase', letterSpacing:'0.1em', fontFamily:'monospace', marginBottom:8 }}>🤖 AI Conclusie</div>
      {loading ? <div style={{ color:'#334155', fontSize:12, fontFamily:'monospace', animation:'pulse 1.5s infinite' }}>Analyseren...</div>
               : <div style={{ color:'#cbd5e1', fontSize:13, lineHeight:1.6 }}>{text}</div>}
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

function StockCard({ row, prices, isWatchlist, expanded, onToggle }) {
  const d      = prices[row.Symbol] || {};
  const isOpen = expanded === row.Symbol;
  const returnPct = isWatchlist ? null : (() => {
    const bp = parseFloat(row['Buy Price']);
    return bp && d.price ? +((d.price-bp)/bp*100).toFixed(2) : parseFloat(row['Rendement %'])||null;
  })();

  return (
    <div>
      <div onClick={onToggle} style={{ padding:'14px 16px', borderBottom:'1px solid #111827', background:isOpen?'#111827':'transparent', cursor:'pointer', WebkitTapHighlightColor:'transparent' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div style={{ flex:1, paddingRight:8 }}>
            <div style={{ fontWeight:600, fontSize:14, color:'#f1f5f9' }}>{row.Name}</div>
            <div style={{ fontFamily:'monospace', fontSize:10, color:'#475569', marginTop:2 }}>
              {row.Symbol}{!isWatchlist&&` · ${row.Shares} st.`}{row.Notes&&` · ${row.Notes}`}
            </div>
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
      {isOpen && (
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
            {!isWatchlist&&row['Buy Price']&&<MetricRow label="Aankoopprijs" value={`${parseFloat(row['Buy Price']).toFixed(2)} ${row.Currency}`} color="#94a3b8" />}
          </div>
          <AIConclusion symbol={row.Symbol} name={row.Name} data={d} returnPct={returnPct} isWatchlist={isWatchlist} />
        </div>
      )}
    </div>
  );
}

function PortfolioWatchlist() {
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
    try {
      const res = await fetch('/api/prices');
      setData(await res.json());
      setUpdated(new Date());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { portfolio, watchlist, prices } = data;
  const sortFn = (a,b) => {
    const da=prices[a.Symbol]||{}, db=prices[b.Symbol]||{};
    if(sortBy==='signal') return (SIGNAL_ORDER[da.signal]??5)-(SIGNAL_ORDER[db.signal]??5);
    if(sortBy==='1d') return (db['1d']??-999)-(da['1d']??-999);
    if(sortBy==='1m') return (db['1m']??-999)-(da['1m']??-999);
    if(sortBy==='6m') return (db['6m']??-999)-(da['6m']??-999);
    return 0;
  };
  const filterFn = r => !filterSig || (prices[r.Symbol]||{}).signal===filterSig;
  const activeRows = (subTab==='portfolio'?portfolio:watchlist).filter(filterFn).sort(sortFn);
  const sigCounts = {};
  (subTab==='portfolio'?portfolio:watchlist).forEach(r=>{ const s=(prices[r.Symbol]||{}).signal; if(s) sigCounts[s]=(sigCounts[s]||0)+1; });
  const winners = portfolio.filter(r=>{ const d=prices[r.Symbol]||{}; const bp=parseFloat(r['Buy Price']); return bp&&d.price&&d.price>bp; }).length;

  const btn = a => ({ background:a?'#1e3a5f':'#111827', color:a?'#60a5fa':'#64748b', border:`1px solid ${a?'#2563eb44':'#1e293b'}`, borderRadius:6, padding:'5px 10px', fontSize:11, fontFamily:'monospace', cursor:'pointer', letterSpacing:'0.04em', whiteSpace:'nowrap' });
  const tabBtn = a => ({ flex:1, padding:'10px', background:a?'#1e3a5f':'transparent', color:a?'#60a5fa':'#64748b', border:'none', borderBottom:`2px solid ${a?'#3b82f6':'transparent'}`, fontSize:12, fontFamily:'monospace', fontWeight:600, cursor:'pointer' });

  return (
    <div>
      {/* Header */}
      <div style={{ background:'linear-gradient(180deg,#111827,#0a0e1a)', padding:'52px 20px 16px', borderBottom:'1px solid #1e293b' }}>
        <div style={{ fontSize:11, color:'#475569', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'monospace', marginBottom:6 }}>Portfolio Momentum</div>
        <div style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.02em', color:'#f1f5f9' }}>{portfolio.length>0?`${portfolio.length} posities`:'Laden...'}</div>
        <div style={{ fontSize:12, color:'#475569', fontFamily:'monospace', marginTop:4 }}>Live via Google Sheets · {updated?updated.toLocaleTimeString('nl-BE',{hour:'2-digit',minute:'2-digit'}):'—'}</div>
        <div style={{ display:'flex', gap:10, marginTop:14, flexWrap:'wrap' }}>
          {[{label:'Portfolio',value:portfolio.length,color:'#f1f5f9'},{label:'Watchlist',value:watchlist.length,color:'#60a5fa'},{label:'Winnaars',value:winners,color:'#22c55e'},{label:'Verliezers',value:portfolio.length-winners,color:'#ef4444'}].map(s=>(
            <div key={s.label} style={{ background:'#0f172a', border:'1px solid #1e293b', borderRadius:8, padding:'8px 14px' }}>
              <div style={{ fontSize:9, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'monospace' }}>{s.label}</div>
              <div style={{ fontSize:18, fontWeight:700, color:s.color, fontFamily:'monospace' }}>{s.value}</div>
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

      {/* Sub tabs */}
      <div style={{ display:'flex', borderBottom:'1px solid #1e293b', background:'#0f172a' }}>
        <button onClick={()=>{setSubTab('portfolio');setFilterSig(null);}} style={tabBtn(subTab==='portfolio')}>📊 Portfolio ({portfolio.length})</button>
        <button onClick={()=>{setSubTab('watchlist');setFilterSig(null);}} style={tabBtn(subTab==='watchlist')}>👁 Watchlist ({watchlist.length})</button>
      </div>

      {/* Sort */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', gap:8, overflowX:'auto' }}>
        <div style={{ display:'flex', gap:6 }}>
          {[{key:'signal',label:'Signaal'},{key:'1d',label:'1D'},{key:'1m',label:'1M'},{key:'6m',label:'6M'}].map(s=>(
            <button key={s.key} onClick={()=>setSortBy(s.key)} style={btn(sortBy===s.key)}>{s.label}</button>
          ))}
        </div>
        <button onClick={fetchData} disabled={loading} style={{...btn(false),color:loading?'#334155':'#93c5fd',flexShrink:0}}>{loading?'...':'⟳'}</button>
      </div>

      {/* List */}
      {loading&&activeRows.length===0?(
        <div style={{ textAlign:'center', padding:60, color:'#334155', fontFamily:'monospace', fontSize:13, animation:'pulse 1.5s infinite' }}>Laden via Google Sheets...</div>
      ):activeRows.length===0?(
        <div style={{ textAlign:'center', padding:60, color:'#334155', fontFamily:'monospace', fontSize:13 }}>
          {subTab==='watchlist'?'Voeg aandelen toe aan het Watchlist tabblad in Google Sheets':'Geen posities gevonden'}
        </div>
      ):activeRows.map(row=>(
        <StockCard key={row.Symbol} row={row} prices={prices} isWatchlist={subTab==='watchlist'} expanded={expanded} onToggle={()=>setExpanded(expanded===row.Symbol?null:row.Symbol)} />
      ))}
    </div>
  );
}

export default function Page() {
  const [mainTab, setMainTab] = useState('portfolio');

  const tabBtn = a => ({
    flex:1, padding:'12px 8px',
    background:a?'#0f172a':'transparent',
    color:a?'#f1f5f9':'#64748b',
    border:'none',
    borderTop:`2px solid ${a?'#3b82f6':'transparent'}`,
    fontSize:11, fontFamily:'monospace', fontWeight:a?700:400,
    cursor:'pointer', letterSpacing:'0.04em',
  });

  return (
    <div style={{ fontFamily:"'SF Pro Display',-apple-system,sans-serif", background:'#0a0e1a', minHeight:'100vh', color:'#e2e8f0' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Main content */}
      <div style={{ paddingBottom:70 }}>
        {mainTab==='portfolio' && <PortfolioWatchlist />}
        {mainTab==='ai'        && <AIPicks />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position:'fixed', bottom:0, left:0, right:0,
        background:'#0f172a', borderTop:'1px solid #1e293b',
        display:'flex', zIndex:100,
        paddingBottom:'env(safe-area-inset-bottom)',
      }}>
        <button onClick={()=>setMainTab('portfolio')} style={tabBtn(mainTab==='portfolio')}>
          📊<br/>Portfolio
        </button>
        <button onClick={()=>setMainTab('ai')} style={tabBtn(mainTab==='ai')}>
          🤖<br/>AI Picks
        </button>
      </div>
    </div>
  );
}
