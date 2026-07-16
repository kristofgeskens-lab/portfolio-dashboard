// Portfolio data - update this wanneer je koopt/verkoopt
const PORTFOLIO = [
  { Symbol:'ASML',     Name:'ASML Holding',          Shares:6,   'Buy Price':666.38,  Currency:'EUR', Notes:'' },
  { Symbol:'MSFT',     Name:'Microsoft Corp',         Shares:16,  'Buy Price':430.14,  Currency:'USD', Notes:'' },
  { Symbol:'NVO',      Name:'Novo Nordisk A/S-B',     Shares:120, 'Buy Price':293.20,  Currency:'DKK', Notes:'' },
  { Symbol:'MELI',     Name:'MercadoLibre Inc',       Shares:3,   'Buy Price':1776.89, Currency:'USD', Notes:'' },
  { Symbol:'MC.PA',    Name:'LVMH-Moët Hennessy',     Shares:9,   'Buy Price':431.43,  Currency:'EUR', Notes:'' },
  { Symbol:'ZTS',      Name:'Zoetis Inc',             Shares:70,  'Buy Price':81.89,   Currency:'USD', Notes:'' },
  { Symbol:'VST',      Name:'Vistra Corp',            Shares:30,  'Buy Price':149.15,  Currency:'USD', Notes:'' },
  { Symbol:'UNH',      Name:'UnitedHealth Group',     Shares:11,  'Buy Price':243.41,  Currency:'USD', Notes:'' },
  { Symbol:'3IN.L',    Name:'3i Group PLC',           Shares:126, 'Buy Price':2184.55, Currency:'GBp', Notes:'' },
  { Symbol:'BN',       Name:'Brookfield Corp',        Shares:90,  'Buy Price':48.80,   Currency:'USD', Notes:'' },
  { Symbol:'NOW',      Name:'ServiceNow Inc',         Shares:40,  'Buy Price':91.41,   Currency:'USD', Notes:'' },
  { Symbol:'AMZN',     Name:'Amazon.com Inc',         Shares:15,  'Buy Price':233.23,  Currency:'USD', Notes:'' },
  { Symbol:'INVEB.ST', Name:'Investor AB-A',          Shares:90,  'Buy Price':297.15,  Currency:'SEK', Notes:'' },
  { Symbol:'WVE',      Name:'Wave Life Sciences',     Shares:338, 'Buy Price':6.36,    Currency:'USD', Notes:'' },
  { Symbol:'SOF.BR',   Name:'Sofina',                 Shares:10,  'Buy Price':226.93,  Currency:'EUR', Notes:'' },
  { Symbol:'SMR',      Name:'NuScale Power Corp',     Shares:100, 'Buy Price':9.77,    Currency:'USD', Notes:'' },
  { Symbol:'EIMI.L',   Name:'iShares MSCI EM IMI ETF',Shares:150, 'Buy Price':33.16,   Currency:'EUR', Notes:'ETF' },
  { Symbol:'VBTC.DE',  Name:'VanEck Bitcoin ETN',     Shares:50,  'Buy Price':30.96,   Currency:'EUR', Notes:'ETF' },
];

