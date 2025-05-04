import Keycloak from 'keycloak-js';

// Create a single Keycloak instance
const keycloakConfig = {
    url: import.meta.env.VITE_KEYCLOAK_URL,
    realm: import.meta.env.VITE_KEYCLOAK_REALM,
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID
};

// Create the Keycloak instance
const keycloak = new Keycloak(keycloakConfig);

// Function to initialize Keycloak
const initKeycloak = async (onSuccess, onError) => {
    try {
        // Initialize Keycloak
        const auth = await keycloak.init({
            onLoad: 'check-sso',
            silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
            pkceMethod: 'S256',
            checkLoginIframe: false,
        });

        // Call success callback
        if (onSuccess) {
            onSuccess(auth);
        }
    } catch (error) {
        console.error('Erreur d\'initialisation Keycloak:', error);
        // Call error callback
        if (onError) {
            onError(error);
        }
    }
};

export { keycloak, initKeycloak };

