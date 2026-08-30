const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient = null;
let isRedisAvailable = false;

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 2000,
    retryStrategy(times) {
      if (times > 1) return null; // stop retrying quickly in test/standalone env
      return 500;
    }
  });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    console.log('[Redis] Connected to Redis server.');
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
  });
} catch (e) {
  isRedisAvailable = false;
}

const getRedisClient = () => redisClient;
const checkRedisAvailable = () => isRedisAvailable;

const disconnectRedis = async () => {
  if (redisClient) {
    try {
      redisClient.disconnect();
    } catch (e) {}
  }
};

module.exports = {
  getRedisClient,
  checkRedisAvailable,
  disconnectRedis
};
