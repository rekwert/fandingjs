import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  telegramChatId: varchar("telegram_chat_id"),
  emailNotifications: boolean("email_notifications").default(false),
  language: varchar("language", { length: 2 }).default("ru"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exchanges table
export const exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  displayName: varchar("display_name", { length: 100 }).notNull(),
  apiUrl: varchar("api_url", { length: 255 }).notNull(),
  wsUrl: varchar("ws_url", { length: 255 }),
  isActive: boolean("is_active").default(true),
  color: varchar("color", { length: 7 }).default("#3B82F6"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trading pairs table
export const tradingPairs = pgTable("trading_pairs", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  baseAsset: varchar("base_asset", { length: 10 }).notNull(),
  quoteAsset: varchar("quote_asset", { length: 10 }).notNull(),
  exchangeId: integer("exchange_id").references(() => exchanges.id).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Funding rates table
export const fundingRates = pgTable("funding_rates", {
  id: serial("id").primaryKey(),
  exchangeId: integer("exchange_id").references(() => exchanges.id).notNull(),
  pairId: integer("pair_id").references(() => tradingPairs.id).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  fundingRate: decimal("funding_rate", { precision: 10, scale: 6 }).notNull(),
  nextFundingTime: timestamp("next_funding_time").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User notification settings
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  thresholdPercent: decimal("threshold_percent", { precision: 5, scale: 3 }).default("0.200"),
  frequencyMinutes: integer("frequency_minutes").default(60),
  telegramEnabled: boolean("telegram_enabled").default(false),
  emailEnabled: boolean("email_enabled").default(false),
  webPushEnabled: boolean("web_push_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom alerts
export const customAlerts = pgTable("custom_alerts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  exchangeId: integer("exchange_id").references(() => exchanges.id),
  symbol: varchar("symbol", { length: 20 }),
  condition: varchar("condition", { length: 10 }).notNull(), // 'gt', 'lt', 'gte', 'lte'
  threshold: decimal("threshold", { precision: 10, scale: 6 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  notificationSettings: many(notificationSettings),
  customAlerts: many(customAlerts),
}));

export const exchangesRelations = relations(exchanges, ({ many }) => ({
  tradingPairs: many(tradingPairs),
  fundingRates: many(fundingRates),
  customAlerts: many(customAlerts),
}));

export const tradingPairsRelations = relations(tradingPairs, ({ one, many }) => ({
  exchange: one(exchanges, {
    fields: [tradingPairs.exchangeId],
    references: [exchanges.id],
  }),
  fundingRates: many(fundingRates),
}));

export const fundingRatesRelations = relations(fundingRates, ({ one }) => ({
  exchange: one(exchanges, {
    fields: [fundingRates.exchangeId],
    references: [exchanges.id],
  }),
  pair: one(tradingPairs, {
    fields: [fundingRates.pairId],
    references: [tradingPairs.id],
  }),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
  user: one(users, {
    fields: [notificationSettings.userId],
    references: [users.id],
  }),
}));

export const customAlertsRelations = relations(customAlerts, ({ one }) => ({
  user: one(users, {
    fields: [customAlerts.userId],
    references: [users.id],
  }),
  exchange: one(exchanges, {
    fields: [customAlerts.exchangeId],
    references: [exchanges.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users);
export const insertExchangeSchema = createInsertSchema(exchanges);
export const insertTradingPairSchema = createInsertSchema(tradingPairs);
export const insertFundingRateSchema = createInsertSchema(fundingRates);
export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings);
export const insertCustomAlertSchema = createInsertSchema(customAlerts);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Exchange = typeof exchanges.$inferSelect;
export type TradingPair = typeof tradingPairs.$inferSelect;
export type FundingRate = typeof fundingRates.$inferSelect;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type CustomAlert = typeof customAlerts.$inferSelect;

export type FundingRateWithExchange = FundingRate & {
  exchange: Exchange;
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertExchange = z.infer<typeof insertExchangeSchema>;
export type InsertTradingPair = z.infer<typeof insertTradingPairSchema>;
export type InsertFundingRate = z.infer<typeof insertFundingRateSchema>;
export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type InsertCustomAlert = z.infer<typeof insertCustomAlertSchema>;
