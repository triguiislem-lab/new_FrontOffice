import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useWishlist } from "@/Contexts/WishlistContext";
import { useCart } from "@/Contexts/CartContext";
import { useAuth } from "@/Contexts/AuthContext";
import LoadingSpinner from "../Components/LoadingSpinner";

// Custom CSS for animations
const customStyles = `
  @keyframes pulse-width {
    0% { width: 15%; }
    50% { width: 85%; }
    100% { width: 15%; }
  }

  .animate-pulse-width {
    animation: pulse-width 2s ease-in-out infinite;
  }
`;

const FavoritesPage = () => {
  const { wishlist, loading, error, removeFromWishlist, moveToCart } = useWishlist();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [productImages, setProductImages] = useState({});

  const handleMoveToCart = (itemId) => {
    moveToCart(itemId, 1);
  };

  // Fetch product images when wishlist changes
  useEffect(() => {
    const fetchProductImages = async () => {
      if (!wishlist || !wishlist.items || wishlist.items.length === 0) return;

      // Get unique product IDs
      const productIds = wishlist.items
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
                }
              }
            } catch (error) {
              // Silent fail
            }
          })
        );

        if (Object.keys(newImages).length > 0) {
          setProductImages(prevImages => ({
            ...prevImages,
            ...newImages
          }));
        }
      } catch (error) {
        // Silent fail
      }
    };

    fetchProductImages();
  }, [wishlist]);

  if (loading) {
    return (
      <div className="bg-[#FAFAFA] min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="text-center max-w-md mx-auto px-4 py-12 bg-white rounded-lg shadow-md">
            <LoadingSpinner size="lg" variant="elegant" color="#A67B5B" />
            <p className="mt-6 text-gray-600 font-light tracking-wide">Chargement de votre liste d'envies...</p>
            <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-30"></div>
            <p className="text-sm text-gray-500 font-light">Veuillez patienter pendant que nous préparons vos articles favoris</p>
            <div className="mt-6 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-[#A67B5B] animate-pulse-width"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FAFAFA] min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-light text-gray-800 mb-4">Une erreur est survenue</h2>
            <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-4 opacity-30"></div>
            <p className="text-gray-600 mb-8 max-w-md">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center bg-[#A67B5B] text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transition-all duration-300 mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-800 font-serif" key="favorites-page">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {/* Hero Section */}
      <div className="relative py-20 bg-[#F5F2EE]">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute w-96 h-96 rounded-full bg-[#D4B78F] blur-3xl -top-20 -left-20"></div>
          <div className="absolute w-96 h-96 rounded-full bg-[#D4B78F] blur-3xl -bottom-20 -right-20"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-[0.3em] text-[#A67B5B] mb-4">Collection Personnelle</p>
            <h1 className="text-4xl md:text-5xl font-extralight tracking-wide mb-6">
              Ma Liste d'Envies
            </h1>
            <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-8 opacity-60"></div>
            <p className="text-base text-gray-600 font-light leading-relaxed tracking-wide">
              Vos articles favoris soigneusement sélectionnés, prêts à transformer votre intérieur
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Authentication status notification */}
        <div className={`mb-8 p-4 rounded-lg ${isAuthenticated ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
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
                  <p>Votre liste d'envies sera sauvegardée de façon permanente et accessible depuis tous vos appareils.</p>
                ) : (
                  <p>Votre liste d'envies est temporairement stockée sur cet appareil. Pour la sauvegarder de façon permanente, veuillez vous <Link to="/login" className="font-medium underline">connecter</Link>.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {wishlist.items.length === 0 ? (
          <div className="bg-white border border-gray-100 p-16 text-center shadow-sm">
            <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-[#F5F2EE] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#A67B5B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-light tracking-wide text-gray-800 mb-4">Votre collection personnelle est vide</h3>
            <p className="text-gray-500 font-light max-w-md mx-auto mb-10">Explorez notre catalogue et ajoutez vos articles préférés à votre liste d'envies pour les retrouver facilement.</p>
            <button
              onClick={() => navigate('/home')}
              className="inline-block font-light text-[#A67B5B] border-[0.5px] border-[#A67B5B] bg-transparent px-10 py-3 text-sm tracking-[0.2em] hover:bg-[#A67B5B] hover:text-white transition-all duration-300"
            >
              DÉCOUVRIR NOS COLLECTIONS
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {wishlist.items.map((item) => (
              <div key={item.id} className="bg-white border border-gray-100 overflow-hidden transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-2/5 lg:w-1/3 overflow-hidden relative group">
                    <img
                      src={
                        // For authenticated users, use the fetched image from API
                        isAuthenticated && item.produit?.id && productImages[item.produit.id]
                          ? productImages[item.produit.id]
                          // For unauthenticated users or fallback
                          : item.produit?.image_url ? item.produit.image_url
                          : item.produit?.image && item.produit.image.startsWith('http') ? item.produit.image
                          : item.image_produit ? item.image_produit
                          : "/placeholder-product.jpg"
                      }
                      alt={item.produit?.nom || 'Produit'}
                      className="w-full h-96 object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder-product.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                  </div>
                  <div className="flex-1 p-8 md:p-12 flex flex-col justify-between">
                    <div>
                      <h2 className="text-2xl font-light tracking-wider text-gray-800 mb-2">{item.produit.nom}</h2>

                      {/* Display variant attributes if available */}
                      {item.variante && item.variante.attributs && item.variante.attributs.length > 0 && (
                        <div className="text-sm text-gray-500 font-light mt-1 mb-4">
                          {item.variante.attributs.map((attr, index) => (
                            <span key={index} className="inline-block mr-4">
                              <span className="text-[#A67B5B]">{attr.nom}:</span> {attr.valeur}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Display price information */}
                      <div className="mb-8 mt-4">
                        {item.prix_a_change ? (
                          <div className="flex items-center gap-3">
                            <p className="text-xl font-light text-gray-800">
                              {typeof item.prix_actuel === 'number'
                                ? item.prix_actuel.toFixed(2)
                                : parseFloat(item.prix_actuel || 0).toFixed(2)} DT
                            </p>
                            <p className="text-sm text-gray-400 line-through font-light">
                              {typeof item.prix_reference === 'number'
                                ? item.prix_reference.toFixed(2)
                                : parseFloat(item.prix_reference || 0).toFixed(2)} DT
                            </p>
                            <span className={`text-xs px-3 py-1 rounded-sm font-light ${
                              (typeof item.difference_prix === 'number' ? item.difference_prix : parseFloat(item.difference_prix || 0)) > 0
                                ? 'bg-red-50 text-red-600'
                                : 'bg-green-50 text-green-600'
                            }`}>
                              {(typeof item.difference_prix === 'number' ? item.difference_prix : parseFloat(item.difference_prix || 0)) > 0 ? '+' : ''}
                              {typeof item.difference_prix === 'number'
                                ? item.difference_prix.toFixed(2)
                                : parseFloat(item.difference_prix || 0).toFixed(2)} DT
                            </span>
                          </div>
                        ) : (
                          <p className="text-xl font-light text-gray-800">
                            {typeof item.prix_actuel === 'number'
                              ? item.prix_actuel.toFixed(2)
                              : parseFloat(item.prix_actuel || 0).toFixed(2)} DT
                          </p>
                        )}
                      </div>

                      {/* Display note if available */}
                      {item.note && (
                        <div className="bg-[#F5F2EE] p-4 rounded-sm mb-6 text-sm font-light text-gray-700 border-l-2 border-[#A67B5B]">
                          "{item.note}"
                        </div>
                      )}

                      {/* Display date added */}
                      <p className="text-xs text-gray-400 font-light tracking-wide">
                        Ajouté le {new Date(item.date_ajout).toLocaleDateString('fr-FR', {day: '2-digit', month: 'long', year: 'numeric'})}
                      </p>
                    </div>

                    <div className="mt-10 border-t border-gray-100 pt-6">
                      <button
                        onClick={() => navigate(`/article/${item.produit.id}`)}
                        className="text-[#A67B5B] hover:text-[#8B5A2B] font-light tracking-wider transition duration-300 mb-8 inline-flex items-center group"
                      >
                        <span>DÉCOUVRIR</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>

                      <div className="flex flex-col sm:flex-row gap-4 mt-2">
                        <button
                          onClick={() => handleMoveToCart(item.id)}
                          className="inline-block font-light text-white border-[0.5px] border-[#A67B5B] bg-[#A67B5B] px-8 py-3 text-sm tracking-wider hover:bg-[#8B5A2B] transition-all duration-300"
                        >
                          AJOUTER AU PANIER
                        </button>

                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="flex items-center justify-center border-[0.5px] border-gray-200 hover:border-gray-300 py-3 px-6 transition duration-300 group"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>
  );
};

export default FavoritesPage;