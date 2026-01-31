import type { CacheManagerStore } from 'cache-manager';
import Redis from 'ioredis';

export function createRedisStore(): CacheManagerStore {
  const client = new Redis(process.env.REDIS_URL!, {
    password: process.env.REDIS_TOKEN!,
    tls: {}, 
  });

  return {
    name: 'redis',

    async get(key: string) {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    },

    async mget(...keys: string[]) {
      const values = await client.mget(...keys);
      return values.map(v => v ? JSON.parse(v) : null);
    },

    async set(key: string, value: any, ttl?: number) {
      const data = JSON.stringify(value);
      if (ttl) {
        await client.set(key, data, 'PX', ttl); // PX = TTL in ms
      } else {
        await client.set(key, data);
      }
    },

    async mset(data: Record<string, any>, ttl?: number) {
      const pipeline = client.pipeline();
      for (const [key, value] of Object.entries(data)) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.set(key, serialized, 'PX', ttl);
        } else {
          pipeline.set(key, serialized);
        }
      }
      await pipeline.exec();
    },

    async del(key: string) {
      await client.del(key);
    },
    
    async mdel(...keys: string[]) {
      await client.del(...keys);
    },

    async ttl(key: string, ttl?: number) {
      if (ttl !== undefined) {
        await client.expire(key, Math.ceil(ttl / 1000));
        return ttl;
      }
      const remaining = await client.ttl(key);
      return remaining > 0 ? remaining * 1000 : 0;
    },

    async keys() {
      return await client.keys('*');
    },

    async reset() {
      await client.flushdb();
    },
    
    async disconnect() {
      client.disconnect();
    },
  };
}
