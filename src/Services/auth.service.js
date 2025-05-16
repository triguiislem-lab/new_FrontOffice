import axios from 'axios';
import { keycloak } from './keycloakInstance.js';

const API_URL = import.meta.env.VITE_API_URL;

// Create a custom axios instance for auth operations
const authAxios = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add request interceptor to include authentication token
authAxios.interceptors.request.use(
    config => {
        // Add authentication token if available
        if (keycloak && keycloak.authenticated && keycloak.token) {
            config.headers.Authorization = `Bearer ${keycloak.token}`;
        } else {

            // Try to get user from localStorage as fallback
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    if (user && user.token) {
                        config.headers.Authorization = `Bearer ${user.token}`;
                    }
                }
            } catch (error) {
                // Silent fail
            }
        }

        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

class AuthService {
    // Vérifie les tokens Keycloak auprès de notre backend
    async verifyTokens(tokens) {
        try {
            const response = await authAxios.post(`/auth/verify`, tokens);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Récupère les informations de l'utilisateur connecté
    async getCurrentUser() {
        try {
            // Ensure token is fresh
            if (keycloak && keycloak.authenticated) {
                try {
                    await keycloak.updateToken(30);
                } catch (refreshError) {
                    // Silent fail
                }
            }

            const response = await authAxios.get(`/auth/user`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Gestion uniformisée des erreurs
    handleError(error) {
        if (error.response) {
            return {
                status: 'error',
                message: error.response.data?.message || 'Une erreur est survenue',
                statusCode: error.response.status
            };
        } else if (error.request) {
            return {
                status: 'error',
                message: 'Aucune réponse du serveur. Veuillez vérifier votre connexion internet.',
                statusCode: 0
            };
        } else {
            return {
                status: 'error',
                message: error.message || 'Une erreur est survenue',
                statusCode: 0
            };
        }
    }
}
export default new AuthService();