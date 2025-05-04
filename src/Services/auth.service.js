import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;
class AuthService {
    constructor() { 
        // Important : Permet d'envoyer les cookies avec les requêtes
        axios.defaults.withCredentials = true;
    }

    // Vérifie les tokens Keycloak auprès de notre backend
    async verifyTokens(tokens) {
        try {
            const response = await axios.post(`${API_URL}/auth/verify`, tokens);
            return response.data; 
        } catch (error) {
            throw this.handleError(error);
        }
    }   

    // Récupère les informations de l'utilisateur connecté
    async getCurrentUser() {
        try {
            const response = await axios.get(`${API_URL}/auth/user`);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    // Gestion uniformisée des erreurs
    handleError(error) {
        return {
            message: error.response?.data?.message || 'Une erreur est survenue',
        };
    }
}
export default new AuthService();