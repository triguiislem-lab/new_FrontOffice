import Keycloak from 'keycloak-js';
import { createFallbackKeycloak, checkKeycloakServer } from '../utils/keycloakHelper';

// Create a single Keycloak instance
const keycloakConfig = {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'master',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'frontend'
};

// Log the Keycloak configuration only in development
if (process.env.NODE_ENV !== 'production') {
    console.log('Keycloak Config:', {
        url: keycloakConfig.url,
        realm: keycloakConfig.realm,
        clientId: keycloakConfig.clientId
    });
}

// Check if Keycloak server is reachable (only log in development)
checkKeycloakServer(keycloakConfig.url)
    .then(isReachable => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`Keycloak server is ${isReachable ? 'reachable' : 'not reachable'}`);
        }
    })
    .catch(error => {
        if (process.env.NODE_ENV !== 'production') {
            console.error('Error checking Keycloak server:', error);
        }
    });

// Create the Keycloak instance with error handling
let keycloak;
try {
    keycloak = new Keycloak(keycloakConfig);
} catch (error) {
    // Log error only in development
    if (process.env.NODE_ENV !== 'production') {
        console.error('Error creating Keycloak instance:', error);
    }
    // Create a fallback instance that won't break the app
    keycloak = createFallbackKeycloak();
}

// Track initialization state
let isInitialized = false;
let initializationPromise = null;

// Function to initialize Keycloak with improved error handling
const initKeycloak = async (onSuccess, onError) => {
    // If already initialized, return the authenticated state
    if (isInitialized) {
        console.log('Keycloak already initialized, skipping duplicate initialization');
        if (onSuccess) {
            onSuccess(keycloak.authenticated || false);
        }
        return;
    }

    // If initialization is in progress, wait for it to complete
    if (initializationPromise) {
        console.log('Keycloak initialization already in progress, waiting for it to complete');
        try {
            const auth = await initializationPromise;
            if (onSuccess) {
                onSuccess(auth);
            }
            return;
        } catch (error) {
            console.error('Error while waiting for Keycloak initialization:', error);
            if (onError) {
                onError(error);
            }
            return;
        }
    }

    // Start initialization with timeout
    const INIT_TIMEOUT = 10000; // 10 seconds timeout

    initializationPromise = (async () => {
        try {
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Keycloak initialization timed out')), INIT_TIMEOUT);
            });

            // Race between initialization and timeout
            const auth = await Promise.race([
                keycloak.init({
                    onLoad: 'check-sso',
                    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
                    pkceMethod: 'S256',
                    checkLoginIframe: false,
                    enableLogging: true, // Enable logging for debugging
                }),
                timeoutPromise
            ]);

            // Mark as initialized
            isInitialized = true;
            console.log('Keycloak initialized successfully:', auth);

            // Call success callback
            if (onSuccess) {
                onSuccess(auth);
            }

            return auth;
        } catch (error) {
            console.error('Keycloak initialization error:', error);
            // Reset initialization promise so we can try again
            initializationPromise = null;

            // Call error callback with more information
            if (onError) {
                // Provide more context about the error
                const enhancedError = {
                    originalError: error,
                    message: 'Failed to initialize Keycloak authentication',
                    keycloakConfig: {
                        url: keycloakConfig.url,
                        realm: keycloakConfig.realm,
                        clientId: keycloakConfig.clientId
                    },
                    timestamp: new Date().toISOString()
                };
                onError(enhancedError);
            }

            // Return false instead of throwing to prevent app crashes
            return false;
        }
    })();

    return initializationPromise;
};

export { keycloak, initKeycloak };

