/**
 * Cloudflare KV Namespace adapter with memory cache fallback
 */
export class KVService {
  private static stores: Map<string, Map<string, string>> = new Map();
  private cfKv: any = null;
  private namespace: string;

  constructor(namespace: string, cfKv?: any) {
    this.namespace = namespace;
    this.cfKv = cfKv;
    if (!KVService.stores.has(namespace)) {
      KVService.stores.set(namespace, new Map());
    }
  }

  public async get(key: string): Promise<string | null> {
    if (this.cfKv) {
      return this.cfKv.get(key);
    }
    const store = KVService.stores.get(this.namespace);
    return store?.get(key) ?? null;
  }

  public async getJSON<T = any>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  public async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    if (this.cfKv) {
      return this.cfKv.put(key, value, options);
    }
    const store = KVService.stores.get(this.namespace)!;
    store.set(key, value);
  }

  public async delete(key: string): Promise<void> {
    if (this.cfKv) {
      return this.cfKv.delete(key);
    }
    const store = KVService.stores.get(this.namespace)!;
    store.delete(key);
  }

  public async list(): Promise<{ keys: Array<{ name: string }> }> {
    if (this.cfKv) {
      return this.cfKv.list();
    }
    const store = KVService.stores.get(this.namespace)!;
    return {
      keys: Array.from(store.keys()).map((k) => ({ name: k })),
    };
  }
}
