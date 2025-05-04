import React from 'react';
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import routes from "@/routes";
// Import bootstrap JS only when needed, not on initial load
// import "bootstrap/dist/js/bootstrap.bundle.min.js";

import { AuthProvider } from './Contexts/AuthContext.jsx';
import { CartProvider } from './Contexts/CartContext.jsx';
import { WishlistProvider } from './Contexts/WishlistContext.jsx';
import { lazyWithPreload } from './utils/lazyLoader.jsx';
import Layout from './Components/Layout';

// Lazy load components that aren't in the main routes file with preloading
const AccesRefuse = lazyWithPreload(
  () => import('./pages/AccesRefuse.jsx'),
  { fallbackMessage: "Chargement..." }
);


function App() {
  const { pathname } = useLocation();

  // Dynamically load Bootstrap JS when the app is mounted
  React.useEffect(() => {
    // Load Bootstrap JS only after the app is mounted and only the necessary components
    const loadBootstrap = async () => {
      try {
        // Use a more targeted import to load only what's needed
        const bootstrap = await import("bootstrap/dist/js/bootstrap.esm.min.js");
        console.log("Bootstrap JS loaded successfully");

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
        console.error("Failed to load Bootstrap JS:", err);
      }
    };

    // Use requestIdleCallback to load Bootstrap during browser idle time
    if (window.requestIdleCallback) {
      window.requestIdleCallback(loadBootstrap);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(loadBootstrap, 200);
    }
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Layout>
            <Routes>
              {/* Routes publiques */}
              <Route
                path="/acces-refuse"
                element={<AccesRefuse />}
              />

              {/* Routes from routes.jsx (already wrapped with Suspense) */}
              {routes.map(
                ({ path, element }, key) =>
                  element && <Route key={key} exact path={path} element={element} />
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
