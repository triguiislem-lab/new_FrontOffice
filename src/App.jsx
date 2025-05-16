import React from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import routes from "./routes";
// Import bootstrap JS only when needed, not on initial load
// import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { AuthProvider } from './Contexts/AuthContext.jsx';
import { CartProvider } from './Contexts/CartContext.jsx';
import { WishlistProvider } from './Contexts/WishlistContext.jsx';
import { lazyWithPreload } from './utils/lazyLoader.jsx';
import Layout from './Components/Layout';
import ResourceHints from './Components/ResourceHints';
import { debounce } from './utils/performanceOptimizer';

// Lazy load components that aren't in the main routes file with preloading
const AccesRefuse = lazyWithPreload(
  () => import('./pages/AccesRefuse.jsx'),
  { fallbackMessage: "Chargement..." }
);


function App() {
  const { pathname } = useLocation();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  // Handle online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add resource hints for better performance
  React.useEffect(() => {
    // Add meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#A67B5B';
      document.head.appendChild(meta);
    }
  }, []);

  // Dynamically load Bootstrap JS when the app is mounted
  React.useEffect(() => {
    // Load Bootstrap JS only after the app is mounted and only the necessary components
    const loadBootstrap = async () => {
      try {
        // Use a more targeted import to load only what's needed
        const bootstrap = await import("bootstrap/dist/js/bootstrap.esm.min.js");

        // Initialize only the components we need
        // This prevents unnecessary initialization of all Bootstrap components
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        if (tooltipTriggerList.length > 0) {
          tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));
        }

        const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
        if (popoverTriggerList.length > 0) {
          popoverTriggerList.forEach(el => new bootstrap.Popover(el));
        }
      } catch (err) {
        // Silent fail
      }
    };

    // Use requestIdleCallback to load Bootstrap during browser idle time
    if (window.requestIdleCallback) {
      window.requestIdleCallback(loadBootstrap);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(loadBootstrap, 500);
    }
  }, []);

  // Optimize scroll performance
  React.useEffect(() => {
    const handleScroll = debounce(() => {
      // Add any scroll-based optimizations here
      const scrollY = window.scrollY;

      // Lazy load images that are about to come into view
      const lazyImages = document.querySelectorAll('img[loading="lazy"]');
      lazyImages.forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.top < window.innerHeight + 500) {
          img.loading = 'eager';
        }
      });
    }, 100);

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Show offline notification if user is offline
  const offlineNotification = !isOnline && (
    <div className="fixed bottom-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.</span>
      </div>
      <button
        className="ml-4 bg-white text-red-500 px-3 py-1 rounded-md text-sm font-medium"
        onClick={() => window.location.reload()}
      >
        Réessayer
      </button>
    </div>
  );

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          {/* Add ResourceHints component for better performance */}
          <ResourceHints />

          <Layout>
            {offlineNotification}

            <Routes>
              {/* Routes publiques */}
              <Route
                path="/acces-refuse"
                element={<AccesRefuse />}
              />

              {/* Routes from routes.jsx (already wrapped with Suspense) */}
              {routes.map(
                ({ path, element, onMouseEnter }, key) =>
                  element && (
                    <Route
                      key={key}
                      exact
                      path={path}
                      element={element}
                    />
                  )
              )}

              {/* Default route */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Layout>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
