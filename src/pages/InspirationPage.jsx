import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from "../Components/LoadingSpinner";

// Custom CSS for animations and styling
const customStyles = `
  /* Custom animations for the inspiration page */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes subtle-zoom {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(1.05);
    }
  }

  @keyframes fade-up {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-subtle-zoom {
    animation: subtle-zoom 10s infinite alternate ease-in-out;
  }

  .animate-fade-up {
    animation: fade-up 1s ease-out forwards;
  }

  /* Collection card styling */
  .collection-card {
    transition: all 0.5s ease;
  }

  .collection-card:hover {
    transform: translateY(-10px);
  }

  .collection-card .image-container img {
    transition: transform 0.8s ease, filter 0.8s ease;
  }

  .collection-card:hover .image-container img {
    transform: scale(1.05);
    filter: brightness(1.05);
  }

  /* Product card styling */
  .product-card {
    transition: all 0.3s ease;
  }

  .product-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .product-card .image-container img {
    transition: transform 0.5s ease;
  }

  .product-card:hover .image-container img {
    transform: scale(1.1);
  }
`;

const InspirationPage = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionProducts, setCollectionProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [transitionState, setTransitionState] = useState('closed'); // 'closed', 'opening', 'open', 'closing'
  const productsSectionRef = useRef(null);

  // Images de secours pour les collections et produits
  const fallbackImages = [
    "/img/rustic-river-9510.jpeg",
    "/img/sunset-spice-9560.jpeg",
    "/img/maison-majorelle-9460.jpeg",
    "/img/beach-breeze-9356.jpeg"
  ];

  // Fonction pour récupérer les images d'une collection
  const fetchCollectionImages = async (collectionId) => {
    try {
      const response = await fetch(`https://laravel-api.fly.dev/api/images/get?model_type=collection&model_id=${collectionId}`);
      const data = await response.json();
      if (data && data.images && data.images.length > 0) {
        return data.images[0].direct_url || null;
      }
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération des images pour la collection ${collectionId}:`, error);
      return null;
    }
  };

  // Récupération des collections depuis l'API
  useEffect(() => {
    setLoading(true);
    const fetchCollections = async () => {
      try {
        const collectionsResponse = await fetch("https://laravel-api.fly.dev/api/collections");
        const collectionsData = await collectionsResponse.json();
        if (collectionsData && collectionsData.length > 0) {
          const processedCollections = [];
          for (const collection of collectionsData) {
            const imageUrl = await fetchCollectionImages(collection.id);
            processedCollections.push({
              id: collection.id,
              title: collection.nom || 'Collection',
              subtitle: collection.description?.split(' ').slice(0, 2).join(' ') || 'Sans titre',
              description: collection.description || 'Aucune description disponible',
              direct_url: imageUrl || fallbackImages[collection.id % fallbackImages.length]
            });
          }
          setCollections(processedCollections);
        }
      } catch (error) {
        console.error("Erreur API collections:", error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCollections();
  }, []);

  // Gestion des états de transition
useEffect(() => {
  if (expandedView) {
    // Ouvrir le panneau
    setTransitionState('opening');
    const timer = setTimeout(() => {
      setTransitionState('open');
    }, 100); // Délai plus court pour l'animation
    return () => clearTimeout(timer);
  } else {
    // Fermer le panneau
    if (transitionState === 'open' || transitionState === 'opening') {
      setTransitionState('closing');
      const timer = setTimeout(() => {
        setTransitionState('closed');
      }, 500);
      return () => clearTimeout(timer);
    }
  }
}, [expandedView, transitionState]);

  // Fonction de défilement doux vers la section des produits
  useEffect(() => {
    if (transitionState === 'open' && productsSectionRef.current) {
      setTimeout(() => {
        productsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [transitionState]);

  // Ouvre la vue détaillée et récupère les produits de la collection sélectionnée
  const openCollectionDetail = async (collection) => {
    setSelectedCollection(collection);
    setExpandedView(true);
    setLoadingProducts(true);
    setCollectionProducts([]);

    try {
      // Récupérer les produits de la collection
      const response = await fetch(`https://laravel-api.fly.dev/api/collections/${collection.id}/`);
      const data = await response.json();
      if (data && data.produits && data.produits.length > 0) {
        // Pour chaque produit, récupérer ses images via l'API images
        const productsWithImages = await Promise.all(
          data.produits.map(async (product) => {
            try {
              const imgRes = await fetch(`https://laravel-api.fly.dev/api/images/get?model_type=produit&model_id=${product.id}`);
              const imgData = await imgRes.json();
              let imageUrl = null;
              if (imgData && imgData.images && imgData.images.length > 0) {
                // Chercher l'image principale, sinon prendre la première
                const primary = imgData.images.find(img => img.is_primary) || imgData.images[0];
                imageUrl = primary.direct_url;
              }
              return {
                id: product.id,
                nom: product.nom_produit,
                description: product.description_produit,
                image_produit: imageUrl || fallbackImages[product.id % fallbackImages.length],
                prix: product.prix_produit
              };
            } catch (imgErr) {
              return {
                id: product.id,
                nom: product.nom_produit,
                description: product.description_produit,
                image_produit: fallbackImages[product.id % fallbackImages.length],
                prix: product.prix_produit
              };
            }
          })
        );
        setCollectionProducts(productsWithImages);
      } else {
        setCollectionProducts([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
      setCollectionProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const closeCollectionDetail = () => {
    setExpandedView(false);
  };


        // Ajoutez cette fonction dans le composant
      const forceClosePanel = () => {
        setExpandedView(false);
        setTransitionState('closed');
      };

      // Ajoutez également un bouton de secours visible en cas de problème:
      // À ajouter dans votre panneau, en haut:
      {transitionState === 'opening' && (
        <button
          onClick={forceClosePanel}
          className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg"
        >
          Fermer
        </button>
      )}

  // Fermeture de la vue en appuyant sur Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && expandedView) {
        closeCollectionDetail();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedView]);

  // Fonction pour naviguer vers la page détaillée du produit
  const navigateToProductDetails = (productId) => {
    navigate(`/article/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif" key="inspiration-page">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {/* Enhanced Hero Section avec parallaxe */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#A67B5B] to-transparent py-28">
        <div className="absolute inset-0 bg-pattern opacity-10 transform scale-110 rotate-3"></div>
        <div className="absolute inset-0 bg-[url('/img/texture-overlay.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl font-extralight tracking-widest mb-4 transition-all duration-700 transform text-white">
              NOS COLLECTIONS
            </h1>
            <div className="w-24 h-px bg-white mx-auto my-6 opacity-70"></div>
            <p className="max-w-2xl mx-auto text-white text-opacity-90 font-light leading-relaxed text-lg">
              Découvrez l'élégance à travers nos collections exclusives, un mariage parfait entre tradition et modernité
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Enhanced Main Content */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="container mx-auto px-4">

          {loading ? (
            <div className="flex flex-col justify-center items-center h-96 py-12">
              <div className="text-center max-w-md mx-auto px-6 py-12 bg-white rounded-lg shadow-md">
                <LoadingSpinner
                  size="lg"
                  variant="elegant"
                  color="#A67B5B"
                  message="Chargement des collections..."
                  showLoadingLine={true}
                />
                <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-30"></div>
                <p className="text-sm text-gray-500 font-light">Veuillez patienter pendant que nous préparons nos inspirations</p>
              </div>
            </div>
          ) : collections.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-96 py-12">
              <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-light text-gray-800 mb-4">Aucune collection disponible</h2>
                <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-4 opacity-30"></div>
                <p className="text-gray-600 mb-8 max-w-md">Nos collections d'inspiration seront bientôt disponibles. Revenez nous voir prochainement.</p>
                <button
                  onClick={() => navigate('/home')}
                  className="flex items-center bg-[#A67B5B] text-white px-8 py-3 rounded-md font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transition-all duration-300 mx-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Retour à l'accueil</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-48">
              {collections.map((collection, index) => (
                <div key={collection.id} className="collection-card group">
                  <div className={`flex flex-col ${index % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center`}>
                    <div className="w-full lg:w-3/5 mb-10 lg:mb-0 relative">
                      <div className="overflow-hidden shadow-xl relative image-container rounded-lg">
                        <div className="absolute inset-0 border border-[#A67B5B] transform scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700 z-10 rounded-lg"></div>
                        <img
                          src={collection.direct_url}
                          alt={collection.title}
                          className="w-full h-auto object-cover"
                          style={{ height: "600px", objectPosition: "center" }}
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-r border-b border-[#A67B5B] opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-l border-t border-[#A67B5B] opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10"></div>
                      </div>
                    </div>
                    <div className={`w-full lg:w-2/5 ${index % 2 !== 0 ? 'lg:pr-20' : 'lg:pl-20'} text-center ${index % 2 !== 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                      <div className="mb-8">
                        <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-3 font-light">{collection.title}</h2>
                        <div className={`w-20 h-px bg-[#A67B5B] mx-auto ${index % 2 !== 0 ? 'lg:ml-auto lg:mr-0' : 'lg:mr-auto lg:ml-0'} my-4`}></div>
                        <h3 className="text-3xl font-light tracking-wide mb-6">{collection.subtitle}</h3>
                      </div>
                      <p className="text-gray-600 mb-10 font-light leading-relaxed">{collection.description}</p>
                      <button
                        onClick={() => openCollectionDetail(collection)}
                        className="inline-flex items-center justify-center px-8 py-3 bg-[#A67B5B] text-white rounded-md font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transition-all duration-300"
                      >
                        <span className="mr-2">DÉCOUVRIR</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vue détaillée innovante - Panneau coulissant amélioré */}
      <div
        className={`fixed inset-0 z-40 flex flex-col bg-white transition-all duration-500 ease-in-out transform ${
          transitionState === 'closed' ? 'translate-y-full' :
          transitionState === 'opening' ? 'translate-y-0' :
          transitionState === 'open' ? 'translate-y-0' :
          'translate-y-full'
        } ${expandedView ? 'pointer-events-auto' : 'pointer-events-none'} overflow-y-auto`}
      >
        {selectedCollection && (
          <>
            {/* Header fixe du panneau amélioré */}
            <div className="sticky top-0 z-10 bg-white shadow-md">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between py-4">
                  <button
                    onClick={closeCollectionDetail}
                    className="flex items-center text-[#A67B5B] hover:text-[#8B5A2B] transition-colors duration-300"
                    aria-label="Retour aux collections"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    <span className="font-medium">RETOUR</span>
                  </button>
                  <h2 className="text-lg font-light tracking-widest uppercase text-[#A67B5B]">{selectedCollection.title}</h2>
                  <div className="w-8"></div> {/* Spacer pour équilibrer le layout */}
                </div>
              </div>
            </div>

            {/* Hero de la collection amélioré */}
            <div className="relative h-[500px] overflow-hidden">
              <img
                src={selectedCollection.direct_url}
                alt={selectedCollection.title}
                className="absolute inset-0 w-full h-full object-cover transform scale-110 animate-subtle-zoom"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                <div className="bg-white bg-opacity-90 backdrop-blur-sm p-10 max-w-xl transform transition-transform duration-700 animate-fade-up rounded-md shadow-lg">
                  <h1 className="text-4xl font-extralight tracking-widest mb-4">{selectedCollection.title}</h1>
                  <div className="w-24 h-px bg-[#A67B5B] mx-auto my-4"></div>
                  <p className="font-light text-gray-700 text-lg">{selectedCollection.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Description de la collection améliorée */}
            <div className="py-16 bg-gradient-to-b from-gray-50 to-white">
              <div className="container mx-auto px-4 text-center">
                <p className="max-w-3xl mx-auto text-gray-600 font-light leading-relaxed text-lg">
                  {selectedCollection.description}
                </p>
                <div className="w-24 h-px bg-[#A67B5B] mx-auto my-10"></div>
              </div>
            </div>

            {/* Produits de la collection avec effet de déploiement - Amélioré */}
            <div ref={productsSectionRef}>
              <div className="container mx-auto px-4 pb-16">
                <h3 className="text-3xl font-light tracking-wide text-center mb-12">PRODUITS DE LA COLLECTION</h3>

                {loadingProducts ? (
                  <div className="flex flex-col justify-center items-center h-64 py-8">
                    <div className="text-center max-w-md mx-auto px-6 py-10 bg-white rounded-lg shadow-md">
                      <LoadingSpinner
                        size="md"
                        variant="elegant"
                        color="#A67B5B"
                        message="Chargement des produits..."
                        showLoadingLine={true}
                      />
                      <div className="w-12 h-[0.5px] bg-[#A67B5B] mx-auto my-4 opacity-30"></div>
                    </div>
                  </div>
                ) : collectionProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {collectionProducts.map((product, idx) => (
                      <div
                        key={product.id}
                        className="product-card overflow-hidden bg-white rounded-lg shadow-md"
                        style={{
                          animationDelay: `${idx * 100}ms`,
                          animationFillMode: 'both',
                          animationName: 'fadeInUp',
                          animationDuration: '800ms'
                        }}
                      >
                        <div className="relative overflow-hidden image-container" style={{ paddingBottom: "100%" }}>
                          <img
                            src={product.image_produit || fallbackImages[product.id % fallbackImages.length]}
                            alt={product.nom}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          {/* Overlay avec bouton amélioré */}
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <Link
                              to={`/article/${product.id}`}
                              className="bg-[#A67B5B] text-white px-6 py-3 rounded-md font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transform translate-y-8 group-hover:translate-y-0 transition-all duration-500"
                            >
                              VOIR DÉTAILS
                            </Link>
                          </div>
                        </div>
                        <div className="p-6 relative">
                          <h4 className="text-xl font-light tracking-wider mb-3 text-gray-800 hover:text-[#A67B5B] transition-colors">{product.nom}</h4>
                          <div className="w-10 h-px bg-[#A67B5B] mb-3 transition-all duration-300 group-hover:w-20"></div>
                          <p className="text-gray-600 font-light mb-4 h-16 overflow-hidden">
                            {product.description?.slice(0, 80)}{product.description?.length > 80 ? '...' : ''}
                          </p>
                          <p className="text-[#A67B5B] font-medium mb-4 text-lg">{product.prix ? `${product.prix} DT` : 'Prix sur demande'}</p>
                          <Link
                            to={`/article/${product.id}`}
                            className="inline-block w-full text-center text-white text-sm bg-[#A67B5B] px-4 py-2 rounded hover:bg-[#8B5A2B] transition-colors"
                          >
                            Voir détail
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-gray-100 bg-white rounded-lg shadow-md">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-light text-gray-800 mb-4">Aucun produit trouvé</h3>
                    <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-4 opacity-30"></div>
                    <p className="text-gray-600 font-light max-w-md mx-auto mb-8">Cette collection ne contient pas encore de produits. Veuillez consulter nos autres collections exclusives.</p>
                    <button
                      onClick={closeCollectionDetail}
                      className="flex items-center bg-[#A67B5B] text-white px-8 py-3 rounded-md font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transition-all duration-300 mx-auto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span>Retour aux collections</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton de fermeture flottant */}
            <button
              onClick={closeCollectionDetail}
              className="fixed bottom-8 right-8 bg-[#A67B5B] text-white p-4 rounded-full shadow-lg hover:bg-[#8B5A2B] transition-colors z-50"
              aria-label="Fermer le panneau"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Footer dans la vue détaillée */}
            {/* <div className="mt-auto py-10 bg-gray-50">
              <div className="container mx-auto px-4 text-center">
                <button
                  onClick={closeCollectionDetail}
                  className="px-8 py-3 border border-gold text-gold hover:bg-gold hover:text-white transition-colors duration-300 font-light tracking-wider mx-2 inline-block mt-4 md:mt-0"
                >
                  RETOUR AUX COLLECTIONS
                </button>

              </div>
            </div> */}
          </>
        )}
      </div>

      {/* CSS Variables and custom styles */}
      <style jsx global>{`
        :root {
          --color-gold: #A67B5B;
        }
        .bg-gold {
          background-color: var(--color-gold);
        }
        .text-gold {
          color: var(--color-gold);
        }
        .ring-gold {
          --tw-ring-color: var(--color-gold);
        }
        .border-gold {
          border-color: var(--color-gold);
        }
        .from-gold {
          --tw-gradient-from: var(--color-gold);
        }
        .to-gold {
          --tw-gradient-to: var(--color-gold);
        }
        .hover\\:bg-gold:hover {
          background-color: var(--color-gold);
        }
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23A67B5B' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        /* Animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes subtle-zoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.05);
          }
        }

        @keyframes fade-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-subtle-zoom {
          animation: subtle-zoom 10s infinite alternate ease-in-out;
        }

        .animate-fade-up {
          animation: fade-up 1s ease-out forwards;
        }

        /* Personnalisation de la barre de défilement */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
          background: #D4AF37;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #b69329;
        }

        /* Effet de débordement pour le panneau coulissant */
        .overflow-y-auto {
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
};

export default InspirationPage;