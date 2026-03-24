/**
 * Cache helper for KV storage
 * Handles caching of frequently accessed data
 */

export class CacheHelper {
  constructor(kvNamespace) {
    this.kv = kvNamespace;
    this.defaultTTL = 3600; // 1 hour
  }

  /**
   * Get cached value
   */
  async get(key) {
    try {
      const value = await this.kv.get(key, 'json');
      return value;
    } catch (error) {
      console.warn(`[Cache] Get failed for ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: ttl
      });
      return true;
    } catch (error) {
      console.warn(`[Cache] Set failed for ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Delete cache key
   */
  async delete(key) {
    try {
      await this.kv.delete(key);
      return true;
    } catch (error) {
      console.warn(`[Cache] Delete failed for ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Get or set (lazy loading)
   */
  async getOrSet(key, fetcher, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    
    if (cached !== null) {
      return cached;
    }

    // Not in cache, fetch it
    const fresh = await fetcher();
    
    // Cache the result
    await this.set(key, fresh, ttl);
    
    return fresh;
  }

  /**
   * Invalidate cache pattern (e.g., "user:*")
   * Note: KV doesn't support pattern deletion, so this lists and deletes
   */
  async invalidatePattern(pattern) {
    try {
      console.warn('[Cache] Pattern invalidation not yet implemented');
      // This would require listing all keys and filtering by pattern
      // For now, manually delete specific keys
      return false;
    } catch (error) {
      console.warn(`[Cache] Pattern invalidation failed:`, error.message);
      return false;
    }
  }
}

export default CacheHelper;
