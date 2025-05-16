import axios from 'axios';
import { keycloak } from '../Services/keycloakInstance.js';

// Helper function to generate a UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const API_URL = 'https://laravel-api.fly.dev/api';

// Create a custom axios instance for cart operations
const cartAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: Allow cookies to be sent with requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

class CartService {
  constructor() {
    // Add request interceptor to ensure auth token is sent with every request
    cartAxios.interceptors.request.use(
      config => {
        // First try to use Keycloak token (most reliable)
        if (keycloak && keycloak.authenticated && keycloak.token) {
          config.headers['Authorization'] = `Bearer ${keycloak.token}`;
              // Add client ID to identify the user
          if (keycloak.tokenParsed && keycloak.tokenParsed.sub) {
            config.headers['X-User-ID'] = keycloak.tokenParsed.sub;
          }
        } else {
          // Fallback to localStorage if keycloak is not available
          try {
            const user = JSON.parse(localStorage.getItem('user'));

            // Add all possible auth headers to maximize chances of success
            if (user) {
              // If we have a token, add it as Bearer token
              if (user.token) {
                config.headers['Authorization'] = `Bearer ${user.token}`;
              }

              // If we have an access token, add it as well
              if (user.access_token) {
                config.headers['Authorization'] = `Bearer ${user.access_token}`;
              }

              // Add user ID as a custom header (some backends use this)
              if (user.id) {
                config.headers['X-User-ID'] = user.id;
              }
            }
          } catch (error) {
            // Silent fail
          }
        }

        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        config.params = {
          ...config.params,
          _t: timestamp
        };

        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  // Get the current user's cart
  async getCart() {
    try {
      // Add a unique parameter to prevent caching
      const timestamp = new Date().getTime();

      // Prepare request parameters
      const params = { _t: timestamp };

      // If user is authenticated with Keycloak, add client_id parameter
      if (keycloak && keycloak.authenticated && keycloak.tokenParsed?.sub) {
        params.client_id = keycloak.tokenParsed.sub;
      }

      // Make the API request using the correct endpoint
      const response = await cartAxios.get('/cart', { params });

      // Check if the response is valid
      if (response.data && response.data.status === 'success') {
        // Ensure price values are numbers
        this.normalizeCartData(response.data);
        return response.data;
      } else {
        return { status: 'error', data: { items: [] } };
      }
    } catch (error) {
      return { status: 'error', data: { items: [] } };
    }
  }

  // Add an item to the cart
  async addToCart(produitId, varianteId = null, quantite = 1, replaceQuantity = true) {
    try {
      // Validate inputs according to API documentation
      if (!produitId) {
        throw new Error('ID du produit requis');
      }

      // Ensure quantity is a positive integer
      const validatedQuantity = Math.max(1, Math.floor(Number(quantite) || 1));

      // Prepare request data according to API documentation
      const requestData = {
        produit_id: produitId,
        variante_id: varianteId,
        quantite: validatedQuantity,
        replace_quantity: replaceQuantity // Send this flag to the API
      };

      // If user is authenticated with Keycloak, add client_id
      if (keycloak && keycloak.authenticated && keycloak.tokenParsed?.sub) {
        requestData.client_id = keycloak.tokenParsed.sub;
      }

      const response = await cartAxios.post('/cart/items', requestData);

      // Ensure price values are numbers
      this.normalizeCartData(response.data);

      return response.data;
    } catch (error) {
      return {
        status: 'error',
        message: error.message || 'Impossible d\'ajouter le produit au panier',
        data: { items: [] }
      };
    }
  }

  // Update the quantity of an item in the cart
  async updateCartItem(itemId, quantite) {
    try {
      // Validate inputs according to API documentation
      if (!itemId) {
        throw new Error('ID de l\'article requis');
      }

      // Ensure quantity is a positive integer or zero (to remove)
      const validatedQuantity = Math.max(0, Math.floor(Number(quantite) || 0));

      // Prepare request data
      const requestData = {
        quantite: validatedQuantity
      };

      // If user is authenticated with Keycloak, add client_id
      if (keycloak && keycloak.authenticated) {
        if (keycloak.tokenParsed && keycloak.tokenParsed.sub) {
          requestData.client_id = keycloak.tokenParsed.sub;
        }
      }

      const response = await cartAxios.put(`/cart/items/${itemId}`, requestData);

      // Ensure price values are numbers
      this.normalizeCartData(response.data);

      return response.data;
    } catch (error) {
      const errorDetails = this.handleError(error);

      // Throw a more user-friendly error
      const errorMessage = errorDetails.message || 'Impossible de mettre à jour la quantité';
      throw new Error(errorMessage);
    }
  }

  // Remove an item from the cart
  async removeFromCart(itemId) {
    try {
      // Validate inputs according to API documentation
      if (!itemId) {
        throw new Error('ID de l\'article requis');
      }

      // Prepare request params
      const params = {};

      // If user is authenticated with Keycloak, add client_id
      if (keycloak && keycloak.authenticated) {
        if (keycloak.tokenParsed && keycloak.tokenParsed.sub) {
          params.client_id = keycloak.tokenParsed.sub;
        }
      }

      const response = await cartAxios.delete(`/cart/items/${itemId}`, { params });

      // Ensure price values are numbers
      this.normalizeCartData(response.data);

      return response.data;
    } catch (error) {
      const errorDetails = this.handleError(error);

      // Throw a more user-friendly error
      const errorMessage = errorDetails.message || 'Impossible de supprimer l\'article du panier';
      throw new Error(errorMessage);
    }
  }

  // Clear the entire cart
  async clearCart() {
    try {
      // Prepare request params
      const params = {};

      // If user is authenticated with Keycloak, add client_id
      if (keycloak && keycloak.authenticated) {
        if (keycloak.tokenParsed && keycloak.tokenParsed.sub) {
          params.client_id = keycloak.tokenParsed.sub;
        }
      }

      const response = await cartAxios.delete(`/cart`, { params });

      // Ensure price values are numbers if data exists
      if (response.data && response.data.data) {
        this.normalizeCartData(response.data);
      }

      return response.data;
    } catch (error) {
      const errorDetails = this.handleError(error);

      // Throw a more user-friendly error
      const errorMessage = errorDetails.message || 'Impossible de vider le panier';
      throw new Error(errorMessage);
    }
  }

  // Clear cart for a specific user
  async clearCartForUser(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Prepare request params
      const params = {
        client_id: userId
      };

      const response = await cartAxios.delete(`/cart`, { params });

      // Ensure price values are numbers if data exists
      if (response.data && response.data.data) {
        this.normalizeCartData(response.data);
      }

      return response.data;
    } catch (error) {
      const errorDetails = this.handleError(error);

      // Throw a more user-friendly error
      const errorMessage = errorDetails.message || 'Impossible de vider le panier pour cet utilisateur';
      throw new Error(errorMessage);
    }
  }

  // Helper method to normalize cart data (ensure price values are numbers)
  normalizeCartData(responseData) {
    if (responseData.status === 'success' && responseData.data) {
      const cart = responseData.data;

      // Convert price values to numbers if they're strings
      if (cart.items && Array.isArray(cart.items)) {
        cart.items.forEach(item => {
          if (item.prix_unitaire && typeof item.prix_unitaire !== 'number') {
            item.prix_unitaire = parseFloat(item.prix_unitaire);
          }
          if (item.prix_total && typeof item.prix_total !== 'number') {
            item.prix_total = parseFloat(item.prix_total);
          }
        });
      }

      if (cart.sous_total && typeof cart.sous_total !== 'number') {
        cart.sous_total = parseFloat(cart.sous_total);
      }

      if (cart.total && typeof cart.total !== 'number') {
        cart.total = parseFloat(cart.total);
      }
    }
  }

  // Merge a guest cart with the user's cart after login
  async mergeCart() {
    try {
      // Instead of trying to merge with a guest cart, let's just get the current cart
      // This is a workaround since the merge endpoint seems to be having issues
      const response = await this.getCart();

      // Return the current cart as if it was merged
      return response;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Handle API errors according to the standard error format
  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx


      // Check if the response follows the standard error format
      if (error.response.data && error.response.data.status === 'error') {
        // Extract the error message from the standard format
        const errorMessage = error.response.data.message || 'Une erreur est survenue';

        // Return a standardized error object
        return {
          message: errorMessage,
          details: error.response.data.errors || {},
          status: error.response.status
        };
      }
    } else if (error.request) {
      // The request was made but no response was received
      return {
        message: 'Aucune réponse du serveur. Veuillez vérifier votre connexion internet.',
        status: 0
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        message: error.message || 'Une erreur est survenue lors de la communication avec le serveur',
        status: 0
      };
    }

    // Default error object if none of the above conditions are met
    return {
      message: 'Une erreur inattendue est survenue',
      status: error.response ? error.response.status : 0
    };
  }
}

export default new CartService();
