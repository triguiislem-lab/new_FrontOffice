import axios from 'axios';
import { keycloak } from '../Services/keycloakInstance.js';

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
    } else {
      // Fallback to localStorage if keycloak is not available
      try {
        const user = JSON.parse(localStorage.getItem('user'));

        // If user exists and has a token, add it to the headers
        if (user && user.token) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
        } else if (user && user.message === "Authentication successful") {
          // Try to get token from localStorage directly
          const token = localStorage.getItem('token');
          if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
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

class WishlistService {
  constructor() {
    // Important: Allow cookies to be sent with requests
    axios.defaults.withCredentials = true;
  }

  // Get the current user's wishlist
  async getWishlist() {
    try {
      const timestamp = new Date().getTime();
      const response = await wishlistAxios.get('/wishlist', {
        params: { _t: timestamp }
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      return { status: 'error', data: { items: [] } };
    }
  }

  // Add an item to the wishlist
  async addToWishlist(produitId, varianteId = null, note = '') {
    try {
      const response = await wishlistAxios.post('/wishlist/items', {
        produit_id: produitId,
        variante_id: varianteId,
        note: note
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Remove an item from the wishlist
  async removeFromWishlist(itemId) {
    try {
      const response = await wishlistAxios.delete(`/wishlist/items/${itemId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Check if a product is in the wishlist
  async checkWishlist(produitId, varianteId = null) {
    try {
      const params = varianteId ? { variante_id: varianteId } : {};
      const response = await wishlistAxios.get(`/wishlist/check/${produitId}`, { params });
      return response.data;
    } catch (error) {
      this.handleError(error);
      return { status: 'error', data: { in_wishlist: false } };
    }
  }

  // Move an item from wishlist to cart
  async moveToCart(itemId, quantite = 1) {
    try {
      const response = await wishlistAxios.post(`/wishlist/items/${itemId}/move-to-cart`, {
        quantite: quantite
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  // Handle API errors
  handleError(error) {
    // Silent error handling
  }
}

export default new WishlistService();
