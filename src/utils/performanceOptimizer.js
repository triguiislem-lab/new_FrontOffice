/**
 * Performance optimization utilities for better website performance
 */

// Track if performance monitoring is initialized
let isInitialized = false;

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (isInitialized) return;

  // Only run in production mode
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  try {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Check for long tasks (tasks that block the main thread for more than 50ms)
          // No logging in production
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
    }

    // Monitor largest contentful paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        // Capture LCP metrics (no logging in production)
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    }

    // Monitor first input delay (FID)
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Capture FID metrics (no logging in production)
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
    }

    isInitialized = true;
  } catch (error) {
    // Silent fail
  }
};

/**
 * Optimize resource loading
 */
export const optimizeResourceLoading = () => {
  // Preconnect to external domains
  const domains = [
    'https://laravel-api.fly.dev',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ];

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });

  // Preload critical resources
  const criticalResources = [
    { href: '/img/logo.png', as: 'image' },
    { href: '/fonts/main-font.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' }
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;

    if (resource.type) {
      link.type = resource.type;
    }

    if (resource.crossOrigin) {
      link.crossOrigin = resource.crossOrigin;
    }

    document.head.appendChild(link);
  });
};

/**
 * Defer non-critical JavaScript
 *
 * @param {string} src - Script source URL
 * @param {Function} callback - Callback function to execute when script is loaded
 */
export const loadScriptDeferred = (src, callback = null) => {
  const script = document.createElement('script');
  script.src = src;
  script.defer = true;

  if (callback) {
    script.onload = callback;
  }

  document.body.appendChild(script);
};

/**
 * Optimize rendering by using requestAnimationFrame
 *
 * @param {Function} callback - Function to execute during the next animation frame
 * @returns {number} - Request ID that can be used to cancel the scheduled work
 */
export const optimizedRender = (callback) => {
  return window.requestAnimationFrame(callback);
};

/**
 * Cancel a previously scheduled optimized render
 *
 * @param {number} requestId - Request ID returned by optimizedRender
 */
export const cancelOptimizedRender = (requestId) => {
  window.cancelAnimationFrame(requestId);
};

/**
 * Debounce a function to limit how often it can be called
 *
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait before executing the function
 * @param {boolean} immediate - Whether to execute the function immediately
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 100, immediate = false) => {
  let timeout;

  return function(...args) {
    const context = this;

    const later = () => {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
};

/**
 * Throttle a function to limit how often it can be called
 *
 * @param {Function} func - Function to throttle
 * @param {number} limit - Milliseconds to wait between function executions
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit = 100) => {
  let inThrottle;

  return function(...args) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

export default {
  initPerformanceMonitoring,
  optimizeResourceLoading,
  loadScriptDeferred,
  optimizedRender,
  cancelOptimizedRender,
  debounce,
  throttle
};
