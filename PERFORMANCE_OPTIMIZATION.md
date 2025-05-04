# Performance Optimization Guide

This document outlines the performance optimizations implemented in the project and provides guidelines for maintaining good performance.

## Recent Optimizations

### 1. Image Loading

- Implemented `EnhancedLazyImage` component for optimized image loading with consistent loading animations
- Added proper lazy loading with the `loading="lazy"` attribute
- Implemented batch image loading to reduce the number of API calls
- Added proper error handling for failed image loads
- Added image preloading for critical images (like carousel first slide)

### 2. API Calls and Caching

- Implemented `apiService` with caching capabilities
- Added batch API requests to reduce the number of network requests
- Implemented longer cache durations for static resources like images
- Added proper error handling for API calls
- Created `apiOptimizer` service for request batching, deduplication, and prioritization

### 3. Code Splitting and Lazy Loading

- Implemented advanced lazy loading with preloading capabilities
- Created `lazyLoader` utility for consistent lazy loading across the application
- Added preloading of critical components during browser idle time
- Optimized route-based code splitting

### 4. CSS and JS Optimization

- Optimized Bootstrap loading to prevent render blocking
- Implemented selective loading of only necessary Bootstrap components
- Used `requestIdleCallback` to load non-critical resources during browser idle time
- Dynamically loaded CSS files to prevent render blocking
- Implemented parallel loading of CSS files

### 5. Carousel Optimization

- Created `OptimizedCarousel` component with performance optimizations
- Implemented progressive image loading for carousel slides
- Added preloading of carousel images
- Reduced animation work for better performance

### 6. Loading Animations

- Standardized loading animations across the application
- Implemented skeleton loading for better user experience
- Created a central configuration for loading animations in `src/utils/loadingConfig.js`

## Best Practices

### Image Optimization

1. **Always use `EnhancedLazyImage` for image loading**
   ```jsx
   <EnhancedLazyImage
     src={imageUrl}
     alt="Description"
     className="w-full h-48"
     fallbackSrc="/placeholder-image.jpg"
     spinnerVariant="circle"
   />
   ```

2. **Batch image loading for multiple images**
   ```jsx
   const productIds = products.map(product => product.id);
   const imagesMap = await apiService.getBatchProductImages(productIds);
   ```

3. **Preload critical images**
   ```jsx
   // Preload first image immediately
   if (slides[0].primary_image_url) {
     const firstImg = new Image();
     firstImg.src = slides[0].primary_image_url;
   }

   // Preload remaining images during idle time
   if (window.requestIdleCallback && slides.length > 1) {
     window.requestIdleCallback(() => {
       slides.slice(1).forEach(slide => {
         if (slide.primary_image_url) {
           const img = new Image();
           img.src = slide.primary_image_url;
         }
       });
     });
   }
   ```

### API Calls

1. **Use apiService for all API calls**
   ```jsx
   import apiService from "../utils/apiService";

   // With caching
   const data = await apiService.get('/endpoint', params);

   // Without caching
   const data = await apiService.get('/endpoint', params, { useCache: false });
   ```

2. **Use apiOptimizer for advanced API optimization**
   ```jsx
   import apiOptimizer from "../utils/apiOptimizer";

   // Queue a request with priority
   const data = await apiOptimizer.queueRequest('/endpoint', params, {
     priority: 2,
     useCache: true,
     cacheDuration: 300
   });

   // Prefetch data that will be needed soon
   apiOptimizer.prefetchData([
     { endpoint: '/products', params: { category: 'popular' } },
     { endpoint: '/categories', params: { featured: true } }
   ]);
   ```

3. **Set appropriate cache durations**
   ```jsx
   // For frequently changing data (short cache)
   const cartData = await apiService.get('/cart', {}, {
     useCache: true,
     cacheDuration: 60 // 1 minute
   });

   // For static data (long cache)
   const categoriesData = await apiService.get('/categories', {}, {
     useCache: true,
     cacheDuration: 3600 // 1 hour
   });
   ```

### Component Loading