// Watchlist - Kristof's persoonlijke watchlist
const WATCHLIST = [
  { Symbol:'ADBE',    Name:'Adobe Inc',                   Currency:'USD', Notes:'Software' },
  { Symbol:'ADYEN',   Name:'Adyen N.V.',                  Currency:'EUR', Notes:'Fintech' },
  { Symbol:'GOOGL',   Name:'Alphabet Inc',                Currency:'USD', Notes:'Tech' },
  { Symbol:'ALRM',    Name:'Alarm.com Holdings',          Currency:'USD', Notes:'Tech' },
  { Symbol:'AMP',     Name:'Ameriprise Financial',        Currency:'USD', Notes:'Financials' },
  { Symbol:'ADP',     Name:'Automatic Data Processing',   Currency:'USD', Notes:'Software' },
  { Symbol:'BN',      Name:'Brookfield Corp',             Currency:'USD', Notes:'Financials' },
  { Symbol:'BRO',     Name:'Brown & Brown Inc',           Currency:'USD', Notes:'Insurance' },
  { Symbol:'COLM',    Name:'Columbia Sportswear',         Currency:'USD', Notes:'Consumer' },
  { Symbol:'CMG',     Name:'Chipotle Mexican Grill',      Currency:'USD', Notes:'Consumer' },
  { Symbol:'CSU',     Name:'Constellation Software',      Currency:'CAD', Notes:'Software' },
  { Symbol:'CPRT',    Name:'Copart Inc',                  Currency:'USD', Notes:'Services' },
  { Symbol:'DECK',    Name:'Deckers Outdoor',             Currency:'USD', Notes:'Consumer' },
  { Symbol:'DPZ',     Name:'Dominos Pizza',               Currency:'USD', Notes:'Consumer' },
  { Symbol:'ESQ',     Name:'Esquire Financial Holdings',  Currency:'USD', Notes:'Financials' },
  { Symbol:'EVO',     Name:'Evolution AB',                Currency:'SEK', Notes:'Gaming' },
  { Symbol:'FFH',     Name:'Fairfax Financial',           Currency:'CAD', Notes:'Financials' },
  { Symbol:'FICO',    Name:'Fair Isaac Corporation',      Currency:'USD', Notes:'Software' },
  { Symbol:'FTNT',    Name:'Fortinet Inc',                Currency:'USD', Notes:'Cybersecurity' },
  { Symbol:'IT',      Name:'Gartner Inc',                 Currency:'USD', Notes:'Research' },
  { Symbol:'HLNE',    Name:'Hamilton Lane Inc',           Currency:'USD', Notes:'Financials' },
  { Symbol:'ICE',     Name:'Intercontinental Exchange',   Currency:'USD', Notes:'Financials' },
  { Symbol:'IPAR',    Name:'Inter Parfums Inc',           Currency:'USD', Notes:'Consumer' },
  { Symbol:'KNSL',    Name:'Kinsale Capital Group',       Currency:'USD', Notes:'Insurance' },
  { Symbol:'KKR',     Name:'KKR & Co Inc',                Currency:'USD', Notes:'Financials' },
  { Symbol:'LULU',    Name:'Lululemon Athletica',         Currency:'USD', Notes:'Consumer' },
  { Symbol:'MKL',     Name:'Markel Group',                Currency:'USD', Notes:'Insurance' },
  { Symbol:'MA',      Name:'Mastercard Inc',              Currency:'USD', Notes:'Financials' },
  { Symbol:'MELI',    Name:'MercadoLibre Inc',            Currency:'USD', Notes:'E-commerce' },
  { Symbol:'MCO',     Name:'Moodys Corporation',          Currency:'USD', Notes:'Financials' },
  { Symbol:'MSCI',    Name:'MSCI Inc',                    Currency:'USD', Notes:'Financials' },
  { Symbol:'NSSC',    Name:'NAPCO Security Technologies', Currency:'USD', Notes:'Tech' },
  { Symbol:'POOL',    Name:'Pool Corporation',            Currency:'USD', Notes:'Consumer' },
  { Symbol:'QLYS',    Name:'Qualys Inc',                  Currency:'USD', Notes:'Cybersecurity' },
  { Symbol:'RH',      Name:'RH (Restoration Hardware)',   Currency:'USD', Notes:'Consumer' },
  { Symbol:'SPGI',    Name:'S&P Global Inc',              Currency:'USD', Notes:'Financials' },
  { Symbol:'SSNC',    Name:'SS&C Technologies',           Currency:'USD', Notes:'Software' },
  { Symbol:'V',       Name:'Visa Inc',                    Currency:'USD', Notes:'Financials' },
  { Symbol:'XPEL',    Name:'XPEL Inc',                    Currency:'USD', Notes:'Consumer' },
  { Symbol:'ZTS',     Name:'Zoetis Inc',                  Currency:'USD', Notes:'Healthcare' },
  { Symbol:'FISV',    Name:'Fiserv Inc',                  Currency:'USD', Notes:'Fintech' },
  { Symbol:'MRVL',    Name:'Marvell Technology',          Currency:'USD', Notes:'Semiconductors' },
  { Symbol:'NVDA',    Name:'Nvidia Corporation',          Currency:'USD', Notes:'AI chips' },
  { Symbol:'NBIS',    Name:'Nebius Group',                Currency:'USD', Notes:'AI cloud' },
  { Symbol:'NFLX',    Name:'Netflix Inc',                 Currency:'USD', Notes:'Streaming' },
  { Symbol:'IONQ',    Name:'IonQ Inc',                    Currency:'USD', Notes:'Quantum' },
];

