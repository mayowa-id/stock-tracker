// Shared types for Polygon responses (simplified; extend from client if needed)
export interface StockQuote {
  askprice: number;
  asksize: number;
  bidprice: number;
  bidsize: number;
  timestamp: number;
  // Add more from Polygon's quote response as needed
}

export interface AggregateBar {
  o: number; // Open
  h: number; // High
  l: number; // Low
  c: number; // Close
  v: number; // Volume
  vw: number; // Volume-weighted average price
  t: number; // Timestamp
  n: number; // Number of trades
}

export interface AggregatesResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: AggregateBar[];
  status: string;
  request_id: string;
  count: number;
}

// WebSocket message type (for quotes)
export interface WSQuoteMessage {
  ev: 'Q'; // Event type: Q for quote
  sym: string; // Symbol
  bx: number; // Bid exchange ID
  bp: number; // Bid price
  bs: number; // Bid size
  ax: number; // Ask exchange ID
  ap: number; // Ask price
  as: number; // Ask size
  c: number; // Condition
  t: number; // Timestamp
  z: string; // Tape
}

// ============ Polygon Types ============
export interface StockQuote {
  askprice: number;
  asksize: number;
  bidprice: number;
  bidsize: number;
  timestamp: number;
}

export interface AggregateBar {
  o: number; // Open
  h: number; // High
  l: number; // Low
  c: number; // Close
  v: number; // Volume
  vw: number; // Volume-weighted average price
  t: number; // Timestamp
  n: number; // Number of trades
}

export interface AggregatesResponse {
  ticker: string;
  queryCount: number;
  resultsCount: number;
  adjusted: boolean;
  results: AggregateBar[];
  status: string;
  request_id: string;
  count: number;
}

export interface WSQuoteMessage {
  ev: 'Q';
  sym: string;
  bx: number;
  bp: number;
  bs: number;
  ax: number;
  ap: number;
  as: number;
  c: number;
  t: number;
  z: string;
}

// ============ Alpaca Types ============
export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: number;
  regt_buying_power: number;
  daytrading_buying_power: number;
  cash: number;
  portfolio_value: number;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  created_at: string;
  multiplier: string;
  equity: number;
  last_equity: number;
  long_market_value: number;
  short_market_value: number;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_fill_price: number;
  qty: number;
  side: 'long' | 'short';
  market_value: number;
  cost_basis: number;
  unrealized_gain: number;
  unrealized_gain_pct: number;
  unrealized_intraday_gain: number;
  unrealized_intraday_gain_pct: number;
  current_price: number;
  lastday_price: number;
  change_today: number;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  expired_at: string | null;
  canceled_at: string | null;
  failed_at: string | null;
  replaced_at: string | null;
  replaced_by: string | null;
  replaces: string | null;
  asset_id: string;
  symbol: string;
  asset_class: string;
  qty: number;
  filled_qty: number;
  filled_avg_price: number | null;
  order_class: string;
  order_type: string;
  type: string;
  side: 'buy' | 'sell';
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  status: string;
  extended_hours: boolean;
  legs: any[] | null;
  trail_price: string | null;
  trail_percent: string | null;
  hwm: string | null;
}

export interface AlpacaWatchlist {
  account_id: string;
  created_at: string;
  name: string;
  updated_at: string;
  id: string;
  assets: AlpacaAsset[];
}

export interface AlpacaAsset {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  shortable: boolean;
  marginable: boolean;
  maintenance_ratio: string;
  min_order_value: string;
}

export interface AlpacaClock {
  timestamp: string;
  is_open: boolean;
  next_open: string;
  next_close: string;
}

export interface AlpacaCalendar {
  date: string;
  open: string;
  close: string;
}

export interface PortfolioHistory {
  timestamp: number[];
  equity: number[];
  profit_loss: number[];
  profit_loss_pct: number[];
  base_value: number;
}

// ============ FMP Types ============
export interface CompanyProfile {
  symbol: string;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  changes: number;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  gics_sector: string;
  gics_sub_industry: string;
  founded: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isDelisted: boolean;
}

export interface IncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
  dividendPerShare: number;
  operatingCashFlow: number;
  freeCashFlow: number;
  link: string;
  finalLink: string;
}

export interface KeyMetrics {
  date: string;
  symbol: string;
  period: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  tangibleBookValuePerShare: number;
  shareholdersEquityPerShare: number;
  interestDebtPerShare: number;
  marketCap: number;
  priceBookValueRatio: number;
  priceToBookRatio: number;
  priceToSalesRatio: number;
  priceEarningsRatio: number;
  pegratio: number;
  enterpriseValue: number;
  enterpriseValueRevenue: number;
  enterpriseValueEbitda: number;
  returnOnAssets: number;
  returnOnEquity: number;
  returnOnCapitalEmployed: number;
  netProfitMargin: number;
  assetTurnover: number;
  roic: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebtToEbitda: number;
  currentRatio: number;
  interestCoverage: number;
  incomeQuality: number;
  stockBasedCompensationToRevenue: number;
  daysInventoryOutstanding: number;
  daysPayableOutstanding: number;
  daysSalesOutstanding: number;
  cashConversionCycle: number;
  workingCapital: number;
  operatingCycle: number;
}

export interface EarningsHistory {
  symbol: string;
  announceTime: string;
  numberOfEstimates: number;
  numberOfRevisions: number;
  eps: number;
  epsEstimated: number;
  revenue: number;
  revenueEstimated: number;
  reportDate: string;
  fiscalDateEnding: string;
  quarter: number;
  year: number;
}

export interface CompanyRating {
  symbol: string;
  rating: string;
  ratingScore: number;
  ratingRecommendation: string;
  ratingDetails: {
    type: string;
    score: number;
  }[];
  scores: {
    roe: number;
    roic: number;
    roA: number;
    debtToEquity: number;
    freeCashFlowToNet: number;
    operatingCashFlowToNetIncome: number;
  };
}

export interface Dividend {
  recordDate: string;
  paymentDate: string;
  declarationDate: string;
  symbol: string;
  dividend: number;
  dividendYield: number;
  label: string;
  adjDividend: number;
}

export interface NewsArticle {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
}

export interface SectorPerformance {
  sector: string;
  changesPercentage: number;
}

// ============ App-Specific Types ============
export interface TradeRequest {
  symbol: string;
  quantity: number;
  side: 'buy' | 'sell';
  orderType?: 'market' | 'limit';
  limitPrice?: number;
}

export interface PortfolioOverview {
  account: AlpacaAccount;
  positions: AlpacaPosition[];
  buyingPower: number;
  totalValue: number;
  cashAvailable: number;
  dayTradesBought: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  addedAt: string;
}

export interface StockAnalysis {
  profile: CompanyProfile;
  latestQuote: any;
  keyMetrics: KeyMetrics;
  rating: CompanyRating;
  earnings: EarningsHistory[];
  news: NewsArticle[];
}