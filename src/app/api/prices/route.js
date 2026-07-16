const YAHOO_SYMBOLS = {
  'ASML':'ASML.AS','MSFT':'MSFT','NVO':'NVO','MELI':'MELI','MC.PA':'MC.PA',
  'ZTS':'ZTS','VST':'VST','UNH':'UNH','3IN.L':'3IN.L','BN':'BN','NOW':'NOW',
  'AMZN':'AMZN','INVEB.ST':'INVE-B.ST','WVE':'WVE','SOF.BR':'SOF.BR',
  'SMR':'SMR','EIMI.L':'EIMI.L','VBTC.DE':'VBTC.DE',
  'NVDA':'NVDA','NBIS':'NBIS','PLTR':'PLTR','AVGO':'AVGO','META':'META',
  // Watchlist tickers (Ticker column)
  'ADBE':'ADBE','ADYEN':'ADYEN.AS','GOOGL':'GOOGL','ALRM':'ALRM',
  'AMP':'AMP','ADP':'ADP','BRO':'BRO','COLM':'COLM','CMG':'CMG',
  'CSU':'CSU.TO','CPRT':'CPRT','DECK':'DECK','DPZ':'DPZ','ESQ':'ESQ',
  'EVO':'EVO.ST','FFH':'FFH.TO','FICO':'FICO','FTNT':'FTNT','IT':'IT',
};

const SHEET_ID = '1wpm6L5V8QTfTdOLrfizauLh3ik-YB6OF5JAjfdBNUcs';

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function fetchSheet(tab) {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || text.trim().length === 0) return [];
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g,'').trim());
    console.log(`Sheet "${tab}" headers:`, headers);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseCSVLine(lines[i]);
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (vals[idx] || '').replace(/^"|"$/g, '').trim();
      });

      // Normalize: support both Portfolio (Symbol) and Watchlist (Ticker/Company) formats
      if (!obj.Symbol && obj.Ticker) obj.Symbol = obj.Ticker;
      if (!obj.Name && obj.Company) obj.Name = obj.Company;
      if (!obj.Notes && obj.Sector) obj.Notes = obj.Sector;

      if (obj.Symbol && obj.Symbol.length > 0) rows.push(obj);
    }
    console.log(`Sheet "${tab}": ${rows.length} rows parsed`);
    return rows;
  } catch (e) {
    console.error('fetchSheet error:', e);
    return [];
  }
}

async function fetchYahoo(symbol) {
  const ticker = YAHOO_SYMBOLS[symbol] || symbol;
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
    const valid   = closes.map((c,i) => ({c, v:volumes[i]})).filter(x => x.c != null);
    const cs = valid.map(x => x.c);
    const vs = valid.map(x => x.v);
    const n  = cs.length;
    if (n < 5) return null;
    const last = cs[n-1];
    const pct  = (from, to) => (from && from > 0) ? +((to-from)/from*100).toFixed(2) : null;
    const d1   = n>=2   ? pct(cs[n-2],   last) : null;
    const d7   = n>=6   ? pct(cs[n-6],   last) : null;
    const d22  = n>=22  ? pct(cs[n-22],  last) : null;
    const d66  = n>=66  ? pct(cs[n-66],  last) : null;
    const d126 = n>=126 ? pct(cs[n-126], last) : null;
    const ma   = (arr,p) => arr.length<p ? null : +(arr.slice(-p).reduce((a,b)=>a+b,0)/p).toFixed(2);
    const ma50  = ma(cs,50);
    const ma200 = ma(cs,200);
    const year   = cs.slice(-252);
    const high52 = +Math.max(...year).toFixed(2);
    const low52  = +Math.min(...year).toFixed(2);
    const pos52  = high52!==low52 ? +(((last-low52)/(high52-low52))*100).toFixed(1) : 50;
    const rets   = cs.slice(-60).map((c,i,a)=>i===0?0:(c-a[i-1])/a[i-1]);
    const avgR   = rets.reduce((a,b)=>a+b,0)/rets.length;
    const vol    = +(Math.sqrt(rets.reduce((a,b)=>a+Math.pow(b-avgR,2),0)/rets.length*252)*100).toFixed(1);
    const avgVol30=vs.slice(-30).filter(Boolean).reduce((a,b)=>a+b,0)/30;
    const avgVol5 =vs.slice(-5).filter(Boolean).reduce((a,b)=>a+b,0)/5;
    const volTrend=avgVol30>0?+((avgVol5/avgVol30-1)*100).toFixed(1):null;
    const rsi    = calcRSI(cs,14);
    const signal = calcSignal({d1,d7,d22,d66,d126,rsi,ma50,ma200,last});
    return {'1d':d1,'7d':d7,'1m':d22,'3m':d66,'6m':d126,rsi,signal,ma50,ma200,high52,low52,pos52,vol,volTrend,price:last};
  } catch { return null; }
}

function calcRSI(closes,period=14){
  if(closes.length<period+1)return null;
  const r=closes.slice(-period-1);
  let g=0,l=0;
  for(let i=1;i<r.length;i++){const d=r[i]-r[i-1];if(d>0)g+=d;else l+=Math.abs(d);}
  const ag=g/period,al=l/period;
  if(al===0)return 100;
  return+(100-100/(1+ag/al)).toFixed(1);
}

function calcSignal({d1,d7,d22,d66,d126,rsi,ma50,ma200,last}){
  let s=0,f=0;
  if(d1!=null){s+=d1>1?1:d1<-1?-1:0;f++;}
  if(d7!=null){s+=d7>3?2:d7<-3?-2:d7>0?.5:-.5;f+=2;}
  if(d22!=null){s+=d22>5?3:d22<-5?-3:d22>0?1:-1;f+=3;}
  if(d66!=null){s+=d66>10?3:d66<-10?-3:d66>0?1:-1;f+=3;}
  if(d126!=null){s+=d126>15?3:d126<-15?-3:d126>0?1:-1;f+=3;}
  if(rsi!=null){s+=rsi<30?2:rsi>70?-2:rsi<45?1:rsi>55?-1:0;f+=2;}
  if(ma50&&last){s+=last>ma50?1:-1;f++;}
  if(ma200&&last){s+=last>ma200?2:-2;f+=2;}
  const ap=[d7,d22,d66,d126].filter(v=>v!=null);
  if(ap.length>=3&&ap.every(v=>v>0))s+=2;
  if(ap.length>=3&&ap.every(v=>v<0))s-=2;
  const n=f>0?s/f:0;
  if(n>=.5)return 'STRONG BUY';
  if(n>=.2)return 'BUY';
  if(n>=-.2)return 'HOLD';
  if(n>=-.5)return 'SELL';
  return 'STRONG SELL';
}

export async function GET() {
  const [portfolioRows, watchlistRows] = await Promise.all([
    fetchSheet('Portfolio'),
    fetchSheet('Watchlist'),
  ]);

  const portfolio = Array.isArray(portfolioRows) ? portfolioRows : [];
  const watchlist = Array.isArray(watchlistRows) ? watchlistRows : [];

  const allSymbols = new Set([...portfolio, ...watchlist].map(r => r.Symbol).filter(Boolean));
  const prices = {};
  await Promise.all([...allSymbols].map(async sym => {
    prices[sym] = await fetchYahoo(sym);
  }));

  return Response.json({ portfolio, watchlist, prices });
}
