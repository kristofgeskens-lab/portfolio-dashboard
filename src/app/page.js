'use client';
import { useState, useEffect, useCallback } from 'react';

const PORTFOLIO = [
  { symbol: 'ASML',     name: 'ASML Holding',        shares: 6,   currency: 'EUR', currentValue: 9296.40,  returnPct: 132.57, isETF: false },
  { symbol: 'MSFT',     name: 'Microsoft Corp',       shares: 16,  currency: 'USD', currentValue: 5522.18,  returnPct: -6.33,  isETF: false },
  { symbol: 'NVO',      name: 'Novo Nordisk A/S-B',   shares: 120, currency: 'DKK', currentValue: 5306.35,  returnPct: 12.55,  isETF: false },
  { symbol: 'MELI',     name: 'MercadoLibre Inc',     shares: 3,   currency: 'USD', currentValue: 4823.84,  returnPct: 3.73,   isETF: false },
  { symbol: 'MC.PA',    name: 'LVMH-Moët Hennessy',   shares: 9,   currency: 'EUR', currentValue: 4462.20,  returnPct: 3.43,   isETF: false },
  { symbol: 'ZTS',      name: 'Zoetis Inc',           shares: 70,  currency: 'USD', currentValue: 4551.25,  returnPct: -8.99,  isETF: false },
  { symbol: 'VST',      name: 'Vistra Corp',          shares: 30,  currency: 'USD', currentValue: 4193.40,  returnPct: 7.4,    isETF: false },
  { symbol: 'UNH',      name: 'UnitedHealth Group',   shares: 11,  currency: 'USD', currentValue: 4016.16,  returnPct: 71.94,  isETF: false },
  { symbol: '3IN.L',    name: '3i Group PLC',         shares: 126, currency: 'GBp', currentValue: 3954.70,  returnPct: 21.65,  isETF: false },
  { symbol: 'BN',       name: 'Brookfield Corp',      shares: 90,  currency: 'USD', currentValue: 3491.49,  returnPct: -8.84,  isETF: false },
  { symbol: 'NOW',      name: 'ServiceNow Inc',       shares: 40,  currency: 'USD', currentValue: 3654.54,  returnPct: 14.47,  isETF: false },
  { symbol: 'AMZN',     name: 'Amazon.com Inc',       shares: 15,  currency: 'USD', currentValue: 3336.30,  returnPct: 9.4,    isETF: false },
  { symbol: 'INVEB.ST', name: 'Investor AB-A',        shares: 90,  currency: 'SEK', currentValue: 3162.04,  returnPct: 30,     isETF: false },
  { symbol: 'WVE',      name: 'Wave Life Sciences',   shares: 338, currency: 'USD', currentValue: 1742.63,  returnPct: -7.17,  isETF: false },
  { symbol: 'SOF.BR',   name: 'Sofina',               shares: 10,  currency: 'EUR', currentValue: 2260.00,  returnPct: -0.41,  isETF: false },
  { symbol: 'SMR',      name: 'NuScale Power Corp',   shares: 100, currency: 'USD', currentValue: 729.30,   returnPct: -14.38, isETF: false },
  { symbol: 'EIMI.L',   name: 'iShares MSCI EM IMI', shares: 150, currency: 'EUR', currentValue: 7017.75,  returnPct: 41.07,  isETF: true  },
  { symbol: 'VBTC.DE',  name: 'VanEck Bitcoin ETN',  shares: 50,  currency: 'EUR', currentValue: 1505.20,  returnPct: -2.86,  isETF: true  },
];

const TOTAL = 73324.89;

const SIGNAL_CONFIG = {
  'STRONG BUY':  { color: '#16a34a', bg: '#052e16', label: '⬆⬆ STRONG BUY'  },
  'BUY':         { color: '#22c55e', bg: '#0f1e0f', label: '⬆ BUY'           },
  'HOLD':        { color: '#f59e0b', bg: '#1c1506', label: '◆ HOLD'          },
  'SELL':        { color: '#f97316', bg: '#1c0a02', label: '⬇ SELL'          },
  'STRONG SELL': { color: '#ef4444', bg: '#1c0505', label: '⬇⬇ STRONG SELL' },
};

const pc   = v => !v && v !== 0 ? '#475569' : v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#94a3b8';
const ps   = v => v > 0 ? '+' : '';
const fmt  = v => v == null ? '—' : `${ps(v)}${v.toFixed(2)}%`;

