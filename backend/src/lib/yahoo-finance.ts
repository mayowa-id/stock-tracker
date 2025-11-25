const BASE_URL = 'https://query1.finance.yahoo.com';
const BASE_URL_V2 = 'https://query2.finance.yahoo.com';

export async function getQuote(symbol: string) {
  const url = `${BASE_URL}/v8/finance/chart/${symbol}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const quote = data.chart.result[0];
  const meta = quote.meta;
  
  return {
    symbol: meta.symbol,
    price: meta.regularMarketPrice,
    previousClose: meta.previousClose,
    open: meta.regularMarketOpen,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    volume: meta.regularMarketVolume,
    change: meta.regularMarketPrice - meta.previousClose,
    changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
    marketCap: meta.marketCap,
    currency: meta.currency,
  };
}

export async function getHistoricalData(
  symbol: string,
  period1: number, // Unix timestamp
  period2: number, // Unix timestamp
  interval: '1d' | '1wk' | '1mo' = '1d'
) {
  const url = `${BASE_URL}/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const result = data.chart.result[0];
  
  const timestamps = result.timestamp;
  const quotes = result.indicators.quote[0];
  
  return timestamps.map((timestamp: number, index: number) => ({
    timestamp: timestamp * 1000, // Convert to milliseconds
    open: quotes.open[index],
    high: quotes.high[index],
    low: quotes.low[index],
    close: quotes.close[index],
    volume: quotes.volume[index],
  }));
}

export async function searchSymbols(query: string) {
  const url = `${BASE_URL}/v1/finance/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  return data.quotes.map((quote: any) => ({
    symbol: quote.symbol,
    name: quote.longname || quote.shortname,
    exchange: quote.exchange,
    type: quote.quoteType,
  }));
}

export async function getCompanyInfo(symbol: string) {
  const url = `${BASE_URL_V2}/v10/finance/quoteSummary/${symbol}?modules=assetProfile,financialData,defaultKeyStatistics`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const result = data.quoteSummary.result[0];
  
  return {
    profile: result.assetProfile || {},
    financials: result.financialData || {},
    keyStats: result.defaultKeyStatistics || {},
  };
}

export async function getMarketMovers() {
  // Get S&P 500 as proxy for market
  const url = `${BASE_URL}/v1/finance/screener/predefined/saved?scrIds=day_gainers,day_losers,most_actives&count=10`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    gainers: data.finance.result[0]?.quotes || [],
    losers: data.finance.result[1]?.quotes || [],
    mostActive: data.finance.result[2]?.quotes || [],
  };
}