import type { BotState } from '@packages/types';

export class BotStateManager {
  private static memoryStates: Map<number, BotState> = new Map();

  public static async getState(userId: number, kv?: any): Promise<BotState | null> {
    if (kv) {
      try {
        const raw = await kv.get(`bot_state_${userId}`);
        return raw ? JSON.parse(raw) : null;
      } catch {
        // fallback
      }
    }
    return this.memoryStates.get(userId) || null;
  }

  public static async setState(userId: number, state: Partial<BotState>, kv?: any): Promise<void> {
    const existing = (await this.getState(userId, kv)) || {
      userId,
      currentStep: 'idle',
      lastInteractionAt: Date.now(),
    };

    const updated: BotState = {
      ...existing,
      ...state,
      userId,
      lastInteractionAt: Date.now(),
    };

    this.memoryStates.set(userId, updated);

    if (kv) {
      try {
        await kv.put(`bot_state_${userId}`, JSON.stringify(updated), { expirationTtl: 3600 });
      } catch {
        // fallback
      }
    }
  }

  public static async clearState(userId: number, kv?: any): Promise<void> {
    this.memoryStates.delete(userId);
    if (kv) {
      try {
        await kv.delete(`bot_state_${userId}`);
      } catch {
        // fallback
      }
    }
  }
}
