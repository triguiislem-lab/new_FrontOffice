import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import LoadingSpinner from "../Components/LoadingSpinner";

// Custom CSS for animations and styling
const customStyles = `
  /* Loading animations */
  @keyframes pulse-width {
    0% { width: 15%; }
    50% { width: 85%; }
    100% { width: 15%; }
  }

  .animate-pulse-width {
    animation: pulse-width 2s ease-in-out infinite;
  }

  .skeleton-pulse {
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-pulse {
    0% { opacity: 0.6; }
    50% { opacity: 0.8; }
    100% { opacity: 0.6; }
  }

  /* Card hover effects */
  .promo-card {
    transition: all 0.3s ease;
  }

  .promo-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .promo-card .image-container img {
    transition: transform 0.5s ease;
  }

  .promo-card:hover .image-container img {
    transform: scale(1.05);
  }

  /* Badge styling */
  .discount-badge {
    position: absolute;
    top: 0;
    left: 0;
    background-color: #FEF2F2;
    color: #EF4444;
    font-weight: 500;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    z-index: 10;
  }

  .event-badge {
    position: absolute;
    top: 0;
    right: 0;
    font-weight: 500;
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    z-index: 10;
    color: white;
  }

  /* Filter styling */
  .filter-button {
    transition: all 0.2s ease;
  }

  .filter-button:hover {
    background-color: #F3F4F6;
  }

  .filter-button.active {
    background-color: #111827;
    color: white;
  }

  /* Improved scrollbar for filter section */
  .hide-scrollbar::-webkit-scrollbar {
    height: 4px;
  }

  .hide-scrollbar::-webkit-scrollbar-track {
    background: #F3F4F6;
  }

  .hide-scrollbar::-webkit-scrollbar-thumb {
    background: #A67B5B;
    border-radius: 2px;
  }
`;

