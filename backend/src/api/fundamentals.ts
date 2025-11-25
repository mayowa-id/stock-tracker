import { Hono } from 'hono';
import type { Context } from 'hono';
import { getCompanyInfo } from '../lib/yahoo-finance';

const app = new Hono();

// GET /fundamentals/:symbol - Get company profile and basic fundamentals
app.get('/:symbol', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const info = await getCompanyInfo(symbol);
    
    const profile = info.profile || {};
    const financials = info.financials || {};
    const keyStats = info.keyStats || {};
    
    return c.json({
      symbol,
      name: profile.longName || symbol,
      sector: profile.sector,
      industry: profile.industry,
      website: profile.website,
      description: profile.longBusinessSummary,
      employees: profile.fullTimeEmployees,
      city: profile.city,
      state: profile.state,
      country: profile.country,
      
      // Financial data
      marketCap: financials.marketCap?.raw,
      enterpriseValue: financials.enterpriseValue?.raw,
      trailingPE: financials.trailingPE?.raw,
      forwardPE: financials.forwardPE?.raw,
      pegRatio: financials.pegRatio?.raw,
      priceToBook: financials.priceToBook?.raw,
      priceToSales: financials.priceToSalesTrailing12Months?.raw,
      profitMargin: financials.profitMargins?.raw,
      operatingMargin: financials.operatingMargins?.raw,
      returnOnAssets: financials.returnOnAssets?.raw,
      returnOnEquity: financials.returnOnEquity?.raw,
      revenue: financials.totalRevenue?.raw,
      revenuePerShare: financials.revenuePerShare?.raw,
      grossProfit: financials.grossProfits?.raw,
      ebitda: financials.ebitda?.raw,
      netIncome: financials.netIncomeToCommon?.raw,
      eps: financials.trailingEps?.raw,
      
      // Key statistics
      beta: keyStats.beta?.raw,
      fiftyTwoWeekLow: keyStats.fiftyTwoWeekLow?.raw,
      fiftyTwoWeekHigh: keyStats.fiftyTwoWeekHigh?.raw,
      fiftyDayAverage: keyStats.fiftyDayAverage?.raw,
      twoHundredDayAverage: keyStats.twoHundredDayAverage?.raw,
      sharesOutstanding: keyStats.sharesOutstanding?.raw,
      floatShares: keyStats.floatShares?.raw,
      heldPercentInsiders: keyStats.heldPercentInsiders?.raw,
      heldPercentInstitutions: keyStats.heldPercentInstitutions?.raw,
      shortRatio: keyStats.shortRatio?.raw,
      bookValue: keyStats.bookValue?.raw,
      priceToBook: keyStats.priceToBook?.raw,
      earningsQuarterlyGrowth: keyStats.earningsQuarterlyGrowth?.raw,
      forwardEps: keyStats.forwardEps?.raw,
      dividendYield: keyStats.dividendYield?.raw,
      exDividendDate: keyStats.exDividendDate?.fmt,
    });
  } catch (err) {
    console.error('Error fetching company fundamentals:', err);
    return c.json({ error: 'Failed to fetch company fundamentals' }, 500);
  }
});

// GET /fundamentals/:symbol/summary - Quick summary
app.get('/:symbol/summary', async (c: Context) => {
  try {
    const symbol = c.req.param('symbol').toUpperCase();
    const info = await getCompanyInfo(symbol);
    
    const profile = info.profile || {};
    const financials = info.financials || {};
    
    return c.json({
      symbol,
      name: profile.longName || symbol,
      sector: profile.sector,
      industry: profile.industry,
      description: profile.longBusinessSummary?.substring(0, 500) + '...',
      marketCap: financials.marketCap?.raw,
      pe: financials.trailingPE?.raw,
      eps: financials.trailingEps?.raw,
      dividend: financials.dividendYield?.raw,
      beta: info.keyStats?.beta?.raw,
    });
  } catch (err) {
    console.error('Error fetching summary:', err);
    return c.json({ error: 'Failed to fetch summary' }, 500);
  }
});

export default app;