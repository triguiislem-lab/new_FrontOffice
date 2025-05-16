/**
 * Enhanced in-memory cache for API responses with persistent storage
 */
class ApiCache {
  constructor(maxAge = 5 * 60 * 1000) { // Default cache expiry: 5 minutes
    this.cache = new Map();
    this.maxAge = maxAge;
    this.persistentStorageKey = 'api_cache_data';
    this.loadFromStorage();

    // Set up automatic cleanup every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Load cache from localStorage if available
   * @private
   */
  loadFromStorage() {
    try {
      const storedCache = localStorage.getItem(this.persistentStorageKey);
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        Object.entries(parsedCache).forEach(([key, entry]) => {
          // Only load non-expired entries
          if (Date.now() - entry.timestamp <= this.maxAge) {
            this.cache.set(key, entry);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  /**
   * Save cache to localStorage
   * @private
   */
  saveToStorage() {
    try {
      const cacheObject = {};
      this.cache.forEach((value, key) => {
        // Only save non-expired entries
        if (Date.now() - value.timestamp <= this.maxAge) {
          cacheObject[key] = value;
        }
      });
      localStorage.setItem(this.persistentStorageKey, JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Clean up expired entries
   * @private
   */
  cleanup() {
    const now = Date.now();
    let hasChanges = false;

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.saveToStorage();
    }
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
      this.saveToStorage();
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

    // Debounce storage updates to avoid excessive writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveToStorage();
    }, 1000);
  }

  /**
   * Clear the entire cache or a specific key
   * @param {string|null} key - Specific key to clear, or null to clear all
   */
  clear(key = null) {
    if (key === null) {
      this.cache.clear();
      localStorage.removeItem(this.persistentStorageKey);
    } else {
      this.cache.delete(key);
      this.saveToStorage();
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

    if (now - timestamp > this.maxAge) {
      this.cache.delete(key);
      this.saveToStorage();
      return false;
    }

    return true;
  }

  /**
   * Destroy the cache instance and clean up
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
  }
}

// Create a singleton instance
const apiCache = new ApiCache();

export default apiCache;
