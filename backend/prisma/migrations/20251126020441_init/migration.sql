-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "cash" REAL NOT NULL DEFAULT 100000,
    "buyingPower" REAL NOT NULL DEFAULT 100000,
    "portfolioValue" REAL NOT NULL DEFAULT 100000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "positions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "avgPrice" REAL NOT NULL,
    "currentPrice" REAL NOT NULL,
    "marketValue" REAL NOT NULL,
    "costBasis" REAL NOT NULL,
    "unrealizedGain" REAL NOT NULL,
    "unrealizedGainPct" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "positions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "side" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "limitPrice" REAL,
    "stopPrice" REAL,
    "filledPrice" REAL,
    "filledQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "filledAt" DATETIME,
    "canceledAt" DATETIME,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "watchlists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "watchlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "watchlist_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "watchlistId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "watchlist_items_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "watchlists" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "portfolio_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "portfolioValue" REAL NOT NULL,
    "cash" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_userId_key" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "positions_userId_symbol_key" ON "positions"("userId", "symbol");

-- CreateIndex
CREATE UNIQUE INDEX "watchlist_items_watchlistId_symbol_key" ON "watchlist_items"("watchlistId", "symbol");
