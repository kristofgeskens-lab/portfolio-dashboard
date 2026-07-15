// Yahoo Finance proxy - geen API key nodig
const SYMBOLS = {
  ASML:       'ASML.AS',
  MSFT:       'MSFT',
  NVO:        'NVO',
  MELI:       'MELI',
  'MC.PA':    'MC.PA',
  ZTS:        'ZTS',
  VST:        'VST',
  UNH:        'UNH',
  '3IN.L':    '3IN.L',
  BN:         'BN',
  NOW:        'NOW',
  AMZN:       'AMZN',
  'INVEB.ST': 'INVEB.ST',
  WVE:        'WVE',
  'SOF.BR':   'SOF.BR',
  SMR:        'SMR',
  'EIMI.L':   'EIMI.L',
  'VBTC.DE':  'VBTC.DE',
};

async function fetchYahoo(symbol) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=6mo`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 }, // cache 1 uur
    });
    if (!res.ok) return null;
    const json = await res.json();
    const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
    const timestamps = json?.chart?.result?.[0]?.timestamp;
    if (!closes || closes.length < 2) return null;

    const validCloses = closes.filter(Boolean);
    const n = validCloses.length;

    const pct = (from, to) => from && to ? +((to - from) / from * 100).toFixed(2) : null;

    const d1  = pct(validCloses[n - 2], validCloses[n - 1]);
    const d7  = n >= 6  ? pct(validCloses[n - 6],  validCloses[n - 1]) : null;
    const d22 = n >= 22 ? pct(validCloses[n - 22], validCloses[n - 1]) : null;
    const d66 = n >= 66 ? pct(validCloses[n - 66], validCloses[n - 1]) : null;
    const d126 = n >= 126 ? pct(validCloses[n - 126], validCloses[n - 1]) : null;

    return { '1d': d1, '7d': d7, '1m': d22, '3m': d66, '6m': d126 };
  } catch {
    return null;
  }
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