function SignalBadge({ signal }) {
  if (!signal) return <span style={{ color: '#334155', fontSize: 10, fontFamily: 'monospace' }}>—</span>;
  const cfg = SIGNAL_CONFIG[signal];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}44`,
      borderRadius: 6, padding: '3px 8px',
      fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>{cfg.label}</span>
  );
}

function MetricRow({ label, value, color, sub }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #1e293b' }}>
      <span style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: color || '#e2e8f0', fontFamily: 'monospace' }}>{value}</span>
        {sub && <span style={{ fontSize: 10, color: '#475569', marginLeft: 6, fontFamily: 'monospace' }}>{sub}</span>}
      </div>
    </div>
  );
}

function RSIBar({ rsi }) {
  if (!rsi) return null;
  const color = rsi < 30 ? '#22c55e' : rsi > 70 ? '#ef4444' : '#f59e0b';
  const zone  = rsi < 30 ? 'Oversold 🟢' : rsi > 70 ? 'Overbought 🔴' : 'Neutraal 🟡';
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ flex: 1, height: 6, background: '#1e293b', borderRadius: 3, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${rsi}%`, background: color, borderRadius: 3 }} />
          <div style={{ position: 'absolute', left: '30%', top: -3, width: 1, height: 12, background: '#475569' }} />
          <div style={{ position: 'absolute', left: '70%', top: -3, width: 1, height: 12, background: '#475569' }} />
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color, minWidth: 30 }}>{rsi}</span>
      </div>
      <span style={{ fontSize: 10, color, fontFamily: 'monospace' }}>{zone}</span>
    </div>
  );
}

function Week52Bar({ pos52, high52, low52 }) {
  if (pos52 == null) return null;
  const color = pos52 > 75 ? '#22c55e' : pos52 < 25 ? '#ef4444' : '#f59e0b';
  const zone  = pos52 > 75 ? 'Dicht bij 52W high 🔴' : pos52 < 25 ? 'Dicht bij 52W low 🟢' : 'Midden range 🟡';
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ flex: 1, height: 6, background: '#1e293b', borderRadius: 3, position: 'relative' }}>
          <div style={{ position: 'absolute', left: `${pos52}%`, top: -2, width: 10, height: 10, background: color, borderRadius: '50%', transform: 'translateX(-50%)' }} />
        </div>
        <span style={{ fontFamily: 'monospace', fontSize: 11, color, minWidth: 36 }}>{pos52}%</span>
      </div>
      <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{zone}</span>
    </div>
  );
}

function AIConclusion({ symbol, name, data, returnPct }) {
  const [text, setText]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!data || !data.signal) return;
    setLoading(true);
    setText(null);

    const maStatus = data.ma50 && data.price
      ? (data.price > data.ma50 ? 'boven' : 'onder') + ' 50D MA'
      : '';
    const ma200Status = data.ma200 && data.price
      ? (data.price > data.ma200 ? 'boven' : 'onder') + ' 200D MA'
      : '';

    const prompt = `Je bent een beknopte portfolioadviseur. Geef voor ${name} (${symbol}) een advies van EXACT 2 zinnen in het Nederlands voor een Belgische belegger.

Metrics:
- Signaal: ${data.signal}
- RSI: ${data.rsi ?? '—'} (${data.rsi < 30 ? 'oversold' : data.rsi > 70 ? 'overbought' : 'neutraal'})
- 1D: ${data['1d'] ?? '—'}% | 1M: ${data['1m'] ?? '—'}% | 6M: ${data['6m'] ?? '—'}%
- ${maStatus} | ${ma200Status}
- 52-week positie: ${data.pos52 ?? '—'}% (0=low, 100=high)
- Rendement sinds aankoop: ${returnPct}%

Zin 1: Wat zeggen de technische metrics over de huidige situatie?
Zin 2: Concreet advies voor deze positie (bijhouden/bijkopen/afbouwen/verkopen met reden).
Geen disclaimers. Geen inleiding. Direct starten met de analyse.`;

    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
      .then(r => r.json())
      .then(d => {
        const t = d.content?.find(b => b.type === 'text')?.text;
        setText(t || 'Kon geen conclusie genereren.');
      })
      .catch(() => setText('Kon geen conclusie genereren.'))
      .finally(() => setLoading(false));
  }, [symbol, data?.signal]);

  if (!data?.signal) return null;

  return (
    <div style={{
      background: '#0a1628',
      border: '1px solid #1e3a5f',
      borderRadius: 8,
      padding: '12px 14px',
      marginTop: 12,
    }}>
      <div style={{ fontSize: 9, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace', marginBottom: 8 }}>
        🤖 AI Conclusie
      </div>
      {loading ? (
        <div style={{ color: '#334155', fontSize: 12, fontFamily: 'monospace', animation: 'pulse 1.5s infinite' }}>
          Analyseren...
        </div>
      ) : (
        <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>{text}</div>
      )}
    </div>
  );
}

function PeriodBadge({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 50 }}>
      <span style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 2 }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600, color: pc(value) }}>{fmt(value)}</span>
    </div>
  );
}

