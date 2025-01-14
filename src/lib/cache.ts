// src/lib/cache.ts
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 100, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes
});

export function getCacheKey(params: Record<string, any>): string {
  return JSON.stringify(params);
}

export { cache };
