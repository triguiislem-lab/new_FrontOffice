/**
 * Helper functions for Keycloak integration
 */

/**
 * Adds necessary frame-ancestors to allow Keycloak iframes to work
 * This is a workaround for Content Security Policy issues
 */
export const setupKeycloakFraming = () => {
  try {
    // Create a meta tag for frame-ancestors
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = "frame-ancestors 'self' https://keycloak-prod.1squalq6nmfj.eu-de.codeengine.appdomain.cloud";
    
    // Add it to the head
    document.head.appendChild(meta);
    
    console.log('Keycloak framing setup complete');
    return true;
  } catch (error) {
    console.error('Failed to setup Keycloak framing:', error);
    return false;
  }
};

/**
 * Checks if Keycloak server is reachable
 * @returns {Promise<boolean>} True if server is reachable
 */
export const checkKeycloakServer = async (url) => {
  try {
    // Use a simple HEAD request to check if the server is reachable
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // This is needed for CORS restrictions
    });
    
    // If we get here, the server is reachable (no-cors won't give status)
    return true;
  } catch (error) {
    console.error('Keycloak server check failed:', error);
    return false;
  }
};

/**
 * Creates a fallback Keycloak instance that won't break the app
 */
export const createFallbackKeycloak = () => {
  return {
    authenticated: false,
    login: () => console.warn('Keycloak not properly initialized. Login unavailable.'),
    logout: () => console.warn('Keycloak not properly initialized. Logout unavailable.'),
    register: () => console.warn('Keycloak not properly initialized. Register unavailable.'),
    updateToken: () => Promise.resolve(false),
    init: () => Promise.resolve(false)
  };
};

export default {
  setupKeycloakFraming,
  checkKeycloakServer,
  createFallbackKeycloak
};
