import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../Services/auth.service.js';
import { keycloak, initKeycloak } from '../Services/keycloakInstance.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    // State to track initialization errors
    const [initError, setInitError] = useState(null);

    useEffect(() => {
        // Set loading state
        setLoading(true);

        // Function to handle initialization with retry logic
        const initializeAuth = async (retryCount = 0) => {
            const MAX_RETRIES = 2;
            const RETRY_DELAY = 2000; // 2 seconds

            try {
                // Initialize Keycloak with callbacks
                await initKeycloak(
                    // Success callback
                    async (auth) => {
                        console.log('Keycloak initialized successfully, auth state:', auth);
                        setAuthenticated(auth);
                        setInitError(null);

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
                                // Continue even if token verification fails
                            }
                        }

                        // Set loading to false after a short delay
                        setTimeout(() => {
                            setLoading(false);
                        }, 500);
                    },
                    // Error callback
                    (error) => {
                        console.error('Keycloak initialization error:', error);
                        setInitError(error);
                        setAuthenticated(false);

                        // Retry logic
                        if (retryCount < MAX_RETRIES) {
                            console.log(`Retrying Keycloak initialization (${retryCount + 1}/${MAX_RETRIES})...`);
                            setTimeout(() => initializeAuth(retryCount + 1), RETRY_DELAY);
                        } else {
                            console.error('Max retries reached, giving up on Keycloak initialization');
                            setTimeout(() => {
                                setLoading(false);
                            }, 500);
                        }
                    }
                );
            } catch (error) {
                console.error('Unexpected error during auth initialization:', error);
                setInitError(error);
                setAuthenticated(false);
                setTimeout(() => {
                    setLoading(false);
                }, 500);
            }
        };

        // Start initialization
        initializeAuth();

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
        error: initError,
        hasError: !!initError,
        refreshToken: async () => {
            try {
                const refreshed = await keycloak.updateToken(70);
                if (refreshed) {
                    setAuthenticated(true);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Erreur lors du rafraîchissement du token:', error);
                setAuthenticated(false);

                // Only redirect to login if it's a token expiration issue
                if (error && error.error === 'invalid_token') {
                    try {
                        keycloak.login();
                    } catch (loginError) {
                        console.error('Failed to redirect to login:', loginError);
                    }
                }

                return false;
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
