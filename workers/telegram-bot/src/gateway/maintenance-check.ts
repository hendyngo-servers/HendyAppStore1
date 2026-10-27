import { getBotDatabase } from '../db';

export async function checkBotMaintenance(isAdmin: boolean, cfDb?: any, kv?: any): Promise<{ isMaintenance: boolean; message?: string }> {
  if (isAdmin) {
    return { isMaintenance: false };
  }

  // Check KV first
  if (kv) {
    try {
      const raw = await kv.get('status');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.isActive) {
          return {
            isMaintenance: true,
            message: `🛠️ <b>Bot Under Maintenance</b>\n\n${parsed.message || 'System upgrades in progress. We will be back online shortly!'}\n\n⏱️ <i>Estimated return: ${parsed.estimatedResolution || 'Under 30 minutes'}</i>`,
          };
        }
      }
    } catch {}
  }

  // Check feature flag in D1
  const db = getBotDatabase(cfDb);
  const flag = await db.prepare("SELECT enabled FROM feature_flags WHERE key = 'maintenance_mode'").first() as any;

  if (flag && flag.enabled === 1) {
    return {
      isMaintenance: true,
      message: '🛠️ <b>Bot Under Maintenance</b>\n\nSystem upgrades in progress. Please try again soon!',
    };
  }

  return { isMaintenance: false };
}
