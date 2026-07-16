// AI Picks via RSS feeds - geen API key nodig

const RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US',
  'https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best',
  'https://feeds.marketwatch.com/marketwatch/topstories/',
  'https://feeds.marketwatch.com/marketwatch/marketpulse/',
];

// Grote lijst van gekende tickers om te detecteren in nieuws
const KNOWN_TICKERS = {
  'NVIDIA':'NVDA','NVDA':'NVDA','APPLE':'AAPL','AAPL':'AAPL',
  'MICROSOFT':'MSFT','MSFT':'MSFT','GOOGLE':'GOOGL','ALPHABET':'GOOGL','GOOGL':'GOOGL',
  'AMAZON':'AMZN','AMZN':'AMZN','META':'META','FACEBOOK':'META',
  'TESLA':'TSLA','TSLA':'TSLA','NETFLIX':'NFLX','NFLX':'NFLX',
  'PALANTIR':'PLTR','PLTR':'PLTR','BROADCOM':'AVGO','AVGO':'AVGO',
  'ASML':'ASML','LVMH':'MC.PA','NOVO NORDISK':'NVO','NVO':'NVO',
  'UNITEDHEALTH':'UNH','UNH':'UNH','SERVICENOW':'NOW','NOW':'NOW',
  'MERCADOLIBRE':'MELI','MELI':'MELI','VISTRA':'VST','VST':'VST',
  'BROOKFIELD':'BN','ZOETIS':'ZTS','ZTS':'ZTS','SOFINA':'SOF.BR',
  'SHOPIFY':'SHOP','SHOP':'SHOP','SNOWFLAKE':'SNOW','SNOW':'SNOW',
  'CROWDSTRIKE':'CRWD','CRWD':'CRWD','DATADOG':'DDOG','DDOG':'DDOG',
  'CELSIUS':'CELH','CELH':'CELH','UBER':'UBER','AIRBNB':'ABNB',
  'ABNB':'ABNB','COINBASE':'COIN','COIN':'COIN','ROBINHOOD':'HOOD',
  'INTUITIVE SURGICAL':'ISRG','ISRG':'ISRG','VEEVA':'VEEV','VEEV':'VEEV',
  'ADYEN':'ADYEN','KERING':'KER.PA','HERMES':'RMS.PA','FERRARI':'RACE',
  'CONSTELLATION':'CSU','VISA':'V','MASTERCARD':'MA','JPMORGAN':'JPM',
  'GOLDMAN':'GS','BLACKROCK':'BLK','BERKSHIRE':'BRK-B',
  'ABBOTT':'ABT','ELI LILLY':'LLY','LLY':'LLY','MODERNA':'MRNA',
  'PFIZER':'PFE','JOHNSON':'JNJ','JNJ':'JNJ',
  'EXXON':'XOM','CHEVRON':'CVX','SHELL':'SHEL',
  'NEBIUS':'NBIS','NBIS':'NBIS','ARM':'ARM','SMCI':'SMCI',
};

const TICKER_META = {
  'NVDA': { name:'Nvidia Corporation',    currency:'USD', sector:'Tech' },
  'AAPL': { name:'Apple Inc',             currency:'USD', sector:'Tech' },
  'MSFT': { name:'Microsoft Corp',        currency:'USD', sector:'Tech' },
  'GOOGL': { name:'Alphabet Inc',         currency:'USD', sector:'Tech' },
  'AMZN': { name:'Amazon.com Inc',        currency:'USD', sector:'Tech' },
  'META': { name:'Meta Platforms',        currency:'USD', sector:'Tech' },
  'TSLA': { name:'Tesla Inc',             currency:'USD', sector:'Tech' },
  'NFLX': { name:'Netflix Inc',           currency:'USD', sector:'Tech' },
  'PLTR': { name:'Palantir Technologies', currency:'USD', sector:'Tech' },
  'AVGO': { name:'Broadcom Inc',          currency:'USD', sector:'Tech' },
  'SHOP': { name:'Shopify Inc',           currency:'USD', sector:'Tech' },
  'SNOW': { name:'Snowflake Inc',         currency:'USD', sector:'Tech' },
  'CRWD': { name:'CrowdStrike Holdings',  currency:'USD', sector:'Tech' },
  'DDOG': { name:'Datadog Inc',           currency:'USD', sector:'Tech' },
  'ISRG': { name:'Intuitive Surgical',    currency:'USD', sector:'Healthcare' },
  'LLY':  { name:'Eli Lilly & Co',        currency:'USD', sector:'Healthcare' },
  'JNJ':  { name:'Johnson & Johnson',     currency:'USD', sector:'Healthcare' },
  'NVO':  { name:'Novo Nordisk A/S',      currency:'USD', sector:'Healthcare' },
  'UNH':  { name:'UnitedHealth Group',    currency:'USD', sector:'Healthcare' },
  'UBER': { name:'Uber Technologies',     currency:'USD', sector:'Consumer' },
  'ABNB': { name:'Airbnb Inc',            currency:'USD', sector:'Consumer' },
  'CELH': { name:'Celsius Holdings',      currency:'USD', sector:'Consumer' },
  'COIN': { name:'Coinbase Global',       currency:'USD', sector:'Financials' },
  'V':    { name:'Visa Inc',              currency:'USD', sector:'Financials' },
  'MA':   { name:'Mastercard Inc',        currency:'USD', sector:'Financials' },
  'ADYEN':{ name:'Adyen N.V.',            currency:'EUR', sector:'Financials' },
  'NBIS': { name:'Nebius Group',          currency:'USD', sector:'Tech' },
  'ARM':  { name:'Arm Holdings',          currency:'USD', sector:'Tech' },
  'NOW':  { name:'ServiceNow Inc',        currency:'USD', sector:'Tech' },
  'VST':  { name:'Vistra Corp',           currency:'USD', sector:'Energie' },
  'ASML': { name:'ASML Holding',          currency:'EUR', sector:'Tech' },
  'MC.PA':{ name:'LVMH-Moët Hennessy',    currency:'EUR', sector:'Consumer' },
  'RACE': { name:'Ferrari N.V.',          currency:'USD', sector:'Consumer' },
  'BLK':  { name:'BlackRock Inc',         currency:'USD', sector:'Financials' },
  'SMCI': { name:'Super Micro Computer',  currency:'USD', sector:'Tech' },
};

