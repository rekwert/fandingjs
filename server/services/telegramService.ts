export class TelegramService {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    if (!this.botToken) {
      console.warn('Telegram bot token not provided. Telegram notifications will be disabled.');
    }
  }

  async sendMessage(chatId: string, message: string): Promise<boolean> {
    if (!this.botToken) {
      console.warn('Telegram bot token not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  async handleWebhook(update: any) {
    if (!update.message || !update.message.text) {
      return;
    }

    const chatId = update.message.chat.id;
    const text = update.message.text;

    if (text.startsWith('/start')) {
      await this.sendMessage(
        chatId,
        `🚀 *Добро пожаловать в Funding Rate Monitor!*\n\n` +
        `Ваш Chat ID: \`${chatId}\`\n\n` +
        `Скопируйте этот ID и добавьте его в настройки уведомлений на сайте для получения уведомлений о высоких ставках финансирования.`
      );
    }
  }

  async setWebhook(url: string): Promise<boolean> {
    if (!this.botToken) {
      console.warn('Telegram bot token not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `${url}/api/telegram/webhook`,
        }),
      });

      const data = await response.json();
      return data.ok;
    } catch (error) {
      console.error('Error setting Telegram webhook:', error);
      return false;
    }
  }
}
