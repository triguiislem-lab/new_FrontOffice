/**
 * Image optimization utilities for better performance
 */

// Keep track of preloaded images to avoid duplicates
const preloadedImages = new Set();

/**
 * Preload an image in the background
 * 
 * @param {string} src - Image URL to preload
 * @returns {Promise} - Promise that resolves when the image is loaded
 */
export const preloadImage = (src) => {
  if (!src || preloadedImages.has(src)) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      preloadedImages.add(src);
      resolve();
    };
    
    img.onerror = () => {
      resolve(); // Resolve anyway to avoid blocking
    };
    
    img.src = src;
  });
};

/**
 * Preload multiple images in the background with priority
 * 
 * @param {Array<string>} sources - Array of image URLs to preload
 * @param {number} priority - Number of images to load immediately (rest during idle time)
 */
export const preloadImages = (sources, priority = 1) => {
  if (!Array.isArray(sources) || sources.length === 0) {
    return;
  }
  
  // Filter out already preloaded images and empty sources
  const filteredSources = sources.filter(src => src && !preloadedImages.has(src));
  
  if (filteredSources.length === 0) {
    return;
  }
  
  // Preload priority images immediately
  const prioritySources = filteredSources.slice(0, priority);
  prioritySources.forEach(src => {
    preloadImage(src);
  });
  
  // Preload remaining images during idle time
  const remainingSources = filteredSources.slice(priority);
  
  if (remainingSources.length > 0) {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        remainingSources.forEach(src => {
          preloadImage(src);
        });
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        remainingSources.forEach(src => {
          preloadImage(src);
        });
      }, 1000);
    }
  }
};

/**
 * Get optimized image dimensions based on viewport and container
 * 
 * @param {Object} options - Options for image optimization
 * @param {number} options.width - Original image width
 * @param {number} options.height - Original image height
 * @param {number} options.containerWidth - Container width (default: viewport width)
 * @param {number} options.containerHeight - Container height (default: viewport height)
 * @param {number} options.maxWidth - Maximum width (default: 1200)
 * @param {number} options.maxHeight - Maximum height (default: 800)
 * @returns {Object} - Optimized width and height
 */
export const getOptimizedDimensions = (options) => {
  const {
    width,
    height,
    containerWidth = window.innerWidth,
    containerHeight = window.innerHeight,
    maxWidth = 1200,
    maxHeight = 800
  } = options;
  
  if (!width || !height) {
    return { width: maxWidth, height: maxHeight };
  }
  
  const aspectRatio = width / height;
  
  // Calculate dimensions based on container and max dimensions
  let optimizedWidth = Math.min(containerWidth, maxWidth);
  let optimizedHeight = Math.round(optimizedWidth / aspectRatio);
  
  // If height exceeds container or max height, recalculate
  if (optimizedHeight > containerHeight || optimizedHeight > maxHeight) {
    optimizedHeight = Math.min(containerHeight, maxHeight);
    optimizedWidth = Math.round(optimizedHeight * aspectRatio);
  }
  
  return {
    width: optimizedWidth,
    height: optimizedHeight
  };
};

/**
 * Generate a responsive image URL with appropriate dimensions
 * 
 * @param {string} src - Original image URL
 * @param {Object} options - Options for image optimization
 * @returns {string} - Optimized image URL
 */
export const getResponsiveImageUrl = (src, options = {}) => {
  if (!src) return '';
  
  // If the URL is already optimized or is a data URL, return as is
  if (src.includes('w=') || src.includes('h=') || src.startsWith('data:')) {
    return src;
  }
  
  const { width, height } = getOptimizedDimensions(options);
  
  // Add dimensions to URL if it's from a CDN or service that supports it
  if (src.includes('cloudinary.com')) {
    // Cloudinary format
    return src.replace('/upload/', `/upload/w_${width},h_${height},c_limit,q_auto,f_auto/`);
  } else if (src.includes('imgix.net')) {
    // Imgix format
    return `${src}${src.includes('?') ? '&' : '?'}w=${width}&h=${height}&fit=clip&auto=format,compress`;
  } else if (src.includes('images.unsplash.com')) {
    // Unsplash format
    return `${src}${src.includes('?') ? '&' : '?'}w=${width}&h=${height}&fit=crop&auto=format`;
  }
  
  // For other URLs, return as is
  return src;
};

export default {
  preloadImage,
  preloadImages,
  getOptimizedDimensions,
  getResponsiveImageUrl
};
