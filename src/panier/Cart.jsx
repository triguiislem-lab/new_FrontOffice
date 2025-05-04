import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import LoadingSpinner from "../Components/LoadingSpinner";

function Cart() {
  const { user, isAuthenticated } = useAuth(); // Get user and authentication status
  const { cart, loading, error, addToCart: contextAddToCart, updateCartItem: contextUpdateCartItem,
          removeFromCart: contextRemoveFromCart, clearCart: contextClearCart, refreshCart } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [productImages, setProductImages] = useState({});

  // Fetch cart data from the backend (for authenticated users only)
  const fetchCart = async () => {
    if (isAuthenticated) {
      try {
        console.log('Fetching cart from API...');
        const response = await axios.get('https://laravel-api.fly.dev/api/cart', {
          headers: {
            Authorization: `Bearer ${user?.token}`, // Pass the user's token for authentication
          },
        });
        console.log('Cart API response:', response.data);
        return response.data.status === 'success';
      } catch (err) {
        console.error('Fetch cart error:', err);
        return false;
      }
    }
    return false;
  };

  // Add an item to the cart
  const addToCart = async (produit_id, variante_id = null, quantite = 1) => {
    try {
      if (isAuthenticated) {
        // For authenticated users, use direct API call
        const response = await axios.post(
          'https://laravel-api.fly.dev/api/cart/items',
          { produit_id, variante_id, quantite },
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );
        if (response.data.status === 'success') {
          fetchCart(); // Refresh the cart after adding an item
        } else {
          alert('Erreur lors de l\'ajout au panier.');
        }
      } else {
        // For unauthenticated users, use CartContext
        // Find the product details first
        const product = {
          id: produit_id,
          nom_produit: 'Produit', // Default name if not available
          prix_produit: 0, // Default price if not available
        };

        const variant = variante_id ? { id: variante_id } : null;

        await contextAddToCart(product, variant, quantite);
      }
    } catch (err) {
      alert('Erreur réseau lors de l\'ajout au panier.');
    }
  };

  // Update the quantity of a cart item
  const updateCartItem = async (itemId, quantite) => {
    try {
      await contextUpdateCartItem(itemId, quantite);
    } catch (err) {
      alert('Erreur réseau lors de la mise à jour de l\'article.');
    }
  };

  // Remove an item from the cart
  const removeFromCart = async (itemId) => {
    try {
      await contextRemoveFromCart(itemId);
    } catch (err) {
      alert('Erreur réseau lors de la suppression de l\'article.');
    }
  };

  // Clear the entire cart
  const clearCart = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vider votre panier ?')) {
      setClearing(true);
      try {
        await contextClearCart();
      } catch (err) {
        alert('Erreur réseau lors du vidage du panier.');
      } finally {
        setClearing(false);
      }
    }
  };

  // Merge guest cart with user cart
  const mergeCart = async (guestCartId, guestId) => {
    try {
      const response = await axios.post(
        'https://laravel-api.fly.dev/api/cart/merge',
        {
          guest_cart_id: guestCartId,
          guest_id: guestId, // Include the guest_id
          email: user?.email, // Optional, if required by the backend
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`, // Token contains client_id
          },
        }
      );

      if (response.data.status === 'success') {
        console.log('Cart merged successfully:', response.data);
        fetchCart(); // Refresh the cart after merging
      } else {
        console.error('Erreur lors de la fusion du panier:', response.data.message);
      }
    } catch (error) {
      if (error.response && error.response.status === 422) {
        console.error('Validation errors:', error.response.data.errors);
        alert('Erreur de validation: ' + JSON.stringify(error.response.data.errors));
      } else {
        console.error('Erreur réseau lors de la fusion du panier:', error);
      }
    }
  };

  // Refresh the cart manually
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (isAuthenticated) {
        await fetchCart();
      } else {
        await refreshCart();
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch product images when cart changes
  useEffect(() => {
    const fetchProductImages = async () => {
      if (!cart || !cart.items || cart.items.length === 0) return;

      // Get unique product IDs
      const productIds = cart.items
        .filter(item => item.produit && item.produit.id)
        .map(item => item.produit.id);

      if (productIds.length === 0) return;

      try {
        // Fetch images for each product
        const newImages = {};
        await Promise.all(
          productIds.map(async (productId) => {
            try {
              const response = await axios.get(
                `https://laravel-api.fly.dev/api/images/get?model_type=produit&model_id=${productId}`
              );

              if (response.data && response.data.images && response.data.images.length > 0) {
                // Find primary image or use the first one
                const primaryImage = response.data.images.find(img => img.is_primary) || response.data.images[0];
                if (primaryImage.direct_url) {
                  newImages[productId] = primaryImage.direct_url;
                  console.log(`Fetched image for product ${productId}:`, primaryImage.direct_url);
                }
              }
            } catch (error) {
              console.error(`Error fetching images for product ${productId}:`, error);
            }
          })
        );

        if (Object.keys(newImages).length > 0) {
          setProductImages(prevImages => ({
            ...prevImages,
            ...newImages
          }));
          console.log('Updated product images:', newImages);
        }
      } catch (error) {
        console.error('Error fetching product images:', error);
      }
    };

    fetchProductImages();
  }, [cart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" variant="circle" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="text-center py-10 text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Votre Panier</h1>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            disabled={refreshing}
          >
            {refreshing ? (
              <span className="flex items-center">
                <LoadingSpinner size="xs" variant="circle" className="mr-2" />
                Actualisation...
              </span>
            ) : (
              <span className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Actualiser
              </span>
            )}
          </button>
        </div>

        {/* Authentication status notification */}
        <div className={`mb-6 p-4 rounded-lg ${isAuthenticated ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              {isAuthenticated ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${isAuthenticated ? 'text-green-800' : 'text-amber-800'}`}>
                {isAuthenticated ? 'Vous êtes connecté' : 'Vous n\'êtes pas connecté'}
              </h3>
              <div className={`mt-1 text-sm ${isAuthenticated ? 'text-green-700' : 'text-amber-700'}`}>
                {isAuthenticated ? (
                  <p>Votre panier sera sauvegardé de façon permanente et accessible depuis tous vos appareils.</p>
                ) : (
                  <p>Votre panier est temporairement stocké sur cet appareil. Pour sauvegarder votre panier de façon permanente, veuillez vous <Link to="/login" className="font-medium underline">connecter</Link>.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {(!cart || !cart.items || cart.items.length === 0) ? (
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
            <p className="text-gray-500 mb-6">Votre panier est vide.</p>
            <Link
              to="/home"
              className="inline-block bg-[#A67B5B] text-white px-6 py-3 rounded hover:bg-[#8A5A3B] transition-colors"
            >
              Continuer vos achats
            </Link>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              {cart.items.map(item => (
                <div key={item.id} className="flex justify-between items-center py-4 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center">
                    <img
                      src={
                        // For authenticated users, use the fetched image from API
                        isAuthenticated && item.produit?.id && productImages[item.produit.id]
                          ? productImages[item.produit.id]
                          // For unauthenticated users or fallback
                          : item.produit?.image_url ? item.produit.image_url
                          : item.produit?.image && item.produit.image.startsWith('http') ? item.produit.image
                          : item.image_produit ? item.image_produit
                          : 'https://via.placeholder.com/150'
                      }
                      alt={item.produit?.nom || 'Produit'}
                      className="w-24 h-24 object-cover rounded-md mr-4"
                      onError={(e) => {
                        console.log('Image failed to load:', e.target.src);
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/150';
                      }}
                    />
                    <div>
                      <h2 className="text-xl font-semibold">{item.produit?.nom}</h2>
                      <p className="text-gray-700 mt-1">{(item.prix_unitaire || 0).toFixed(2)} DT</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center border border-gray-300 rounded">
                          <button
                            onClick={() => updateCartItem(item.id, item.quantite - 1)}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                            disabled={item.quantite <= 1}
                          >
                            -
                          </button>
                          <span className="px-3 py-1 border-x border-gray-300">{item.quantite}</span>
                          <button
                            onClick={() => updateCartItem(item.id, item.quantite + 1)}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-lg ml-auto">
                    {((item.quantite || 0) * (item.prix_unitaire || 0)).toFixed(2)} DT
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Sous-total</span>
                <span>{(cart.sous_total || 0).toFixed(2)} DT</span>
              </div>
              <div className="flex justify-between items-center mb-4 font-bold text-lg border-t border-gray-200 pt-4">
                <span>Total</span>
                <span>{(cart.total || 0).toFixed(2)} DT</span>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={clearCart}
                  className="px-6 py-3 border border-gray-300 rounded text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Vider le panier
                </button>
                <button
                  className="px-6 py-3 bg-[#A67B5B] text-white rounded hover:bg-[#8A5A3B] transition-colors ml-4"
                >
                  Passer la commande
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
