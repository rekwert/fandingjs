import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ExchangeService } from "./services/exchangeService";
import { TelegramService } from "./services/telegramService";
import { NotificationService } from "./services/notificationService";
import { insertNotificationSettingsSchema, insertCustomAlertSchema } from "@shared/schema";

const exchangeService = new ExchangeService(storage);
const telegramService = new TelegramService();
const notificationService = new NotificationService(storage, telegramService);

interface WebSocketClient {
  ws: WebSocket;
  userId?: string;
}

const clients: Set<WebSocketClient> = new Set();

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize exchanges
  await exchangeService.initializeExchanges();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Exchange routes
  app.get('/api/exchanges', async (req, res) => {
    try {
      const exchanges = await storage.getActiveExchanges();
      res.json(exchanges);
    } catch (error) {
      console.error("Error fetching exchanges:", error);
      res.status(500).json({ message: "Failed to fetch exchanges" });
    }
  });

  app.get('/api/exchanges/stats', async (req, res) => {
    try {
      const stats = await storage.getExchangeStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching exchange stats:", error);
      res.status(500).json({ message: "Failed to fetch exchange stats" });
    }
  });

  // Funding rate routes
  app.get('/api/funding-rates', async (req, res) => {
    try {
      const {
        exchangeIds,
        symbols,
        minRate,
        maxRate,
        limit = 25,
        offset = 0,
      } = req.query;

      const filters = {
        exchangeIds: exchangeIds ? String(exchangeIds).split(',').map(Number) : undefined,
        symbols: symbols ? String(symbols).split(',') : undefined,
        minRate: minRate ? Number(minRate) : undefined,
        maxRate: maxRate ? Number(maxRate) : undefined,
        limit: Number(limit),
        offset: Number(offset),
      };

      const rates = await storage.getFundingRates(filters);
      res.json(rates);
    } catch (error) {
      console.error("Error fetching funding rates:", error);
      res.status(500).json({ message: "Failed to fetch funding rates" });
    }
  });

  app.get('/api/funding-rates/latest', async (req, res) => {
    try {
      const rates = await storage.getLatestFundingRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching latest funding rates:", error);
      res.status(500).json({ message: "Failed to fetch latest funding rates" });
    }
  });

  app.get('/api/funding-rates/hot/:threshold', async (req, res) => {
    try {
      const threshold = Number(req.params.threshold);
      const rates = await storage.getHotFundingRates(threshold);
      res.json(rates);
    } catch (error) {
      console.error("Error fetching hot funding rates:", error);
      res.status(500).json({ message: "Failed to fetch hot funding rates" });
    }
  });

  app.get('/api/funding-rates/history/:symbol/:exchangeId/:hours', async (req, res) => {
    try {
      const { symbol, exchangeId, hours } = req.params;
      const history = await storage.getFundingRateHistory(
        symbol,
        Number(exchangeId),
        Number(hours)
      );
      res.json(history);
    } catch (error) {
      console.error("Error fetching funding rate history:", error);
      res.status(500).json({ message: "Failed to fetch funding rate history" });
    }
  });

  // Notification routes
  app.get('/api/notifications/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getNotificationSettings(userId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.post('/api/notifications/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertNotificationSettingsSchema.parse({
        ...req.body,
        userId,
      });
      
      const settings = await storage.upsertNotificationSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error saving notification settings:", error);
      res.status(500).json({ message: "Failed to save notification settings" });
    }
  });

  // Custom alerts routes
  app.get('/api/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alerts = await storage.getCustomAlerts(userId);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching custom alerts:", error);
      res.status(500).json({ message: "Failed to fetch custom alerts" });
    }
  });

  app.post('/api/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCustomAlertSchema.parse({
        ...req.body,
        userId,
      });
      
      const alert = await storage.createCustomAlert(validatedData);
      res.json(alert);
    } catch (error) {
      console.error("Error creating custom alert:", error);
      res.status(500).json({ message: "Failed to create custom alert" });
    }
  });

  app.delete('/api/alerts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const alertId = Number(req.params.id);
      await storage.deleteCustomAlert(alertId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting custom alert:", error);
      res.status(500).json({ message: "Failed to delete custom alert" });
    }
  });

  // Telegram bot webhook
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      await telegramService.handleWebhook(req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error handling telegram webhook:", error);
      res.status(500).json({ message: "Failed to handle telegram webhook" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('New WebSocket connection');
    
    const client: WebSocketClient = { ws };
    clients.add(client);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth' && data.userId) {
          client.userId = data.userId;
          console.log(`Client authenticated: ${data.userId}`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clients.delete(client);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(client);
    });
  });

  // Broadcast function for real-time updates
  function broadcastToClients(data: any) {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  // Start exchange data collection
  exchangeService.onDataUpdate((rates) => {
    broadcastToClients({
      type: 'funding-rates-update',
      data: rates,
    });
  });

  // Start services
  await exchangeService.start();
  await notificationService.start();

  console.log('All services started successfully');

  return httpServer;
}