1. **Use standardized loading components**
   ```jsx
   import LoadingSpinner from "../Components/LoadingSpinner";
   import { COMPONENT_LOADING, LOADING_MESSAGES } from "../utils/loadingConfig";

   // For page loading
   <LoadingSpinner
     {...COMPONENT_LOADING.pageLoading}
     message={LOADING_MESSAGES.page}
   />

   // For product loading
   <LoadingSpinner
     {...COMPONENT_LOADING.productCard}
     message={LOADING_MESSAGES.products}
   />
   ```

### Code Splitting and Lazy Loading

1. **Use lazyWithPreload for component loading**
   ```jsx
   import { lazyWithPreload } from "../utils/lazyLoader.jsx";

   // Define a lazy-loaded component with preloading capability
   const MyComponent = lazyWithPreload(
     () => import('./MyComponent'),
     { fallbackMessage: "Chargement..." }
   );

   // In render (no need for Suspense)
   <MyComponent />

   // Preload the component when needed
   MyComponent.preload();
   ```

2. **Preload components during idle time**
   ```jsx
   import { preloadMultipleDuringIdle } from "../utils/lazyLoader.jsx";

   // Preload multiple components during browser idle time
   preloadMultipleDuringIdle([
     () => import('./HomePage'),
     () => import('./ProductsPage')
   ]);
   ```

### CSS and JS Loading

1. **Load CSS files dynamically and in parallel**
   ```jsx
   // Function to load CSS asynchronously
   const loadCSS = (href) => {
     return new Promise((resolve, reject) => {
       const link = document.createElement('link');
       link.href = href;
       link.rel = 'stylesheet';
       link.onload = () => resolve(link);
       link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
       document.head.appendChild(link);
     });
   };

   // Load CSS files in parallel
   const loadAllCSS = async () => {
     try {
       const cssFiles = [
         loadCSS('https://cdn.example.com/css/style1.css'),
         loadCSS('https://cdn.example.com/css/style2.css')
       ];
       await Promise.all(cssFiles);
     } catch (error) {
       console.error('Error loading CSS:', error);
     }
   };

   // Use requestIdleCallback to load CSS during browser idle time
   if (window.requestIdleCallback) {
     window.requestIdleCallback(loadAllCSS);
   } else {
     setTimeout(loadAllCSS, 100);
   }
   ```

2. **Load JS libraries selectively and during idle time**
   ```jsx
   // Load only necessary Bootstrap components
   const loadBootstrap = async () => {
     try {
       const bootstrap = await import("bootstrap/dist/js/bootstrap.esm.min.js");

       // Initialize only the components we need
       const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
       if (tooltipTriggerList.length > 0) {
         tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
       }
     } catch (err) {
       console.error("Failed to load Bootstrap JS:", err);
     }
   };

   // Use requestIdleCallback
   if (window.requestIdleCallback) {
     window.requestIdleCallback(loadBootstrap);
   } else {
     setTimeout(loadBootstrap, 200);
   }
   ```

## Performance Monitoring

### Key Metrics to Monitor

1. **First Contentful Paint (FCP)**: Time until the first content is rendered
2. **Largest Contentful Paint (LCP)**: Time until the largest content element is rendered
3. **Time to Interactive (TTI)**: Time until the page becomes fully interactive
4. **Total Blocking Time (TBT)**: Total time the main thread is blocked
5. **Cumulative Layout Shift (CLS)**: Measure of visual stability

### Tools for Monitoring

1. **Lighthouse**: Run Lighthouse audits in Chrome DevTools
2. **Chrome DevTools Performance tab**: Analyze runtime performance
3. **Network tab**: Monitor network requests and identify bottlenecks

## Common Performance Issues to Avoid

1. **Unoptimized images**: Always use proper image optimization
2. **Too many API calls**: Use batch requests and caching
3. **Render blocking resources**: Load non-critical resources asynchronously
4. **Unnecessary re-renders**: Use React.memo, useMemo, and useCallback
5. **Large bundle sizes**: Use code splitting and lazy loading
6. **Inefficient list rendering**: Use virtualization for long lists
7. **Layout shifts**: Set proper dimensions for images and elements

## Future Optimizations

1. **Implement server-side rendering (SSR)** for critical pages
2. **Add service workers** for offline support and caching
3. **Implement HTTP/2** for multiplexed connections
4. **Add resource hints** (preload, prefetch, preconnect)
5. **Optimize third-party scripts** loading
