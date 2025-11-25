import { getQuote } from './yahoo-finance';

// In-memory mock trading system (i will replace with database later)
interface MockAccount {
  id: string;
  cash: number;
  buyingPower: number;
  portfolioValue: number;
}

interface MockPosition {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

interface MockOrder {
  id: string;
  symbol: string;
  quantity: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  status: 'open' | 'filled' | 'canceled';
  limitPrice?: number;
  filledPrice?: number;
  createdAt: Date;
  filledAt?: Date;
}

// Mock data stores
const mockAccount: MockAccount = {
  id: 'demo-account',
  cash: 100000, // Start with $100k
  buyingPower: 100000,
  portfolioValue: 100000,
};

const mockPositions = new Map<string, MockPosition>();
const mockOrders: MockOrder[] = [];
let orderIdCounter = 1;

// Account operations
export function getMockAccount() {
  updatePortfolioValue(); // Recalculate before returning
  return mockAccount;
}

export function getMockPositions() {
  return Array.from(mockPositions.values());
}

export function getMockPosition(symbol: string) {
  return mockPositions.get(symbol.toUpperCase());
}

// Order operations
export async function placeMockOrder(params: {
  symbol: string;
  quantity: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  limitPrice?: number;
}) {
  const symbol = params.symbol.toUpperCase();
  const orderId = `order-${orderIdCounter++}`;
  
  // Get current market price
  const quote = await getQuote(symbol);
  const currentPrice = quote.price;
  
  const order: MockOrder = {
    id: orderId,
    symbol,
    quantity: params.quantity,
    side: params.side,
    type: params.type,
    status: 'open',
    limitPrice: params.limitPrice,
    createdAt: new Date(),
  };
  
  // Simulate market order execution immediately
  if (params.type === 'market') {
    executeMockOrder(order, currentPrice);
  }
  
  mockOrders.push(order);
  return order;
}

export function getMockOrders(status?: 'open' | 'filled' | 'canceled') {
  if (status) {
    return mockOrders.filter(o => o.status === status);
  }
  return mockOrders;
}

export function getMockOrder(orderId: string) {
  return mockOrders.find(o => o.id === orderId);
}

export function cancelMockOrder(orderId: string) {
  const order = mockOrders.find(o => o.id === orderId);
  if (order && order.status === 'open') {
    order.status = 'canceled';
    return order;
  }
  throw new Error('Order not found or already filled/canceled');
}

export async function closeMockPosition(symbol: string, quantity?: number) {
  const position = mockPositions.get(symbol.toUpperCase());
  if (!position) {
    throw new Error('Position not found');
  }
  
  const qtyToSell = quantity || position.quantity;
  if (qtyToSell > position.quantity) {
    throw new Error('Insufficient quantity to close');
  }
  
  return placeMockOrder({
    symbol,
    quantity: qtyToSell,
    side: 'sell',
    type: 'market',
  });
}

// Helper: Execute order
function executeMockOrder(order: MockOrder, price: number) {
  const symbol = order.symbol.toUpperCase();
  const cost = order.quantity * price;
  
  if (order.side === 'buy') {
    // Check if enough cash
    if (cost > mockAccount.cash) {
      throw new Error('Insufficient funds');
    }
    
    // Deduct cash
    mockAccount.cash -= cost;
    mockAccount.buyingPower -= cost;
    
    // Add or update position
    const existingPosition = mockPositions.get(symbol);
    if (existingPosition) {
      const totalQty = existingPosition.quantity + order.quantity;
      const totalCost = (existingPosition.avgPrice * existingPosition.quantity) + cost;
      existingPosition.quantity = totalQty;
      existingPosition.avgPrice = totalCost / totalQty;
      existingPosition.currentPrice = price;
    } else {
      mockPositions.set(symbol, {
        symbol,
        quantity: order.quantity,
        avgPrice: price,
        currentPrice: price,
      });
    }
  } else {
    // Sell
    const position = mockPositions.get(symbol);
    if (!position) {
      throw new Error('No position to sell');
    }
    if (order.quantity > position.quantity) {
      throw new Error('Insufficient shares to sell');
    }
    
    // Add cash
    mockAccount.cash += cost;
    mockAccount.buyingPower += cost;
    
    // Update or remove position
    position.quantity -= order.quantity;
    if (position.quantity === 0) {
      mockPositions.delete(symbol);
    }
  }
  
  // Mark order as filled
  order.status = 'filled';
  order.filledPrice = price;
  order.filledAt = new Date();
  
  updatePortfolioValue();
}

// Helper: Update portfolio value
async function updatePortfolioValue() {
  let totalValue = mockAccount.cash;
  
  // Add value of all positions
  for (const position of mockPositions.values()) {
    try {
      const quote = await getQuote(position.symbol);
      position.currentPrice = quote.price;
      totalValue += position.quantity * position.currentPrice;
    } catch (err) {
      // If can't get quote, use last known price
      totalValue += position.quantity * position.currentPrice;
    }
  }
  
  mockAccount.portfolioValue = totalValue;
}

// Watchlist operations (simple in-memory)
const mockWatchlists = new Map<string, { id: string; name: string; symbols: string[] }>();
let watchlistIdCounter = 1;

export function getMockWatchlists() {
  return Array.from(mockWatchlists.values());
}

export function getMockWatchlist(id: string) {
  return mockWatchlists.get(id);
}

export function createMockWatchlist(name: string, symbols: string[] = []) {
  const id = `watchlist-${watchlistIdCounter++}`;
  const watchlist = { id, name, symbols: symbols.map(s => s.toUpperCase()) };
  mockWatchlists.set(id, watchlist);
  return watchlist;
}

export function addToMockWatchlist(id: string, symbol: string) {
  const watchlist = mockWatchlists.get(id);
  if (!watchlist) {
    throw new Error('Watchlist not found');
  }
  const upperSymbol = symbol.toUpperCase();
  if (!watchlist.symbols.includes(upperSymbol)) {
    watchlist.symbols.push(upperSymbol);
  }
  return watchlist;
}

export function removeFromMockWatchlist(id: string, symbol: string) {
  const watchlist = mockWatchlists.get(id);
  if (!watchlist) {
    throw new Error('Watchlist not found');
  }
  watchlist.symbols = watchlist.symbols.filter(s => s !== symbol.toUpperCase());
  return watchlist;
}

export function deleteMockWatchlist(id: string) {
  mockWatchlists.delete(id);
}

// Reset function for testing
export function resetMockAccount() {
  mockAccount.cash = 100000;
  mockAccount.buyingPower = 100000;
  mockAccount.portfolioValue = 100000;
  mockPositions.clear();
  mockOrders.length = 0;
  mockWatchlists.clear();
  orderIdCounter = 1;
  watchlistIdCounter = 1;
}