const DEFAULT_TTL = 5 * 60 * 1000;
const memoryCache = new Map();

class CacheService {
  static async set(key, data, ttl = DEFAULT_TTL) {
    memoryCache.set(key, { data, timestamp: Date.now(), ttl });
    return true;
  }

  static async get(key) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > item.ttl) {
      memoryCache.delete(key);
      return null;
    }
    return item.data;
  }

  static async remove(key) {
    memoryCache.delete(key);
    return true;
  }

  static async clear() {
    memoryCache.clear();
    return true;
  }

  static async cleanExpired() {
    const now = Date.now();
    for (const [key, item] of memoryCache.entries()) {
      if (now - item.timestamp > item.ttl) memoryCache.delete(key);
    }
    return true;
  }

  static async getStats() {
    await this.cleanExpired();
    return { totalItems: memoryCache.size, expiredItems: 0, totalSizeKB: 0 };
  }
}

export default CacheService;
