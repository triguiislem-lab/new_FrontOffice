import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import wishlistService from '../Services/wishlist.service.js';
import { useCart } from './CartContext.jsx';
import { keycloak } from '../Services/keycloakInstance.js';

// Create the context
const WishlistContext = createContext();

// Custom hook to use the wishlist context
export const useWishlist = () => useContext(WishlistContext);

// Provider component
export const WishlistProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState({ items: [], nombre_items: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  // Create a ref to store previous auth state
  const prevAuthStateRef = useRef({ isAuthenticated, userId: user?.id });

  // Helper function to trigger wishlist sync between tabs
  const triggerWishlistSync = (wishlistData = null) => {
    // Store sync info in localStorage to trigger storage event in other tabs
    localStorage.setItem('wishlist_sync', JSON.stringify({
      action: 'update',
      timestamp: Date.now()
    }));

    // If wishlist data is provided, update the shared wishlist
    if (wishlistData) {
      if (isAuthenticated) {
        // For authenticated users, use localStorage for persistence
        localStorage.setItem('shared_wishlist', JSON.stringify(wishlistData));
      } else {
        // For unauthenticated users, use sessionStorage for temporary storage
        sessionStorage.setItem('shared_wishlist', JSON.stringify(wishlistData));
      }
    }

    // Update our own last sync time
    setLastSyncTime(Date.now());
  };

  // Force refresh wishlist from server
  const refreshWishlist = async () => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        const response = await wishlistService.getWishlist();

        if (response.status === 'success') {
          setWishlist(response.data);

          // Update shared wishlist for cross-browser sync
          triggerWishlistSync(response.data);
          return true;
        }
      }

      return false;
    } catch (err) {
      setError('Failed to refresh wishlist data');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Listen for storage events to sync wishlist between tabs
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'wishlist_sync') {
        const syncData = JSON.parse(event.newValue || '{}');

        // Only process if this is a newer sync than our last one
        if (syncData.timestamp > lastSyncTime) {
          setLastSyncTime(syncData.timestamp);

          // For immediate feedback, check if there's a shared wishlist
          const sharedWishlist = JSON.parse(localStorage.getItem('shared_wishlist'));
          if (sharedWishlist) {
            setWishlist(sharedWishlist);
          }

          // Then refresh from server if authenticated (in the background)
          if (isAuthenticated) {

            // Use setTimeout to avoid blocking the UI
            setTimeout(() => {
              // Use our refreshWishlist function to ensure consistent behavior
              refreshWishlist().catch(() => {
                // Fallback to direct API call if refreshWishlist fails
                wishlistService.getWishlist().then(response => {
                  if (response.status === 'success' && response.data) {
                    setWishlist(response.data);

                    // Also update localStorage for backup
                    if (user?.id) {
                      localStorage.setItem(`favorites_user_${user.id}`, JSON.stringify(response.data));
                    }
                  }
                }).catch(() => {
                  // Silent fail
                });
              });
            }, 0);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAuthenticated, lastSyncTime, user?.id]);

  // Set up periodic refresh for authenticated users
  useEffect(() => {
    let refreshInterval = null;

    if (isAuthenticated) {
      // Set up interval for periodic refresh
      refreshInterval = setInterval(async () => {
        try {
          const response = await wishlistService.getWishlist();
          if (response.status === 'success' && response.data) {
            setWishlist(response.data);

            // Also store in localStorage for backup
            if (user?.id) {
              localStorage.setItem(`favorites_user_${user.id}`, JSON.stringify(response.data));
            }

            // Update shared wishlist for cross-browser sync
            triggerWishlistSync(response.data);
          }
        } catch (err) {
          // Silent fail
        }
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [isAuthenticated, user?.id]);

  // Handle authentication state changes
  useEffect(() => {
    // Function to handle auth state changes
    const handleAuthStateChange = async () => {
      // Case 1: User logged out
      if (prevAuthStateRef.current.isAuthenticated && !isAuthenticated) {

        // Get the current wishlist before clearing
        const currentWishlist = { ...wishlist };

        // Clear any user-specific wishlist data
        if (prevAuthStateRef.current.userId) {
          localStorage.removeItem(`favorites_user_${prevAuthStateRef.current.userId}`);
        }

        // Convert the authenticated wishlist to local format
        if (currentWishlist.items && currentWishlist.items.length > 0) {

          // Convert wishlist items to local format
          const localItems = currentWishlist.items.map(item => ({
            id: item.produit.id,
            nom_produit: item.produit.nom,
            prix_produit: item.prix_actuel || item.prix_reference,
            image_produit: item.produit.image,
            variante_id: item.variante?.id || null,
            note: item.note || ''
          }));

          // Save to localStorage
          localStorage.setItem('favorites', JSON.stringify(localItems));

          // Create updated wishlist object with local IDs
          const localWishlistObj = {
            liste_souhait: {
              id: 0,
              nom: 'Ma liste de souhaits',
              description: null,
              nombre_items: localItems.length
            },
            items: localItems.map(item => ({
              id: `local_${item.id}_${item.variante_id || 0}`,
              produit: {
                id: item.id,
                nom: item.nom_produit,
                image: item.image_produit,
                prix: item.prix_produit
              },
              variante: item.variante_id ? {
                id: item.variante_id
              } : null,
              note: item.note || '',
              prix_reference: item.prix_produit,
              prix_actuel: item.prix_produit,
              date_ajout: new Date().toISOString()
            }))
          };

          setWishlist(localWishlistObj);

          // Also update shared wishlist
          triggerWishlistSync(localWishlistObj);
        } else {
          // Check for guest wishlist data
          const localWishlist = JSON.parse(localStorage.getItem('favorites')) || [];
          if (localWishlist.length > 0) {

            const localWishlistObj = {
              liste_souhait: {
                id: 0,
                nom: 'Ma liste de souhaits',
                description: null,
                nombre_items: localWishlist.length
              },
              items: localWishlist.map(item => ({
                id: `local_${item.id}_${item.variante_id || 0}`,
                produit: {
                  id: item.id,
                  nom: item.nom_produit,
                  image: item.image_produit,
                  prix: item.prix_produit
                },
                variante: item.variante_id ? {
                  id: item.variante_id
                } : null,
                note: item.note || '',
                prix_reference: item.prix_produit,
                prix_actuel: item.prix_produit,
                date_ajout: new Date().toISOString()
              }))
            };

            setWishlist(localWishlistObj);
          } else {
            // Reset to empty wishlist
            const emptyWishlist = {
              liste_souhait: {
                id: 0,
                nom: 'Ma liste de souhaits',
                description: null,
                nombre_items: 0
              },
              items: []
            };
            setWishlist(emptyWishlist);
          }
        }
      }

      // Case 2: User logged in
      if (!prevAuthStateRef.current.isAuthenticated && isAuthenticated) {

        // Check if we have local wishlist items to merge with server
        const localWishlist = JSON.parse(localStorage.getItem('favorites')) || [];
        const hasLocalItems = localWishlist.length > 0;

        // Force refresh wishlist from server
        try {
          // First get the current server wishlist
          const response = await wishlistService.getWishlist();

          if (response.status === 'success') {

            // Store in localStorage for backup and cross-browser sync
            if (user?.id) {
              localStorage.setItem(`favorites_user_${user.id}`, JSON.stringify(response.data));
            }

            // Update shared wishlist for cross-browser sync
            triggerWishlistSync(response.data);

            // Check if server wishlist is empty and we have local items
            if (response.data.items.length === 0 && hasLocalItems) {

              // Add each local item to the server wishlist
              for (const item of localWishlist) {
                try {
                  await wishlistService.addToWishlist(
                    item.id,
                    item.variante_id || null,
                    item.note || ''
                  );
                } catch (addError) {
                  // Silent fail
                }
              }

              // Get the updated wishlist from server
              const refreshResponse = await wishlistService.getWishlist();

              if (refreshResponse.status === 'success') {
                setWishlist(refreshResponse.data);

                // Clear local wishlist after successful sync
                localStorage.removeItem('favorites');

                // Update shared wishlist
                triggerWishlistSync(refreshResponse.data);

                // Store in localStorage for backup
                if (user?.id) {
                  localStorage.setItem(`favorites_user_${user.id}`, JSON.stringify(refreshResponse.data));
                }
              } else {
                // Use server wishlist if refresh fails
                setWishlist(response.data);
              }
            } else {
              // Server wishlist has items or no local items, use server wishlist
              setWishlist(response.data);

              // If we have local items, try to merge them with server
              if (hasLocalItems && response.data.items.length > 0) {

                // Add each local item to the server wishlist
                for (const item of localWishlist) {
                  try {
                    await wishlistService.addToWishlist(
                      item.id,
                      item.variante_id || null,
                      item.note || ''
                    );
                  } catch (addError) {
                    // Silent fail
                  }
                }

                // Get the updated wishlist from server
                const refreshResponse = await wishlistService.getWishlist();

                if (refreshResponse.status === 'success') {
                  setWishlist(refreshResponse.data);

                  // Clear local wishlist after successful sync
                  localStorage.removeItem('favorites');

                  // Update shared wishlist
                  triggerWishlistSync(refreshResponse.data);

                  // Store in localStorage for backup
                  if (user?.id) {
                    localStorage.setItem(`favorites_user_${user.id}`, JSON.stringify(refreshResponse.data));
                  }
                }
              }
            }
          }
        } catch (error) {
          // Silent fail
        }
      }

      // Update previous state reference
      prevAuthStateRef.current = { isAuthenticated, userId: user?.id };
    };

    // Call the handler when auth state changes
    handleAuthStateChange();

  }, [isAuthenticated, user?.id]);

  // Ref to track if we've already loaded the wishlist to prevent multiple loads
  const hasLoadedWishlistRef = useRef(false);

  // Load wishlist data from API or localStorage
  useEffect(() => {
    const loadWishlist = async () => {
      // Skip if we've already loaded the wishlist
      if (hasLoadedWishlistRef.current) {
        return;
      }

      setLoading(true);
      try {
        // Mark as loaded to prevent duplicate loads
        hasLoadedWishlistRef.current = true;

        if (isAuthenticated) {
          // If user is authenticated, try to get wishlist from API
          try {
            const response = await wishlistService.getWishlist();

            if (response.status === 'success' && response.data) {
              setWishlist(response.data);

              // Try to sync any local items that might exist
              const localWishlist = JSON.parse(localStorage.getItem(`favorites_user_${user?.id}`)) || [];
              if (localWishlist.length > 0) {

                // Add each local item to the server wishlist
                for (const item of localWishlist) {
                  await wishlistService.addToWishlist(
                    item.id,
                    item.variante_id || null,
                    ''
                  );
                }

                // Clear localStorage after successful sync
                localStorage.removeItem(`favorites_user_${user?.id}`);

                // Refresh wishlist from server
                const refreshedResponse = await wishlistService.getWishlist();
                if (refreshedResponse.status === 'success' && refreshedResponse.data) {
                  setWishlist(refreshedResponse.data);
                }
              }
            } else {
              throw new Error('Invalid API response format');
            }
          } catch (apiError) {
            // If API fails, fallback to localStorage
            const localWishlist = JSON.parse(localStorage.getItem(`favorites_user_${user?.id}`)) || [];

            // Format local wishlist to match API response format
            setWishlist({
              liste_souhait: {
                id: 0,
                nom: 'Ma liste de souhaits',
                description: null,
                nombre_items: localWishlist.length
              },
              items: localWishlist.map(item => ({
                id: `local_${item.id}_${item.variante_id || 0}`,
                produit: {
                  id: item.id,
                  nom: item.nom_produit,
                  image: item.image_produit,
                  prix: item.prix_produit
                },
                variante: item.variante_id ? {
                  id: item.variante_id
                } : null,
                prix_reference: parseFloat(item.prix_produit || 0),
                prix_actuel: parseFloat(item.prix_produit || 0),
                prix_a_change: false,
                difference_prix: 0,
                date_ajout: new Date().toISOString()
              }))
            });
          }
        } else {
          // For unauthenticated users, use sessionStorage
          const localWishlist = JSON.parse(sessionStorage.getItem('favorites')) || [];

          setWishlist({
            liste_souhait: {
              id: 0,
              nom: 'Ma liste de souhaits',
              description: null,
              nombre_items: localWishlist.length
            },
            items: localWishlist.map(item => ({
              id: `local_${item.id}_${item.variante_id || 0}`,
              produit: {
                id: item.id,
                nom: item.nom_produit,
                image: item.image_produit,
                prix: item.prix_produit
              },
              variante: item.variante_id ? {
                id: item.variante_id
              } : null,
              prix_reference: parseFloat(item.prix_produit || 0),
              prix_actuel: parseFloat(item.prix_produit || 0),
              prix_a_change: false,
              difference_prix: 0,
              date_ajout: new Date().toISOString()
            }))
          });
        }
      } catch (err) {
        setError('Failed to load wishlist data');

        // Fallback to localStorage in case of any error
        const storageKey = isAuthenticated && user ? `favorites_user_${user.id}` : 'favorites';
        const localWishlist = JSON.parse(localStorage.getItem(storageKey)) || [];

        setWishlist({
          liste_souhait: {
            id: 0,
            nom: 'Ma liste de souhaits',
            description: null,
            nombre_items: localWishlist.length
          },
          items: localWishlist.map(item => ({
            id: `local_${item.id}_${item.variante_id || 0}`,
            produit: {
              id: item.id,
              nom: item.nom_produit,
              image: item.image_produit,
              prix: item.prix_produit
            },
            variante: item.variante_id ? {
              id: item.variante_id
            } : null,
            prix_reference: parseFloat(item.prix_produit || 0),
            prix_actuel: parseFloat(item.prix_produit || 0),
            prix_a_change: false,
            difference_prix: 0,
            date_ajout: new Date().toISOString()
          }))
        });
      } finally {
        setLoading(false);
      }
    };

    // Only load wishlist when authentication state is determined
    if (isAuthenticated !== undefined) {
      loadWishlist();
    }
  }, [isAuthenticated, user]);

  // Check if a product is in the wishlist
  const isInWishlist = async (productId, variantId = null) => {
    // First check local state for immediate response
    const inLocalState = wishlist.items.some(item =>
      item.produit.id.toString() === productId.toString() &&
      (variantId
        ? (item.variante && item.variante.id.toString() === variantId.toString())
        : !item.variante)
    );

    // For non-authenticated users or for immediate response, return the local check
    if (!isAuthenticated) {
      return inLocalState;
    }

    // For authenticated users, also check with the API in the background
    try {
      const response = await wishlistService.checkWishlist(productId, variantId);
      const apiResult = response.status === 'success' && response.data.in_wishlist;

      // If there's a mismatch between local state and API, refresh the wishlist
      if (apiResult !== inLocalState) {
        // Use setTimeout to avoid blocking the UI
        setTimeout(() => refreshWishlist(), 0);
      }

      return apiResult;
    } catch (err) {
      // Fallback to local state if API fails
      return inLocalState;
    }
  };

  // Add item to wishlist
  const addToWishlist = async (product, variant = null, note = '') => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        // Use API for authenticated users

        const response = await wishlistService.addToWishlist(
          product.id,
          variant?.id || null,
          note
        );

        if (response.status === 'success') {
          setWishlist(response.data);

          // Trigger sync to update other tabs/devices
          triggerWishlistSync(response.data);

          // Also store in localStorage for backup
          if (user?.id) {
            localStorage.setItem(`favorites_user_${user.id}`, JSON.stringify(response.data));
          }
        }
      } else {
        // Use sessionStorage for unauthenticated users (temporary storage)
        const localWishlist = JSON.parse(sessionStorage.getItem('favorites')) || [];

        // Check if product already exists in wishlist
        const existingItemIndex = localWishlist.findIndex(item =>
          item.id.toString() === product.id.toString() &&
          (variant
            ? (item.variante_id && item.variante_id.toString() === variant.id.toString())
            : !item.variante_id)
        );

        if (existingItemIndex === -1) {
          // Add new item if it doesn't exist
          localWishlist.push({
            id: product.id,
            nom_produit: product.nom_produit || product.nom,
            prix_produit: variant?.prix_supplement
              ? (product.prix_produit || product.prix) + variant.prix_supplement
              : (product.prix_produit || product.prix),
            image_produit: product.image_produit || product.image,
            variante_id: variant?.id || null,
            variante_sku: variant?.sku || null,
            note: note
          });

          // Save to sessionStorage (temporary storage)
          sessionStorage.setItem('favorites', JSON.stringify(localWishlist));

          // Create updated wishlist object
          const updatedWishlist = {
            liste_souhait: {
              id: 0,
              nom: 'Ma liste de souhaits',
              description: null,
              nombre_items: localWishlist.length
            },
            items: localWishlist.map(item => ({
              id: `local_${item.id}_${item.variante_id || 0}`,
              produit: {
                id: item.id,
                nom: item.nom_produit,
                image: item.image_produit,
                prix: item.prix_produit
              },
              variante: item.variante_id ? {
                id: item.variante_id
              } : null,
              note: item.note || '',
              prix_reference: item.prix_produit,
              prix_actuel: item.prix_produit,
              date_ajout: new Date().toISOString()
            }))
          };

          // Update state
          setWishlist(updatedWishlist);

          // Trigger sync to update other tabs/devices
          triggerWishlistSync(updatedWishlist);
        }
      }
    } catch (err) {
      setError('Failed to add item to wishlist');
    } finally {
      setLoading(false);
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (itemId) => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        // Use API for authenticated users

        const response = await wishlistService.removeFromWishlist(itemId);

        if (response.status === 'success') {
          setWishlist(response.data);

          // Trigger sync to update other tabs/devices
          triggerWishlistSync(response.data);

          // Also store in localStorage for backup
          if (user?.id) {
            localStorage.setItem(`favorites_user_${user.id}`, JSON.stringify(response.data));
          }
        }
      } else {
        // Use sessionStorage for unauthenticated users (temporary storage)
        const localWishlist = JSON.parse(sessionStorage.getItem('favorites')) || [];
        let updatedWishlist = [];

        // Check if itemId is a string that can be split (local format)
        if (typeof itemId === 'string' && itemId.includes('_')) {
          // Extract product ID and variant ID from local item ID
          const parts = itemId.split('_');
          if (parts.length >= 3) {
            const [_, productId, variantId] = parts;

            // Filter out the item
            updatedWishlist = localWishlist.filter(item =>
              !(item.id.toString() === productId &&
                (variantId === '0' ? !item.variante_id : item.variante_id?.toString() === variantId))
            );
          } else {
            updatedWishlist = localWishlist;
          }
        } else {
          // Handle numeric or non-string itemId (direct item ID from API)

          // Find the item in the local wishlist that matches this ID
          updatedWishlist = localWishlist.filter(item => {
            // Convert both to strings for comparison
            return item.id.toString() !== itemId.toString();
          });
        }

        // Save to sessionStorage (temporary storage)
        sessionStorage.setItem('favorites', JSON.stringify(updatedWishlist));

        // Create updated wishlist object
        const updatedWishlistObj = {
          liste_souhait: {
            id: 0,
            nom: 'Ma liste de souhaits',
            description: null,
            nombre_items: updatedWishlist.length
          },
          items: updatedWishlist.map(item => ({
            id: `local_${item.id}_${item.variante_id || 0}`,
            produit: {
              id: item.id,
              nom: item.nom_produit,
              image: item.image_produit,
              prix: item.prix_produit
            },
            variante: item.variante_id ? {
              id: item.variante_id
            } : null,
            note: item.note || '',
            prix_reference: item.prix_produit,
            prix_actuel: item.prix_produit,
            date_ajout: new Date().toISOString()
          }))
        };

        // Update state
        setWishlist(updatedWishlistObj);

        // Trigger sync to update other tabs/devices
        triggerWishlistSync(updatedWishlistObj);
      }
    } catch (err) {
      setError('Failed to remove item from wishlist');
    } finally {
      setLoading(false);
    }
  };

  // Move item from wishlist to cart
  const moveToCart = async (itemId, quantity = 1) => {
    try {
      setLoading(true);

      if (isAuthenticated) {
        // Use API for authenticated users

        const response = await wishlistService.moveToCart(itemId, quantity);

        if (response.status === 'success') {
          setWishlist(response.data.liste_souhait);

          // Trigger sync to update other tabs/devices
          triggerWishlistSync(response.data.liste_souhait);

          // Also store in localStorage for backup
          if (user?.id) {
            localStorage.setItem(`favorites_user_${user.id}`, JSON.stringify(response.data.liste_souhait));
          }

          // The cart will be updated automatically via the CartContext
        }
      } else {
        // Use sessionStorage for unauthenticated users (temporary storage)
        const localWishlist = JSON.parse(sessionStorage.getItem('favorites')) || [];
        let itemIndex = -1;
        let productData = null;
        let variantData = null;

        // Check if itemId is a string that can be split (local format)
        if (typeof itemId === 'string' && itemId.includes('_')) {
          // Extract product ID and variant ID from local item ID
          const parts = itemId.split('_');
          if (parts.length >= 3) {
            const [_, productId, variantId] = parts;

            // Find the item in the wishlist
            itemIndex = localWishlist.findIndex(item =>
              item.id.toString() === productId &&
              (variantId === '0' ? !item.variante_id : item.variante_id?.toString() === variantId)
            );

            if (itemIndex >= 0) {
              productData = localWishlist[itemIndex];
              if (productData.variante_id) {
                variantData = { id: productData.variante_id };
              }
            }
          } else {
            // Invalid item ID format
          }
        } else {
          // Handle numeric or non-string itemId (direct item ID from API)

          // Find the item in the local wishlist that matches this ID
          itemIndex = localWishlist.findIndex(item => {
            // Convert both to strings for comparison
            return item.id.toString() === itemId.toString();
          });

          if (itemIndex >= 0) {
            productData = localWishlist[itemIndex];
            if (productData.variante_id) {
              variantData = { id: productData.variante_id };
            }
          }
        }



        if (itemIndex >= 0 && productData) {
          // Add to cart
          await addToCart(
            {
              id: productData.id,
              nom_produit: productData.nom_produit,
              prix_produit: productData.prix_produit,
              image_produit: productData.image_produit
            },
            variantData,
            quantity
          );

          // Remove from wishlist
          localWishlist.splice(itemIndex, 1);
          sessionStorage.setItem('favorites', JSON.stringify(localWishlist));

          // Create updated wishlist object
          const updatedWishlist = {
            liste_souhait: {
              id: 0,
              nom: 'Ma liste de souhaits',
              description: null,
              nombre_items: localWishlist.length
            },
            items: localWishlist.map(item => ({
              id: `local_${item.id}_${item.variante_id || 0}`,
              produit: {
                id: item.id,
                nom: item.nom_produit,
                image: item.image_produit,
                prix: item.prix_produit
              },
              variante: item.variante_id ? {
                id: item.variante_id
              } : null,
              note: item.note || '',
              prix_reference: item.prix_produit,
              prix_actuel: item.prix_produit,
              date_ajout: new Date().toISOString()
            }))
          };

          // Update state
          setWishlist(updatedWishlist);

          // Trigger sync to update other tabs/devices
          triggerWishlistSync(updatedWishlist);
        } else {
          setError('Item not found in wishlist');
        }
      }
    } catch (err) {
      setError('Failed to move item to cart');
    } finally {
      setLoading(false);
    }
  };

  // Toggle wishlist status (add or remove)
  const toggleWishlist = async (product, variant = null) => {
    // First check locally for immediate feedback
    const localCheck = wishlist.items.some(item =>
      item.produit.id.toString() === product.id.toString() &&
      (variant
        ? (item.variante && item.variante.id.toString() === variant.id.toString())
        : !item.variante)
    );

    // Apply optimistic update for immediate UI feedback
    if (localCheck) {
      // Item is in wishlist, remove it optimistically

      // Create a copy of the current wishlist
      const updatedItems = wishlist.items.filter(item =>
        !(item.produit.id.toString() === product.id.toString() &&
          (variant
            ? (item.variante && item.variante.id.toString() === variant.id.toString())
            : !item.variante))
      );

      // Update state immediately for responsive UI
      setWishlist({
        ...wishlist,
        items: updatedItems,
        liste_souhait: {
          ...wishlist.liste_souhait,
          nombre_items: updatedItems.length
        }
      });

      // Find the item ID to remove
      let itemId;

      if (isAuthenticated) {
        // For authenticated users, find the item in the original wishlist
        const item = wishlist.items.find(item =>
          item.produit.id.toString() === product.id.toString() &&
          (variant
            ? (item.variante && item.variante.id.toString() === variant.id.toString())
            : !item.variante)
        );

        if (item) {
          itemId = item.id;

          // Perform actual removal in the background
          removeFromWishlist(itemId).catch(() => {
            // Revert optimistic update if the API call fails
            refreshWishlist();
          });
        } else {
          // Item not found in wishlist
        }
      } else {
        // For unauthenticated users, construct a local ID
        itemId = `local_${product.id}_${variant?.id || 0}`;

        // Perform actual removal in the background
        removeFromWishlist(itemId).catch(() => {
          // Revert optimistic update if the operation fails
          refreshWishlist();
        });
      }
    } else {
      // Item is not in wishlist, add it optimistically

      // Create a new item
      const newItem = {
        id: isAuthenticated ? `temp_${Date.now()}` : `local_${product.id}_${variant?.id || 0}`,
        produit: {
          id: product.id,
          nom: product.nom_produit || product.nom,
          image: product.image_produit || product.image,
          prix: product.prix_produit || product.prix
        },
        variante: variant ? {
          id: variant.id
        } : null,
        note: '',
        prix_reference: product.prix_produit || product.prix,
        prix_actuel: product.prix_produit || product.prix,
        date_ajout: new Date().toISOString()
      };

      // Update state immediately for responsive UI
      setWishlist({
        ...wishlist,
        items: [...wishlist.items, newItem],
        liste_souhait: {
          ...wishlist.liste_souhait,
          nombre_items: wishlist.items.length + 1
        }
      });

      // Perform actual addition in the background
      addToWishlist(product, variant).catch(() => {
        // Revert optimistic update if the API call fails
        refreshWishlist();
      });
    }

    // Also perform the actual check in the background to ensure consistency
    isInWishlist(product.id, variant?.id).then(inWishlist => {
      // If there's a mismatch between our optimistic update and the actual state,
      // refresh the wishlist to ensure consistency
      if (inWishlist !== localCheck) {
        refreshWishlist();
      }
    }).catch(() => {
      // Silent fail
    });
  };

  // Value object to be provided to consumers
  const value = {
    wishlist,
    loading,
    error,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    moveToCart,
    toggleWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
