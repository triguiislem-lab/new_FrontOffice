import axios from 'axios';
import { keycloak } from '../services/keycloakInstance.js';

const API_URL = 'https://laravel-api.fly.dev/api';

// Create a custom axios instance for wishlist operations
const wishlistAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor to include auth token
wishlistAxios.interceptors.request.use(
  config => {
    // Check if keycloak is authenticated and has a token
    if (keycloak && keycloak.authenticated && keycloak.token) {
      config.headers['Authorization'] = `Bearer ${keycloak.token}`;
      console.log('Using Keycloak token for authorization');
    } else {
      // Fallback to localStorage if keycloak is not available
      try {
        const user = JSON.parse(localStorage.getItem('user'));

        // If user exists and has a token, add it to the headers
        if (user && user.token) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
          console.log('Using localStorage user token for authorization');
        } else if (user && user.message === "Authentication successful") {
          // Try to get token from localStorage directly
          const token = localStorage.getItem('token');
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
            console.log('Using localStorage token for authorization');
          }
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }

    // Log the headers for debugging
    console.log('Request headers for wishlist API:', config.headers);

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

class WishlistService {
  constructor() {
    // Important: Allow cookies to be sent with requests
    axios.defaults.withCredentials = true;
  }

  // Get the current user's wishlist
  async getWishlist() {
    try {
      console.log('Getting wishlist data...');
      const timestamp = new Date().getTime();
      const response = await wishlistAxios.get('/wishlist', {
        params: { _t: timestamp }
      });
      console.log('Wishlist API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error syncing wishlist:', error);
      this.handleError(error);
      return { status: 'error', data: { items: [] } };
    }
  }

  // Add an item to the wishlist
  async addToWishlist(produitId, varianteId = null, note = '') {
    try {
      console.log('Adding to wishlist:', { produitId, varianteId, note });
      const response = await wishlistAxios.post('/wishlist/items', {
        produit_id: produitId,
        variante_id: varianteId,
        note: note
      });
      console.log('Add to wishlist response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      this.handleError(error);
      throw error;
    }
  }

  // Remove an item from the wishlist
  async removeFromWishlist(itemId) {
    try {
      console.log('Removing from wishlist:', itemId);
      const response = await wishlistAxios.delete(`/wishlist/items/${itemId}`);
      console.log('Remove from wishlist response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      this.handleError(error);
      throw error;
    }
  }

  // Check if a product is in the wishlist
  async checkWishlist(produitId, varianteId = null) {
    try {
      console.log('Checking wishlist for:', { produitId, varianteId });
      const params = varianteId ? { variante_id: varianteId } : {};
      const response = await wishlistAxios.get(`/wishlist/check/${produitId}`, { params });
      console.log('Check wishlist response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error checking wishlist:', error);
      this.handleError(error);
      return { status: 'error', data: { in_wishlist: false } };
    }
  }

  // Move an item from wishlist to cart
  async moveToCart(itemId, quantite = 1) {
    try {
      console.log('Moving to cart:', { itemId, quantite });
      const response = await wishlistAxios.post(`/wishlist/items/${itemId}/move-to-cart`, {
        quantite: quantite
      });
      console.log('Move to cart response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error moving to cart:', error);
      this.handleError(error);
      throw error;
    }
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
  }
}

export default new WishlistService();
