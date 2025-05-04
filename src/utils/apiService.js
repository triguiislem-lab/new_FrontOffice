import axios from 'axios';
import apiCache from './apiCache';

const API_BASE_URL = 'https://laravel-api.fly.dev/api';

/**
 * Enhanced API service with caching capabilities
 */
const apiService = {
  /**
   * Make a GET request with caching
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @param {boolean} options.useCache - Whether to use cache
   * @param {number} options.cacheMaxAge - Cache max age in milliseconds
   * @returns {Promise<any>} - Response data
   */
  async get(endpoint, params = {}, options = {}) {
    const { useCache = true, cacheMaxAge = null } = options;
    
    // Create a cache key from the endpoint and params
    const queryString = new URLSearchParams(params).toString();
    const cacheKey = `${endpoint}?${queryString}`;
    
    // Check cache first if enabled
    if (useCache && apiCache.has(cacheKey)) {
      return apiCache.get(cacheKey);
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, { params });
      
      // Cache the response if caching is enabled
      if (useCache) {
        if (cacheMaxAge) {
          // Create a temporary cache with custom max age
          const tempCache = new apiCache.constructor(cacheMaxAge);
          tempCache.set(cacheKey, response.data);
        } else {
          apiCache.set(cacheKey, response.data);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`API Error (GET ${endpoint}):`, error);
      throw error;
    }
  },
  
  /**
   * Make a POST request
   * 
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<any>} - Response data
   */
  async post(endpoint, data = {}, options = {}) {
    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, data);
      
      // Invalidate related cache entries if needed
      if (options.invalidateCache) {
        if (Array.isArray(options.invalidateCache)) {
          options.invalidateCache.forEach(key => apiCache.clear(key));
        } else if (typeof options.invalidateCache === 'string') {
          apiCache.clear(options.invalidateCache);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error(`API Error (POST ${endpoint}):`, error);
      throw error;
    }
  },
  
  /**
   * Batch multiple GET requests together
   * 
   * @param {Array<Object>} requests - Array of request objects
   * @param {string} requests[].endpoint - API endpoint
   * @param {Object} requests[].params - Query parameters
   * @param {Object} requests[].options - Additional options
   * @returns {Promise<Array<any>>} - Array of response data
   */
  async batchGet(requests) {
    return Promise.all(
      requests.map(request => 
        this.get(
          request.endpoint, 
          request.params || {}, 
          request.options || {}
        )
      )
    );
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
      // Cache product images for longer (30 minutes)
      cacheMaxAge: 30 * 60 * 1000
    });
  },
  
  /**
   * Get multiple products' images in a single batch
   * 
   * @param {Array<number>} productIds - Array of product IDs
   * @returns {Promise<Object>} - Map of product IDs to image arrays
   */
  async getBatchProductImages(productIds) {
    // Filter out duplicate IDs
    const uniqueIds = [...new Set(productIds)];
    
    // Create a map to store results
    const imagesMap = {};
    
    // Process in batches of 10 to avoid too many parallel requests
    const batchSize = 10;
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize);
      const requests = batch.map(id => ({
        endpoint: '/images/get',
        params: {
          model_type: 'produit',
          model_id: id
        },
        options: {
          cacheMaxAge: 30 * 60 * 1000
        }
      }));
      
      const results = await this.batchGet(requests);
      
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
   * Clear all cache or specific cache entries
   * 
   * @param {string|null} key - Specific key to clear, or null to clear all
   */
  clearCache(key = null) {
    apiCache.clear(key);
  }
};

export default apiService;
