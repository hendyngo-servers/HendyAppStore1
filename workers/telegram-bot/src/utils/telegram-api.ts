export interface InlineKeyboardButton {
  text: string;
  callback_data?: string;
  url?: string;
  web_app?: { url: string };
}

export interface TelegramOutboundMessage {
  chat_id: number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: {
    inline_keyboard?: InlineKeyboardButton[][];
    keyboard?: Array<Array<{ text: string }>>;
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
  };
}

export class TelegramApiClient {
  private botToken: string;
  private static recordedResponses: TelegramOutboundMessage[] = [];

  constructor(botToken: string) {
    this.botToken = botToken;
  }

  public async sendMessage(
    chatId: number,
    text: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      reply_markup?: TelegramOutboundMessage['reply_markup'];
    }
  ): Promise<TelegramOutboundMessage> {
    const payload: TelegramOutboundMessage = {
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || 'HTML',
      reply_markup: options?.reply_markup,
    };

    TelegramApiClient.recordedResponses.push(payload);

    // If real token provided, attempt real HTTP fetch to Telegram Bot API
    if (this.botToken && !this.botToken.startsWith('dummy') && !this.botToken.startsWith('123456789:') && this.botToken.includes(':')) {
      try {
        await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('[TelegramApiClient] Could not send to Telegram network:', err);
      }
    }

    return payload;
  }

  public async answerCallbackQuery(
    callbackQueryId: string,
    options?: { text?: string; show_alert?: boolean }
  ): Promise<void> {
    if (this.botToken && !this.botToken.startsWith('dummy') && !this.botToken.startsWith('123456789:') && this.botToken.includes(':')) {
      try {
        await fetch(`https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQueryId,
            text: options?.text,
            show_alert: options?.show_alert || false,
          }),
        });
      } catch (err) {
        // ignore
      }
    }
  }

  public static getRecentOutbound(): TelegramOutboundMessage[] {
    return [...this.recordedResponses];
  }

  public static getLastOutbound(): TelegramOutboundMessage | undefined {
    return this.recordedResponses[this.recordedResponses.length - 1];
  }

  public static clearOutbound(): void {
    this.recordedResponses = [];
  }
}
