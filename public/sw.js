/**
 * Service Worker for caching and offline support
 */

// Cache names
const CACHE_NAME = 'frontoffice-cache-v1';
const STATIC_CACHE_NAME = 'frontoffice-static-v1';
const DYNAMIC_CACHE_NAME = 'frontoffice-dynamic-v1';
const API_CACHE_NAME = 'frontoffice-api-v1';
const IMAGE_CACHE_NAME = 'frontoffice-images-v1';

// Resources to cache immediately (static assets)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
];

// API URL patterns to cache
const API_URL_PATTERNS = [
  /^https:\/\/laravel-api\.fly\.dev\/api\/categories/,
  /^https:\/\/laravel-api\.fly\.dev\/api\/products/,
  /^https:\/\/laravel-api\.fly\.dev\/api\/brands/,
];

// Image URL patterns to cache
const IMAGE_URL_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|svg)$/i,
  /^https:\/\/laravel-api\.fly\.dev\/api\/images/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName !== IMAGE_CACHE_NAME
            ) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper function to determine cache name based on request
function getCacheName(request) {
  const url = new URL(request.url);
  
  // Check if it's an API request
  if (API_URL_PATTERNS.some(pattern => pattern.test(url.href))) {
    return API_CACHE_NAME;
  }
  
  // Check if it's an image request
  if (IMAGE_URL_PATTERNS.some(pattern => pattern.test(url.href))) {
    return IMAGE_CACHE_NAME;
  }
  
  // Default to dynamic cache
  return DYNAMIC_CACHE_NAME;
}

// Helper function to determine if a request should be cached
function shouldCache(request) {
  // Don't cache POST requests
  if (request.method !== 'GET') {
    return false;
  }
  
  const url = new URL(request.url);
  
  // Don't cache authentication requests
  if (url.pathname.includes('/auth/') || url.pathname.includes('/login')) {
    return false;
  }
  
  // Don't cache cart or checkout requests
  if (url.pathname.includes('/cart') || url.pathname.includes('/checkout')) {
    return false;
  }
  
  return true;
}

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('laravel-api.fly.dev')) {
    return;
  }
  
  // Handle API requests with network-first strategy
  if (API_URL_PATTERNS.some(pattern => pattern.test(event.request.url))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the response if it's valid and should be cached
          if (response.ok && shouldCache(event.request)) {
            caches.open(API_CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle image requests with cache-first strategy
  if (IMAGE_URL_PATTERNS.some(pattern => pattern.test(event.request.url))) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then((response) => {
              // Clone the response
              const responseToCache = response.clone();
              
              // Cache the response if it's valid
              if (response.ok) {
                caches.open(IMAGE_CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              
              return response;
            });
        })
    );
    return;
  }
  
  // For other requests, use stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response immediately if available
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Cache the network response if it's valid and should be cached
            if (networkResponse.ok && shouldCache(event.request)) {
              const cacheName = getCacheName(event.request);
              caches.open(cacheName)
                .then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                });
            }
            
            return networkResponse;
          })
          .catch(() => {
            // If both cache and network fail, return a fallback
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            
            return new Response('Network error occurred', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
        
        return cachedResponse || fetchPromise;
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  } else if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }
});

// Helper function to sync favorites
async function syncFavorites() {
  try {
    const db = await openDB();
    const offlineFavorites = await db.getAll('offlineFavorites');
    
    for (const item of offlineFavorites) {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      await db.delete('offlineFavorites', item.id);
    }
  } catch (error) {
    console.error('Error syncing favorites:', error);
  }
}

// Helper function to sync cart
async function syncCart() {
  try {
    const db = await openDB();
    const offlineCart = await db.getAll('offlineCart');
    
    for (const item of offlineCart) {
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      await db.delete('offlineCart', item.id);
    }
  } catch (error) {
    console.error('Error syncing cart:', error);
  }
}

// Helper function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('frontoffice-db', 1);
    
    request.onerror = () => {
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('offlineFavorites')) {
        db.createObjectStore('offlineFavorites', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('offlineCart')) {
        db.createObjectStore('offlineCart', { keyPath: 'id' });
      }
    };
  });
}
