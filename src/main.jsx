/**
=========================================================
* Material Tailwind Kit React - v2.1.0
=========================================================
* Product Page: https://www.creative-tim.com/product/material-tailwind-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/material-tailwind-dashboard-react/blob/main/LICENSE.md)
* Coded by Creative Tim
=========================================================
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import React from "react";
import ReactDOM from "react-dom/client";
import App from './App.jsx';
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@material-tailwind/react";
import theme from "./theme";
import { initPerformanceMonitoring, optimizeResourceLoading } from "./utils/performanceOptimizer";
import * as serviceWorkerRegistration from './utils/serviceWorkerRegistration';
import { setupKeycloakFraming } from "./utils/keycloakHelper";
import "./style/tailwind.css";
import "./style/animations.css";
import "./style/global.css";
import "./style/buttons.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./style/carousel.css";

// Setup Keycloak framing to allow iframes
setupKeycloakFraming();

// Initialize performance monitoring and optimization
if (process.env.NODE_ENV === 'production') {
  // Initialize performance monitoring
  initPerformanceMonitoring();

  // Optimize resource loading
  optimizeResourceLoading();
}

// Create a custom error boundary for the entire application
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">Oops! Une erreur est survenue</h2>
            <p className="text-gray-600 mb-4">
              Nous sommes désolés pour ce désagrément. Veuillez rafraîchir la page ou réessayer plus tard.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-[#A67B5B] text-white rounded hover:bg-[#8B5A2B] transition-colors"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Temporarily disable StrictMode to fix Keycloak initialization issue
// const AppContainer = process.env.NODE_ENV === 'development'
//   ? React.StrictMode
//   : React.Fragment;
const AppContainer = React.Fragment;

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppContainer>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider value={theme}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </AppContainer>
);

// Register service worker for production
if (process.env.NODE_ENV === 'production') {
  // Register the service worker after the app has loaded
  window.addEventListener('load', () => {
    serviceWorkerRegistration.register();
  });
}
