// Simple in-memory LRU cache for feed optimization
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // Check if expired
      if (Date.now() > value.expiry) {
        this.cache.delete(key);
        return null;
      }
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value.data;
    }
    return null;
  }

  set(key, data, ttlSeconds = 30) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { data, expiry });
  }

  has(key) {
    if (this.cache.has(key)) {
      const item = this.cache.get(key);
      if (Date.now() > item.expiry) {
        this.cache.delete(key);
        return false;
      }
      return true;
    }
    return false;
  }

  clear() {
    this.cache.clear();
  }
}

export const feedCache = new LRUCache(50);