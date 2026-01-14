/**
 * Prefetch Cache Manager
 * Lightweight cache for prefetched tab data
 * Uses in-memory Map for fast access, minimal memory footprint
 */

type CacheKey = string;
type CacheData = any;
type CacheEntry = {
  data: CacheData;
  timestamp: number;
  staleTime: number; // milliseconds
};

class PrefetchCache {
  private cache: Map<CacheKey, CacheEntry> = new Map();
  private readonly DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5 minutes

  /**
   * Set cache entry with optional stale time
   */
  set(key: CacheKey, data: CacheData, staleTime?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      staleTime: staleTime || this.DEFAULT_STALE_TIME,
    });
  }

  /**
   * Get cache entry if not stale
   */
  get(key: CacheKey): CacheData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isStale = Date.now() - entry.timestamp > entry.staleTime;
    if (isStale) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if key exists and is not stale
   */
  has(key: CacheKey): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove specific cache entry
   */
  delete(key: CacheKey): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear stale entries
   */
  clearStale(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.staleTime) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const prefetchCache = new PrefetchCache();

// Cache keys
export const CACHE_KEYS = {
  ROLLS_FIRST: 'prefetch:rolls:first',
  COUPONS_FIRST: 'prefetch:coupons:first',
  CATEGORIES_ALL: 'prefetch:categories:all',
} as const;
