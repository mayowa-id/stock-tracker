import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.FMP_API_KEY;
if (!API_KEY) {
  throw new Error('FMP_API_KEY is required in .env');
}

const BASE_URL = 'https://financialmodelingprep.com/api/v3';

export async function fetchFMP(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set('apikey', API_KEY);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.statusText}`);
  }
  return response.json();
}

// Company Information
export async function getCompanyProfile(symbol: string) {
  return fetchFMP(`/profile/${symbol}`);
}

export async function getCompanyQuote(symbol: string) {
  return fetchFMP(`/quote/${symbol}`);
}

// Financial Statements
export async function getIncomeStatement(symbol: string, period: 'annual' | 'quarterly' = 'annual', limit = 10) {
  return fetchFMP(`/income-statement/${symbol}`, {
    period,
    limit: limit.toString(),
  });
}

export async function getBalanceSheet(symbol: string, period: 'annual' | 'quarterly' = 'annual', limit = 10) {
  return fetchFMP(`/balance-sheet-statement/${symbol}`, {
    period,
    limit: limit.toString(),
  });
}

export async function getCashFlowStatement(symbol: string, period: 'annual' | 'quarterly' = 'annual', limit = 10) {
  return fetchFMP(`/cash-flow-statement/${symbol}`, {
    period,
    limit: limit.toString(),
  });
}

// Key Metrics
export async function getKeyMetrics(symbol: string, period: 'annual' | 'quarterly' = 'annual', limit = 5) {
  return fetchFMP(`/key-metrics/${symbol}`, {
    period,
    limit: limit.toString(),
  });
}

export async function getRatios(symbol: string, period: 'annual' | 'quarterly' = 'annual', limit = 5) {
  return fetchFMP(`/ratios/${symbol}`, {
    period,
    limit: limit.toString(),
  });
}

export async function getGrowthRates(symbol: string, period: 'annual' | 'quarterly' = 'annual', limit = 5) {
  return fetchFMP(`/growth/${symbol}`, {
    period,
    limit: limit.toString(),
  });
}

// Earnings
export async function getEarningsHistory(symbol: string, limit = 10) {
  return fetchFMP(`/earnings-history/${symbol}`, {
    limit: limit.toString(),
  });
}

export async function getEarningsSurprises(symbol: string, limit = 10) {
  return fetchFMP(`/earnings-surprises/${symbol}`, {
    limit: limit.toString(),
  });
}

// Valuation
export async function getEnterpriseValue(symbol: string) {
  return fetchFMP(`/enterprise-values/${symbol}`);
}

// Ratings
export async function getCompanyRating(symbol: string) {
  return fetchFMP(`/rating/${symbol}`);
}

// Analysts
export async function getAnalystEstimates(symbol: string) {
  return fetchFMP(`/analyst-estimates/${symbol}`);
}

export async function getAnalystRatings(symbol: string) {
  return fetchFMP(`/analyst-stock-recommendations/${symbol}`);
}

// Market Data
export async function getAllStockSymbols() {
  return fetchFMP(`/stock/list`);
}

export async function searchStocks(query: string) {
  return fetchFMP(`/search`, { query });
}

// Dividends & Splits
export async function getDividends(symbol: string, limit = 10) {
  return fetchFMP(`/dividends-calendar/${symbol}`, {
    limit: limit.toString(),
  });
}

export async function getHistoricalDividends(symbol: string) {
  return fetchFMP(`/dividends/${symbol}`);
}

export async function getStockSplits(symbol: string) {
  return fetchFMP(`/stock-splits/${symbol}`);
}

// News
export async function getStockNews(symbol: string, limit = 20, page = 0) {
  return fetchFMP(`/stock_news`, {
    symbol,
    limit: limit.toString(),
    page: page.toString(),
  });
}

// Sector Performance
export async function getSectorPerformance() {
  return fetchFMP(`/sector-performance`);
}

// Most Active / Gainers / Losers
export async function getMostActiveStocks(limit = 10) {
  return fetchFMP(`/actives`, { limit: limit.toString() });
}

export async function getTopGainers(limit = 10) {
  return fetchFMP(`/gainers`, { limit: limit.toString() });
}

export async function getTopLosers(limit = 10) {
  return fetchFMP(`/losers`, { limit: limit.toString() });
}

// Insider Trading
export async function getInsiderTrades(symbol: string, limit = 100) {
  return fetchFMP(`/insider-trading/${symbol}`, {
    limit: limit.toString(),
  });
}