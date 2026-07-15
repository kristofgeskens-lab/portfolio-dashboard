'use client';
import { useState, useEffect, useCallback } from 'react';

const PORTFOLIO = [
  { symbol: 'ASML',     name: 'ASML Holding',          shares: 6,   currency: 'EUR', currentValue: 9296.40,  returnPct: 132.57, isETF: false },
  { symbol: 'MSFT',     name: 'Microsoft Corp',         shares: 16,  currency: 'USD', currentValue: 5522.18,  returnPct: -6.33,  isETF: false },
  { symbol: 'NVO',      name: 'Novo Nordisk A/S-B',     shares: 120, currency: 'DKK', currentValue: 5306.35,  returnPct: 12.55,  isETF: false },
  { symbol: 'MELI',     name: 'MercadoLibre Inc',       shares: 3,   currency: 'USD', currentValue: 4823.84,  returnPct: 3.73,   isETF: false },
  { symbol: 'MC.PA',    name: 'LVMH-Moët Hennessy',     shares: 9,   currency: 'EUR', currentValue: 4462.20,  returnPct: 3.43,   isETF: false },
  { symbol: 'ZTS',      name: 'Zoetis Inc',             shares: 70,  currency: 'USD', currentValue: 4551.25,  returnPct: -8.99,  isETF: false },
  { symbol: 'VST',      name: 'Vistra Corp',            shares: 30,  currency: 'USD', currentValue: 4193.40,  returnPct: 7.4,    isETF: false },
  { symbol: 'UNH',      name: 'UnitedHealth Group',     shares: 11,  currency: 'USD', currentValue: 4016.16,  returnPct: 71.94,  isETF: false },
  { symbol: '3IN.L',    name: '3i Group PLC',           shares: 126, currency: 'GBp', currentValue: 3954.70,  returnPct: 21.65,  isETF: false },
  { symbol: 'BN',       name: 'Brookfield Corp',        shares: 90,  currency: 'USD', currentValue: 3491.49,  returnPct: -8.84,  isETF: false },
  { symbol: 'NOW',      name: 'ServiceNow Inc',         shares: 40,  currency: 'USD', currentValue: 3654.54,  returnPct: 14.47,  isETF: false },
  { symbol: 'AMZN',     name: 'Amazon.com Inc',         shares: 15,  currency: 'USD', currentValue: 3336.30,  returnPct: 9.4,    isETF: false },
  { symbol: 'INVEB.ST', name: 'Investor AB-A',          shares: 90,  currency: 'SEK', currentValue: 3162.04,  returnPct: 30,     isETF: false },
  { symbol: 'WVE',      name: 'Wave Life Sciences',     shares: 338, currency: 'USD', currentValue: 1742.63,  returnPct: -7.17,  isETF: false },
  { symbol: 'SOF.BR',   name: 'Sofina',                 shares: 10,  currency: 'EUR', currentValue: 2260.00,  returnPct: -0.41,  isETF: false },
  { symbol: 'SMR',      name: 'NuScale Power Corp',     shares: 100, currency: 'USD', currentValue: 729.30,   returnPct: -14.38, isETF: false },
  { symbol: 'EIMI.L',   name: 'iShares MSCI EM IMI',   shares: 150, currency: 'EUR', currentValue: 7017.75,  returnPct: 41.07,  isETF: true  },
  { symbol: 'VBTC.DE',  name: 'VanEck Bitcoin ETN',    shares: 50,  currency: 'EUR', currentValue: 1505.20,  returnPct: -2.86,  isETF: true  },
];

const TOTAL = 73324.89;

const pColor = v => v === null || v === undefined ? '#475569' : v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#94a3b8';
const pSign  = v => v > 0 ? '+' : '';
const fmt    = v => v === null || v === undefined ? '—' : `${pSign(v)}${v.toFixed(2)}%`;

function MiniBar({ value }) {
  if (value === null || value === undefined) return <span style={{ color: '#334155', fontFamily: 'monospace', fontSize: 11 }}>—</span>;
  const capped = Math.max(-20, Math.min(20, value));
  const w = Math.abs(capped) / 20 * 28;
  const pos = value >= 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 60, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 28, display: 'flex', justifyContent: 'flex-end' }}>
          {!pos && <div style={{ width: w, height: 6, background: '#ef4444', borderRadius: 2 }} />}
        </div>
        <div style={{ width: 2, height: 12, background: '#334155', borderRadius: 1, flexShrink: 0 }} />
        <div style={{ width: 28, display: 'flex', justifyContent: 'flex-start' }}>
          {pos && <div style={{ width: w, height: 6, background: '#22c55e', borderRadius: 2 }} />}
        </div>
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: 11, color: pColor(value), minWidth: 52 }}>
        {fmt(value)}
      </span>
    </div>
  );
}

function PeriodBadge({ label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 56 }}>
      <span style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace', marginBottom: 2 }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: pColor(value) }}>{fmt(value)}</span>
    </div>
  );
}