const YAHOO_SYMBOLS = {
  'ASML':'ASML.AS','MC.PA':'MC.PA','SOF.BR':'SOF.BR','3IN.L':'3IN.L',
  'INVEB.ST':'INVE-B.ST','EIMI.L':'EIMI.L','VBTC.DE':'VBTC.DE',
  'ADYEN':'ADYEN.AS',
};

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
    const valid   = closes.map((c,i) => ({c,v:volumes[i]})).filter(x => x.c != null);
    const cs = valid.map(x => x.c);
    const vs = valid.map(x => x.v);
    const n  = cs.length;
    if (n < 5) return null;
    const last = cs[n-1];
    const pct  = (f,t) => f&&f>0 ? +((t-f)/f*100).toFixed(2) : null;
    const d1   = n>=2   ? pct(cs[n-2],last)   : null;
    const d7   = n>=6   ? pct(cs[n-6],last)   : null;
    const d22  = n>=22  ? pct(cs[n-22],last)  : null;
    const d66  = n>=66  ? pct(cs[n-66],last)  : null;
    const d126 = n>=126 ? pct(cs[n-126],last) : null;
    const ma   = (arr,p) => arr.length<p ? null : +(arr.slice(-p).reduce((a,b)=>a+b,0)/p).toFixed(2);
    const ma50=ma(cs,50), ma200=ma(cs,200);
    const year=cs.slice(-252);
    const high52=+Math.max(...year).toFixed(2), low52=+Math.min(...year).toFixed(2);
    const pos52=high52!==low52?+(((last-low52)/(high52-low52))*100).toFixed(1):50;
    const rets=cs.slice(-60).map((c,i,a)=>i===0?0:(c-a[i-1])/a[i-1]);
    const avgR=rets.reduce((a,b)=>a+b,0)/rets.length;
    const vol=+(Math.sqrt(rets.reduce((a,b)=>a+Math.pow(b-avgR,2),0)/rets.length*252)*100).toFixed(1);
    const av30=vs.slice(-30).filter(Boolean).reduce((a,b)=>a+b,0)/30;
    const av5=vs.slice(-5).filter(Boolean).reduce((a,b)=>a+b,0)/5;
    const volTrend=av30>0?+((av5/av30-1)*100).toFixed(1):null;
    const rsi=calcRSI(cs,14);
    const signal=calcSignal({d1,d7,d22,d66,d126,rsi,ma50,ma200,last});
    return {'1d':d1,'7d':d7,'1m':d22,'3m':d66,'6m':d126,rsi,signal,ma50,ma200,high52,low52,pos52,vol,volTrend,price:last};
  } catch { return null; }
}

function calcRSI(c,p=14){
  if(c.length<p+1)return null;
  const r=c.slice(-p-1);let g=0,l=0;
  for(let i=1;i<r.length;i++){const d=r[i]-r[i-1];if(d>0)g+=d;else l+=Math.abs(d);}
  const ag=g/p,al=l/p;if(al===0)return 100;
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
  if(n>=.5)return 'STRONG BUY';if(n>=.2)return 'BUY';
  if(n>=-.2)return 'HOLD';if(n>=-.5)return 'SELL';
  return 'STRONG SELL';
}

export async function GET() {
  const allSymbols = new Set([...PORTFOLIO,...WATCHLIST].map(r=>r.Symbol));
  const prices = {};
  await Promise.all([...allSymbols].map(async sym => {
    prices[sym] = await fetchYahoo(sym);
  }));
  return Response.json({ portfolio:PORTFOLIO, watchlist:WATCHLIST, prices });
}

