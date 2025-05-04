import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EnhancedLazyImage from "../Components/EnhancedLazyImage";
import apiService from "../utils/apiService";
import LoadingSpinner from "../Components/LoadingSpinner";

// Custom CSS for the similar products carousel on mobile
const carouselStyles = `
  .similar-products-carousel {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; /* Firefox */
  }

  .similar-products-carousel::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Edge */
  }

  .carousel-button {
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }

  .carousel-button:hover {
    opacity: 1;
  }

  @media (max-width: 640px) {
    .similar-products-grid {
      display: none;
    }
    .similar-products-carousel-container {
      display: block;
    }
  }

  @media (min-width: 641px) {
    .similar-products-grid {
      display: grid;
    }
    .similar-products-carousel-container {
      display: none;
    }
  }
`;

const SimilarProducts = ({ productId, categorieId, marqueId, description, isInStock }) => {
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [marquesMap, setMarquesMap] = useState({}); // Map pour stocker marque_id -> nom_marque
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);
  const navigate = useNavigate();

  // Function to scroll the carousel
  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;

    const scrollAmount = direction === 'left'
      ? -carouselRef.current.offsetWidth
      : carouselRef.current.offsetWidth;

    carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });

    // Update current slide
    if (direction === 'left' && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else if (direction === 'right' && currentSlide < similarProducts.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  // Fonction pour extraire les mots-clés d'une description
  const extractKeywords = (text) => {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
  };

  // Fonction pour calculer un score de similarité entre deux descriptions
  const calculateSimilarity = (desc1, desc2) => {
    const keywords1 = extractKeywords(desc1);
    const keywords2 = extractKeywords(desc2);
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const commonKeywords = keywords1.filter(keyword => keywords2.includes(keyword));
    return commonKeywords.length / Math.max(keywords1.length, keywords2.length);
  };

  // Fonction pour mélanger un tableau aléatoirement (Fisher-Yates shuffle)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Récupérer les marques au montage du composant
  useEffect(() => {
    const fetchMarques = async () => {
      try {
        const response = await fetch("https://laravel-api.fly.dev/api/marques");
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des marques");
        }
        const marquesData = await response.json();
        console.log("Données des marques :", marquesData);

        // Créer une map marque_id -> nom_marque
        const marquesMapTemp = {};
        marquesData.forEach((marque) => {
          marquesMapTemp[marque.id] = marque.nom_marque;
        });
        setMarquesMap(marquesMapTemp);
      } catch (error) {
        console.error("Erreur lors de la récupération des marques :", error);
        setError(error.message);
      }
    };

    fetchMarques();
  }, []);

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://laravel-api.fly.dev/api/produits?sous_sous_categorie_id=${categorieId}`
        );
        if (!response.ok) {
          throw new Error(`Erreur HTTP : ${response.status}`);
        }
        const responseData = await response.json();
        const data = responseData.data || [];
        if (!Array.isArray(data)) {
          throw new Error("Les données de l'API ne sont pas un tableau");
        }

        // Filtrer par marque et sous-sous-catégorie, exclure le produit actuel
        let filteredProducts = data.filter(
          (product) =>
            product.id !== parseInt(productId) &&
            product.marque_id === marqueId &&
            product.sous_sous_categorie_id === categorieId
        );

        // Calculer la similarité des descriptions et trier
        if (description && filteredProducts.length > 0) {
          filteredProducts = filteredProducts
            .map((product) => ({
              ...product,
              similarityScore: calculateSimilarity(description, product.description_produit),
            }))
            .sort((a, b) => b.similarityScore - a.similarityScore);
        }

        // Limiter à 4 produits
        filteredProducts = filteredProducts.slice(0, 4);

        // Mélanger aléatoirement
        filteredProducts = shuffleArray(filteredProducts);

        // Récupérer les images pour chaque produit similaire en utilisant apiService
        try {
          // Extraire tous les IDs de produits
          const productIds = filteredProducts.map(product => product.id);

          // Utiliser la fonction de chargement d'images par lot
          const imagesMap = await apiService.getBatchProductImages(productIds);

          // Ajouter les URLs d'images aux produits
          const productsWithImages = filteredProducts.map(product => ({
            ...product,
            imageUrl: imagesMap[product.id] || product.image_produit
          }));
          setSimilarProducts(productsWithImages);
        } catch (error) {
          console.error("Erreur lors du chargement des images:", error);
          // Fallback to products without images
          setSimilarProducts(filteredProducts);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des produits similaires :", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (categorieId && marqueId && description) {
      fetchSimilarProducts();
    }
  }, [productId, categorieId, marqueId, description]);

  // Custom styles for the similar products section
  const sectionStyles = {
    background: 'linear-gradient(to bottom, #ffffff, #f9f7f5)',
    borderTop: '1px solid rgba(166, 123, 91, 0.1)',
    borderBottom: '1px solid rgba(166, 123, 91, 0.1)',
  };

  if (loading) {
    return (
      <div className="py-16 bg-gray-50" style={sectionStyles}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <LoadingSpinner
              size="lg"
              variant="elegant"
              color="#A67B5B"
              message="Découverte de produits similaires..."
            />
            <p className="mt-4 text-gray-500 font-light italic">
              Nous recherchons des produits qui pourraient vous intéresser
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 bg-gray-50" style={sectionStyles}>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-lg mx-auto p-6 bg-white rounded-lg shadow-sm">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Impossible de charger les suggestions</h3>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (similarProducts.length === 0) {
    return (
      <div className="py-12 bg-gray-50" style={sectionStyles}>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-lg mx-auto p-6 bg-white rounded-lg shadow-sm">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun produit similaire</h3>
            <p className="text-gray-600 text-sm">Nous n'avons pas trouvé de produits similaires à celui-ci pour le moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 mt-8" style={sectionStyles}>
      <style dangerouslySetInnerHTML={{ __html: carouselStyles }} />
      <div className="container mx-auto px-4">
        {/* Elegant section header with decorative elements */}
        <div className="text-center mb-12 relative">
          <div className="inline-block">
            <h2 className="text-3xl font-serif font-light text-[#A67B5B] mb-3 relative inline-block">
              Produits Similaires
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 bg-[#A67B5B] opacity-50"></span>
            </h2>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-sm font-light">
            Ces produits ont été sélectionnés spécialement pour vous en fonction de vos intérêts
          </p>
        </div>

        {/* Desktop: Responsive product grid with improved cards */}
        <div className="similar-products-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {similarProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-100 rounded-lg shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group overflow-hidden"
            >
              {/* Image container with hover effects */}
              <div className="relative overflow-hidden h-56">
                <EnhancedLazyImage
                  src={product.imageUrl || product.image_produit}
                  alt={product.nom_produit}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  fallbackSrc="/placeholder-image.jpg"
                  spinnerVariant="elegant"
                />

                {/* Overlay with quick action buttons */}
                <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/article/${product.id}`);
                    }}
                    className="bg-white text-gray-800 hover:bg-[#A67B5B] hover:text-white transition-colors duration-300 rounded-full p-3 mx-2 shadow-md"
                    title="Voir le produit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>

                {/* Brand badge */}
                <div className="absolute top-3 left-3 bg-white bg-opacity-90 text-xs px-2 py-1 rounded-md shadow-sm z-10 font-medium">
                  {marquesMap[product.marque_id] || "Marque"}
                </div>
              </div>

              {/* Product details with improved styling */}
              <div className="p-5">
                <h3
                  className="text-lg font-medium text-gray-800 hover:text-[#A67B5B] transition-colors duration-300 cursor-pointer mb-2 line-clamp-1"
                  onClick={() => navigate(`/article/${product.id}`)}
                >
                  {product.nom_produit}
                </h3>

                <div className="flex justify-between items-end mt-4">
                  <div>
                    <span className="text-lg font-bold text-[#A67B5B]">{product.prix_produit} DT</span>
                    <div className="mt-1">
                      {isInStock(product) ? (
                        <span className="inline-flex items-center text-xs text-green-600">
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1"></span>
                          En stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-red-600">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1"></span>
                          Rupture de stock
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/article/${product.id}`)}
                    className="text-[#A67B5B] hover:text-[#8B5A2B] transition-colors duration-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Horizontal carousel for similar products */}
        <div className="similar-products-carousel-container relative">
          {/* Carousel navigation buttons */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
            <button
              onClick={() => scrollCarousel('left')}
              className="carousel-button bg-white rounded-full p-2 shadow-md text-gray-800 hover:text-[#A67B5B] focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentSlide === 0}
              aria-label="Précédent"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
            <button
              onClick={() => scrollCarousel('right')}
              className="carousel-button bg-white rounded-full p-2 shadow-md text-gray-800 hover:text-[#A67B5B] focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
              disabled={currentSlide >= similarProducts.length - 1}
              aria-label="Suivant"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Carousel container */}
          <div
            ref={carouselRef}
            className="similar-products-carousel flex overflow-x-auto py-4 px-8 -mx-4 snap-x"
          >
            {similarProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-4/5 px-4 snap-start"
              >
                <div
                  className="bg-white border border-gray-100 rounded-lg shadow-md overflow-hidden h-full"
                  onClick={() => navigate(`/article/${product.id}`)}
                >
                  <div className="relative h-48">
                    <EnhancedLazyImage
                      src={product.imageUrl || product.image_produit}
                      alt={product.nom_produit}
                      className="w-full h-full object-cover"
                      fallbackSrc="/placeholder-image.jpg"
                      spinnerVariant="elegant"
                    />
                    <div className="absolute top-3 left-3 bg-white bg-opacity-90 text-xs px-2 py-1 rounded-md shadow-sm z-10 font-medium">
                      {marquesMap[product.marque_id] || "Marque"}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-medium text-gray-800 mb-2 line-clamp-1">
                      {product.nom_produit}
                    </h3>
                    <div className="flex justify-between items-end">
                      <span className="text-base font-bold text-[#A67B5B]">{product.prix_produit} DT</span>
                      {isInStock(product) ? (
                        <span className="inline-flex items-center text-xs text-green-600">
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1"></span>
                          En stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-red-600">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1"></span>
                          Rupture
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Carousel indicators */}
          <div className="flex justify-center mt-4">
            {similarProducts.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 mx-1 rounded-full ${
                  index === currentSlide ? 'bg-[#A67B5B]' : 'bg-gray-300'
                }`}
                onClick={() => {
                  if (carouselRef.current) {
                    const slideWidth = carouselRef.current.offsetWidth;
                    carouselRef.current.scrollTo({
                      left: index * slideWidth,
                      behavior: 'smooth'
                    });
                    setCurrentSlide(index);
                  }
                }}
                aria-label={`Aller à la diapositive ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* View all button */}
        <div className="text-center mt-10">
          <button
            onClick={() => navigate(`/Produit/AllCat`)}
            className="inline-block font-light text-[#A67B5B] border border-[#A67B5B] bg-transparent px-8 py-3 rounded-md text-sm tracking-wider transition-all duration-300 shadow-sm relative overflow-hidden group hover:text-white"
          >
            <span className="relative z-10">Découvrir plus de produits</span>
            <span className="absolute inset-0 w-0 bg-[#A67B5B] transition-all duration-300 ease-out group-hover:w-full"></span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default SimilarProducts;