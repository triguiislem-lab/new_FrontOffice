/**
 * Service Worker Registration
 * 
 * This file handles the registration of the service worker
 * for offline support and caching.
 */

// Check if service workers are supported
const isServiceWorkerSupported = 'serviceWorker' in navigator;

/**
 * Register the service worker
 * 
 * @returns {Promise} - Promise that resolves when the service worker is registered
 */
export function register() {
  if (isServiceWorkerSupported) {
    const swUrl = `${window.location.origin}/sw.js`;
    
    return navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available, show notification
                  console.log('New content is available, please refresh.');
                  
                  // Dispatch event for the app to show update notification
                  window.dispatchEvent(new CustomEvent('swUpdate'));
                } else {
                  // Content is cached for offline use
                  console.log('Content is cached for offline use.');
                }
              }
            };
          }
        };
        
        return registration;
      })
      .catch(error => {
        console.error('Error during service worker registration:', error);
      });
  }
  
  return Promise.resolve();
}

/**
 * Unregister the service worker
 * 
 * @returns {Promise} - Promise that resolves when the service worker is unregistered
 */
export function unregister() {
  if (isServiceWorkerSupported) {
    return navigator.serviceWorker.ready
      .then(registration => {
        return registration.unregister();
      })
      .catch(error => {
        console.error('Error during service worker unregistration:', error);
      });
  }
  
  return Promise.resolve();
}

/**
 * Check if the app is installed (PWA)
 * 
 * @returns {boolean} - Whether the app is installed
 */
export function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

/**
 * Request to sync data when online
 * 
 * @param {string} tag - Sync tag
 * @returns {Promise} - Promise that resolves when the sync is registered
 */
export function requestSync(tag) {
  if (isServiceWorkerSupported && 'SyncManager' in window) {
    return navigator.serviceWorker.ready
      .then(registration => {
        return registration.sync.register(tag);
      })
      .catch(error => {
        console.error('Error registering sync:', error);
      });
  }
  
  return Promise.resolve();
}

export default {
  register,
  unregister,
  isInstalled,
  requestSync,
  isSupported: isServiceWorkerSupported
};