function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [featuredPromotions, setFeaturedPromotions] = useState([]);
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [marques, setMarques] = useState([]);
  const [evenements, setEvenements] = useState([]);
  const [activeFilter, setActiveFilter] = useState('tous');
  const [isLoading, setIsLoading] = useState(true);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);
  const [selectedMarque, setSelectedMarque] = useState('');
  const [selectedEvenement, setSelectedEvenement] = useState('');
  const [isMarqueDropdownOpen, setIsMarqueDropdownOpen] = useState(false);
  const [isEvenementDropdownOpen, setIsEvenementDropdownOpen] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 12
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Refs for dropdown containers
  const marqueDropdownRef = useRef(null);
  const evenementDropdownRef = useRef(null);

  useEffect(() => {
    // Fetch all data
    setIsLoading(true);

    // Fetch promotions with the new API format
    // Build query parameters based on filters
    const promotionsParams = new URLSearchParams();
    promotionsParams.append('actives_seulement', 'true'); // Only get active promotions
    promotionsParams.append('with', 'event'); // Include event relationship
    promotionsParams.append('per_page', pagination.perPage.toString()); // Number of items per page
    promotionsParams.append('page', currentPage.toString()); // Current page

    // Add category filter if a category is selected
    if (typeof activeFilter === 'number') {
      promotionsParams.append('category_id', activeFilter);
    }

    // Add brand filter if a brand is selected
    if (selectedMarque) {
      promotionsParams.append('brand_id', selectedMarque);
    }

    // Add event filter if an event is selected
    if (selectedEvenement) {
      promotionsParams.append('event_id', selectedEvenement);
    }

    axios.get(`https://laravel-api.fly.dev/api/promotions?${promotionsParams.toString()}`)
      .then(response => {
        // Check for the new standardized response format
        if (response.data && response.data.status === 'success' && response.data.data) {
          // Check if the data is paginated
          if (response.data.data.data && Array.isArray(response.data.data.data)) {
            setPromotions(response.data.data.data);
            console.log('Promotions loaded (paginated):', response.data.data);

            // Store pagination info
            setPagination({
              currentPage: response.data.data.current_page,
              lastPage: response.data.data.last_page,
              total: response.data.data.total,
              perPage: response.data.data.per_page
            });
          }
          // Check if it's a direct array
          else if (Array.isArray(response.data.data)) {
            setPromotions(response.data.data);
            console.log('Promotions loaded (direct):', response.data.data);
          }
          else {
            console.error('Format de données de promotions inattendu:', response.data);
            setPromotions([]);
          }
        }
        // Fallback for old API format
        else if (Array.isArray(response.data)) {
          setPromotions(response.data);
          console.log('Promotions loaded (legacy format):', response.data);
        }
        else if (response.data && Array.isArray(response.data.data)) {
          setPromotions(response.data.data);
          console.log('Promotions loaded from data property (legacy format):', response.data.data);
        }
        else {
          console.error('Format de données de promotions invalide:', response.data);
          setPromotions([]);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des promotions:', error);
        setPromotions([]);
      });

    // Fetch products with marque and category relationships (we'll fetch images separately)
    axios.get('https://laravel-api.fly.dev/api/produits?with=marque,categorie')
      .then(response => {
        if (response.data && Array.isArray(response.data.data)) {
          const products = response.data.data;

          // Log information about the first few products
          const sampleProducts = products.slice(0, 3);
          sampleProducts.forEach(product => {
            console.log(`Product ${product.id} (${product.nom_produit}):`);
            console.log('- image_produit:', product.image_produit);
            console.log('- categorie_id:', product.categorie_id);
            console.log('- category_id:', product.category_id);
            console.log('- categorie:', product.categorie);
          });

          // Log category distribution
          const categoryDistribution = {};
          products.forEach(product => {
            const categoryId = product.categorie_id || (product.categorie && product.categorie.id) || product.category_id;
            if (categoryId) {
              categoryDistribution[categoryId] = (categoryDistribution[categoryId] || 0) + 1;
            }
          });
          console.log('Products by category:', categoryDistribution);

          setProduits(products);
          console.log(`Loaded ${products.length} products`);
        } else {
          console.error('Format de données de produits invalide:', response.data);
          setProduits([]);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des produits:', error);
        setProduits([]);
      });

    // Fetch categories
    axios.get('https://laravel-api.fly.dev/api/categories')
      .then(response => {
        // Check if response.data is an array directly (no data property)
        if (Array.isArray(response.data)) {
          setCategories(response.data);
          console.log('Categories loaded directly:', response.data.length);
        }
        // Check if response.data.data is an array (with data property)
        else if (response.data && Array.isArray(response.data.data)) {
          setCategories(response.data.data);
          console.log('Categories loaded from data property:', response.data.data.length);
        } else {
          console.error('Format de données de catégories invalide:', response.data);
          setCategories([]);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des catégories:', error);
        setCategories([]);
      });

    // Fetch marques
    axios.get('https://laravel-api.fly.dev/api/marques')
      .then(response => {
        // Check if response.data is an array directly (no data property)
        if (Array.isArray(response.data)) {
          setMarques(response.data);
          console.log('Marques loaded:', response.data);
        }
        // Check if response.data.data is an array (with data property)
        else if (response.data && Array.isArray(response.data.data)) {
          setMarques(response.data.data);
          console.log('Marques loaded from data property:', response.data.data);
        } else {
          console.error('Format de données de marques invalide:', response.data);
          setMarques([]);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des marques:', error);
        setMarques([]);
      });

    // Fetch promotion events
    axios.get('https://laravel-api.fly.dev/api/promotion-events?actifs_seulement=true')
      .then(response => {
        // Check for the new standardized response format
        if (response.data && response.data.status === 'success' && response.data.data) {
          // Check if the data is paginated
          if (response.data.data.data && Array.isArray(response.data.data.data)) {
            setEvenements(response.data.data.data);
            console.log('Promotion events loaded (paginated):', response.data.data.data);
          }
          // Check if it's a direct array
          else if (Array.isArray(response.data.data)) {
            setEvenements(response.data.data);
            console.log('Promotion events loaded (direct):', response.data.data);
          }
        }
        // Fallback for old API format
        else if (Array.isArray(response.data)) {
          setEvenements(response.data);
          console.log('Promotion events loaded (legacy format):', response.data);
        }
        else if (response.data && Array.isArray(response.data.data)) {
          setEvenements(response.data.data);
          console.log('Promotion events loaded from data property (legacy format):', response.data.data);
        }
        else {
          console.error('Format de données des événements promotionnels invalide:', response.data);
          // Fallback to hardcoded events if API fails
          setEvenements([
            { id: 'soldes', nom: 'Soldes' },
            { id: 'black-friday', nom: 'Black Friday' },
            { id: 'destockage', nom: 'Déstockage' }
          ]);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des événements promotionnels:', error);
        // Fallback to hardcoded events if API fails
        setEvenements([
          { id: 'soldes', nom: 'Soldes' },
          { id: 'black-friday', nom: 'Black Friday' },
          { id: 'destockage', nom: 'Déstockage' }
        ]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [activeFilter, selectedMarque, selectedEvenement, currentPage]);

  // Fonction pour calculer le prix après remise
  const calculerPrixRemise = (prixOriginal, pourcentageReduction) => {
    const reduction = (prixOriginal * pourcentageReduction) / 100;
    return (prixOriginal - reduction).toFixed(2);
  };

  // Placeholder image as data URL to avoid external requests
  const PLACEHOLDER_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTk5OTkiPlByb2R1Y3QgSW1hZ2U8L3RleHQ+PC9zdmc+';

  // Get a product for each promotion, using the promotion ID as a seed for consistent selection
  const getProduitAleatoire = (categoryId = null, marqueId = null, promotionId = null) => {
    if (produits.length === 0) return null;

    let filteredProduits = [...produits];

    // Filtrer par catégorie si spécifié
    if (categoryId) {
      filteredProduits = filteredProduits.filter(produit => {
        // Check if the product has a categorie_id property that matches
        if (produit.categorie_id && produit.categorie_id.toString() === categoryId.toString()) {
          return true;
        }

        // Check if the product has a category_id property that matches (alternative property name)
        if (produit.category_id && produit.category_id.toString() === categoryId.toString()) {
          return true;
        }

        // Check if the product has a nested category object
        if (produit.categorie && produit.categorie.id && produit.categorie.id.toString() === categoryId.toString()) {
          return true;
        }

        return false;
      });
    }

    // Filtrer par marque si spécifié
    if (marqueId) {
      // Check both marque_id and marque.id if marque is an object
      filteredProduits = filteredProduits.filter(produit => {
        // Check direct marque_id property
        if (produit.marque_id && produit.marque_id.toString() === marqueId.toString()) {
          return true;
        }

        // Check nested marque object if it exists
        if (produit.marque && produit.marque.id && produit.marque.id.toString() === marqueId.toString()) {
          return true;
        }

        return false;
      });
    }

    if (filteredProduits.length === 0) {
      return null;
    }

    // If we have a promotion ID, use it as a seed to get a consistent product
    if (promotionId) {
      // Use the promotion ID as a seed to get a consistent index
      // This ensures the same product is shown for the same promotion each time
      const seed = parseInt(promotionId, 10);
      const index = seed % filteredProduits.length;
      return filteredProduits[index];
    } else {
      // Fallback to random selection if no promotion ID is provided
      const indexAleatoire = Math.floor(Math.random() * filteredProduits.length);
      return filteredProduits[indexAleatoire];
    }
  };

  // Filtrer les promotions selon plusieurs critères
  const getFilteredPromotions = () => {
    let filtered = [...promotions];

    // Filtre par catégorie
    if (activeFilter !== 'tous') {
      if (activeFilter === '-30') {
        filtered = filtered.filter(promo => parseFloat(promo.valeur) >= 30);
      } else if (activeFilter === '-20') {
        filtered = filtered.filter(promo => parseFloat(promo.valeur) >= 20 && parseFloat(promo.valeur) < 30);
      }
      // Pour les autres catégories, nous supposons que vous avez une relation entre promotions et catégories
      // Ce serait implémenté ici
    }

    // Filtrer par marque si une marque est sélectionnée
    // Note: Since we don't have a direct relation between promotions and brands in the API,
    // we'll filter the products in the getProduitAleatoire function instead

    // Filtrer par événement si un événement est sélectionné
    if (selectedEvenement) {
      // Dans un cas réel, vous auriez une relation entre promotions et événements
      // Ce filtre serait appliqué ici
      console.log('Filtering by event:', selectedEvenement);
    }

    return filtered;
  };

  const filteredPromotions = getFilteredPromotions();

  // State to store product images and loading state
  const [productImages, setProductImages] = useState({});
  const [imagesLoading, setImagesLoading] = useState(false);

  // Create a memoized map of products for featured promotions
  const featuredPromotionProductsMap = useMemo(() => {
    console.log('Rebuilding featured promotion products map...');
    const productMap = {};

    if (!featuredPromotions || featuredPromotions.length === 0 || produits.length === 0) {
      return productMap;
    }

    featuredPromotions.forEach(promotion => {
      if (!promotion || !promotion.id) return;

      const product = getProduitAleatoire(
        null, // No category filter for featured
        null, // No brand filter for featured
        promotion.id // Pass promotion ID as seed for consistent selection
      );

      if (product) {
        productMap[promotion.id] = product;
      }
    });

    console.log(`Created product map for ${Object.keys(productMap).length} featured promotions`);
    return productMap;
  }, [featuredPromotions, produits.length]);

  // Create a memoized map of products for each regular promotion
  // This avoids using useMemo inside the render loop which violates React's rules of hooks
  const promotionProductsMap = useMemo(() => {
    console.log('Rebuilding promotion products map...');
    const productMap = {};

    if (!filteredPromotions || filteredPromotions.length === 0 || produits.length === 0) {
      return productMap;
    }

    filteredPromotions.forEach(promotion => {
      if (!promotion || !promotion.id) return;

      const product = getProduitAleatoire(
        typeof activeFilter === 'number' ? activeFilter : null,
        selectedMarque ? selectedMarque : null,
        promotion.id // Pass promotion ID as seed for consistent selection
      );

      if (product) {
        productMap[promotion.id] = product;
      }
    });

    console.log(`Created product map for ${Object.keys(productMap).length} promotions`);
    return productMap;
  }, [filteredPromotions, activeFilter, selectedMarque, produits.length]);

  // Fetch images for products using the correct image system API
  useEffect(() => {
    const fetchProductImages = async () => {
      // Don't fetch if we're already loading images
      if (imagesLoading) return;

      const imagesMap = {};

      // Combine products from both regular and featured promotions
      const allProducts = [
        ...Object.values(promotionProductsMap),
        ...Object.values(featuredPromotionProductsMap)
      ]
        .filter(product => product && product.id)
        // Only fetch for products that don't already have images
        .filter(product => !productImages[product.id])
        // Remove duplicates by ID
        .filter((product, index, self) =>
          index === self.findIndex(p => p.id === product.id)
        );

      const productsToFetch = allProducts;

      if (productsToFetch.length === 0) return;

      setImagesLoading(true);
      console.log(`Fetching images for ${productsToFetch.length} products...`);

      try {
        await Promise.all(
          productsToFetch.map(async (product) => {
            try {
              const imageResponse = await fetch(
                `https://laravel-api.fly.dev/api/images/get?model_type=produit&model_id=${product.id}`
              );

              if (!imageResponse.ok) {
                throw new Error(`Failed to fetch images for product ${product.id}: ${imageResponse.status}`);
              }

              const imageData = await imageResponse.json();

              if (imageData.images && imageData.images.length > 0) {
                // Find primary image or use the first one
                const primaryImage = imageData.images.find(img => img.is_primary) || imageData.images[0];
                if (primaryImage.direct_url) {
                  imagesMap[product.id] = primaryImage.direct_url;
                  console.log(`Fetched image for product ${product.id}:`, primaryImage.direct_url);
                }
              }
            } catch (error) {
              console.error(`Error fetching images for product ${product.id}:`, error);
            }
          })
        );

        if (Object.keys(imagesMap).length > 0) {
          setProductImages(prevImages => ({
            ...prevImages,
            ...imagesMap
          }));
          console.log(`Added ${Object.keys(imagesMap).length} product images to state`);
        }
      } catch (error) {
        console.error('Error fetching product images:', error);
      } finally {
        setImagesLoading(false);
      }
    };

    fetchProductImages();
  }, [promotionProductsMap, featuredPromotionProductsMap, productImages, imagesLoading]);

  // Handles category filter change
  const handleFilterChange = (filter) => {
    console.log('Changing filter to:', filter);

    // If selecting a category, log some debug info
    if (typeof filter === 'number') {
      const category = categories.find(cat => cat.id === filter);
      console.log('Selected category:', category);

      // Log how many products match this category
      const matchingProducts = produits.filter(produit => {
        if (produit.categorie_id && produit.categorie_id.toString() === filter.toString()) return true;
        if (produit.category_id && produit.category_id.toString() === filter.toString()) return true;
        if (produit.categorie && produit.categorie.id && produit.categorie.id.toString() === filter.toString()) return true;
        return false;
      });

      console.log(`Found ${matchingProducts.length} products matching category ID ${filter}`);
    }

    setActiveFilter(filter);
  };

  // Handle marque selection change
  const handleMarqueChange = (marqueId) => {
    console.log('Selected marque ID:', marqueId);
    setSelectedMarque(marqueId);
    setIsMarqueDropdownOpen(false);
  };

  // Toggle marque dropdown
  const toggleMarqueDropdown = () => {
    setIsMarqueDropdownOpen(!isMarqueDropdownOpen);
    // Close the other dropdown
    setIsEvenementDropdownOpen(false);
  };

  // Handle event selection change
  const handleEvenementChange = (evenementId) => {
    setSelectedEvenement(evenementId);
    setIsEvenementDropdownOpen(false);
  };

  // Toggle evenement dropdown
  const toggleEvenementDropdown = () => {
    setIsEvenementDropdownOpen(!isEvenementDropdownOpen);
    // Close the other dropdown
    setIsMarqueDropdownOpen(false);
  };

  // Fetch featured promotions
  useEffect(() => {
    setIsFeaturedLoading(true);

    axios.get('https://laravel-api.fly.dev/api/promotions/featured?with=event')
      .then(response => {
        // Check for the new standardized response format
        if (response.data && response.data.status === 'success' && response.data.data) {
          if (Array.isArray(response.data.data)) {
            setFeaturedPromotions(response.data.data);
            console.log('Featured promotions loaded:', response.data.data);
          } else {
            console.error('Format de données des promotions vedettes invalide:', response.data);
            setFeaturedPromotions([]);
          }
        }
        // Fallback for old API format
        else if (Array.isArray(response.data)) {
          setFeaturedPromotions(response.data);
          console.log('Featured promotions loaded (legacy format):', response.data);
        }
        else if (response.data && Array.isArray(response.data.data)) {
          setFeaturedPromotions(response.data.data);
          console.log('Featured promotions loaded from data property (legacy format):', response.data.data);
        }
        else {
          console.error('Format de données des promotions vedettes invalide:', response.data);
          setFeaturedPromotions([]);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des promotions vedettes:', error);
        setFeaturedPromotions([]);
      })
      .finally(() => {
        setIsFeaturedLoading(false);
      });
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close marque dropdown if click is outside
      if (marqueDropdownRef.current && !marqueDropdownRef.current.contains(event.target)) {
        setIsMarqueDropdownOpen(false);
      }

      // Close evenement dropdown if click is outside
      if (evenementDropdownRef.current && !evenementDropdownRef.current.contains(event.target)) {
        setIsEvenementDropdownOpen(false);
      }
    };

    // Handle keyboard events (Escape key)
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMarqueDropdownOpen(false);
        setIsEvenementDropdownOpen(false);
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif" key="promotions-page">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      {/* Enhanced Hero Section with parallax effect */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#A67B5B] to-transparent py-28">
        <div className="absolute inset-0 bg-pattern opacity-10 transform scale-110 rotate-3"></div>
        <div className="absolute inset-0 bg-[url('/img/texture-overlay.png')] opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl font-extralight tracking-widest mb-4 transition-all duration-700 transform text-white">
              NOS PROMOTIONS
            </h1>
            <div className="w-24 h-px bg-white mx-auto my-6 opacity-70"></div>
            <p className="max-w-2xl mx-auto text-white text-opacity-90 font-light leading-relaxed text-lg">
              Découvrez nos offres exclusives et profitez de réductions exceptionnelles sur nos collections !
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      {/* Enhanced Navigation bar with filters - Horizontal scrollable version */}
      <div className="border-b border-gray-200 sticky top-0 bg-white z-20 shadow-sm">
        <div className="container mx-auto">
          {/* Main filters - Always visible */}
          <div className="flex justify-center items-center text-center border-b">
            <button
              onClick={() => handleFilterChange('-30')}
              className={`text-sm uppercase tracking-wider py-4 px-6 border-b-2 transition-all ${
                activeFilter === '-30' ? 'border-[#A67B5B] text-[#A67B5B] font-medium' : 'border-transparent text-gray-500 hover:text-[#A67B5B]'
              }`}
            >
              LA SÉLECTION À -30%
            </button>
            <button
              onClick={() => handleFilterChange('-20')}
              className={`text-sm uppercase tracking-wider py-4 px-6 border-b-2 transition-all ${
                activeFilter === '-20' ? 'border-[#A67B5B] text-[#A67B5B] font-medium' : 'border-transparent text-gray-500 hover:text-[#A67B5B]'
              }`}
            >
              LA SÉLECTION À -20%
            </button>
            <button
              onClick={() => handleFilterChange('tous')}
              className={`text-sm uppercase tracking-wider py-4 px-6 border-b-2 transition-all ${
                activeFilter === 'tous' ? 'border-[#A67B5B] text-[#A67B5B] font-medium' : 'border-transparent text-gray-500 hover:text-[#A67B5B]'
              }`}
            >
              TOUTES LES PROMOTIONS
            </button>
          </div>

          {/* Category filters in horizontal scrollable container */}
          <div className="relative">
            {/* Left shadow gradient for scroll indication */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>

            {/* Scrollable container */}
            <div className="flex overflow-x-auto py-4 px-4 hide-scrollbar">
              {Array.isArray(categories) && categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleFilterChange(category.id)}
                  className={`text-xs uppercase tracking-wider py-2 px-5 mx-1.5 whitespace-nowrap border rounded-full transition-all flex-shrink-0 filter-button ${
                    activeFilter === category.id
                      ? 'border-[#A67B5B] bg-[#A67B5B] text-white font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-[#A67B5B] hover:text-[#A67B5B]'
                  }`}
                >
                  {category.nom_categorie || category.nom || `Catégorie ${category.id}`}
                </button>
              ))}
            </div>

            {/* Right shadow gradient for scroll indication */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
          </div>
        </div>
      </div>

      {/* Enhanced Brand and Event filter section */}
      <div className="container mx-auto py-8">
        <div className="flex flex-wrap justify-center gap-6">
          {/* Brands dropdown with improved styling */}
          <div className="relative" ref={marqueDropdownRef}>
            <button
              id="marque-dropdown-button"
              onClick={toggleMarqueDropdown}
              aria-haspopup="true"
              aria-expanded={isMarqueDropdownOpen}
              className={`text-sm uppercase tracking-wider px-5 py-2.5 border flex items-center gap-2 rounded-md transition-all ${
                isMarqueDropdownOpen
                  ? 'border-[#A67B5B] text-[#A67B5B] bg-[#A67B5B]/5'
                  : 'border-gray-200 hover:border-[#A67B5B] hover:text-[#A67B5B]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              MARQUE
            </button>
            {isMarqueDropdownOpen && (
              <div
                id="marque-dropdown-menu"
                aria-labelledby="marque-dropdown-button"
                className="absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-md py-2 z-20 max-h-80 overflow-y-auto border border-gray-100">
                <button
                  onClick={() => handleMarqueChange('')}
                  className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-50 ${selectedMarque === '' ? 'font-medium text-[#A67B5B]' : ''}`}
                >
                  Toutes les marques
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                {Array.isArray(marques) && marques.map(marque => (
                  <button
                    key={marque.id}
                    onClick={() => handleMarqueChange(marque.id)}
                    className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-50 ${selectedMarque === marque.id ? 'font-medium text-[#A67B5B]' : ''}`}
                  >
                    {marque.nom_marque || marque.nom || `Marque ${marque.id}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Events dropdown with improved styling */}
          <div className="relative" ref={evenementDropdownRef}>
            <button
              id="evenement-dropdown-button"
              onClick={toggleEvenementDropdown}
              aria-haspopup="true"
              aria-expanded={isEvenementDropdownOpen}
              className={`text-sm uppercase tracking-wider px-5 py-2.5 border flex items-center gap-2 rounded-md transition-all ${
                isEvenementDropdownOpen
                  ? 'border-[#A67B5B] text-[#A67B5B] bg-[#A67B5B]/5'
                  : 'border-gray-200 hover:border-[#A67B5B] hover:text-[#A67B5B]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              ÉVÉNEMENT
            </button>
            {isEvenementDropdownOpen && (
              <div
                id="evenement-dropdown-menu"
                aria-labelledby="evenement-dropdown-button"
                className="absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-md py-2 z-20 border border-gray-100">
                <button
                  onClick={() => handleEvenementChange('')}
                  className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-50 ${selectedEvenement === '' ? 'font-medium text-[#A67B5B]' : ''}`}
                >
                  Tous les événements
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                {Array.isArray(evenements) && evenements.map(evenement => (
                  <button
                    key={evenement.id}
                    onClick={() => handleEvenementChange(evenement.id)}
                    className={`block px-4 py-2 text-sm text-left w-full hover:bg-gray-50 ${selectedEvenement === evenement.id ? 'font-medium text-[#A67B5B]' : ''}`}
                  >
                    {/* Display event with color indicator if available */}
                    <div className="flex items-center">
                      {evenement.couleur && (
                        <span
                          className="inline-block w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: evenement.couleur }}
                        ></span>
                      )}
                      {evenement.nom || evenement.nom_evenement}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset filters button - Only shown when filters are active */}
          {(selectedMarque || selectedEvenement || activeFilter !== 'tous') && (
            <button
              onClick={() => {
                setSelectedMarque('');
                setSelectedEvenement('');
                setActiveFilter('tous');
                setIsMarqueDropdownOpen(false);
                setIsEvenementDropdownOpen(false);
              }}
              className="text-sm uppercase tracking-wider px-5 py-2.5 text-gray-600 hover:text-[#A67B5B] border border-transparent hover:border-gray-200 rounded-md transition-all flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              RÉINITIALISER
            </button>
          )}
        </div>
      </div>

      {/* Featured Promotions Section - Enhanced */}
      {featuredPromotions.length > 0 && (
        <div className="container mx-auto px-4 py-16">
          <div className="mb-10">
            <h2 className="text-3xl font-light text-center mb-3">Promotions Vedettes</h2>
            <div className="w-20 h-0.5 bg-[#A67B5B] mx-auto mb-8"></div>
            <p className="text-center text-gray-600 max-w-2xl mx-auto">Découvrez nos offres exclusives sélectionnées spécialement pour vous</p>
          </div>

          {isFeaturedLoading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="text-center max-w-md mx-auto px-6 py-10 bg-white rounded-lg shadow-md">
                <LoadingSpinner size="md" variant="elegant" color="#A67B5B" />
                <p className="mt-5 text-gray-600 font-light tracking-wide">Chargement des promotions vedettes...</p>
                <div className="w-12 h-[0.5px] bg-[#A67B5B] mx-auto my-4 opacity-30"></div>
                <div className="mt-4 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#A67B5B] animate-pulse-width"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPromotions.map(promotion => {
                // Get the product from our memoized map
                const produitExemple = featuredPromotionProductsMap[promotion.id];

                const prixOriginal = produitExemple ? parseFloat(produitExemple.prix_produit) : 99.99;
                const prixRemise = calculerPrixRemise(prixOriginal, parseFloat(promotion.valeur));

                return (
                  <div key={`featured-${promotion.id}`} className="promo-card bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="relative overflow-hidden image-container">
                      {/* Show loading indicator while fetching images */}
                      {imagesLoading && !productImages[produitExemple?.id] && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-10">
                          <LoadingSpinner size="sm" variant="circle" color="#A67B5B" />
                        </div>
                      )}

                      <img
                        src={
                          produitExemple && productImages[produitExemple.id] ?
                            productImages[produitExemple.id] :
                            (produitExemple?.image_produit || PLACEHOLDER_IMAGE)
                        }
                        alt={produitExemple?.nom_produit || promotion.nom}
                        className="w-full aspect-square object-cover"
                        onError={(e) => {
                          if (e.target.src.includes('data:image/svg+xml;base64')) return;
                          e.target.onerror = null;
                          e.target.src = PLACEHOLDER_IMAGE;
                        }}
                      />

                      {/* Wishlist button */}
                      <button className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 hover:text-[#A67B5B]">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                      </button>

                      {/* Discount badge - Enhanced */}
                      <div className="discount-badge">
                        {promotion.type === 'montant_fixe'
                          ? `-${parseFloat(promotion.valeur)} DT`
                          : promotion.type === 'gratuit'
                            ? 'GRATUIT'
                            : `-${parseFloat(promotion.valeur)}%`}
                      </div>

                      {/* Event badge if available - Enhanced */}
                      {promotion.event && (
                        <div
                          className="event-badge"
                          style={{ backgroundColor: promotion.event.couleur || '#000000' }}
                        >
                          {promotion.event.nom}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-gray-800 text-lg mb-2 font-light hover:text-[#A67B5B] transition-colors">
                        {produitExemple?.nom_produit || promotion.nom}
                      </h3>

                      {/* Promotion description if available */}
                      {promotion.description && (
                        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{promotion.description}</p>
                      )}

                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-lg font-medium text-[#A67B5B]">{prixRemise} DT</span>
                        <span className="text-gray-500 text-sm line-through">{prixOriginal.toFixed(2)} DT</span>
                        <span className="text-red-500 text-xs font-medium ml-auto">
                          -{parseFloat(promotion.valeur)}%
                        </span>
                      </div>

                      {/* Promotion dates if available */}
                      {promotion.date_debut && promotion.date_fin && (
                        <div className="text-gray-500 text-xs mb-4 bg-gray-50 p-2 rounded">
                          <span className="font-medium">Valable du</span> {new Date(promotion.date_debut).toLocaleDateString()} <span className="font-medium">au</span> {new Date(promotion.date_fin).toLocaleDateString()}
                        </div>
                      )}

                      <DynamicButton
                        label="Voir détail"
                        to={produitExemple ? `/article/${produitExemple.id}` : `/promotions/${promotion.id}`}
                        className="w-full py-2.5 bg-[#A67B5B] text-white rounded hover:bg-[#8B5A2B] transition-colors duration-300 flex items-center justify-center"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Regular Promotions Section - Enhanced */}
      <div className="container mx-auto px-4 pb-20">
        <div className="mb-10">
          <h2 className="text-3xl font-light text-center mb-3">Toutes Nos Promotions</h2>
          <div className="w-20 h-0.5 bg-[#A67B5B] mx-auto mb-8"></div>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-16">
            <div className="text-center max-w-md mx-auto px-6 py-12 bg-white rounded-lg shadow-md">
              <LoadingSpinner size="lg" variant="elegant" color="#A67B5B" />
              <p className="mt-6 text-gray-600 font-light tracking-wide">Chargement des promotions...</p>
              <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-30"></div>
              <p className="text-sm text-gray-500 font-light">Veuillez patienter pendant que nous préparons les meilleures offres</p>
              <div className="mt-6 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-[#A67B5B] animate-pulse-width"></div>
              </div>
            </div>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-16">
            <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-light text-gray-800 mb-4">Aucune promotion disponible</h2>
              <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-4 opacity-30"></div>
              <p className="text-gray-600 mb-8 max-w-md">Aucune promotion ne correspond à votre sélection actuelle. Essayez de modifier vos filtres pour voir plus de résultats.</p>
              <button
                onClick={() => {
                  setSelectedMarque('');
                  setSelectedEvenement('');
                  setActiveFilter('tous');
                }}
                className="flex items-center bg-[#A67B5B] text-white px-8 py-3 rounded-md font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transition-all duration-300 mx-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Réinitialiser les filtres</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredPromotions.map(promotion => {
                // Get the product from our memoized map
                const produitExemple = promotionProductsMap[promotion.id];

                const prixOriginal = produitExemple ? parseFloat(produitExemple.prix_produit) : 99.99;
                const prixRemise = calculerPrixRemise(prixOriginal, parseFloat(promotion.valeur));

              return (
                <div key={promotion.id} className="promo-card bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="relative overflow-hidden image-container">
                    {/* Show loading indicator while fetching images */}
                    {imagesLoading && !productImages[produitExemple?.id] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50 z-10">
                        <LoadingSpinner size="sm" variant="circle" color="#A67B5B" />
                      </div>
                    )}

                    <img
                      src={
                        produitExemple && productImages[produitExemple.id] ?
                          productImages[produitExemple.id] :
                          (produitExemple?.image_produit || PLACEHOLDER_IMAGE)
                      }
                      alt={produitExemple?.nom_produit || promotion.nom}
                      className="w-full aspect-square object-cover"
                      onError={(e) => {
                        // Prevent infinite loop by checking if we're already using the fallback
                        if (e.target.src.includes('data:image/svg+xml;base64')) {
                          // Already using the fallback, don't try again
                          return;
                        }

                        console.error('Error loading image:', e.target.src);
                        e.target.onerror = null; // Prevent infinite loop

                        // Use the embedded SVG data URL as placeholder - no external request needed
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    {/* Bouton d'ajout aux favoris */}
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center transition-colors hover:bg-gray-100 shadow-sm z-10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 hover:text-[#A67B5B]">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                      </svg>
                    </button>

                    {/* Discount badge - Enhanced */}
                    <div className="discount-badge">
                      {promotion.type === 'montant_fixe'
                        ? `-${parseFloat(promotion.valeur)} DT`
                        : promotion.type === 'gratuit'
                          ? 'GRATUIT'
                          : `-${parseFloat(promotion.valeur)}%`}
                    </div>

                    {/* Event badge if available - Enhanced */}
                    {promotion.event && (
                      <div
                        className="event-badge"
                        style={{ backgroundColor: promotion.event.couleur || '#000000' }}
                      >
                        {promotion.event.nom}
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-gray-800 text-base mb-1 font-light hover:text-[#A67B5B] transition-colors">
                      {produitExemple?.nom_produit || promotion.nom}
                    </h3>

                    {/* Promotion description if available */}
                    {promotion.description && (
                      <p className="text-gray-500 text-xs mb-2 line-clamp-2">{promotion.description}</p>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base font-medium text-[#A67B5B]">{prixRemise} DT</span>
                      <span className="text-gray-500 text-sm line-through">{prixOriginal.toFixed(2)} DT</span>
                      <span className="text-red-500 text-xs font-medium ml-auto">
                        -{parseFloat(promotion.valeur)}%
                      </span>
                    </div>

                    {/* Promotion dates if available */}
                    {promotion.date_debut && promotion.date_fin && (
                      <div className="text-gray-500 text-xs mb-3 bg-gray-50 p-1.5 rounded">
                        <span className="font-medium">Valable du</span> {new Date(promotion.date_debut).toLocaleDateString()} <span className="font-medium">au</span> {new Date(promotion.date_fin).toLocaleDateString()}
                      </div>
                    )}

                    <Link
                      to={produitExemple ? `/article/${produitExemple.id}` : `/promotions/${promotion.id}`}
                      className="inline-block w-full text-center text-white text-sm bg-[#A67B5B] px-4 py-2 rounded hover:bg-[#8B5A2B] transition-colors"
                    >
                      Voir détail
                    </Link>
                  </div>
                </div>
              );
              })}
            </div>

            {/* Enhanced Pagination controls */}
            {pagination.lastPage > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center space-x-2">
                  {/* Previous page button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#A67B5B] hover:bg-[#A67B5B]/10'
                    }`}
                    aria-label="Page précédente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Page numbers */}
                  {[...Array(pagination.lastPage).keys()].map(page => {
                    const pageNumber = page + 1;
                    // Only show a few pages around the current page
                    if (
                      pageNumber === 1 ||
                      pageNumber === pagination.lastPage ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-10 h-10 flex items-center justify-center rounded-md transition-all ${
                            currentPage === pageNumber
                              ? 'bg-[#A67B5B] text-white font-medium shadow-sm'
                              : 'text-gray-700 hover:bg-[#A67B5B]/10 hover:text-[#A67B5B]'
                          }`}
                          aria-label={`Page ${pageNumber}`}
                          aria-current={currentPage === pageNumber ? 'page' : undefined}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      (pageNumber === currentPage - 2 && currentPage > 3) ||
                      (pageNumber === currentPage + 2 && currentPage < pagination.lastPage - 2)
                    ) {
                      // Show ellipsis
                      return <span key={pageNumber} className="w-10 h-10 flex items-center justify-center text-gray-500">&hellip;</span>;
                    }
                    return null;
                  })}

                  {/* Next page button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.lastPage))}
                    disabled={currentPage === pagination.lastPage}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      currentPage === pagination.lastPage
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#A67B5B] hover:bg-[#A67B5B]/10'
                    }`}
                    aria-label="Page suivante"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            )}

            {/* Results count */}
            {!isLoading && filteredPromotions.length > 0 && (
              <div className="text-center text-gray-500 text-sm mt-6">
                Affichage de {Math.min(pagination.perPage, filteredPromotions.length)} sur {pagination.total} promotions
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Promotions;