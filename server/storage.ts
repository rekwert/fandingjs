import {
  users,
  exchanges,
  tradingPairs,
  fundingRates,
  notificationSettings,
  customAlerts,
  type User,
  type UpsertUser,
  type Exchange,
  type TradingPair,
  type FundingRate,
  type FundingRateWithExchange,
  type NotificationSettings,
  type CustomAlert,
  type InsertExchange,
  type InsertTradingPair,
  type InsertFundingRate,
  type InsertNotificationSettings,
  type InsertCustomAlert,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Exchange operations
  getExchanges(): Promise<Exchange[]>;
  getActiveExchanges(): Promise<Exchange[]>;
  upsertExchange(exchange: InsertExchange): Promise<Exchange>;
  
  // Trading pair operations
  getTradingPairs(exchangeId?: number): Promise<TradingPair[]>;
  upsertTradingPair(pair: InsertTradingPair): Promise<TradingPair>;
  
  // Funding rate operations
  getFundingRates(filters?: {
    exchangeIds?: number[];
    symbols?: string[];
    minRate?: number;
    maxRate?: number;
    limit?: number;
    offset?: number;
  }): Promise<FundingRateWithExchange[]>;
  getLatestFundingRates(): Promise<FundingRateWithExchange[]>;
  insertFundingRate(rate: InsertFundingRate): Promise<FundingRate>;
  insertFundingRates(rates: InsertFundingRate[]): Promise<FundingRate[]>;
  getHotFundingRates(threshold: number): Promise<FundingRateWithExchange[]>;
  
  // Notification settings
  getNotificationSettings(userId: string): Promise<NotificationSettings | undefined>;
  upsertNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  
  // Custom alerts
  getCustomAlerts(userId: string): Promise<CustomAlert[]>;
  createCustomAlert(alert: InsertCustomAlert): Promise<CustomAlert>;
  deleteCustomAlert(id: number, userId: string): Promise<void>;
  
  // Analytics
  getFundingRateHistory(symbol: string, exchangeId: number, hours: number): Promise<FundingRate[]>;
  getExchangeStats(): Promise<Array<{ exchangeId: number; name: string; count: number; avgRate: number }>>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Exchange operations
  async getExchanges(): Promise<Exchange[]> {
    return await db.select().from(exchanges).orderBy(exchanges.name);
  }

  async getActiveExchanges(): Promise<Exchange[]> {
    return await db.select().from(exchanges).where(eq(exchanges.isActive, true)).orderBy(exchanges.name);
  }

  async upsertExchange(exchangeData: InsertExchange): Promise<Exchange> {
    const [exchange] = await db
      .insert(exchanges)
      .values(exchangeData)
      .onConflictDoUpdate({
        target: exchanges.name,
        set: exchangeData,
      })
      .returning();
    return exchange;
  }

  // Trading pair operations
  async getTradingPairs(exchangeId?: number): Promise<TradingPair[]> {
    const query = db.select().from(tradingPairs).where(eq(tradingPairs.isActive, true));
    
    if (exchangeId) {
      query.where(and(eq(tradingPairs.isActive, true), eq(tradingPairs.exchangeId, exchangeId)));
    }
    
    return await query.orderBy(tradingPairs.symbol);
  }

  async upsertTradingPair(pairData: InsertTradingPair): Promise<TradingPair> {
    const [pair] = await db
      .insert(tradingPairs)
      .values(pairData)
      .onConflictDoUpdate({
        target: [tradingPairs.symbol, tradingPairs.exchangeId],
        set: pairData,
      })
      .returning();
    return pair;
  }

  // Funding rate operations
  async getFundingRates(filters?: {
    exchangeIds?: number[];
    symbols?: string[];
    minRate?: number;
    maxRate?: number;
    limit?: number;
    offset?: number;
  }): Promise<FundingRateWithExchange[]> {
    let query = db
      .select({
        id: fundingRates.id,
        exchangeId: fundingRates.exchangeId,
        pairId: fundingRates.pairId,
        symbol: fundingRates.symbol,
        fundingRate: fundingRates.fundingRate,
        nextFundingTime: fundingRates.nextFundingTime,
        timestamp: fundingRates.timestamp,
        createdAt: fundingRates.createdAt,
        exchange: exchanges,
      })
      .from(fundingRates)
      .leftJoin(exchanges, eq(fundingRates.exchangeId, exchanges.id))
      .where(sql`1=1`);

    if (filters?.exchangeIds?.length) {
      query = query.where(inArray(fundingRates.exchangeId, filters.exchangeIds));
    }

    if (filters?.symbols?.length) {
      query = query.where(inArray(fundingRates.symbol, filters.symbols));
    }

    if (filters?.minRate !== undefined) {
      query = query.where(gte(fundingRates.fundingRate, filters.minRate.toString()));
    }

    if (filters?.maxRate !== undefined) {
      query = query.where(lte(fundingRates.fundingRate, filters.maxRate.toString()));
    }

    query = query.orderBy(desc(fundingRates.timestamp));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async getLatestFundingRates(): Promise<FundingRateWithExchange[]> {
    const subquery = db
      .select({
        exchangeId: fundingRates.exchangeId,
        symbol: fundingRates.symbol,
        maxTimestamp: sql`MAX(${fundingRates.timestamp})`.as('maxTimestamp'),
      })
      .from(fundingRates)
      .groupBy(fundingRates.exchangeId, fundingRates.symbol)
      .as('latest');

    return await db
      .select({
        id: fundingRates.id,
        exchangeId: fundingRates.exchangeId,
        pairId: fundingRates.pairId,
        symbol: fundingRates.symbol,
        fundingRate: fundingRates.fundingRate,
        nextFundingTime: fundingRates.nextFundingTime,
        timestamp: fundingRates.timestamp,
        createdAt: fundingRates.createdAt,
        exchange: exchanges,
      })
      .from(fundingRates)
      .leftJoin(exchanges, eq(fundingRates.exchangeId, exchanges.id))
      .innerJoin(
        subquery,
        and(
          eq(fundingRates.exchangeId, subquery.exchangeId),
          eq(fundingRates.symbol, subquery.symbol),
          eq(fundingRates.timestamp, subquery.maxTimestamp)
        )
      )
      .orderBy(desc(fundingRates.fundingRate));
  }

  async insertFundingRate(rate: InsertFundingRate): Promise<FundingRate> {
    const [inserted] = await db.insert(fundingRates).values(rate).returning();
    return inserted;
  }

  async insertFundingRates(rates: InsertFundingRate[]): Promise<FundingRate[]> {
    if (rates.length === 0) return [];
    return await db.insert(fundingRates).values(rates).returning();
  }

  async getHotFundingRates(threshold: number): Promise<FundingRateWithExchange[]> {
    return await this.getFundingRates({
      minRate: threshold,
      limit: 50,
    });
  }

  // Notification settings
  async getNotificationSettings(userId: string): Promise<NotificationSettings | undefined> {
    const [settings] = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.userId, userId));
    return settings;
  }

  async upsertNotificationSettings(settingsData: InsertNotificationSettings): Promise<NotificationSettings> {
    const [settings] = await db
      .insert(notificationSettings)
      .values(settingsData)
      .onConflictDoUpdate({
        target: notificationSettings.userId,
        set: {
          ...settingsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }

  // Custom alerts
  async getCustomAlerts(userId: string): Promise<CustomAlert[]> {
    return await db
      .select()
      .from(customAlerts)
      .where(and(eq(customAlerts.userId, userId), eq(customAlerts.isActive, true)))
      .orderBy(desc(customAlerts.createdAt));
  }

  async createCustomAlert(alert: InsertCustomAlert): Promise<CustomAlert> {
    const [created] = await db.insert(customAlerts).values(alert).returning();
    return created;
  }

  async deleteCustomAlert(id: number, userId: string): Promise<void> {
    await db
      .update(customAlerts)
      .set({ isActive: false })
      .where(and(eq(customAlerts.id, id), eq(customAlerts.userId, userId)));
  }

  // Analytics
  async getFundingRateHistory(symbol: string, exchangeId: number, hours: number): Promise<FundingRate[]> {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await db
      .select()
      .from(fundingRates)
      .where(
        and(
          eq(fundingRates.symbol, symbol),
          eq(fundingRates.exchangeId, exchangeId),
          gte(fundingRates.timestamp, hoursAgo)
        )
      )
      .orderBy(fundingRates.timestamp);
  }

  async getExchangeStats(): Promise<Array<{ exchangeId: number; name: string; count: number; avgRate: number }>> {
    const result = await db
      .select({
        exchangeId: exchanges.id,
        name: exchanges.displayName,
        count: sql<number>`COUNT(DISTINCT ${fundingRates.symbol})`,
        avgRate: sql<number>`AVG(ABS(${fundingRates.fundingRate}))`,
      })
      .from(exchanges)
      .leftJoin(fundingRates, eq(exchanges.id, fundingRates.exchangeId))
      .groupBy(exchanges.id, exchanges.displayName)
      .orderBy(desc(sql`COUNT(DISTINCT ${fundingRates.symbol})`));

    return result;
  }
}

export const storage = new DatabaseStorage();
