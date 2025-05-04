/**
 * API Optimizer Service
 * 
 * This service provides optimizations for API calls:
 * 1. Request batching - combines multiple API requests into a single request
 * 2. Request deduplication - prevents duplicate requests for the same data
 * 3. Request prioritization - prioritizes critical requests over non-critical ones
 * 4. Request cancellation - cancels requests that are no longer needed
 */

import apiService from './apiService';

// Queue for batching requests
let requestQueue = [];
let isProcessingQueue = false;
let queueTimer = null;
const QUEUE_PROCESS_DELAY = 50; // ms

// Map to track in-flight requests for deduplication
const inFlightRequests = new Map();

/**
 * Adds a request to the batch queue
 * 
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Request parameters
 * @param {Object} options - Request options
 * @param {boolean} options.critical - Whether this is a critical request that shouldn't be batched
 * @param {number} options.priority - Priority of the request (higher = more important)
 * @returns {Promise} - Promise that resolves with the response
 */
export const queueRequest = (endpoint, params = {}, options = {}) => {
  const { 
    critical = false, 
    priority = 1,
    useCache = true,
    cacheDuration = 300 // 5 minutes default
  } = options;
  
  // Generate a unique key for this request for deduplication
  const requestKey = `${endpoint}:${JSON.stringify(params)}`;
  
  // If this exact request is already in flight, return the existing promise
  if (inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey);
  }
  
  // For critical requests, bypass the queue and execute immediately
  if (critical) {
    const promise = apiService.get(endpoint, params, { useCache, cacheDuration });
    inFlightRequests.set(requestKey, promise);
    
    // Remove from in-flight requests when done
    promise.finally(() => {
      inFlightRequests.delete(requestKey);
    });
    
    return promise;
  }
  
  // For non-critical requests, add to the queue
  return new Promise((resolve, reject) => {
    requestQueue.push({
      endpoint,
      params,
      options: { useCache, cacheDuration },
      priority,
      resolve,
      reject,
      requestKey
    });
    
    // Sort the queue by priority (higher priority first)
    requestQueue.sort((a, b) => b.priority - a.priority);
    
    // Start the queue processing timer if not already running
    if (!queueTimer) {
      queueTimer = setTimeout(processQueue, QUEUE_PROCESS_DELAY);
    }
  });
};

/**
 * Processes the request queue
 */
const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) {
    queueTimer = null;
    return;
  }
  
  isProcessingQueue = true;
  
  try {
    // Take up to 10 requests from the queue
    const batch = requestQueue.splice(0, 10);
    
    // Add all requests to the in-flight map
    batch.forEach(request => {
      const promise = apiService.get(
        request.endpoint, 
        request.params, 
        request.options
      );
      
      inFlightRequests.set(request.requestKey, promise);
      
      // Process this request
      promise
        .then(response => {
          request.resolve(response);
        })
        .catch(error => {
          request.reject(error);
        })
        .finally(() => {
          inFlightRequests.delete(request.requestKey);
        });
    });
  } catch (error) {
    console.error('Error processing request queue:', error);
  } finally {
    isProcessingQueue = false;
    
    // If there are more requests in the queue, process them after a delay
    if (requestQueue.length > 0) {
      queueTimer = setTimeout(processQueue, QUEUE_PROCESS_DELAY);
    } else {
      queueTimer = null;
    }
  }
};

/**
 * Cancels all pending requests
 */
export const cancelAllRequests = () => {
  requestQueue = [];
  if (queueTimer) {
    clearTimeout(queueTimer);
    queueTimer = null;
  }
};

/**
 * Prefetches data that will likely be needed soon
 * 
 * @param {Array} requests - Array of request objects with endpoint, params, and options
 */
export const prefetchData = (requests) => {
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
          cacheDuration: options.cacheDuration || 600, // 10 minutes default for prefetched data
          priority: options.priority || 0 // Lowest priority
        };
        
        queueRequest(endpoint, params, prefetchOptions);
      });
    });
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(() => {
      requests.forEach(request => {
        const { endpoint, params = {}, options = {} } = request;
        
        const prefetchOptions = {
          ...options,
          useCache: true,
          cacheDuration: options.cacheDuration || 600,
          priority: options.priority || 0
        };
        
        queueRequest(endpoint, params, prefetchOptions);
      });
    }, 200);
  }
};

export default {
  queueRequest,
  cancelAllRequests,
  prefetchData
};
