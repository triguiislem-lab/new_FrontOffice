/**
 * Simple in-memory cache for API responses
 */
class ApiCache {
  constructor(maxAge = 5 * 60 * 1000) { // Default cache expiry: 5 minutes
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const { value, timestamp } = this.cache.get(key);
    const now = Date.now();

    // Check if cache entry has expired
    if (now - timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return value;
  }

  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * Clear the entire cache or a specific key
   * @param {string|null} key - Specific key to clear, or null to clear all
   */
  clear(key = null) {
    if (key === null) {
      this.cache.clear();
    } else {
      this.cache.delete(key);
    }
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} - Whether the key exists and is valid
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const { timestamp } = this.cache.get(key);
    const now = Date.now();

    return now - timestamp <= this.maxAge;
  }
}

// Create a singleton instance
const apiCache = new ApiCache();

export default apiCache;
