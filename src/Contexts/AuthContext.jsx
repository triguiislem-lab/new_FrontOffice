import { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../Services/auth.service.js';
import { keycloak, initKeycloak } from '../Services/keycloakInstance.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        // Set loading state
        setLoading(true);

        // Initialize Keycloak with callbacks
        initKeycloak(
            // Success callback
            async (auth) => {
                setAuthenticated(auth);

                if (auth && keycloak.token) {
                    const tokens = {
                        access_token: keycloak.token,
                        refresh_token: keycloak.refreshToken,
                        id_token: keycloak.idToken
                    };
                    try {
                        const userData = await AuthService.verifyTokens(tokens);
                        setUser(userData);
                    } catch (error) {
                        console.error('Error verifying tokens:', error);
                    }
                }

                // Set loading to false after a short delay
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            },
            // Error callback
            (error) => {
                console.error('Erreur d\'initialisation Keycloak:', error);
                setAuthenticated(false);
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            }
        );

        // Set up token refresh
        const refreshInterval = setInterval(() => {
            if (keycloak.authenticated) {
                keycloak.updateToken(70).then((refreshed) => {
                    if (refreshed) {
                        setAuthenticated(true);
                    }
                }).catch(() => {
                    setAuthenticated(false);
                });
            }
        }, 60000);

        // Add event listeners for auth state changes
        keycloak.onAuthSuccess = () => setAuthenticated(true);
        keycloak.onAuthError = () => setAuthenticated(false);
        keycloak.onAuthLogout = () => setAuthenticated(false);

        return () => {
            clearInterval(refreshInterval);
        };
    }, []); // Empty dependency array - only run once

    const value = {
        keycloak,
        user,
        loading,
        isAuthenticated: authenticated,
        refreshToken: async () => {
            try {
                const refreshed = await keycloak.updateToken(70);
                if (refreshed) {
                    setAuthenticated(true);
                }
            } catch (error) {
                console.error('Erreur lors du rafraîchissement du token:', error);
                setAuthenticated(false);
                keycloak.login();
            }
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    return context;
};