async function fetchRSS(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml, application/xml' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const text = await res.text();
    // Extract titles and descriptions
    const items = [];
    const itemMatches = text.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    for (const match of itemMatches) {
      const content = match[1];
      const title = content.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i);
      const desc  = content.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/i);
      const titleText = (title?.[1] || title?.[2] || '').replace(/<[^>]+>/g,'');
      const descText  = (desc?.[1]  || desc?.[2]  || '').replace(/<[^>]+>/g,'');
      if (titleText) items.push(`${titleText} ${descText}`);
    }
    return items;
  } catch { return []; }
}

function extractTickers(texts) {
  const counts = {};
  const mentions = {};
  const combined = texts.join(' ').toUpperCase();

  for (const [keyword, ticker] of Object.entries(KNOWN_TICKERS)) {
    if (combined.includes(keyword)) {
      counts[ticker] = (counts[ticker] || 0) + 1;
      // Find which article mentioned it
      for (const text of texts) {
        if (text.toUpperCase().includes(keyword) && !mentions[ticker]) {
          mentions[ticker] = text.slice(0, 120).trim();
        }
      }
    }
  }
  return { counts, mentions };
}

async function fetchYahoo(symbol) {
  const YAHOO_MAP = {
    'ASML':'ASML.AS','MC.PA':'MC.PA','SOF.BR':'SOF.BR','3IN.L':'3IN.L',
    'INVEB.ST':'INVE-B.ST','EIMI.L':'EIMI.L','VBTC.DE':'VBTC.DE','ADYEN':'ADYEN.AS',
  };
  const ticker = YAHOO_MAP[symbol] || symbol;
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
    const valid   = closes.map((c,i)=>({c,v:volumes[i]})).filter(x=>x.c!=null);
    const cs=valid.map(x=>x.c), vs=valid.map(x=>x.v), n=cs.length;
    if(n<5) return null;
    const last=cs[n-1];
    const pct=(f,t)=>f&&f>0?+((t-f)/f*100).toFixed(2):null;
    const d1=n>=2?pct(cs[n-2],last):null, d7=n>=6?pct(cs[n-6],last):null;
    const d22=n>=22?pct(cs[n-22],last):null, d66=n>=66?pct(cs[n-66],last):null;
    const d126=n>=126?pct(cs[n-126],last):null;
    const ma=(arr,p)=>arr.length<p?null:+(arr.slice(-p).reduce((a,b)=>a+b,0)/p).toFixed(2);
    const ma50=ma(cs,50),ma200=ma(cs,200);
    const year=cs.slice(-252);
    const high52=+Math.max(...year).toFixed(2),low52=+Math.min(...year).toFixed(2);
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
  try {
    // Fetch all RSS feeds in parallel
    const allTexts = (await Promise.all(RSS_FEEDS.map(fetchRSS))).flat();

    // Extract ticker mentions
    const { counts, mentions } = extractTickers(allTexts);

    // Sort by mention count, take top 10
    const topTickers = Object.entries(counts)
      .sort((a,b) => b[1]-a[1])
      .slice(0, 10)
      .map(([ticker]) => ticker)
      .filter(t => TICKER_META[t]);

    // Fallback if RSS fails
    const finalTickers = topTickers.length >= 5 ? topTickers
      : ['NVDA','META','MSFT','PLTR','AVGO','AMZN','GOOGL','LLY','TSLA','NBIS'];

    // Build picks
    const picks = finalTickers.map(ticker => ({
      symbol: ticker,
      name: TICKER_META[ticker]?.name || ticker,
      currency: TICKER_META[ticker]?.currency || 'USD',
      sector: TICKER_META[ticker]?.sector || 'Tech',
      reason: mentions[ticker]
        ? mentions[ticker].replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').slice(0,140)
        : 'Trending in financiële media',
      source: 'Yahoo Finance / MarketWatch',
    }));

    // Fetch prices
    const prices = {};
    await Promise.all(picks.map(async p => {
      prices[p.symbol] = await fetchYahoo(p.symbol);
    }));

    return Response.json({
      picks,
      prices,
      generated: new Date().toLocaleDateString('nl-BE'),
      source: 'RSS feeds',
    });
  } catch (e) {
    return Response.json({ error: 'Kon picks niet ophalen: ' + e.message, picks:[], prices:{}, generated:null });
  }
}
