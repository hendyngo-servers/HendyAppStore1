import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RefreshCw, Sparkles, ShoppingBag, CreditCard, Award, Gift, ArrowRight } from 'lucide-react';
import { ServerBridge } from '../server-bridge';
import type { TelegramOutboundMessage } from '../../workers/telegram-bot/src/utils/telegram-api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  replyMarkup?: TelegramOutboundMessage['reply_markup'];
}

export const TelegramBotEmulator: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('/start');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number>(123456789);
  const [currentUsername, setCurrentUsername] = useState<string>('hendy_admin');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial trigger
  useEffect(() => {
    sendCommand('/start');
  }, []);

  const sendCommand = async (text: string, isCallback: boolean = false) => {
    if (!text.trim() || loading) return;
    setLoading(true);

    const userMsgId = `user_${Date.now()}`;
    if (!isCallback) {
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          sender: 'user',
          text,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }

    try {
      const result = await ServerBridge.dispatchTelegramUpdate(text, {
        userId: currentUserId,
        username: currentUsername,
        isCallback,
      });

      if (result.outbound.length > 0) {
        const botMessages: ChatMessage[] = result.outbound.map((msg, i) => ({
          id: `bot_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${i}`,
          sender: 'bot',
          text: msg.text,
          timestamp: new Date().toLocaleTimeString(),
          replyMarkup: msg.reply_markup,
        }));
        setMessages((prev) => [...prev, ...botMessages]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: `⚠️ <b>Error:</b> ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleButtonClick = (btn: { callback_data?: string; url?: string; web_app?: any }) => {
    if (btn.callback_data) {
      sendCommand(btn.callback_data, true);
    } else if (btn.url) {
      window.open(btn.url, '_blank');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[750px]">
      {/* Bot Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-sm">HendyAppStoreBot</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950 text-sky-400 border border-sky-800">
                Worker Simulator
              </span>
            </div>
            <p className="text-xs text-slate-400">@HendyAppStoreBot • Instant Telegram Webhook Dispatcher</p>
          </div>
        </div>

        {/* User Switcher */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 hidden sm:inline">Simulated User:</span>
          <select
            value={currentUserId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setCurrentUserId(id);
              setCurrentUsername(id === 123456789 ? 'hendy_admin' : id === 987654321 ? 'crypto_whiz' : 'new_tester');
            }}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value={123456789}>Admin (Hendy - ID: 123456789)</option>
            <option value={987654321}>VIP Member (Alex - ID: 987654321)</option>
            <option value={777888999}>New Referral User (ID: 777888999)</option>
          </select>
        </div>
      </div>

      {/* Quick Command Bar */}
      <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap">Quick Test:</span>
        <button
          onClick={() => sendCommand('/start')}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] whitespace-nowrap transition-colors"
        >
          /start
        </button>
        <button
          onClick={() => sendCommand('/start ref_123456789')}
          className="px-2.5 py-1 rounded bg-sky-950/80 border border-sky-800 hover:bg-sky-900 text-sky-300 font-mono text-[11px] whitespace-nowrap transition-colors"
        >
          /start ref_123456789
        </button>
        <button
          onClick={() => sendCommand('/shop')}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] whitespace-nowrap transition-colors"
        >
          /shop
        </button>
        <button
          onClick={() => sendCommand('/spin')}
          className="px-2.5 py-1 rounded bg-purple-950/80 border border-purple-800 hover:bg-purple-900 text-purple-300 font-mono text-[11px] whitespace-nowrap transition-colors"
        >
          /spin
        </button>
        <button
          onClick={() => sendCommand('/deposit')}
          className="px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 font-mono text-[11px] whitespace-nowrap transition-colors"
        >
          /deposit
        </button>
        <button
          onClick={() => sendCommand('/vip')}
          className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-800 hover:bg-amber-900 text-amber-300 font-mono text-[11px] whitespace-nowrap transition-colors"
        >
          /vip
        </button>
        <button
          onClick={() => sendCommand('/admin')}
          className="px-2.5 py-1 rounded bg-rose-950/80 border border-rose-800 hover:bg-rose-900 text-rose-300 font-mono text-[11px] whitespace-nowrap transition-colors"
        >
          /admin
        </button>
        <button
          onClick={() => sendCommand('/giftcode WELCOME2026')}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] whitespace-nowrap transition-colors"
        >
          /giftcode WELCOME2026
        </button>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-950/40 to-slate-900/60">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-md ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white rounded-br-none'
                  : 'bg-slate-800/90 text-slate-100 border border-slate-700/70 rounded-bl-none'
              }`}
            >
              {/* Message Content formatted as HTML */}
              <div
                className="text-xs sm:text-sm leading-relaxed prose prose-invert max-w-none break-words"
                dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }}
              />

              <div
                className={`text-[10px] mt-2 font-mono text-right ${
                  msg.sender === 'user' ? 'text-sky-200' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {/* Telegram Inline Keyboard Render */}
            {msg.replyMarkup?.inline_keyboard && (
              <div className="mt-2 flex flex-col gap-1.5 w-full max-w-[85%] sm:max-w-[75%]">
                {msg.replyMarkup.inline_keyboard.map((row, rIdx) => (
                  <div key={rIdx} className="grid grid-flow-col gap-1.5 auto-cols-fr">
                    {row.map((btn, bIdx) => (
                      <button
                        key={bIdx}
                        onClick={() => handleButtonClick(btn)}
                        className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-sky-600/80 text-sky-300 hover:text-white border border-slate-700 hover:border-sky-500 transition-all flex items-center justify-center gap-1.5 shadow-sm truncate"
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
            HendyAppStoreBot worker is typing...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendCommand(input);
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type Telegram command (e.g. /shop, /spin, /deposit)..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-1.5 transition-colors shadow-lg shadow-sky-600/20"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
