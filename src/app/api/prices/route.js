// Yahoo Finance proxy - correcte tickers voor alle posities
const SYMBOLS = {
  'ASML':     'ASML.AS',    // Euronext Amsterdam
  'MSFT':     'MSFT',
  'NVO':      'NVO',
  'MELI':     'MELI',
  'MC.PA':    'MC.PA',      // Euronext Paris
  'ZTS':      'ZTS',
  'VST':      'VST',
  'UNH':      'UNH',
  '3IN.L':    '3IN.L',      // London Stock Exchange
  'BN':       'BN',
  'NOW':      'NOW',
  'AMZN':     'AMZN',
  'INVEB.ST': 'INVE-B.ST',  // Stockholm - correcte ticker
  'WVE':      'WVE',
  'SOF.BR':   'SOF.BR',     // Euronext Brussels
  'SMR':      'SMR',
  'EIMI.L':   'EIMI.L',     // London - iShares EM
  'VBTC.DE':  'VBTC.DE',    // Xetra Frankfurt
};

async function fetchYahoo(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const closes = result.indicators?.quote?.[0]?.close || [];
    const validCloses = closes.filter(v => v !== null && v !== undefined);
    const n = validCloses.length;
    if (n < 5) return null;

    const pct = (from, to) => (from && to && from > 0) ? +((to - from) / from * 100).toFixed(2) : null;

    const last  = validCloses[n - 1];
    const d1    = n >= 2   ? pct(validCloses[n - 2],   last) : null;
    const d7    = n >= 6   ? pct(validCloses[n - 6],   last) : null;
    const d22   = n >= 22  ? pct(validCloses[n - 22],  last) : null;
    const d66   = n >= 66  ? pct(validCloses[n - 66],  last) : null;
    const d126  = n >= 126 ? pct(validCloses[n - 126], last) : null;

    // RSI-14 berekening
    const rsi = calcRSI(validCloses, 14);

    // Signal berekening
    const signal = calcSignal({ d1, d7, d22, d66, d126, rsi });

    return { '1d': d1, '7d': d7, '1m': d22, '3m': d66, '6m': d126, rsi, signal };
  } catch {
    return null;
  }
}

function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  const recent = closes.slice(-period - 1);
  let gains = 0, losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return +(100 - 100 / (1 + rs)).toFixed(1);
}

function calcSignal({ d1, d7, d22, d66, d126, rsi }) {
  let score = 0;
  let factors = 0;

  // Momentum scoring per periode (gewogen)
  if (d1   !== null) { score += d1   > 1 ? 1 : d1   < -1  ? -1 : 0;       factors++; }
  if (d7   !== null) { score += d7   > 3 ? 2 : d7   < -3  ? -2 : d7 > 0 ? 0.5 : -0.5; factors += 2; }
  if (d22  !== null) { score += d22  > 5 ? 3 : d22  < -5  ? -3 : d22 > 0 ? 1 : -1;    factors += 3; }
  if (d66  !== null) { score += d66  > 10? 3 : d66  < -10 ? -3 : d66 > 0 ? 1 : -1;    factors += 3; }
  if (d126 !== null) { score += d126 > 15? 3 : d126 < -15 ? -3 : d126> 0 ? 1 : -1;    factors += 3; }

  // RSI factor
  if (rsi !== null) {
    if (rsi < 30)      score += 2;   // Oversold = koopkans
    else if (rsi < 45) score += 1;
    else if (rsi > 70) score -= 2;   // Overbought = verkoopsignaal
    else if (rsi > 55) score -= 1;
    factors += 2;
  }

  // Trend consistentie bonus: alle periodes positief = extra punt
  const allPos = [d7, d22, d66, d126].filter(v => v !== null);
  if (allPos.length >= 3 && allPos.every(v => v > 0)) score += 2;
  if (allPos.length >= 3 && allPos.every(v => v < 0)) score -= 2;

  const normalized = factors > 0 ? score / factors : 0;

  if (normalized >= 0.5)  return 'STRONG BUY';
  if (normalized >= 0.2)  return 'BUY';
  if (normalized >= -0.2) return 'HOLD';
  if (normalized >= -0.5) return 'SELL';
  return 'STRONG SELL';
}

export async function GET() {
  const results = {};
  await Promise.all(
    Object.entries(SYMBOLS).map(async ([key, yahoo]) => {
      results[key] = await fetchYahoo(yahoo);
    })
  );
  return Response.json(results);
}