export default function Page() {
  const [prices, setPrices]       = useState({});
  const [loading, setLoading]     = useState(false);
  const [updated, setUpdated]     = useState(null);
  const [expanded, setExpanded]   = useState(null);
  const [sortBy, setSortBy]       = useState('inception');
  const [view, setView]           = useState('list'); // 'list' | 'momentum'

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/prices');
      const json = await res.json();
      setPrices(json);
      setUpdated(new Date());
    } catch {
      // silently fail — show stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrices(); }, [fetchPrices]);

  const rows = PORTFOLIO.map(p => ({
    ...p,
    p: prices[p.symbol] || {},
    weight: (p.currentValue / TOTAL * 100).toFixed(1),
  }));

  const sortFn = (a, b) => {
    if (sortBy === 'inception') return b.returnPct - a.returnPct;
    if (sortBy === 'value')     return b.currentValue - a.currentValue;
    if (sortBy === '1d')        return (b.p['1d'] ?? -999) - (a.p['1d'] ?? -999);
    if (sortBy === '1m')        return (b.p['1m'] ?? -999) - (a.p['1m'] ?? -999);
    if (sortBy === '6m')        return (b.p['6m'] ?? -999) - (a.p['6m'] ?? -999);
    return 0;
  };

  const stocks = rows.filter(r => !r.isETF).sort(sortFn);
  const etfs   = rows.filter(r => r.isETF).sort(sortFn);

  const winners = PORTFOLIO.filter(p => p.returnPct > 0).length;
  const losers  = PORTFOLIO.filter(p => p.returnPct < 0).length;

  return (
    <div style={{
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      background: '#0a0e1a',
      minHeight: '100vh',
      color: '#e2e8f0',
      paddingBottom: 40,
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, #111827 0%, #0a0e1a 100%)',
        padding: '52px 20px 20px',
        borderBottom: '1px solid #1e293b',
      }}>
        <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 6 }}>
          Portfolio Momentum
        </div>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', color: '#f1f5f9' }}>
          €{TOTAL.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: 13, color: '#22c55e', fontFamily: 'monospace', marginTop: 4 }}>
          -€87,84 vandaag · -0,12%
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Posities', value: PORTFOLIO.length, color: '#f1f5f9' },
            { label: 'Winnaars', value: winners, color: '#22c55e' },
            { label: 'Verliezers', value: losers, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 14px' }}>
              <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
            </div>
          ))}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 14px', flex: 1 }}>
            <div style={{ fontSize: 9, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' }}>Bijgewerkt</div>
            <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', marginTop: 4 }}>
              {updated ? updated.toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'inception', label: 'Aankoop' },
            { key: '1d',        label: '1D' },
            { key: '1m',        label: '1M' },
            { key: '6m',        label: '6M' },
            { key: 'value',     label: 'Waarde' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              style={{
                background: sortBy === s.key ? '#1e3a5f' : '#111827',
                color: sortBy === s.key ? '#60a5fa' : '#64748b',
                border: `1px solid ${sortBy === s.key ? '#2563eb44' : '#1e293b'}`,
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11,
                fontFamily: 'monospace',
                cursor: 'pointer',
                letterSpacing: '0.04em',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={fetchPrices}
          disabled={loading}
          style={{
            background: loading ? '#0f172a' : '#1e3a5f',
            color: loading ? '#334155' : '#93c5fd',
            border: '1px solid #2563eb44',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 11,
            fontFamily: 'monospace',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '...' : '⟳'}
        </button>
      </div>

      {/* List */}
      {[
        { label: `Aandelen (${stocks.length})`, items: stocks },
        { label: `ETF's (${etfs.length})`,      items: etfs   },
      ].map(section => (
        <div key={section.label}>
          <div style={{ padding: '8px 16px 4px', fontSize: 10, color: '#334155', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'monospace' }}>
            {section.label}
          </div>
          {section.items.map(row => (
            <div key={row.symbol}>
              {/* Main row */}
              <div
                onClick={() => setExpanded(expanded === row.symbol ? null : row.symbol)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #111827',
                  background: expanded === row.symbol ? '#111827' : 'transparent',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#f1f5f9' }}>{row.name}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#475569', marginTop: 2 }}>
                      {row.symbol} · {row.shares} st. · {row.weight}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#cbd5e1', fontWeight: 500 }}>
                      €{row.currentValue.toLocaleString('nl-BE', { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: pColor(row.returnPct), marginTop: 2 }}>
                      {pSign(row.returnPct)}{row.returnPct}%
                    </div>
                  </div>
                </div>

                {/* Period bars */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: '1D', key: '1d' },
                    { label: '7D', key: '7d' },
                    { label: '1M', key: '1m' },
                    { label: '3M', key: '3m' },
                    { label: '6M', key: '6m' },
                  ].map(p => (
                    <PeriodBadge key={p.key} label={p.label} value={row.p[p.key]} />
                  ))}
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === row.symbol && (
                <div style={{
                  background: '#0d1117',
                  borderBottom: '1px solid #1e293b',
                  padding: '12px 16px',
                  display: 'flex',
                  gap: 20,
                  flexWrap: 'wrap',
                }}>
                  {[
                    { label: 'Munt', value: row.currency },
                    { label: 'Aantal', value: `${row.shares} st.` },
                    { label: 'Gewicht', value: `${row.weight}%` },
                  ].map(d => (
                    <div key={d.label}>
                      <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'monospace' }}>{d.label}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#94a3b8', marginTop: 3 }}>{d.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <div style={{ textAlign: 'center', padding: '20px 0 0', fontFamily: 'monospace', fontSize: 10, color: '#1e293b' }}>
        Data via Yahoo Finance · Geen beleggingsadvies
      </div>
    </div>
  );
}
