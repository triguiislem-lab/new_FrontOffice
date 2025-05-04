import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import cartService from '../Services/cart.service.js';
import { keycloak } from '../Services/keycloakInstance.js';

// Create the context
const CartContext = createContext();

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext);

// Provider component
// Create a base64 encoded SVG placeholder to avoid external requests
const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YxZjFmMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkltYWdlIGluZGlzcG9uaWJsZTwvdGV4dD48L3N2Zz4=';

// Helper function to create a cart object from local items
const createLocalCartObject = (items) => {
  return {
    items: items.map(item => {
      // Ensure item.id is a string for concatenation
      const itemId = item.id ? item.id.toString() : '0';
      const variantId = item.variante_id ? item.variante_id.toString() : '0';

      return {
        id: `local_${itemId}_${variantId}`,
        produit: {
          id: item.id,
          nom: item.nom_produit || item.produit?.nom || 'Produit',
          // Use embedded SVG placeholder instead of URL to prevent infinite requests
          image: item.image_produit || item.produit?.image || PLACEHOLDER_IMAGE,
          prix: item.prix_produit || item.produit?.prix || 0
        },
        variante: item.variante_id ? {
          id: item.variante_id,
          attributs: item.variante_attributs || []
        } : null,
        quantite: item.quantite || 1,
        prix_unitaire: parseFloat(item.prix_produit || item.produit?.prix || 0),
        prix_total: parseFloat(item.prix_produit || item.produit?.prix || 0) * (item.quantite || 1)
      };
    }),
    nombre_items: items.reduce((total, item) => total + (item.quantite || 1), 0),
    sous_total: items.reduce((total, item) => {
      const price = parseFloat(item.prix_produit || item.produit?.prix || 0);
      return total + (price * (item.quantite || 1));
    }, 0),
    total: items.reduce((total, item) => {
      const price = parseFloat(item.prix_produit || item.produit?.prix || 0);
      return total + (price * (item.quantite || 1));
    }, 0)
  };
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [cart, setCart] = useState({ items: [], nombre_items: 0, sous_total: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  // Create a ref to store previous auth state
  const prevAuthStateRef = useRef({ isAuthenticated, userId: user?.id });

  // Helper function to trigger cart sync between tabs
  const triggerCartSync = (cartData = null) => {
    // Store sync info in localStorage to trigger storage event in other tabs
    localStorage.setItem('cart_sync', JSON.stringify({
      action: 'update',
      timestamp: Date.now()
    }));

    // If cart data is provided, update the shared cart
    if (cartData) {
      if (isAuthenticated) {
        // For authenticated users, use localStorage for persistence
        localStorage.setItem('shared_cart', JSON.stringify(cartData));
      } else {
        // For unauthenticated users, use sessionStorage for temporary storage
        sessionStorage.setItem('shared_cart', JSON.stringify(cartData));
      }
    }

    // Update our own last sync time
    setLastSyncTime(Date.now());
  };

  // Force refresh cart from server
  const refreshCart = async () => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        console.log('Force refreshing cart from server');
        const response = await cartService.getCart();

        if (response.status === 'success') {
          console.log('Refreshed cart data:', response.data);
          setCart(response.data);

          // Update shared cart for cross-browser sync
          triggerCartSync(response.data);
          return true;
        }
      }

      return false;
    } catch (err) {
      console.error('Error refreshing cart:', err);
      setError('Failed to refresh cart data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Listen for storage events to sync cart between tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'cart_sync') {
        const syncData = JSON.parse(event.newValue || '{}');

        // Only process if this is a newer sync than our last one
        if (syncData.timestamp > lastSyncTime) {
          console.log('Syncing cart from another tab', syncData);
          setLastSyncTime(syncData.timestamp);

          // Refresh cart from server if we're authenticated
          if (isAuthenticated) {
            console.log('Authenticated user detected, force refreshing cart from server');

            // Use our refreshCart function to ensure consistent behavior
            refreshCart().catch(err => {
              console.error('Error refreshing cart during sync:', err);

              // Fallback to direct API call if refreshCart fails
              cartService.getCart().then(response => {
                if (response.status === 'success' && response.data) {
                  setCart(response.data);
                }
              }).catch(syncErr => {
                console.error('Error syncing cart between tabs:', syncErr);
              });
            });
          } else {
            // For unauthenticated users, check if there's a shared cart
            const sharedCart = JSON.parse(localStorage.getItem('shared_cart'));
            if (sharedCart) {
              console.log('Using shared cart from localStorage for unauthenticated user');
              setCart(sharedCart);
            }
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, lastSyncTime]);

  // Handle authentication state changes
  useEffect(() => {
    // Function to handle auth state changes
    const handleAuthStateChange = async () => {
      console.log('Auth state changed:', {
        prevState: prevAuthStateRef.current,
        currentState: { isAuthenticated, userId: user?.id }
      });

      // Case 1: User logged out
      if (prevAuthStateRef.current.isAuthenticated && !isAuthenticated) {
        console.log('User logged out, handling cart transition');

        // Get the current cart before clearing
        const currentCart = { ...cart };

        // Clear any user-specific cart data
        if (prevAuthStateRef.current.userId) {
          localStorage.removeItem(`cart_user_${prevAuthStateRef.current.userId}`);
        }

        // Convert the authenticated cart to local format
        if (currentCart.items && currentCart.items.length > 0) {
          console.log('Converting authenticated cart to local format');

          // Convert cart items to local format
          const localItems = currentCart.items.map(item => ({
            id: item.produit.id,
            nom_produit: item.produit.nom,
            prix_produit: item.prix_unitaire,
            image_produit: item.produit.image,
            quantite: item.quantite,
            variante_id: item.variante?.id || null,
            variante_attributs: item.variante?.attributs || []
          }));

          // Save to localStorage
          localStorage.setItem('cart', JSON.stringify(localItems));

          // Create updated cart object with local IDs
          const localCartObj = createLocalCartObject(localItems);
          setCart(localCartObj);

          // Also update shared cart
          triggerCartSync(localCartObj);

          console.log('Successfully converted authenticated cart to local format');
        } else {
          // Reset to empty cart first
          const emptyCart = { items: [], nombre_items: 0, sous_total: 0, total: 0 };
          setCart(emptyCart);

          // Then check for guest cart data
          const localCart = JSON.parse(localStorage.getItem('cart')) || [];
          if (localCart.length > 0) {
            console.log('Using local cart for logged out user');
            const localCartObj = createLocalCartObject(localCart);
            setCart(localCartObj);
          }
        }
      }

      // Case 2: User logged in
      if (!prevAuthStateRef.current.isAuthenticated && isAuthenticated) {
        console.log('User logged in, handling cart transition');

        // Check if we have local cart items to merge with server
        const localCart = JSON.parse(localStorage.getItem('cart')) || [];
        const hasLocalItems = localCart.length > 0;

        // Force refresh cart from server
        try {
          // First get the current server cart
          const response = await cartService.getCart();

          if (response.status === 'success') {
            console.log('Successfully loaded user cart after login');

            // Check if server cart is empty and we have local items
            if (response.data.items.length === 0 && hasLocalItems) {
              console.log('Server cart is empty, merging local items');

              try {
                // Create a guest cart ID for merging
                // In a real implementation, you would have a guest cart ID from the server
                // For now, we'll use a temporary ID based on the current timestamp
                const guestCartId = Date.now();

                // Merge local cart with server using the guest cart ID
                const mergeResponse = await cartService.mergeCart(guestCartId);

                if (mergeResponse.status === 'success') {
                  console.log('Successfully merged local cart with server');

                  // Get the updated cart from server
                  const refreshResponse = await cartService.getCart();

                  if (refreshResponse.status === 'success') {
                    console.log('Using refreshed cart after merge');
                    setCart(refreshResponse.data);

                    // Clear local cart after successful merge
                    localStorage.removeItem('cart');
                  } else {
                    // Use merge response if refresh fails
                    setCart(mergeResponse.data);
                  }
                } else {
                  // Use server cart if merge fails
                  setCart(response.data);
                }
              } catch (mergeError) {
                console.error('Error merging local cart with server:', mergeError);
                // Use server cart if merge fails
                setCart(response.data);
              }
            } else {
              // Server cart has items or no local items, use server cart
              setCart(response.data);

              // If we have local items, try to merge them with server
              if (hasLocalItems && response.data.items.length > 0) {
                console.log('Both server and local cart have items, merging');

                try {
                  // Create a guest cart ID for merging
                  // In a real implementation, you would have a guest cart ID from the server
                  // For now, we'll use a temporary ID based on the current timestamp
                  const guestCartId = Date.now();

                  // Merge local cart with server using the guest cart ID
                  await cartService.mergeCart(guestCartId);

                  // Get the updated cart from server
                  const refreshResponse = await cartService.getCart();

                  if (refreshResponse.status === 'success') {
                    console.log('Using refreshed cart after merge');
                    setCart(refreshResponse.data);

                    // Clear local cart after successful merge
                    localStorage.removeItem('cart');
                  }
                } catch (mergeError) {
                  console.error('Error merging local cart with server:', mergeError);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error loading user cart after login:', error);
        }
      }

      // Case 3: User changed (switched accounts)
      if (prevAuthStateRef.current.isAuthenticated && isAuthenticated &&
          prevAuthStateRef.current.userId !== user?.id) {
        console.log('User account changed, loading new user cart data');

        // Force refresh cart from server
        try {
          const response = await cartService.getCart();
          if (response.status === 'success') {
            console.log('Successfully loaded new user cart');
            setCart(response.data);
          }
        } catch (error) {
          console.error('Error loading new user cart:', error);
        }
      }

      // Update previous state reference
      prevAuthStateRef.current = { isAuthenticated, userId: user?.id };
    };

    // Call the handler when auth state changes
    handleAuthStateChange();

  }, [isAuthenticated, user?.id]);


  // Ref to track if we've already loaded the cart to prevent multiple loads
  const hasLoadedCartRef = useRef(false);

  // Load cart data from API or localStorage
  useEffect(() => {
    const loadCart = async () => {
      // Skip if we've already loaded the cart
      if (hasLoadedCartRef.current) {
        console.log('Cart already loaded, skipping duplicate load');
        return;
      }

      setLoading(true);
      try {
        // Mark as loaded to prevent duplicate loads
        hasLoadedCartRef.current = true;

        // Check for a shared cart in storage
        const sharedCartKey = 'shared_cart';
        // For authenticated users, check localStorage, for unauthenticated users, check sessionStorage first
        const sharedCart = isAuthenticated
          ? JSON.parse(localStorage.getItem(sharedCartKey)) || null
          : JSON.parse(sessionStorage.getItem(sharedCartKey)) || null;

        if (isAuthenticated) {
          console.log('User authentication state:', { isAuthenticated, user });

          // If user is authenticated, try to get cart from API
          const response = await cartService.getCart();
          console.log('Loading cart for authenticated user:', user?.id, response);

          // Check if the API cart is empty or has items
          const hasApiItems = response.status === 'success' &&
                             response.data &&
                             response.data.items &&
                             response.data.items.length > 0;

          // Check if we have a shared cart with items
          const hasSharedItems = sharedCart &&
                                sharedCart.items &&
                                sharedCart.items.length > 0;

          // Get any user-specific local cart items
          // Use Keycloak user ID if available, otherwise fall back to user.id
          const userId = keycloak?.tokenParsed?.sub || user?.id;
          const localCartKey = `cart_user_${userId}`;
          console.log('Using local cart key:', localCartKey);
          const localCart = JSON.parse(localStorage.getItem(localCartKey)) || [];
          const hasLocalItems = localCart.length > 0;

          if (hasApiItems) {
            // API cart has items, use it as the primary source
            console.log('Using API cart with items:', response.data.items.length);
            setCart(response.data);

            // If we also have local or shared items, try to merge them
            if (hasLocalItems || hasSharedItems) {
              console.log('Found local or shared items to merge with API cart');

              // Combine local and shared items for merging
              const itemsToMerge = [
                ...localCart,
                ...(hasSharedItems ? sharedCart.items.map(item => ({
                  id: item.produit.id,
                  variante_id: item.variante?.id || null,
                  quantite: item.quantite,
                  nom_produit: item.produit.nom,
                  prix_produit: item.prix_unitaire,
                  image_produit: item.produit.image || PLACEHOLDER_IMAGE
                })) : [])
              ];

              if (itemsToMerge.length > 0) {
                try {
                  // Create a guest cart ID for merging
                  // In a real implementation, you would have a guest cart ID from the server
                  // For now, we'll use a temporary ID based on the current timestamp
                  const guestCartId = Date.now();

                  // Merge local cart with server using the guest cart ID
                  await cartService.mergeCart(guestCartId);

                  // Clear local storage after successful merge
                  localStorage.removeItem(localCartKey);
                  if (hasSharedItems) localStorage.removeItem(sharedCartKey);

                  // Refresh cart from server
                  const refreshedResponse = await cartService.getCart();
                  if (refreshedResponse.status === 'success' && refreshedResponse.data) {
                    setCart(refreshedResponse.data);
                  }
                } catch (mergeError) {
                  console.error('Error merging items with API cart:', mergeError);
                }
              }
            }
          } else {
            // API cart is empty, check for local or shared items
            console.log('API cart is empty, checking for local or shared items');

            if (hasLocalItems || hasSharedItems) {
              // We have local or shared items, try to use them
              console.log('Found local or shared items to use instead of empty API cart');

              // Combine local and shared items
              const combinedItems = [
                ...localCart,
                ...(hasSharedItems ? sharedCart.items.map(item => ({
                  id: item.produit.id,
                  variante_id: item.variante?.id || null,
                  quantite: item.quantite,
                  nom_produit: item.produit.nom,
                  prix_produit: item.prix_unitaire,
                  image_produit: item.produit.image || PLACEHOLDER_IMAGE
                })) : [])
              ];

              // Try to merge with server
              try {
                // Create a guest cart ID for merging
                // In a real implementation, you would have a guest cart ID from the server
                // For now, we'll use a temporary ID based on the current timestamp
                const guestCartId = Date.now();

                // Merge local cart with server using the guest cart ID
                const mergeResponse = await cartService.mergeCart(guestCartId);
                console.log('Merge response for empty API cart:', mergeResponse);

                // Clear localStorage after successful merge
                localStorage.removeItem(localCartKey);
                if (hasSharedItems) localStorage.removeItem(sharedCartKey);

                // Refresh cart from server
                const refreshedResponse = await cartService.getCart();
                if (refreshedResponse.status === 'success' &&
                    refreshedResponse.data &&
                    refreshedResponse.data.items &&
                    refreshedResponse.data.items.length > 0) {
                  // Server now has items, use it
                  setCart(refreshedResponse.data);
                } else {
                  // Server still empty, use local representation
                  console.log('Server cart still empty after merge, using local representation');

                  // Create a cart object from combined items
                  const localCartObj = createLocalCartObject(combinedItems);
                  setCart(localCartObj);

                  // Save as shared cart for cross-browser access
                  localStorage.setItem(sharedCartKey, JSON.stringify(localCartObj));
                }
              } catch (mergeError) {
                console.error('Error merging with empty API cart:', mergeError);

                // Create a cart object from combined items
                const localCartObj = createLocalCartObject(combinedItems);
                setCart(localCartObj);

                // Save as shared cart for cross-browser access
                localStorage.setItem(sharedCartKey, JSON.stringify(localCartObj));
              }
            } else {
              // No items anywhere, use empty API cart
              console.log('No items found anywhere, using empty API cart');
              setCart(response.data || { items: [], nombre_items: 0, sous_total: 0, total: 0 });
            }
          }
        } else {
          // For unauthenticated users, check both regular cart and shared cart
          const localCart = JSON.parse(sessionStorage.getItem('cart')) || [];
          console.log('Loading cart for unauthenticated user, local items:', localCart.length);

          // Check if we have a shared cart with items
          const hasSharedItems = sharedCart &&
                                sharedCart.items &&
                                sharedCart.items.length > 0;

          if (hasSharedItems) {
            console.log('Found shared cart with items:', sharedCart.items.length);

            if (localCart.length > 0) {
              // We have both local and shared items, merge them
              console.log('Merging local cart with shared cart');

              // Convert shared items to local format for merging
              const sharedItemsLocal = sharedCart.items.map(item => ({
                id: item.produit.id,
                variante_id: item.variante?.id || null,
                quantite: item.quantite,
                nom_produit: item.produit.nom,
                prix_produit: item.prix_unitaire,
                image_produit: item.produit.image || PLACEHOLDER_IMAGE
              }));

              // To prevent duplicate merging, we'll check if the carts are already merged

              // Create a simple hash of the cart contents to compare
              const getCartHash = (items) => {
                return items
                  .map(item => `${item.id}_${item.variante_id || 0}_${item.quantite}`)
                  .sort()
                  .join('|');
              };

              const localCartHash = getCartHash(localCart);

              // Convert shared items to a comparable format
              const sharedItemsForHash = sharedItemsLocal.map(item => ({
                id: item.id,
                variante_id: item.variante_id,
                quantite: item.quantite
              }));

              const sharedCartHash = getCartHash(sharedItemsForHash);

              // Check if the carts are identical (already merged)
              const cartsAreIdentical = localCartHash === sharedCartHash;

              if (cartsAreIdentical) {
                console.log('Shared items already in local cart, skipping merge');

                // Create cart object from local cart only
                const localCartObj = createLocalCartObject(localCart);
                setCart(localCartObj);

                // Save to shared cart for consistency
                localStorage.setItem('shared_cart', JSON.stringify(localCartObj));
              } else {
                console.log('Merging shared items with local cart');

                // Check for duplicates and merge quantities
                const mergedItems = [...localCart];

                sharedItemsLocal.forEach(sharedItem => {
                  const existingIndex = mergedItems.findIndex(item =>
                    item.id === sharedItem.id &&
                    (sharedItem.variante_id ? item.variante_id === sharedItem.variante_id : !item.variante_id)
                  );

                  if (existingIndex >= 0) {
                    // Item exists, don't add quantities to prevent duplication
                    // Just keep the existing quantity to avoid any increases
                    console.log(`Item already exists in cart, keeping quantity: ${mergedItems[existingIndex].quantite}`);
                  } else {
                    // New item, add to array
                    console.log(`Adding new item to merged cart: ${sharedItem.id}`);
                    mergedItems.push(sharedItem);
                  }
                });

                // Create cart object from merged items
                const mergedCart = createLocalCartObject(mergedItems);
                setCart(mergedCart);

                // Save merged cart to both storages
                localStorage.setItem('cart', JSON.stringify(mergedItems));
                localStorage.setItem('shared_cart', JSON.stringify(mergedCart));
              }
            } else {
              // Only have shared items, use them
              setCart(sharedCart);
            }
          } else if (localCart.length > 0) {
            // Only have local items, use them and create a shared cart
            console.log('Using local cart items, creating shared cart');
            const localCartObj = createLocalCartObject(localCart);
            setCart(localCartObj);

            // Save as shared cart for cross-browser access
            localStorage.setItem('shared_cart', JSON.stringify(localCartObj));
          } else {
            // No items anywhere, use empty cart
            console.log('No items found anywhere, using empty cart');
            setCart({ items: [], nombre_items: 0, sous_total: 0, total: 0 });
          }
        }
      } catch (err) {
        console.error('Error loading cart:', err);
        setError('Failed to load cart data');

        // Fallback to localStorage in case of API error
        // Use Keycloak user ID if available, otherwise fall back to user.id
        const userId = keycloak?.tokenParsed?.sub || user?.id;
        const storageKey = isAuthenticated && userId ? `cart_user_${userId}` : 'cart';
        console.log('Using fallback storage key:', storageKey);
        const localCart = JSON.parse(localStorage.getItem(storageKey)) || [];
        setCart({
          items: localCart.map(item => ({
            id: `local_${item.id}_${item.variante_id || 0}`,
            produit: {
              id: item.id,
              nom: item.nom_produit,
              image: item.image_produit || PLACEHOLDER_IMAGE,
              prix: item.prix_produit
            },
            variante: item.variante_id ? {
              id: item.variante_id,
              attributs: item.variante_attributs || []
            } : null,
            quantite: item.quantite,
            prix_unitaire: item.prix_produit,
            prix_total: item.prix_produit * item.quantite
          })),
          nombre_items: localCart.reduce((total, item) => total + item.quantite, 0),
          sous_total: localCart.reduce((total, item) => total + (item.prix_produit * item.quantite), 0),
          total: localCart.reduce((total, item) => total + (item.prix_produit * item.quantite), 0)
        });
      } finally {
        setLoading(false);
      }
    };

    // Only load cart when authentication state is determined
    if (isAuthenticated !== undefined) {
      loadCart();
    }

    // Set up a periodic refresh for authenticated users
    let refreshInterval;
    if (isAuthenticated && user) {
      refreshInterval = setInterval(async () => {
        try {
          console.log('Refreshing cart data...');
          const response = await cartService.getCart();
          if (response.status === 'success' && response.data) {
            setCart(response.data);

            // Also store in localStorage for backup
            if (user?.id) {
              localStorage.setItem(`cart_user_${user.id}`, JSON.stringify(response.data));
            }

            // Update shared cart for cross-browser sync
            triggerCartSync(response.data);
          }
        } catch (err) {
          console.error('Error refreshing cart:', err);
        }
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [isAuthenticated, user]);

  // Add item to cart
  const addToCart = async (product, variant = null, quantity = 1, replaceQuantity = true) => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        // Use API for authenticated users
        console.log('Adding to cart with authenticated user:', {
          productId: product.id,
          variantId: variant?.id,
          quantity,
          replaceQuantity,
          userId: keycloak?.tokenParsed?.sub
        });

        // First add the item
        const response = await cartService.addToCart(
          product.id,
          variant?.id || null,
          quantity,
          replaceQuantity
        );

        if (response.status === 'success') {
          // Then get a fresh cart from the server to ensure consistency
          console.log('Successfully added item, refreshing cart');
          const refreshResponse = await cartService.getCart();

          if (refreshResponse.status === 'success') {
            console.log('Using refreshed cart data:', refreshResponse.data);
            setCart(refreshResponse.data);
            triggerCartSync(refreshResponse.data);

            // Also store in localStorage for backup
            if (user?.id) {
              localStorage.setItem(`cart_user_${user.id}`, JSON.stringify(refreshResponse.data));
            }
          } else {
            // Fallback to the response from addToCart if refresh fails
            console.log('Using addToCart response data:', response.data);
            setCart(response.data);
            triggerCartSync(response.data);

            // Also store in localStorage for backup
            if (user?.id) {
              localStorage.setItem(`cart_user_${user.id}`, JSON.stringify(response.data));
            }
          }
        }
      } else {
        // Use sessionStorage for unauthenticated users (temporary storage)
        const localCart = JSON.parse(sessionStorage.getItem('cart')) || [];

        // Check if product already exists in cart
        const existingItemIndex = localCart.findIndex(item =>
          item.id === product.id &&
          (variant ? item.variante_id === variant.id : !item.variante_id)
        );

        if (existingItemIndex >= 0) {
          // Update quantity if item exists
          if (replaceQuantity) {
            // Replace the quantity
            console.log('Replacing quantity for existing item in local cart');
            localCart[existingItemIndex].quantite = quantity;
          } else {
            // Add to the existing quantity
            console.log('Adding to quantity for existing item in local cart');
            localCart[existingItemIndex].quantite += quantity;
          }
        } else {
          // Add new item if it doesn't exist
          console.log('Adding new item to local cart');
          localCart.push({
            id: product.id,
            nom_produit: product.nom_produit || product.nom,
            prix_produit: variant?.prix_supplement
              ? (product.prix_produit || product.prix) + variant.prix_supplement
              : (product.prix_produit || product.prix),
            // Use embedded SVG placeholder if no image is provided
            image_produit: product.image_produit || product.image || PLACEHOLDER_IMAGE,
            quantite: quantity,
            variante_id: variant?.id || null,
            variante_sku: variant?.sku || null,
            variante_attributs: variant?.attributs || []
          });
        }

        // Save to sessionStorage (temporary storage)
        sessionStorage.setItem('cart', JSON.stringify(localCart));

        // Create updated cart object
        const updatedCart = createLocalCartObject(localCart);

        // Update state
        setCart(updatedCart);

        // Update shared cart and trigger sync
        triggerCartSync(updatedCart);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart');
    } finally {
      setLoading(false);
    }
  };

  // Update cart item quantity
  const updateCartItem = async (itemId, quantity) => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        // Use API for authenticated users
        console.log('Updating cart item with authenticated user:', {
          itemId,
          quantity,
          userId: keycloak?.tokenParsed?.sub
        });

        // First update the item
        const response = await cartService.updateCartItem(itemId, quantity);

        if (response.status === 'success') {
          // Then get a fresh cart from the server to ensure consistency
          console.log('Successfully updated item, refreshing cart');
          const refreshResponse = await cartService.getCart();

          if (refreshResponse.status === 'success') {
            console.log('Using refreshed cart data after update:', refreshResponse.data);
            setCart(refreshResponse.data);
            triggerCartSync(refreshResponse.data);
          } else {
            // Fallback to the response from updateCartItem if refresh fails
            console.log('Using updateCartItem response data:', response.data);
            setCart(response.data);
            triggerCartSync(response.data);
          }
        }
      } else {
        // Use sessionStorage for unauthenticated users (temporary storage)
        const localCart = JSON.parse(sessionStorage.getItem('cart')) || [];
        let itemIndex = -1;

        console.log('Updating cart item for unauthenticated user:', { itemId, quantity });

        // Check if itemId is a string that can be split (local format)
        if (typeof itemId === 'string' && itemId.includes('_')) {
          console.log('Updating item with local ID format:', itemId);
          // Extract product ID and variant ID from local item ID
          const parts = itemId.split('_');
          if (parts.length >= 3) {
            const [_, productId, variantId] = parts;

            // Find the item in the local cart
            itemIndex = localCart.findIndex(item =>
              item.id.toString() === productId &&
              (variantId === '0' ? !item.variante_id : item.variante_id.toString() === variantId)
            );
          } else {
            console.warn('Invalid item ID format:', itemId);
          }
        } else {
          // Handle numeric or non-string itemId (direct item ID from API)
          console.log('Updating item with direct ID:', itemId);

          // Find the item in the local cart that matches this ID
          itemIndex = localCart.findIndex(item => {
            // Convert both to strings for comparison
            return item.id.toString() === itemId.toString();
          });
        }

        console.log('Found item at index:', itemIndex);

        if (itemIndex >= 0) {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            console.log('Removing item because quantity is 0 or less');
            localCart.splice(itemIndex, 1);
          } else {
            // Update quantity
            console.log(`Updating quantity from ${localCart[itemIndex].quantite} to ${quantity}`);
            localCart[itemIndex].quantite = quantity;
          }

          // Save to sessionStorage (temporary storage)
          sessionStorage.setItem('cart', JSON.stringify(localCart));

          // Create updated cart object
          const updatedCart = createLocalCartObject(localCart);

          // Update state
          setCart(updatedCart);

          // Update shared cart and trigger sync
          triggerCartSync(updatedCart);
        } else {
          console.warn('Item not found in cart:', itemId);
          setError('Item not found in cart');
        }
      }
    } catch (err) {
      console.error('Error updating cart item:', err);
      setError('Failed to update cart item');
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId) => {
    try {
      setLoading(true);
      console.log('Removing item from cart:', itemId);

      if (isAuthenticated) {
        // Use API for authenticated users
        console.log('Removing cart item with authenticated user:', {
          itemId,
          userId: keycloak?.tokenParsed?.sub
        });

        // First remove the item
        const response = await cartService.removeFromCart(itemId);

        if (response.status === 'success') {
          // Then get a fresh cart from the server to ensure consistency
          console.log('Successfully removed item, refreshing cart');
          const refreshResponse = await cartService.getCart();

          if (refreshResponse.status === 'success') {
            console.log('Using refreshed cart data after removal:', refreshResponse.data);
            setCart(refreshResponse.data);
            triggerCartSync(refreshResponse.data);
          } else {
            // Fallback to the response from removeFromCart if refresh fails
            console.log('Using removeFromCart response data:', response.data);
            setCart(response.data);
            triggerCartSync(response.data);
          }
        }
      } else {
        // Use sessionStorage for unauthenticated users (temporary storage)
        const localCart = JSON.parse(sessionStorage.getItem('cart')) || [];
        let updatedItems = [];

        // Check if itemId is a string that can be split (local format)
        if (typeof itemId === 'string' && itemId.includes('_')) {
          console.log('Removing item with local ID format:', itemId);
          // Extract product ID and variant ID from local item ID
          const parts = itemId.split('_');
          if (parts.length >= 3) {
            const [_, productId, variantId] = parts;

            // Filter out the item
            updatedItems = localCart.filter(item =>
              !(item.id.toString() === productId &&
                (variantId === '0' ? !item.variante_id : item.variante_id.toString() === variantId))
            );
          } else {
            console.warn('Invalid item ID format:', itemId);
            updatedItems = localCart;
          }
        } else {
          // Handle numeric or non-string itemId (direct item ID from API)
          console.log('Removing item with direct ID:', itemId);

          // Find the item in the local cart that matches this ID
          updatedItems = localCart.filter(item => {
            // Convert both to strings for comparison
            return item.id.toString() !== itemId.toString();
          });
        }

        // Save to sessionStorage (temporary storage)
        sessionStorage.setItem('cart', JSON.stringify(updatedItems));

        // Create updated cart object
        const updatedCart = createLocalCartObject(updatedItems);

        // Update state
        setCart(updatedCart);

        // Update shared cart and trigger sync
        triggerCartSync(updatedCart);
      }
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart');
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        // Use API for authenticated users
        console.log('Clearing cart with authenticated user:', {
          userId: keycloak?.tokenParsed?.sub
        });

        // First clear the cart
        const response = await cartService.clearCart();

        if (response.status === 'success') {
          // Then get a fresh cart from the server to ensure consistency
          console.log('Successfully cleared cart, refreshing');
          const refreshResponse = await cartService.getCart();

          // Clear user-specific cart in localStorage
          if (user?.id) {
            localStorage.removeItem(`cart_user_${user.id}`);
          }
          if (keycloak?.tokenParsed?.sub) {
            localStorage.removeItem(`cart_user_${keycloak.tokenParsed.sub}`);
          }

          if (refreshResponse.status === 'success') {
            console.log('Using refreshed cart data after clearing:', refreshResponse.data);
            setCart(refreshResponse.data);
            triggerCartSync(refreshResponse.data);
          } else {
            // Fallback to empty cart if refresh fails
            console.log('Using empty cart after clearing');
            const emptyCart = { items: [], nombre_items: 0, sous_total: 0, total: 0 };
            setCart(emptyCart);
            triggerCartSync(emptyCart);
          }
        }
      } else {
        // Use sessionStorage for unauthenticated users (temporary storage)
        sessionStorage.removeItem('cart');
        sessionStorage.removeItem('shared_cart');

        const emptyCart = { items: [], nombre_items: 0, sous_total: 0, total: 0 };
        setCart(emptyCart);
        triggerCartSync(emptyCart);
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };



  // Clear cart for current user
  const clearCartForCurrentUser = async () => {
    try {
      setLoading(true);

      if (isAuthenticated && keycloak?.tokenParsed?.sub) {
        console.log('Clearing cart for current user:', keycloak.tokenParsed.sub);

        // Clear the cart for the current user
        const response = await cartService.clearCartForUser(keycloak.tokenParsed.sub);

        if (response.status === 'success') {
          // Clear user-specific cart in localStorage
          if (user?.id) {
            localStorage.removeItem(`cart_user_${user.id}`);
          }
          if (keycloak?.tokenParsed?.sub) {
            localStorage.removeItem(`cart_user_${keycloak.tokenParsed.sub}`);
          }

          // Refresh the cart
          await refreshCart();
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error('Error clearing cart for current user:', err);
      setError('Failed to clear cart for current user');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Value object to be provided to consumers
  const value = {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart,
    clearCartForCurrentUser
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
