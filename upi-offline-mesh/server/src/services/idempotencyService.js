const { getRedisClient, checkRedisAvailable } = require('../config/redis');

class IdempotencyService {
  constructor() {
    this.inMemoryMap = new Map(); // packetHash -> timestamp
    this.ttlSeconds = parseInt(process.env.IDEMPOTENCY_TTL_SECONDS || '86400', 10);
  }

  /**
   * Atomic claim of a packet hash.
   * Uses Redis `SET key val NX EX ttl` when Redis is available.
   * Uses atomic Map operations as fallback for isolated unit tests / offline dev.
   */
  async claim(packetHash) {
    if (checkRedisAvailable()) {
      try {
        const redis = getRedisClient();
        const key = `idempotency:${packetHash}`;
        // SET key value EX ttl NX returns 'OK' if key was set, or null if key already exists
        const result = await redis.set(key, 'claimed', 'EX', this.ttlSeconds, 'NX');
        return result === 'OK';
      } catch (err) {
        console.warn('[Idempotency] Redis error during claim, falling back to in-memory:', err.message);
      }
    }

    // In-memory fallback
    if (this.inMemoryMap.has(packetHash)) {
      return false;
    }
    this.inMemoryMap.set(packetHash, Date.now());
    return true;
  }

  async size() {
    if (checkRedisAvailable()) {
      try {
        const redis = getRedisClient();
        const keys = await redis.keys('idempotency:*');
        return keys.length;
      } catch (e) {
        // Fallback
      }
    }
    return this.inMemoryMap.size;
  }

  async clear() {
    if (checkRedisAvailable()) {
      try {
        const redis = getRedisClient();
        const keys = await redis.keys('idempotency:*');
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (e) {
        // Fallback
      }
    }
    this.inMemoryMap.clear();
  }
}

module.exports = new IdempotencyService();
