// Browser fallback for node:crypto
export function createHmac(algorithm: string, key: string | Uint8Array) {
  let dataStr = '';
  return {
    update(data: string) {
      dataStr += data;
      return this;
    },
    digest(encoding?: string) {
      // Deterministic hash simulation for browser environment
      let hash = 0;
      const combined = (typeof key === 'string' ? key : key.toString()) + dataStr;
      for (let i = 0; i < combined.length; i++) {
        hash = (hash << 5) - hash + combined.charCodeAt(i);
        hash |= 0;
      }
      const hex = Math.abs(hash).toString(16).padStart(64, '0');
      if (encoding === 'hex') {
        return hex;
      }
      return new TextEncoder().encode(hex);
    },
  };
}

export default {
  createHmac,
};