export default function Page() {
  const [prices, setPrices]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [updated, setUpdated]   = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [sortBy, setSortBy]     = useState('signal');
  const [filterSig, setFilterSig] = useState(null);

  const SIGNAL_ORDER = { 'STRONG BUY': 0, 'BUY': 1, 'HOLD': 2, 'SELL': 3, 'STRONG SELL': 4 };

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/prices');
      const json = await res.json();
      setPrices(json);
      setUpdated(new Date());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const rows = PORTFOLIO.map(p => ({
    ...p,
    p:      prices[p.symbol] || {},
    signal: prices[p.symbol]?.signal || null,
    weight: (p.currentValue / TOTAL * 100).toFixed(1),
  }));

  const sortFn = (a, b) => {
    if (sortBy === 'signal')    return (SIGNAL_ORDER[a.signal] ?? 5) - (SIGNAL_ORDER[b.signal] ?? 5);
    if (sortBy === 'inception') return b.returnPct - a.returnPct;
    if (sortBy === 'value')     return b.currentValue - a.currentValue;
    if (sortBy === '1d')        return (b.p['1d'] ?? -999) - (a.p['1d'] ?? -999);
    if (sortBy === '1m')        return (b.p['1m'] ?? -999) - (a.p['1m'] ?? -999);
    if (sortBy === '6m')        return (b.p['6m'] ?? -999) - (a.p['6m'] ?? -999);
    return 0;
  };

  const filterFn  = r => !filterSig || r.signal === filterSig;
  const stocks    = rows.filter(r => !r.isETF).filter(filterFn).sort(sortFn);
  const etfs      = rows.filter(r =>  r.isETF).filter(filterFn).sort(sortFn);
  const sigCounts = {};
  rows.forEach(r => { if (r.signal) sigCounts[r.signal] = (sigCounts[r.signal] || 0) + 1; });

  const btn = active => ({
    background: active ? '#1e3a5f' : '#111827',
    color:      active ? '#60a5fa' : '#64748b',
    border:    `1px solid ${active ? '#2563eb44' : '#1e293b'}`,
    borderRadius: 6, padding: '5px 10px',
    fontSize: 11, fontFamily: 'monospace',
    cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ fontFamily: "'SF Pro Display',-apple-system,sans-serif", background: '#0a0e1a', minHeight: '100vh', color: '#e2e8f0', paddingBottom: 40 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* Header */}
      <div style={{ background: 'linear-gradient(180deg,#111827,#0a0e1a)', padding: '52px 20px 20px', borderBottom: '1px solid #1e293b' }}>
        <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 6 }}>Portfolio Momentum</div>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', color: '#f1f5f9' }}>€{TOTAL.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}</div>
        <div style={{ fontSize: 13, color: '#ef4444', fontFamily: 'monospace', marginTop: 4 }}>-€87,84 vandaag · -0,12%</div>

        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Posities',   value: PORTFOLIO.length,                                                                    color: '#f1f5f9' },
            { label: 'Winnaars',   value: PORTFOLIO.filter(p => p.returnPct > 0).length,                                      color: '#22c55e' },
            { label: 'Verliezers', value: PORTFOLIO.filter(p => p.returnPct < 0).length,                                      color: '#ef4444' },
            { label: 'Bijgewerkt', value: updated ? updated.toLocaleTimeString('nl-BE',{hour:'2-digit',minute:'2-digit'}) : '—', color: '#94a3b8' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 14px' }}>
              <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Signal filter pills */}
        {Object.keys(sigCounts).length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            {Object.entries(SIGNAL_CONFIG).map(([sig, cfg]) => sigCounts[sig] ? (
              <button key={sig} onClick={() => setFilterSig(filterSig === sig ? null : sig)} style={{
                background: filterSig === sig ? cfg.bg : '#0f172a', color: cfg.color,
                border: `1px solid ${cfg.color}${filterSig === sig ? '88' : '33'}`,
                borderRadius: 6, padding: '4px 10px', fontSize: 10, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer',
              }}>
                {sigCounts[sig]}× {sig}
              </button>
            ) : null)}
          </div>
        )}
      </div>

      {/* Sort toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', gap: 8, overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'signal', label: 'Signaal' }, { key: 'inception', label: 'Aankoop' },
            { key: '1d', label: '1D' }, { key: '1m', label: '1M' },
            { key: '6m', label: '6M' }, { key: 'value', label: 'Waarde' },
          ].map(s => <button key={s.key} onClick={() => setSortBy(s.key)} style={btn(sortBy === s.key)}>{s.label}</button>)}
        </div>
        <button onClick={fetchPrices} disabled={loading} style={{ ...btn(false), color: loading ? '#334155' : '#93c5fd', flexShrink: 0 }}>
          {loading ? '...' : '⟳'}
        </button>
      </div>

      {/* Stock list */}
      {[{ label: 'Aandelen', items: stocks }, { label: "ETF's", items: etfs }].map(section =>
        section.items.length === 0 ? null : (
          <div key={section.label}>
            <div style={{ padding: '8px 16px 4px', fontSize: 10, color: '#334155', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              {section.label} ({section.items.length})
            </div>
            {section.items.map(row => {
              const d = prices[row.symbol] || {};
              const isOpen = expanded === row.symbol;
              return (
                <div key={row.symbol}>
                  <div onClick={() => setExpanded(isOpen ? null : row.symbol)} style={{
                    padding: '14px 16px', borderBottom: '1px solid #111827',
                    background: isOpen ? '#111827' : 'transparent',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ flex: 1, paddingRight: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{row.name}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569', marginTop: 2 }}>
                          {row.symbol} · {row.shares} st. · {row.weight}%
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>
                          €{row.currentValue.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: pc(row.returnPct), marginTop: 2 }}>
                          {ps(row.returnPct)}{row.returnPct}%
                        </div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}><SignalBadge signal={row.signal} /></div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {[['1D','1d'],['7D','7d'],['1M','1m'],['3M','3m'],['6M','6m']].map(([l,k]) => (
                        <PeriodBadge key={k} label={l} value={d[k]} />
                      ))}
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isOpen && (
                    <div style={{ background: '#0d1117', borderBottom: '1px solid #1e293b', padding: '14px 16px' }}>

                      {/* RSI */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 6 }}>RSI (14)</div>
                        <RSIBar rsi={d.rsi} />
                      </div>

                      {/* 52-week */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 6 }}>52-WEEK POSITIE</div>
                        <Week52Bar pos52={d.pos52} high52={d.high52} low52={d.low52} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>Low: {d.low52?.toFixed(2)}</span>
                          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>High: {d.high52?.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Moving averages & Beta */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 6 }}>TECHNISCHE METRICS</div>
                        {d.ma50 && d.price && (
                          <MetricRow
                            label="vs 50D MA"
                            value={d.price > d.ma50 ? '▲ Boven' : '▼ Onder'}
                            color={d.price > d.ma50 ? '#22c55e' : '#ef4444'}
                            sub={`MA: ${d.ma50?.toFixed(2)}`}
                          />
                        )}
                        {d.ma200 && d.price && (
                          <MetricRow
                            label="vs 200D MA"
                            value={d.price > d.ma200 ? '▲ Boven' : '▼ Onder'}
                            color={d.price > d.ma200 ? '#22c55e' : '#ef4444'}
                            sub={`MA: ${d.ma200?.toFixed(2)}`}
                          />
                        )}
                        {d.ma50 && d.ma200 && (
                          <MetricRow
                            label="Golden/Death Cross"
                            value={d.ma50 > d.ma200 ? '✦ Golden Cross' : '✖ Death Cross'}
                            color={d.ma50 > d.ma200 ? '#22c55e' : '#ef4444'}
                          />
                        )}
                        {d.beta && (
                          <MetricRow
                            label="Volatiliteit"
                            value={d.beta < 0.15 ? '🟢 Laag' : d.beta < 0.25 ? '🟡 Gemiddeld' : '🔴 Hoog'}
                            color={d.beta < 0.15 ? '#22c55e' : d.beta < 0.25 ? '#f59e0b' : '#ef4444'}
                            sub={`Ann. vol: ${(d.beta * 100).toFixed(0)}%`}
                          />
                        )}
                        {d.volTrend != null && (
                          <MetricRow
                            label="Volume trend (5D vs 30D)"
                            value={d.volTrend > 20 ? '📈 Stijgend volume' : d.volTrend < -20 ? '📉 Dalend volume' : '→ Stabiel volume'}
                            color={d.volTrend > 20 ? '#22c55e' : d.volTrend < -20 ? '#ef4444' : '#f59e0b'}
                            sub={`${ps(d.volTrend)}${d.volTrend}%`}
                          />
                        )}
                      </div>

                      {/* AI conclusie */}
                      <AIConclusion
                        symbol={row.symbol}
                        name={row.name}
                        data={d}
                        returnPct={row.returnPct}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
      <div style={{ textAlign: 'center', padding: '20px 0 0', fontFamily: 'monospace', fontSize: 10, color: '#1e293b' }}>
        Data via Yahoo Finance · RSI-14 · MA50/200 · Geen beleggingsadvies
      </div>
    </div>
  );
}
