import axios from 'axios';
import { keycloak } from '../services/keycloakInstance.js';

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
          console.log('Using Keycloak token for cart authorization');

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
                console.log('Using localStorage user token for cart authorization');
              }

              // If we have an access token, add it as well
              if (user.access_token) {
                config.headers['Authorization'] = `Bearer ${user.access_token}`;
                console.log('Using localStorage access token for cart authorization');
              }

              // Add user ID as a custom header (some backends use this)
              if (user.id) {
                config.headers['X-User-ID'] = user.id;
              }
            }
          } catch (error) {
            console.error('Error parsing user from localStorage:', error);
          }
        }

        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        config.params = {
          ...config.params,
          _t: timestamp
        };

        console.log('Cart request headers:', config.headers);

        return config;
      },
      error => {
        return Promise.reject(error);
      }
    );
  }

  // Get the current user's cart
  async getCart(retryCount = 0) {
    try {
      console.log('Getting cart, retry count:', retryCount);

      // Add a unique parameter to prevent caching
      const timestamp = new Date().getTime();

      // Prepare request parameters
      const params = { _t: timestamp };

      // If user is authenticated with Keycloak, add client_id parameter
      if (keycloak && keycloak.authenticated) {
        if (keycloak.tokenParsed && keycloak.tokenParsed.sub) {
          params.client_id = keycloak.tokenParsed.sub;
          console.log('Adding client_id to cart request:', keycloak.tokenParsed.sub);
        }

        // Also add user email if available
        if (keycloak.tokenParsed && keycloak.tokenParsed.email) {
          params.email = keycloak.tokenParsed.email;
          console.log('Adding email to cart request:', keycloak.tokenParsed.email);
        }
      }

      // Make the API request using the correct endpoint
      const response = await cartAxios.get('/cart', { params });

      console.log('Cart API response:', response.data);

      // Check if the response is valid
      if (response.data && response.data.status === 'success') {
        // Ensure price values are numbers
        this.normalizeCartData(response.data);

        // Check if the cart is empty but we're authenticated
        if (keycloak && keycloak.authenticated &&
            response.data.data && response.data.data.items &&
            response.data.data.items.length === 0 && retryCount < 2) {
          console.log(`Cart is empty for authenticated user. Retry attempt ${retryCount + 1}/2`);

          // Wait a moment and retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          return this.getCart(retryCount + 1);
        }

        return response.data;
      } else {
        console.warn('Invalid cart response format:', response.data);
        return { status: 'error', data: { items: [] } };
      }
    } catch (error) {
      this.handleError(error);

      // If we get a 401 Unauthorized error, the session might have expired
      if (error.response && error.response.status === 401 && retryCount < 2) {
        console.log('Unauthorized error when fetching cart. Retrying...');

        // Wait a moment and retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.getCart(retryCount + 1);
      }

      return { status: 'error', data: { items: [] } };
    }
  }

  // Add an item to the cart
  async addToCart(produitId, varianteId = null, quantite = 1, replaceQuantity = true) {
    try {
      console.log('CartService.addToCart called with:', { produitId, varianteId, quantite, replaceQuantity });

      // Validate inputs according to API documentation
      if (!produitId) {
        throw new Error('ID du produit requis');
      }

      // Ensure quantity is a positive integer
      const validatedQuantity = Math.max(1, Math.floor(Number(quantite) || 1));

      // Always try to replace the quantity instead of adding to it:
      // 1. Get the current cart
      // 2. Find the item if it exists
      // 3. If it exists, update it with the new quantity
      // 4. If it doesn't exist, add it normally
      try {
        // Get the current cart
        const cartResponse = await this.getCart();

        if (cartResponse.status === 'success' && cartResponse.data && cartResponse.data.items) {
          // Find the item in the cart
          const existingItem = cartResponse.data.items.find(item =>
            item.produit.id.toString() === produitId.toString() &&
            (varianteId
              ? (item.variante && item.variante.id.toString() === varianteId.toString())
              : !item.variante)
          );

          if (existingItem) {
            console.log('Found existing item in cart, updating quantity:', existingItem);

            // If we want to replace, use the new quantity
            // If we don't want to replace, add the quantities
            const newQuantity = replaceQuantity
              ? validatedQuantity
              : existingItem.quantite + validatedQuantity;

            console.log(`Updating quantity from ${existingItem.quantite} to ${newQuantity}`);

            // Update the existing item with the new quantity
            return await this.updateCartItem(existingItem.id, newQuantity);
          }
        }
      } catch (findError) {
        console.error('Error checking for existing item:', findError);
        // Continue with normal add if the check fails
      }

      // Prepare request data according to API documentation
      const requestData = {
        produit_id: produitId,
        variante_id: varianteId,
        quantite: validatedQuantity
      };

      // If user is authenticated with Keycloak, add client_id
      if (keycloak && keycloak.authenticated) {
        if (keycloak.tokenParsed && keycloak.tokenParsed.sub) {
          requestData.client_id = keycloak.tokenParsed.sub;
          console.log('Adding client_id to addToCart request:', keycloak.tokenParsed.sub);
        }

        // Also add user email if available
        if (keycloak.tokenParsed && keycloak.tokenParsed.email) {
          requestData.email = keycloak.tokenParsed.email;
          console.log('Adding email to addToCart request:', keycloak.tokenParsed.email);
        }
      }

      console.log('Sending request to API:', `/cart/items`, requestData);

      const response = await cartAxios.post('/cart/items', requestData);

      console.log('API response for addToCart:', response.data);

      // Ensure price values are numbers
      this.normalizeCartData(response.data);

      return response.data;
    } catch (error) {
      console.error('Error in CartService.addToCart:', error);
      const errorDetails = this.handleError(error);

      // Throw a more user-friendly error
      const errorMessage = errorDetails.message || 'Impossible d\'ajouter le produit au panier';
      throw new Error(errorMessage);
    }
  }

  // Update the quantity of an item in the cart
  async updateCartItem(itemId, quantite) {
    try {
      console.log('Updating cart item:', { itemId, quantite });

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
          console.log('Adding client_id to updateCartItem request:', keycloak.tokenParsed.sub);
        }
      }

      const response = await cartAxios.put(`/cart/items/${itemId}`, requestData);

      console.log('Update cart item response:', response.data);

      // Ensure price values are numbers
      this.normalizeCartData(response.data);

      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      const errorDetails = this.handleError(error);

      // Throw a more user-friendly error
      const errorMessage = errorDetails.message || 'Impossible de mettre à jour la quantité';
      throw new Error(errorMessage);
    }
  }

  // Remove an item from the cart
  async removeFromCart(itemId) {
    try {
      console.log('Removing item from cart:', itemId);

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
          console.log('Adding client_id to removeFromCart request:', keycloak.tokenParsed.sub);
        }
      }

      const response = await cartAxios.delete(`/cart/items/${itemId}`, { params });

      console.log('Remove item response:', response.data);

      // Ensure price values are numbers
      this.normalizeCartData(response.data);

      return response.data;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      const errorDetails = this.handleError(error);

      // Throw a more user-friendly error
      const errorMessage = errorDetails.message || 'Impossible de supprimer l\'article du panier';
      throw new Error(errorMessage);
    }
  }

  // Clear the entire cart
  async clearCart() {
    try {
      console.log('Clearing cart');

      // Prepare request params
      const params = {};

      // If user is authenticated with Keycloak, add client_id
      if (keycloak && keycloak.authenticated) {
        if (keycloak.tokenParsed && keycloak.tokenParsed.sub) {
          params.client_id = keycloak.tokenParsed.sub;
          console.log('Adding client_id to clearCart request:', keycloak.tokenParsed.sub);
        }
      }

      const response = await cartAxios.delete(`/cart`, { params });

      console.log('Clear cart response:', response.data);

      // Ensure price values are numbers if data exists
      if (response.data && response.data.data) {
        this.normalizeCartData(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      const errorDetails = this.handleError(error);

      // Throw a more user-friendly error
      const errorMessage = errorDetails.message || 'Impossible de vider le panier';
      throw new Error(errorMessage);
    }
  }

  // Clear cart for a specific user
  async clearCartForUser(userId) {
    try {
      console.log('Clearing cart for user:', userId);

      if (!userId) {
        throw new Error('User ID is required');
      }

      // Prepare request params
      const params = {
        client_id: userId
      };

      const response = await cartAxios.delete(`/cart`, { params });

      console.log('Clear cart for user response:', response.data);

      // Ensure price values are numbers if data exists
      if (response.data && response.data.data) {
        this.normalizeCartData(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Error clearing cart for user:', error);
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
  async mergeCart(guestCartId) {
    try {
      console.log('Merging guest cart with ID:', guestCartId);

      // Prepare request data according to API documentation
      const requestData = {
        guest_cart_id: guestCartId
      };

      // If user is authenticated with Keycloak, add client_id
      if (keycloak && keycloak.authenticated) {
        if (keycloak.tokenParsed && keycloak.tokenParsed.sub) {
          requestData.client_id = keycloak.tokenParsed.sub;
          console.log('Adding client_id to mergeCart request:', keycloak.tokenParsed.sub);
        }

        // Also add user email if available
        if (keycloak.tokenParsed && keycloak.tokenParsed.email) {
          requestData.email = keycloak.tokenParsed.email;
          console.log('Adding email to mergeCart request:', keycloak.tokenParsed.email);
        }
      }

      // Use the correct API endpoint and format according to documentation
      const response = await cartAxios.post(`/cart/merge`, requestData);

      console.log('Merge response:', response.data);

      // Ensure price values are numbers
      this.normalizeCartData(response.data);

      return response.data;
    } catch (error) {
      console.error('Error merging cart:', error);
      this.handleError(error);

      // If the merge fails, log the error and return a meaningful message
      console.log('Merge failed, returning error message');

      throw error;
    }
  }

  // Handle API errors according to the standard error format
  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);

      // Log the request that caused the error
      if (error.config) {
        console.error('Request URL:', error.config.url);
        console.error('Request Method:', error.config.method);
        console.error('Request Headers:', error.config.headers);
        console.error('Request Data:', error.config.data);
      }

      // Check if the response follows the standard error format
      if (error.response.data && error.response.data.status === 'error') {
        // Extract the error message from the standard format
        const errorMessage = error.response.data.message || 'Une erreur est survenue';

        // Log detailed errors if available
        if (error.response.data.errors) {
          console.error('Detailed errors:', error.response.data.errors);
        }

        // Return a standardized error object
        return {
          message: errorMessage,
          details: error.response.data.errors || {},
          status: error.response.status
        };
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request);
      return {
        message: 'Aucune réponse du serveur. Veuillez vérifier votre connexion internet.',
        status: 0
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
      return {
        message: error.message || 'Une erreur est survenue lors de la communication avec le serveur',
        status: 0
      };
    }

    // Log the stack trace
    console.error('Error Stack:', error.stack);

    // Default error object if none of the above conditions are met
    return {
      message: 'Une erreur inattendue est survenue',
      status: error.response ? error.response.status : 0
    };
  }
}

export default new CartService();
