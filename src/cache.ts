export class ExpiringLruCache<K, V> {
  private cache = new Map<K, { value: V; expireAt: number }>();
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    if (Date.now() > item.expireAt) {
      this.cache.delete(key);
      return undefined;
    }
    // Refresh LRU position by deleting and re-inserting
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: K, value: V, ttlMs: number): void {
    // If we're at capacity and this is a new key, evict the oldest entry
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    // Delete first to ensure it goes to the end of the Map (most recently used)
    this.cache.delete(key);
    this.cache.set(key, { value, expireAt: Date.now() + ttlMs });
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
  
  // Expose underlying entries for specific cleanup loops if needed
  entries(): IterableIterator<[K, { value: V; expireAt: number }]> {
    return this.cache.entries();
  }
}
