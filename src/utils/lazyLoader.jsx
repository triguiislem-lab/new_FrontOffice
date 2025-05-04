import React, { lazy, Suspense } from 'react';
import LoadingSpinner from '../Components/LoadingSpinner';
import { COMPONENT_LOADING, LOADING_MESSAGES } from './loadingConfig';

/**
 * Creates a lazy-loaded component with a loading fallback
 * 
 * @param {Function} importFunc - The import function for the component
 * @param {Object} options - Options for the lazy loading
 * @param {string} options.fallbackMessage - Message to display while loading
 * @param {boolean} options.fullScreen - Whether to display the loading spinner full screen
 * @param {string} options.spinnerVariant - The spinner variant to use
 * @param {string} options.spinnerSize - The spinner size to use
 * @returns {React.Component} - The lazy-loaded component with Suspense
 */
export const lazyWithPreload = (importFunc, options = {}) => {
  const {
    fallbackMessage = LOADING_MESSAGES.page,
    fullScreen = false,
    spinnerVariant = COMPONENT_LOADING.pageLoading.variant,
    spinnerSize = COMPONENT_LOADING.pageLoading.size,
  } = options;

  const LazyComponent = lazy(importFunc);
  
  // Create a preloadable component
  const PreloadableLazyComponent = (props) => (
    <Suspense 
      fallback={
        <div className={`flex items-center justify-center ${fullScreen ? 'fixed inset-0 bg-white bg-opacity-80 z-50' : 'h-full w-full py-8'}`}>
          <LoadingSpinner 
            variant={spinnerVariant}
            size={spinnerSize}
            message={fallbackMessage}
          />
        </div>
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
  
  // Add preload method to the component
  PreloadableLazyComponent.preload = importFunc;
  
  return PreloadableLazyComponent;
};

/**
 * Preloads a component during browser idle time
 * 
 * @param {Function} importFunc - The import function for the component
 */
export const preloadDuringIdle = (importFunc) => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      importFunc();
    });
  } else {
    setTimeout(() => {
      importFunc();
    }, 200);
  }
};

/**
 * Preloads multiple components during browser idle time
 * 
 * @param {Array<Function>} importFuncs - Array of import functions
 */
export const preloadMultipleDuringIdle = (importFuncs) => {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      importFuncs.forEach(importFunc => {
        importFunc();
      });
    });
  } else {
    setTimeout(() => {
      importFuncs.forEach(importFunc => {
        importFunc();
      });
    }, 200);
  }
};

export default {
  lazyWithPreload,
  preloadDuringIdle,
  preloadMultipleDuringIdle
};
