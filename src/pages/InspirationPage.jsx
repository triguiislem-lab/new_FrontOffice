import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from "../Components/LoadingSpinner";

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
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif">
      {/* Hero Section avec parallaxe */}
      <div className="relative overflow-hidden bg-gradient-to-b from-gold to-transparent py-24">
        <div className="absolute inset-0 bg-pattern opacity-10 transform scale-110 rotate-3"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl font-extralight tracking-widest mb-4 transition-all duration-700 transform">NOS COLLECTIONS</h1>
            <div className="w-24 h-px bg-gold mx-auto my-6"></div>
            <p className="max-w-2xl mx-auto text-gray-600 font-light leading-relaxed text-lg">
              Découvrez l'élégance à travers nos collections exclusives, un mariage parfait entre tradition et modernité
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="container mx-auto px-4">

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner size="lg" variant="circle" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 italic">Aucune collection disponible pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-40">
              {collections.map((collection, index) => (
                <div key={collection.id} className="group">
                  <div className={`flex flex-col ${index % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center`}>
                    <div className="w-full lg:w-3/5 mb-8 lg:mb-0 relative">
                      <div className="overflow-hidden shadow-xl relative">
                        <div className="absolute inset-0 border border-gold transform scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-700 z-10"></div>
                        <img
                          src={collection.direct_url}
                          alt={collection.title}
                          className="w-full h-auto object-cover transition-all duration-1000 group-hover:scale-105"
                          style={{ height: "600px", objectPosition: "center" }}
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
                        <div className="absolute bottom-0 right-0 w-16 h-16 border-r border-b border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10"></div>
                        <div className="absolute top-0 left-0 w-16 h-16 border-l border-t border-gold opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10"></div>
                      </div>
                    </div>
                    <div className={`w-full lg:w-2/5 ${index % 2 !== 0 ? 'lg:pr-20' : 'lg:pl-20'} text-center ${index % 2 !== 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                      <div className="mb-8">
                        <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-3 font-light">{collection.title}</h2>
                        <div className={`w-20 h-px bg-gold mx-auto ${index % 2 !== 0 ? 'lg:ml-auto lg:mr-0' : 'lg:mr-auto lg:ml-0'} my-4`}></div>
                        <h3 className="text-3xl font-light tracking-wide mb-6">{collection.subtitle}</h3>
                      </div>
                      <p className="text-gray-600 mb-10 font-light leading-relaxed">{collection.description}</p>
                      <button
  onClick={() => openCollectionDetail(collection)}
  className="relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-black transition duration-300 ease-out border-1 border-[#9D7553] rounded-none shadow-md group"
>
  <span className="absolute inset-0 w-full h-full bg-[#9D7553] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
  <span className="relative z-10">DÉCOUVRIR</span>
</button>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vue détaillée innovante - Panneau coulissant */}
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
            {/* Header fixe du panneau */}
            <div className="sticky top-0 z-10 bg-white shadow-md">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between py-4">
                  <button
                    onClick={closeCollectionDetail}
                    className="flex items-center text-gray-600 hover:text-black transition-colors duration-300"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    <span className="font-light">RETOUR</span>
                  </button>
                  <h2 className="text-lg font-light tracking-widest uppercase">{selectedCollection.title}</h2>
                  <div className="w-8"></div> {/* Spacer pour équilibrer le layout */}
                </div>
              </div>
            </div>

            {/* Hero de la collection */}
            <div className="relative h-96 overflow-hidden">
              <img
                src={selectedCollection.direct_url}
                alt={selectedCollection.title}
                className="absolute inset-0 w-full h-full object-cover transform scale-110 animate-subtle-zoom"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <div className="absolute inset-0 flex items-center justify-center text-center p-8">
                <div className="bg-white bg-opacity-80 backdrop-blur-sm p-8 max-w-xl transform transition-transform duration-700 animate-fade-up">
                  <h1 className="text-4xl font-extralight tracking-widest mb-4">{selectedCollection.title}</h1>
                  <div className="w-24 h-px bg-gold mx-auto my-4"></div>
                  <p className="font-light text-gray-700">{selectedCollection.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Description de la collection */}
            <div className="py-16  from-gray-50 to-white">
              <div className="container mx-auto px-4 text-center">
                <p className="max-w-3xl mx-auto text-gray-600 font-light leading-relaxed text-lg">
                  {selectedCollection.description}
                </p>
                <div className="w-24 h-px bg-gold mx-auto my-10"></div>
              </div>
            </div>

            {/* Produits de la collection avec effet de déploiement */}
            <div ref={productsSectionRef} >
              <div className="container mx-auto px-4">
                <h3 className="text-2xl font-light tracking-wide text-center mb-12">PRODUITS DE LA COLLECTION</h3>

                {loadingProducts ? (
                  <div className="flex justify-center items-center h-64">
                    <LoadingSpinner size="md" variant="circle" />
                  </div>
                ) : collectionProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {collectionProducts.map((product, idx) => (
                      <div
                        key={product.id}
                        className="group overflow-hidden bg-white hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2"
                        style={{
                          animationDelay: `${idx * 100}ms`,
                          animationFillMode: 'both',
                          animationName: 'fadeInUp',
                          animationDuration: '800ms'
                        }}
                      >
                        <div className="relative overflow-hidden" style={{ paddingBottom: "100%" }}>
                          <img
                            src={product.image_produit || fallbackImages[product.id % fallbackImages.length]}
                            alt={product.nom}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          {/* Overlay avec bouton */}
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <Link
                              to={`/article/${product.id}`}
                              className="bg-white text-black px-6 py-3 font-light tracking-widest transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500"
                            >
                              VOIR DÉTAILS
                            </Link>
                          </div>
                        </div>
                        <div className="p-6 relative">
                          <h4 className="text-xl font-light tracking-wider mb-3">{product.nom}</h4>
                          <div className="w-10 h-px bg-gold mb-3 transition-all duration-300 group-hover:w-20"></div>
                          <p className="text-gray-600 font-light mb-4 h-16 overflow-hidden">
                            {product.description?.slice(0, 80)}{product.description?.length > 80 ? '...' : ''}
                          </p>
                          <p className="text-gold font-light mb-0 text-lg">{product.prix ? `${product.prix} DT` : 'Prix sur demande'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 border border-gray-100 bg-gray-50">
                    <svg className="w-16 h-16 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <p className="text-gray-500 italic font-light text-lg">Aucun produit trouvé pour cette collection.</p>
                    <p className="text-gray-400 text-sm mt-2">Veuillez consulter nos autres collections exclusives.</p>
                  </div>
                )}
              </div>
            </div>

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
          --color-gold: #D4AF37;
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
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
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