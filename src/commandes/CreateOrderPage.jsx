import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/Contexts/AuthContext';
import { useCart } from '@/Contexts/CartContext';
import orderService from '@/Services/order.service';
import authService from '@/Services/auth.service';
import { keycloak } from '@/Services/keycloakInstance';
import LoadingSpinner from '@/Components/LoadingSpinner';
import DynamicButton from '@/Components/DynamicButton';

const CreateOrderPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { cart, clearCart } = useCart();

  const [formData, setFormData] = useState({
    adresse_commande: '',
    ville_commande: '',
    code_postal_commande: '',
    telephone_commande: '',
    email_commande: '',
    remise_commande: 0,
    produits: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch user profile data from API
  const fetchUserProfile = async () => {
    if (!isAuthenticated) return;

    setProfileLoading(true);
    try {
      // Try to get the user profile from the API
      const userData = await authService.getCurrentUser();

      // Handle different response structures
      // The API might return the user data directly or nested in a 'user' property
      const profileData = userData.user || userData;
      setUserProfile(profileData);

      // Pre-fill form with the fetched user data, checking all possible field names
      setFormData(prev => ({
        ...prev,
        email_commande: profileData.email ||
                       profileData.email_client ||
                       user?.email ||
                       '',
        telephone_commande: profileData.telephone ||
                          profileData.phone ||
                          profileData.telephone_client ||
                          user?.telephone ||
                          '',
        adresse_commande: profileData.adresse ||
                         profileData.address ||
                         profileData.adresse_client ||
                         user?.adresse ||
                         '',
        ville_commande: profileData.ville ||
                       profileData.city ||
                       profileData.ville_client ||
                       user?.ville ||
                       '',
        code_postal_commande: profileData.code_postal ||
                             profileData.postal_code ||
                             profileData.code_postal_client ||
                             user?.code_postal ||
                             ''
      }));

    } catch (error) {
      // Fall back to using the user data from context
      setFormData(prev => ({
        ...prev,
        email_commande: user?.email || '',
        telephone_commande: user?.telephone || user?.phone || '',
        adresse_commande: user?.adresse || user?.address || '',
        ville_commande: user?.ville || user?.city || '',
        code_postal_commande: user?.code_postal || user?.postal_code || ''
      }));
    } finally {
      setProfileLoading(false);
    }
  };

  // Pre-fill form with user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // First, set the form data with what we have from the context
      setFormData(prev => ({
        ...prev,
        email_commande: user.email || '',
        telephone_commande: user.telephone || '',
        adresse_commande: user.adresse || '',
        ville_commande: user.ville || '',
        code_postal_commande: user.code_postal || ''
      }));

      // Then fetch the complete profile data
      fetchUserProfile();
    }
  }, [isAuthenticated, user]);

  // Convert cart items to order products format according to API documentation
  useEffect(() => {
    if (cart && cart.items && cart.items.length > 0) {

      // Format products according to the API documentation
      const orderProducts = cart.items.map(item => {
        // Ensure we have valid data
        const productId = item.produit?.id;
        if (!productId) {
          return null;
        }

        // Get price and quantity
        const price = typeof item.produit.prix === 'number' ?
                    item.produit.prix :
                    parseFloat(item.produit.prix || 0);

        const quantity = typeof item.quantite === 'number' ?
                       item.quantite :
                       parseFloat(item.quantite || 1);

        // Return formatted product data according to API documentation
        return {
          id: productId,
          quantite: quantity,
          prix_unitaire: price
        };
      }).filter(Boolean); // Remove any null items

      if (orderProducts.length === 0) {
        setError('Votre panier ne contient pas de produits valides. Veuillez ajouter des produits avant de passer commande.');
      } else {
        setFormData(prev => ({
          ...prev,
          produits: orderProducts
        }));
      }
    } else {
      // Clear products if cart is empty
      setFormData(prev => ({
        ...prev,
        produits: []
      }));

      setError('Votre panier est vide. Veuillez ajouter des produits avant de passer commande.');
    }
  }, [cart]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.adresse_commande) {
      errors.adresse_commande = 'L\'adresse est requise';
    }

    if (!formData.ville_commande) {
      errors.ville_commande = 'La ville est requise';
    }

    if (!formData.code_postal_commande) {
      errors.code_postal_commande = 'Le code postal est requis';
    }

    if (!formData.telephone_commande) {
      errors.telephone_commande = 'Le numéro de téléphone est requis';
    }

    if (!formData.email_commande) {
      errors.email_commande = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email_commande)) {
      errors.email_commande = 'L\'email n\'est pas valide';
    }

    if (formData.produits.length === 0) {
      errors.produits = 'Votre panier est vide';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get user_id from the fetched profile or other sources
      let userId = null;



      // First priority: Use the ID from the fetched user profile (most reliable)
      if (userProfile) {
        // Handle different API response formats
        if (userProfile.id) {
          userId = userProfile.id;
        } else if (userProfile.user && userProfile.user.id) {
          userId = userProfile.user.id;
        }
      }

      // Second priority: Use the ID from the auth context
      if (!userId && isAuthenticated && user) {
        // Try to get the user ID from various possible properties
        if (user.id) {
          userId = user.id;
        } else if (user.user && user.user.id) {
          userId = user.user.id;
        } else if (user.sub) {
          userId = user.sub;
        } else if (user.keycloak_id) {
          userId = user.keycloak_id;
        } else if (user.tokenParsed && user.tokenParsed.sub) {
          userId = user.tokenParsed.sub;
        }
      }

      // Third priority: Try to get the ID from keycloak directly
      if (!userId && keycloak && keycloak.authenticated) {
        try {
          // Try to refresh the token first
          await keycloak.updateToken(30);

          // Make a direct API call to get the user ID
          const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user`, {
            headers: {
              'Authorization': `Bearer ${keycloak.token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            if (userData.id) {
              userId = userData.id;
            } else if (userData.user && userData.user.id) {
              userId = userData.user.id;
            }
          }
        } catch (error) {
          // Silently handle error
        }

        // If we still don't have a user ID, try to use the Keycloak sub
        if (!userId && keycloak.tokenParsed && keycloak.tokenParsed.sub) {
          // For this API, we need a numeric user ID, not a UUID
          // Try to get the user ID from the backend using the Keycloak sub
          try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/user-by-sub/${keycloak.tokenParsed.sub}`, {
              headers: {
                'Authorization': `Bearer ${keycloak.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });

            if (response.ok) {
              const userData = await response.json();
              if (userData.id) {
                userId = userData.id;
              }
            }
          } catch (error) {
            // Silently handle error
          }
        }
      }

      // If we still don't have a user ID, try to get it from localStorage
      if (!userId) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user'));
          if (storedUser && storedUser.id) {
            userId = storedUser.id;
          }
        } catch (err) {
          // Silently handle error
        }
      }

      // If we still don't have a user ID, make a last attempt with a direct API call
      if (!userId && keycloak && keycloak.token) {
        try {
          // Try a different endpoint that might return the user ID
          const response = await fetch(`${import.meta.env.VITE_API_URL}/clients/current`, {
            headers: {
              'Authorization': `Bearer ${keycloak.token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            const clientData = await response.json();
            if (clientData.id) {
              userId = clientData.id;
            }
          }
        } catch (error) {
          // Silently handle error
        }
      }

      // If we still don't have a user ID, show an error
      if (!userId) {

        // Show an error message to the user
        setError('Impossible de déterminer votre identifiant utilisateur. Veuillez vous reconnecter et réessayer.');
        setLoading(false);
        return; // Stop the form submission
      }

      // Ensure userId is a number if possible (API might expect numeric IDs)
      if (typeof userId === 'string' && !isNaN(userId)) {
        userId = parseInt(userId, 10);
      }

      const orderData = {
        ...formData,
        user_id: userId
      };

      const response = await orderService.createOrder(orderData);

      if (response.status === 'error') {
        // Set the error message
        setError(response.message || 'Une erreur est survenue lors de la création de la commande');

        // Handle validation errors from server
        if (response.errors) {
          setValidationErrors(response.errors);

          // Create a more detailed error message for the user
          const errorDetails = Object.entries(response.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ');

          setError(`Erreur de validation: ${errorDetails}`);
        }

        // If there's a specific user_id error, show it in the UI
        if (response.error && response.error.includes('user id field')) {
          setError('Erreur d\'identification utilisateur. Veuillez vous reconnecter et réessayer.');

          // Try to refresh the authentication
          if (keycloak && keycloak.authenticated) {
            try {
              await keycloak.updateToken(30);
            } catch (refreshError) {
              // Silently handle error
            }
          }
        }

        // If there's a product-related error
        if (response.errors && (response.errors.produits || response.errors.products)) {
          const productErrors = response.errors.produits || response.errors.products;
          setError(`Erreur avec les produits: ${productErrors.join(', ')}`);
        }
      } else {
        setSuccess(true);

        // Clear cart after successful order
        await clearCart();

        // Get the order ID from the response
        // The API might return the ID in different formats, so we need to handle all possibilities
        const orderId = response.id ||
                       (response.data && response.data.id) ||
                       (typeof response === 'object' && 'id' in response ? response.id : null);

        // Redirect to order details after a short delay
        setTimeout(() => {
          if (orderId) {
            navigate(`/commandes/${orderId}`);
          } else {
            // If no order ID is found, redirect to the orders list
            navigate('/commandes');
          }
        }, 2000);
      }
    } catch (err) {
      // Handle different types of errors
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx

        if (err.response.status === 401) {
          setError('Vous n\'êtes pas autorisé à créer une commande. Veuillez vous reconnecter.');
        } else if (err.response.status === 422) {
          // Validation error
          const errorData = err.response.data;
          if (errorData.errors) {
            setValidationErrors(errorData.errors);

            // Create a more detailed error message
            const errorDetails = Object.entries(errorData.errors)
              .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
              .join('; ');

            setError(`Erreur de validation: ${errorDetails}`);
          } else {
            setError(errorData.message || 'Erreur de validation des données.');
          }
        } else {
          setError(`Erreur serveur (${err.response.status}): ${err.response.data.message || 'Veuillez réessayer.'}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError('Aucune réponse du serveur. Veuillez vérifier votre connexion internet.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Erreur lors de la création de la commande: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-3V9m0 0V7m0 2h2m-2 0H9" />
            </svg>
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Connexion requise</h2>
            <p className="text-gray-600 mb-6">Vous devez être connecté pour passer une commande.</p>
            <DynamicButton
              label="Se connecter"
              to="/login"
              className="inline-block"
            />
          </div>
        </div>
      </div>
    );
  }

  // Redirect if cart is empty
  if (cart.items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Votre panier est vide</h2>
            <p className="text-gray-600 mb-6">Ajoutez des produits à votre panier avant de passer une commande.</p>
            <DynamicButton
              label="Continuer vos achats"
              to="/products"
              className="inline-block"
            />
          </div>
        </div>
      </div>
    );
  }

  // Success message
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Commande créée avec succès!</h2>
            <p className="text-gray-600 mb-6">Votre commande a été enregistrée. Vous allez être redirigé vers les détails de votre commande.</p>
            <LoadingSpinner size="md" variant="elegant" color="#A67B5B" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light tracking-wider text-gray-900 mb-4">
            Finaliser votre commande
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Veuillez remplir les informations ci-dessous pour finaliser votre commande.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-gray-800">Informations de livraison</h2>
              {profileLoading && (
                <div className="flex items-center text-sm text-gray-500">
                  <LoadingSpinner size="xs" variant="circle" color="#A67B5B" className="mr-2" />
                  Chargement du profil...
                </div>
              )}
              {userProfile && !profileLoading && (
                <div className="text-sm text-green-600">
                  Profil chargé avec succès
                </div>
              )}
            </div>
            {userProfile && (
              <div className="mt-2 text-sm text-gray-600">
                Commande pour: {userProfile.name || user?.name || 'Client'} (ID: {userProfile.id || 'Non disponible'})
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label htmlFor="email_commande" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="email_commande"
                  name="email_commande"
                  value={formData.email_commande}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-[#A67B5B] focus:border-[#A67B5B] ${
                    validationErrors.email_commande ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre email"
                />
                {validationErrors.email_commande && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email_commande}</p>
                )}
              </div>
              <div>
                <label htmlFor="telephone_commande" className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  id="telephone_commande"
                  name="telephone_commande"
                  value={formData.telephone_commande}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-[#A67B5B] focus:border-[#A67B5B] ${
                    validationErrors.telephone_commande ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre numéro de téléphone"
                />
                {validationErrors.telephone_commande && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.telephone_commande}</p>
                )}
              </div>
              <div>
                <label htmlFor="adresse_commande" className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse *
                </label>
                <input
                  type="text"
                  id="adresse_commande"
                  name="adresse_commande"
                  value={formData.adresse_commande}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-[#A67B5B] focus:border-[#A67B5B] ${
                    validationErrors.adresse_commande ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre adresse"
                />
                {validationErrors.adresse_commande && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.adresse_commande}</p>
                )}
              </div>
              <div>
                <label htmlFor="ville_commande" className="block text-sm font-medium text-gray-700 mb-1">
                  Ville *
                </label>
                <input
                  type="text"
                  id="ville_commande"
                  name="ville_commande"
                  value={formData.ville_commande}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-[#A67B5B] focus:border-[#A67B5B] ${
                    validationErrors.ville_commande ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre ville"
                />
                {validationErrors.ville_commande && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.ville_commande}</p>
                )}
              </div>
              <div>
                <label htmlFor="code_postal_commande" className="block text-sm font-medium text-gray-700 mb-1">
                  Code postal *
                </label>
                <input
                  type="text"
                  id="code_postal_commande"
                  name="code_postal_commande"
                  value={formData.code_postal_commande}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-[#A67B5B] focus:border-[#A67B5B] ${
                    validationErrors.code_postal_commande ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Votre code postal"
                />
                {validationErrors.code_postal_commande && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.code_postal_commande}</p>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif de la commande</h3>

              {/* Order summary */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="space-y-4">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-gray-800 font-medium">{item.produit.nom}</span>
                        <span className="text-gray-500 ml-2">x{item.quantite}</span>
                      </div>
                      <span className="text-gray-800">{(item.produit.prix * item.quantite).toFixed(2)} DT</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-4 flex justify-between">
                    <span className="text-gray-800 font-medium">Total:</span>
                    <span className="text-gray-900 font-bold">{cart.total.toFixed(2)} DT</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <DynamicButton
                  label="Retour au panier"
                  to="/Cart"
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-[#A67B5B] text-white rounded-md hover:bg-[#8B5A2B] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A67B5B]"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <LoadingSpinner size="xs" variant="circle" color="#FFFFFF" className="mr-2" />
                      Traitement...
                    </span>
                  ) : (
                    'Confirmer la commande'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderPage;
