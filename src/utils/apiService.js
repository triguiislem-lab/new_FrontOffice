import axios from 'axios';
import apiCache from './apiCache';

const API_BASE_URL = 'https://laravel-api.fly.dev/api';

// Track in-flight requests to avoid duplicate requests
const inFlightRequests = new Map();

// Default request timeout (10 seconds)
const DEFAULT_TIMEOUT = 10000;

/**
 * Enhanced API service with advanced caching and performance optimizations
 */
const apiService = {
  /**
   * Make a GET request with caching and performance optimizations
   *
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @param {boolean} options.useCache - Whether to use cache
   * @param {number} options.cacheMaxAge - Cache max age in milliseconds
   * @param {number} options.timeout - Request timeout in milliseconds
   * @param {boolean} options.deduplicate - Whether to deduplicate identical in-flight requests
   * @returns {Promise<any>} - Response data
   */
  async get(endpoint, params = {}, options = {}) {
    const {
      useCache = true,
      cacheMaxAge = null,
      timeout = DEFAULT_TIMEOUT,
      deduplicate = true
    } = options;

    // Create a cache key from the endpoint and params
    const queryString = new URLSearchParams(params).toString();
    const cacheKey = `${endpoint}?${queryString}`;

    // Check cache first if enabled
    if (useCache && apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey);
    }

    // Deduplicate identical in-flight requests
    if (deduplicate && inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey);
    }

    // Create the request promise
    const requestPromise = new Promise(async (resolve, reject) => {
      try {
        // Create a cancellation token
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeout);

        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          params,
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': useCache ? 'max-age=3600' : 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        // Cache the response if caching is enabled
        if (useCache) {
          if (cacheMaxAge) {
            // Use custom cache max age
            const tempCache = new apiCache.constructor(cacheMaxAge);
            tempCache.set(cacheKey, response.data);
          } else {
            apiCache.set(cacheKey, response.data);
          }
        }

        resolve(response.data);
      } catch (error) {
        reject(error);
      } finally {
        // Remove from in-flight requests
        inFlightRequests.delete(cacheKey);
      }
    });

    // Add to in-flight requests
    if (deduplicate) {
      inFlightRequests.set(cacheKey, requestPromise);
    }

    return requestPromise;
  },

  /**
   * Make a POST request with optimizations
   *
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Additional options
   * @param {number} options.timeout - Request timeout in milliseconds
   * @returns {Promise<any>} - Response data
   */
  async post(endpoint, data = {}, options = {}) {
    const { timeout = DEFAULT_TIMEOUT, invalidateCache } = options;

    try {
      // Create a cancellation token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeout);

      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      // Invalidate related cache entries if needed
      if (invalidateCache) {
        if (Array.isArray(invalidateCache)) {
          invalidateCache.forEach(key => apiCache.clear(key));
        } else if (typeof invalidateCache === 'string') {
          apiCache.clear(invalidateCache);
        }
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Batch multiple GET requests together with optimized concurrency
   *
   * @param {Array<Object>} requests - Array of request objects
   * @param {string} requests[].endpoint - API endpoint
   * @param {Object} requests[].params - Query parameters
   * @param {Object} requests[].options - Additional options
   * @param {number} concurrency - Maximum number of concurrent requests
   * @returns {Promise<Array<any>>} - Array of response data
   */
  async batchGet(requests, concurrency = 5) {
    // Process requests in batches to limit concurrency
    const results = [];

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(request =>
          this.get(
            request.endpoint,
            request.params || {},
            request.options || {}
          ).catch(error => {
            console.error(`Error in batch request for ${request.endpoint}:`, error);
            return null; // Return null instead of failing the entire batch
          })
        )
      );

      results.push(...batchResults);
    }

    return results;
  },

  /**
   * Get product images with optimized caching
   *
   * @param {number} productId - Product ID
   * @returns {Promise<Array>} - Array of image objects
   */
  async getProductImages(productId) {
    return this.get('/images/get', {
      model_type: 'produit',
      model_id: productId
    }, {
      // Cache product images for longer (1 hour)
      cacheMaxAge: 60 * 60 * 1000,
      // Higher timeout for images
      timeout: 15000
    });
  },

  /**
   * Get multiple products' images in a single batch with optimized performance
   *
   * @param {Array<number>} productIds - Array of product IDs
   * @returns {Promise<Object>} - Map of product IDs to image URLs
   */
  async getBatchProductImages(productIds) {
    // Filter out duplicate IDs
    const uniqueIds = [...new Set(productIds)];

    // Check cache first for all IDs
    const imagesMap = {};
    const uncachedIds = [];

    // Try to get from cache first
    uniqueIds.forEach(id => {
      const cacheKey = `/images/get?model_type=produit&model_id=${id}`;
      if (apiCache.has(cacheKey)) {
        const cachedData = apiCache.get(cacheKey);
        if (cachedData && cachedData.images && cachedData.images.length > 0) {
          const primaryImage = cachedData.images.find(img => img.is_primary) || cachedData.images[0];
          imagesMap[id] = primaryImage.direct_url;
        } else {
          uncachedIds.push(id);
        }
      } else {
        uncachedIds.push(id);
      }
    });

    // If all images were in cache, return immediately
    if (uncachedIds.length === 0) {
      return imagesMap;
    }

    // Process uncached IDs in batches of 10 to avoid too many parallel requests
    const batchSize = 10;
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      const batch = uncachedIds.slice(i, i + batchSize);
      const requests = batch.map(id => ({
        endpoint: '/images/get',
        params: {
          model_type: 'produit',
          model_id: id
        },
        options: {
          cacheMaxAge: 60 * 60 * 1000, // 1 hour cache
          timeout: 15000 // 15 seconds timeout
        }
      }));

      const results = await this.batchGet(requests, 5); // Process 5 at a time

      // Process results
      results.forEach((result, index) => {
        const productId = batch[index];
        if (result && result.images && result.images.length > 0) {
          // Find primary image or use the first one
          const primaryImage = result.images.find(img => img.is_primary) || result.images[0];
          imagesMap[productId] = primaryImage.direct_url;
        }
      });
    }

    return imagesMap;
  },

  /**
   * Prefetch data that will likely be needed soon
   *
   * @param {Array<Object>} requests - Array of request objects to prefetch
   */
  prefetch(requests) {
    if (!Array.isArray(requests) || requests.length === 0) return;

    // Use requestIdleCallback to prefetch during browser idle time
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        requests.forEach(request => {
          const { endpoint, params = {}, options = {} } = request;

          // Use a longer cache duration for prefetched data
          const prefetchOptions = {
            ...options,
            useCache: true,
            cacheMaxAge: options.cacheMaxAge || 60 * 60 * 1000, // 1 hour default for prefetched data
            deduplicate: true
          };

          // Silently fetch and cache
          this.get(endpoint, params, prefetchOptions).catch(() => {
            // Ignore errors in prefetch
          });
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        requests.forEach(request => {
          const { endpoint, params = {}, options = {} } = request;

          // Use a longer cache duration for prefetched data
          const prefetchOptions = {
            ...options,
            useCache: true,
            cacheMaxAge: options.cacheMaxAge || 60 * 60 * 1000, // 1 hour default for prefetched data
            deduplicate: true
          };

          // Silently fetch and cache
          this.get(endpoint, params, prefetchOptions).catch(() => {
            // Ignore errors in prefetch
          });
        });
      }, 1000);
    }
  },

  /**
   * Clear all cache or specific cache entries
   *
   * @param {string|null} key - Specific key to clear, or null to clear all
   */
  clearCache(key = null) {
    apiCache.clear(key);
  }
};

export default apiService;
