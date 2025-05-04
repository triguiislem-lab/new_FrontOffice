/**
 * Configuration file for standardizing loading animations across the application
 */

// Default loading spinner configuration
export const DEFAULT_SPINNER = {
  variant: 'circle',  // circle, dots, pulse, wave, ripple
  size: 'md',         // xs, sm, md, lg, xl
  color: '#A67B5B',   // Primary brand color - brown
  loadingLineColor: '#A67B5B', // Color for loading progress bars
  bgColor: 'bg-white', // Background color for overlay/fullscreen modes
  textColor: 'text-gray-600', // Text color for loading messages
};

// Loading messages for different contexts
export const LOADING_MESSAGES = {
  page: 'Chargement de la page...',
  products: 'Chargement des produits...',
  product: 'Chargement du produit...',
  images: 'Chargement des images...',
  cart: 'Mise à jour du panier...',
  checkout: 'Préparation de la commande...',
  search: 'Recherche en cours...',
  filter: 'Application des filtres...',
  auth: 'Authentification en cours...',
  wishlist: 'Chargement de vos favoris...',
  profile: 'Chargement de votre profil...',
  categories: 'Chargement des catégories...',
  brands: 'Chargement des marques...',
};

// Animation durations
export const ANIMATION_DURATIONS = {
  fast: 300,
  medium: 500,
  slow: 800,
};

// Loading states for different components
export const COMPONENT_LOADING = {
  // For product cards
  productCard: {
    ...DEFAULT_SPINNER,
    variant: 'circle',
    size: 'md',
  },

  // For product images
  productImage: {
    ...DEFAULT_SPINNER,
    variant: 'ripple',
    size: 'md',
  },

  // For thumbnail images
  thumbnailImage: {
    ...DEFAULT_SPINNER,
    variant: 'dots',
    size: 'sm',
  },

  // For page loading
  pageLoading: {
    ...DEFAULT_SPINNER,
    variant: 'circle',
    size: 'lg',
    bgColor: 'bg-white',
    textColor: 'text-gray-700',
  },

  // For button loading
  buttonLoading: {
    ...DEFAULT_SPINNER,
    variant: 'dots',
    size: 'xs',
  },

  // For form submission
  formSubmit: {
    ...DEFAULT_SPINNER,
    variant: 'wave',
    size: 'sm',
  },

  // For API calls
  apiCall: {
    ...DEFAULT_SPINNER,
    variant: 'circle',
    size: 'sm',
  },

  // For authentication
  auth: {
    ...DEFAULT_SPINNER,
    variant: 'ripple',
    size: 'lg',
    bgColor: 'bg-gray-50',
  },

  // For cart operations
  cart: {
    ...DEFAULT_SPINNER,
    variant: 'dots',
    size: 'md',
  },
};

export default {
  DEFAULT_SPINNER,
  LOADING_MESSAGES,
  ANIMATION_DURATIONS,
  COMPONENT_LOADING,
};
