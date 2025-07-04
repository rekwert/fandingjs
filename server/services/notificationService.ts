import type { IStorage } from "../storage";
import type { FundingRateWithExchange } from "@shared/schema";
import { TelegramService } from "./telegramService";

export class NotificationService {
  private notificationInterval?: NodeJS.Timeout;

  constructor(
    private storage: IStorage,
    private telegramService: TelegramService
  ) {}

  async start() {
    // Send notifications every hour
    this.notificationInterval = setInterval(async () => {
      await this.sendHourlyNotifications();
    }, 60 * 60 * 1000); // 1 hour

    console.log('Notification service started');
  }

  async stop() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = undefined;
    }
    console.log('Notification service stopped');
  }

  private async sendHourlyNotifications() {
    try {
      // Get hot funding rates (>0.2%)
      const hotRates = await this.storage.getHotFundingRates(0.002); // 0.2%
      
      if (hotRates.length === 0) {
        return;
      }

      // Get all users with telegram notifications enabled
      const users = await this.storage.getUser('*'); // This would need to be implemented to get all users
      
      // Format notification message
      const timestamp = new Date().toLocaleString('ru-RU', {
        timeZone: 'UTC',
        hour12: false,
      });

      let message = `🔔 *Funding Alert* ${timestamp} UTC\n\n`;
      
      const topRates = hotRates.slice(0, 10); // Top 10 hot rates
      
      for (const rate of topRates) {
        const ratePercent = (parseFloat(rate.fundingRate) * 100).toFixed(3);
        const isPositive = parseFloat(rate.fundingRate) > 0;
        const emoji = isPositive ? '🔥' : '❄️';
        
        message += `${emoji} *${rate.exchange.displayName}* — ${rate.symbol}: ${isPositive ? '+' : ''}${ratePercent}%\n`;
      }

      if (hotRates.length > 10) {
        message += `\n... и еще ${hotRates.length - 10} монет\n`;
      }

      message += `\n📊 Всего горячих монет: ${hotRates.length}`;

      // Send to all users with Telegram notifications enabled
      // Note: This would require implementing user enumeration
      console.log('Hourly notification prepared:', message);
      
      // For now, just log the message
      // In a real implementation, you would:
      // 1. Get all users with telegram notifications enabled
      // 2. Send the message to each user's chat ID
      // 3. Handle failures gracefully
      
    } catch (error) {
      console.error('Error sending hourly notifications:', error);
    }
  }

  async sendCustomAlert(userId: string, message: string) {
    try {
      const user = await this.storage.getUser(userId);
      if (!user?.telegramChatId) {
        console.warn(`User ${userId} has no Telegram chat ID`);
        return false;
      }

      return await this.telegramService.sendMessage(user.telegramChatId, message);
    } catch (error) {
      console.error('Error sending custom alert:', error);
      return false;
    }
  }

  async checkCustomAlerts(rates: FundingRateWithExchange[]) {
    try {
      // This would check all custom alerts against current rates
      // and send notifications when conditions are met
      console.log('Checking custom alerts for', rates.length, 'rates');
      
      // Implementation would:
      // 1. Get all active custom alerts
      // 2. Check each alert against current rates
      // 3. Send notifications for triggered alerts
      // 4. Update alert status to prevent spam
      
    } catch (error) {
      console.error('Error checking custom alerts:', error);
    }
  }
}
