// API route for AI-generated picks with web search
async function getAIPicks() {
  try {
    const today = new Date().toLocaleDateString('nl-BE', { day: '2-digit', month: 'long', year: 'numeric' });
    const prompt = `Vandaag is ${today}. Je bent een financieel analist. Zoek op Yahoo Finance, Bloomberg, Motley Fool, Seeking Alpha en De Tijd welke aandelen vandaag veel aandacht krijgen van analisten en in het nieuws zijn.

Geef een lijst van exact 10 aandelen die nu interessant zijn om te bekijken. Mix van sectoren (tech, healthcare, energie, consumer, financials).

Geef ALLEEN dit JSON object terug, geen uitleg, geen markdown:
{
  "generated": "datum van vandaag",
  "picks": [
    {
      "symbol": "NVDA",
      "name": "Nvidia Corporation",
      "currency": "USD",
      "sector": "Tech",
      "reason": "1 zin waarom dit aandeel nu aandacht krijgt in de media",
      "source": "Bloomberg / Motley Fool / Yahoo Finance / etc."
    }
  ]
}

Gebruik echte ticker symbolen (bv. ASML.AS voor Euronext, MC.PA voor Parijs).
Varieer de sectoren. Focus op aandelen met concrete nieuwscatalyst vandaag.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const textBlocks = data.content?.filter(b => b.type === 'text').map(b => b.text).join('');
    const match = textBlocks?.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function fetchYahooPrice(symbol) {
  const ticker = symbol;
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1y`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const closes  = result.indicators?.quote?.[0]?.close || [];
    const volumes = result.indicators?.quote?.[0]?.volume || [];
    const valid   = closes.map((c, i) => ({ c, v: volumes[i] })).filter(x => x.c != null);
    const cs = valid.map(x => x.c);
    const vs = valid.map(x => x.v);
    const n  = cs.length;
    if (n < 5) return null;

    const last = cs[n - 1];
    const pct  = (from, to) => (from && from > 0) ? +((to - from) / from * 100).toFixed(2) : null;

    const d1   = n >= 2   ? pct(cs[n-2],   last) : null;
    const d7   = n >= 6   ? pct(cs[n-6],   last) : null;
    const d22  = n >= 22  ? pct(cs[n-22],  last) : null;
    const d66  = n >= 66  ? pct(cs[n-66],  last) : null;
    const d126 = n >= 126 ? pct(cs[n-126], last) : null;

    const ma = (arr, p) => arr.length < p ? null : +(arr.slice(-p).reduce((a,b)=>a+b,0)/p).toFixed(2);
    const ma50  = ma(cs, 50);
    const ma200 = ma(cs, 200);

    const year   = cs.slice(-252);
    const high52 = +Math.max(...year).toFixed(2);
    const low52  = +Math.min(...year).toFixed(2);
    const pos52  = high52 !== low52 ? +(((last - low52) / (high52 - low52)) * 100).toFixed(1) : 50;

    const rets   = cs.slice(-60).map((c,i,a) => i===0?0:(c-a[i-1])/a[i-1]);
    const avgR   = rets.reduce((a,b)=>a+b,0)/rets.length;
    const vol    = +(Math.sqrt(rets.reduce((a,b)=>a+Math.pow(b-avgR,2),0)/rets.length*252)*100).toFixed(1);

    const avgVol30 = vs.slice(-30).filter(Boolean).reduce((a,b)=>a+b,0)/30;
    const avgVol5  = vs.slice(-5).filter(Boolean).reduce((a,b)=>a+b,0)/5;
    const volTrend = avgVol30>0 ? +((avgVol5/avgVol30-1)*100).toFixed(1) : null;

    const rsi    = calcRSI(cs, 14);
    const signal = calcSignal({ d1, d7, d22, d66, d126, rsi, ma50, ma200, last });

    return { '1d':d1,'7d':d7,'1m':d22,'3m':d66,'6m':d126, rsi, signal, ma50, ma200, high52, low52, pos52, vol, volTrend, price:last };
  } catch { return null; }
}

function calcRSI(closes, period=14) {
  if (closes.length < period+1) return null;
  const recent = closes.slice(-period-1);
  let gains=0, losses=0;
  for (let i=1;i<recent.length;i++) {
    const d=recent[i]-recent[i-1];
    if (d>0) gains+=d; else losses+=Math.abs(d);
  }
  const ag=gains/period, al=losses/period;
  if (al===0) return 100;
  return +(100-100/(1+ag/al)).toFixed(1);
}

function calcSignal({d1,d7,d22,d66,d126,rsi,ma50,ma200,last}) {
  let score=0,factors=0;
  if(d1  !=null){score+=d1>1?1:d1<-1?-1:0;factors++;}
  if(d7  !=null){score+=d7>3?2:d7<-3?-2:d7>0?.5:-.5;factors+=2;}
  if(d22 !=null){score+=d22>5?3:d22<-5?-3:d22>0?1:-1;factors+=3;}
  if(d66 !=null){score+=d66>10?3:d66<-10?-3:d66>0?1:-1;factors+=3;}
  if(d126!=null){score+=d126>15?3:d126<-15?-3:d126>0?1:-1;factors+=3;}
  if(rsi !=null){score+=rsi<30?2:rsi>70?-2:rsi<45?1:rsi>55?-1:0;factors+=2;}
  if(ma50&&last){score+=last>ma50?1:-1;factors++;}
  if(ma200&&last){score+=last>ma200?2:-2;factors+=2;}
  const allP=[d7,d22,d66,d126].filter(v=>v!=null);
  if(allP.length>=3&&allP.every(v=>v>0))score+=2;
  if(allP.length>=3&&allP.every(v=>v<0))score-=2;
  const norm=factors>0?score/factors:0;
  if(norm>=.5) return 'STRONG BUY';
  if(norm>=.2) return 'BUY';
  if(norm>=-.2)return 'HOLD';
  if(norm>=-.5)return 'SELL';
  return 'STRONG SELL';
}

export async function GET() {
  // Get AI picks first
  const picks = await getAIPicks();
  if (!picks?.picks) {
    return Response.json({ error: 'Kon geen picks ophalen', picks: [], prices: {}, generated: null });
  }

  // Fetch prices for all picks
  const prices = {};
  await Promise.all(picks.picks.map(async p => {
    prices[p.symbol] = await fetchYahooPrice(p.symbol);
  }));

  return Response.json({ picks: picks.picks, prices, generated: picks.generated });
}
