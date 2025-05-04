import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../Components/LoadingSpinner";
import EnhancedLazyImage from "../Components/EnhancedLazyImage";
import apiService from "../utils/apiService";

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

  .skeleton-pulse {
    animation: skeleton-pulse 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-pulse {
    0% { opacity: 0.6; }
    50% { opacity: 0.8; }
    100% { opacity: 0.6; }
  }
`;

function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for products and pagination
  const [products, setProducts] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    perPage: 15,
    total: 0
  });

  // State for filters
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [filterableAttributes, setFilterableAttributes] = useState([]);

  // Filter states
  const [selectedBrandIds, setSelectedBrandIds] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [selectedSubSubCategoryIds, setSelectedSubSubCategoryIds] = useState([]);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyPromotions, setShowOnlyPromotions] = useState(false);
  const [sortBy, setSortBy] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");

  // Load initial data
  useEffect(() => {
    // Get filter values from URL if present
    const page = searchParams.get("page") || 1;
    const brandIds = searchParams.get("marque_id")?.split(",").map(Number) || [];
    const categoryId = searchParams.get("categorie_id") || null;
    const subCategoryId = searchParams.get("sous_categorie_id") || null;
    const subSubCategoryIds = searchParams.get("sous_sous_categorie_id")?.split(",").map(Number) || [];
    const name = searchParams.get("nom") || "";
    const minPrice = searchParams.get("prix_min") || "";
    const maxPrice = searchParams.get("prix_max") || "";
    const available = searchParams.get("disponible") === "true";
    const promotions = searchParams.get("en_promotion") === "true";
    const sort = searchParams.get("sort_by") || "id";
    const direction = searchParams.get("sort_direction") || "asc";

    // Set filter states from URL
    setSelectedBrandIds(brandIds);
    setSelectedCategoryId(categoryId);
    setSelectedSubCategoryId(subCategoryId);
    setSelectedSubSubCategoryIds(subSubCategoryIds);
    setSearchQuery(name);
    setPriceRange({ min: minPrice, max: maxPrice });
    setShowOnlyAvailable(available);
    setShowOnlyPromotions(promotions);
    setSortBy(sort);
    setSortDirection(direction);

    // Load reference data
    loadBrands();
    loadCategories();
    loadSubCategories();
    loadSubSubCategories();
    loadFilterableAttributes();
  }, [searchParams]);

  // Load products when filters change
  useEffect(() => {
    loadProducts();
  }, [
    pagination.currentPage,
    selectedBrandIds,
    selectedCategoryId,
    selectedSubCategoryId,
    selectedSubSubCategoryIds,
    searchQuery,
    priceRange,
    showOnlyAvailable,
    showOnlyPromotions,
    sortBy,
    sortDirection
  ]);

  // Load brands
  const loadBrands = async () => {
    try {
      const response = await axios.get("https://laravel-api.fly.dev/api/marques");
      setBrands(response.data);
    } catch (error) {
      console.error("Error loading brands:", error);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await axios.get("https://laravel-api.fly.dev/api/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  // Load sub-categories
  const loadSubCategories = async () => {
    try {
      // Use the correct API route for sub-categories
      const response = await axios.get("https://laravel-api.fly.dev/api/sousCategories");
      setSubCategories(response.data);
    } catch (error) {
      console.error("Error loading sub-categories:", error);
    }
  };

  // Load sub-sub-categories
  const loadSubSubCategories = async () => {
    try {
      // Use the correct API route for sub-sub-categories
      const response = await axios.get("https://laravel-api.fly.dev/api/sous_sousCategories");
      setSubSubCategories(response.data);
    } catch (error) {
      console.error("Error loading sub-sub-categories:", error);
    }
  };

  // Load filterable attributes
  const loadFilterableAttributes = async () => {
    try {
      // Use the correct API route for filterable attributes
      const response = await axios.get("https://laravel-api.fly.dev/api/attributs/filtrables");

      // Make sure we have an array of attribute groups
      const attributeGroups = Array.isArray(response.data) ? response.data : [];
      setFilterableAttributes(attributeGroups);

      // Initialize selected attributes from URL if present
      const params = new URLSearchParams(window.location.search);
      const attributesFromUrl = {};

      // Check for attribute filters in URL
      for (const [key, value] of params.entries()) {
        if (key.startsWith('attributs[') && key.endsWith('][]')) {
          const attributeId = key.match(/\[(\d+)\]/)[1];
          if (!attributesFromUrl[attributeId]) {
            attributesFromUrl[attributeId] = [];
          }
          attributesFromUrl[attributeId].push(value);
        } else if (key.startsWith('attributs[') && key.endsWith('][min]')) {
          const attributeId = key.match(/\[(\d+)\]/)[1];
          if (!attributesFromUrl[attributeId]) {
            attributesFromUrl[attributeId] = { min: value };
          } else {
            attributesFromUrl[attributeId].min = value;
          }
        } else if (key.startsWith('attributs[') && key.endsWith('][max]')) {
          const attributeId = key.match(/\[(\d+)\]/)[1];
          if (!attributesFromUrl[attributeId]) {
            attributesFromUrl[attributeId] = { max: value };
          } else {
            attributesFromUrl[attributeId].max = value;
          }
        }
      }

      setSelectedAttributes(attributesFromUrl);
    } catch (error) {
      console.error("Error loading filterable attributes:", error);
      // Set empty array to prevent map errors
      setFilterableAttributes([]);
    }
  };

  // Load products with filters
  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();

      // Pagination
      params.append("page", pagination.currentPage);
      params.append("per_page", pagination.perPage);

      // Sorting
      params.append("sort_by", sortBy);
      params.append("sort_direction", sortDirection);

      // Include relations
      params.append("with", "marque,sousSousCategorie");

      // Filters
      if (selectedBrandIds.length > 0) {
        params.append("marque_id", selectedBrandIds.join(","));
      }

      if (selectedCategoryId) {
        params.append("categorie_id", selectedCategoryId);
      }

      if (selectedSubCategoryId) {
        params.append("sous_categorie_id", selectedSubCategoryId);
      }

      if (selectedSubSubCategoryIds.length > 0) {
        params.append("sous_sous_categorie_id", selectedSubSubCategoryIds.join(","));
      }

      if (searchQuery) {
        params.append("nom", searchQuery);
      }

      if (priceRange.min) {
        params.append("prix_min", priceRange.min);
      }

      if (priceRange.max) {
        params.append("prix_max", priceRange.max);
      }

      if (showOnlyAvailable) {
        params.append("disponible", "true");
      }

      if (showOnlyPromotions) {
        params.append("en_promotion", "true");
      }

      // For now, we'll skip attribute filters since we're using the main API endpoint
      // If attribute filtering is needed, we can implement it later when the /filtrer endpoint is fixed

      // Use the correct API endpoint for filtering products
      const response = await axios.get(`https://laravel-api.fly.dev/api/produits?${params.toString()}`);

      // Update state with response data
      const productsData = response.data.data || [];
      setProducts(productsData);
      setPagination({
        currentPage: response.data.current_page || 1,
        lastPage: response.data.last_page || 1,
        perPage: response.data.per_page || 15,
        total: response.data.total || 0
      });

      // Use the optimized batch image loading from apiService
      try {
        // Extract all product IDs
        const productIds = productsData.map(product => product.id);

        // Use the batch image loading function
        const imagesMap = await apiService.getBatchProductImages(productIds);

        // Update state with the image map
        setProductImages(imagesMap);
      } catch (error) {
        console.error("Error fetching product images:", error);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setError("Une erreur est survenue lors du chargement des produits. Veuillez réessayer plus tard.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and update URL
  const applyFilters = () => {
    const params = new URLSearchParams();

    // Add all filter parameters
    if (selectedBrandIds.length > 0) {
      params.append("marque_id", selectedBrandIds.join(","));
    }

    if (selectedCategoryId) {
      params.append("categorie_id", selectedCategoryId);
    }

    if (selectedSubCategoryId) {
      params.append("sous_categorie_id", selectedSubCategoryId);
    }

    if (selectedSubSubCategoryIds.length > 0) {
      params.append("sous_sous_categorie_id", selectedSubSubCategoryIds.join(","));
    }

    if (searchQuery) {
      params.append("nom", searchQuery);
    }

    if (priceRange.min) {
      params.append("prix_min", priceRange.min);
    }

    if (priceRange.max) {
      params.append("prix_max", priceRange.max);
    }

    if (showOnlyAvailable) {
      params.append("disponible", "true");
    }

    if (showOnlyPromotions) {
      params.append("en_promotion", "true");
    }

    // For now, we'll skip attribute filters in the URL
    // If attribute filtering is needed, we can implement it later when the /filtrer endpoint is fixed

    params.append("sort_by", sortBy);
    params.append("sort_direction", sortDirection);

    // Reset to page 1 when filters change
    params.append("page", "1");

    // Update URL with new parameters
    setSearchParams(params);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedBrandIds([]);
    setSelectedCategoryId(null);
    setSelectedSubCategoryId(null);
    setSelectedSubSubCategoryIds([]);
    setSelectedAttributes({});
    setSearchQuery("");
    setPriceRange({ min: "", max: "" });
    setShowOnlyAvailable(false);
    setShowOnlyPromotions(false);
    setSortBy("id");
    setSortDirection("asc");

    // Clear URL parameters and reset to page 1
    setSearchParams({});
  };

  // Handle brand selection
  const handleBrandChange = (brandId) => {
    setSelectedBrandIds(prev => {
      if (prev.includes(brandId)) {
        return prev.filter(id => id !== brandId);
      } else {
        return [...prev, brandId];
      }
    });
  };

  // Handle sub-sub-category selection
  const handleSubSubCategoryChange = (subSubCategoryId) => {
    setSelectedSubSubCategoryIds(prev => {
      if (prev.includes(subSubCategoryId)) {
        return prev.filter(id => id !== subSubCategoryId);
      } else {
        return [...prev, subSubCategoryId];
      }
    });
  };

  // Handle attribute selection
  const handleAttributeChange = (attributeId, value, type = 'choice') => {
    setSelectedAttributes(prev => {
      const newAttributes = { ...prev };

      if (type === 'choice') {
        // For multiple choice attributes (like colors)
        if (!newAttributes[attributeId]) {
          newAttributes[attributeId] = [value];
        } else if (Array.isArray(newAttributes[attributeId])) {
          if (newAttributes[attributeId].includes(value)) {
            // Remove value if already selected
            newAttributes[attributeId] = newAttributes[attributeId].filter(v => v !== value);
            if (newAttributes[attributeId].length === 0) {
              delete newAttributes[attributeId];
            }
          } else {
            // Add value if not already selected
            newAttributes[attributeId] = [...newAttributes[attributeId], value];
          }
        }
      } else if (type === 'range') {
        // For range attributes (like size)
        if (!newAttributes[attributeId]) {
          newAttributes[attributeId] = {};
        }
        newAttributes[attributeId] = { ...newAttributes[attributeId], ...value };

        // Remove empty ranges
        if (!newAttributes[attributeId].min && !newAttributes[attributeId].max) {
          delete newAttributes[attributeId];
        }
      }

      return newAttributes;
    });
  };

  // Handle pagination
  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Elegant page header with animation */}
        <div className="text-center mb-12 fade-in-up">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide mb-2 text-gray-800">
            NOTRE COLLECTION
          </h1>
          <div className="w-24 h-px bg-[#A67B5B] mx-auto my-6"></div>
          <p className="text-gray-600 max-w-2xl mx-auto font-light text-lg">
            Découvrez notre sélection raffinée de produits de qualité, alliant élégance et design pour sublimer votre intérieur
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-8">
          {/* Filters sidebar with improved styling */}
          <div className="w-full md:w-1/4 bg-white p-6 rounded-lg shadow-md border border-gray-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#A67B5B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtres
              </h3>
              <button
                onClick={resetFilters}
                className="text-sm text-gray-600 hover:text-[#A67B5B] transition-colors duration-300 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Réinitialiser
              </button>
            </div>

            {/* Search by name with improved styling */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Recherche par nom
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-all duration-300 text-sm"
                  placeholder="Nom du produit..."
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Price range with improved styling */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Fourchette de prix
              </label>
              <div className="flex space-x-2">
                <div className="relative w-1/2">
                  <input
                    type="number"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-all duration-300 text-sm"
                    placeholder="Min"
                    min="0"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">DT</span>
                  </div>
                </div>
                <div className="relative w-1/2">
                  <input
                    type="number"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="w-full p-3 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-all duration-300 text-sm"
                    placeholder="Max"
                    min="0"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">DT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Availability and promotions with improved styling */}
            <div className="mb-6">
              <h4 className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Options
              </h4>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showOnlyAvailable}
                      onChange={() => setShowOnlyAvailable(!showOnlyAvailable)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border rounded-md transition-colors duration-200 ${showOnlyAvailable ? 'bg-[#A67B5B] border-[#A67B5B]' : 'border-gray-300 bg-white'}`}>
                      {showOnlyAvailable && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">Produits disponibles uniquement</span>
                </label>

                <label className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={showOnlyPromotions}
                      onChange={() => setShowOnlyPromotions(!showOnlyPromotions)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border rounded-md transition-colors duration-200 ${showOnlyPromotions ? 'bg-[#A67B5B] border-[#A67B5B]' : 'border-gray-300 bg-white'}`}>
                      {showOnlyPromotions && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">Produits en promotion uniquement</span>
                </label>
              </div>
            </div>

            {/* Brands filter with improved styling */}
            <div className="mb-6">
              <h4 className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Marques
              </h4>
              <div className="max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                {brands.length > 0 ? (
                  brands.map((brand) => (
                    <label
                      key={brand.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedBrandIds.includes(brand.id)}
                          onChange={() => handleBrandChange(brand.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border rounded-md transition-colors duration-200 ${selectedBrandIds.includes(brand.id) ? 'bg-[#A67B5B] border-[#A67B5B]' : 'border-gray-300 bg-white'}`}>
                          {selectedBrandIds.includes(brand.id) && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-700">{brand.nom_marque}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic p-2">Chargement des marques...</p>
                )}
              </div>
            </div>

            {/* Categories filter with improved styling */}
            <div className="mb-6">
              <h4 className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Catégories
              </h4>
              <div className="max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                {subSubCategories.length > 0 ? (
                  subSubCategories.map((subSubCategory) => (
                    <label
                      key={subSubCategory.id}
                      className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedSubSubCategoryIds.includes(subSubCategory.id)}
                          onChange={() => handleSubSubCategoryChange(subSubCategory.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border rounded-md transition-colors duration-200 ${selectedSubSubCategoryIds.includes(subSubCategory.id) ? 'bg-[#A67B5B] border-[#A67B5B]' : 'border-gray-300 bg-white'}`}>
                          {selectedSubSubCategoryIds.includes(subSubCategory.id) && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-700">{subSubCategory.nom_sous_sous_categorie}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic p-2">Chargement des catégories...</p>
                )}
              </div>
            </div>

            {/* Dynamic attribute filters - temporarily disabled with improved styling */}
            <div className="mb-8">
              <h4 className="flex items-center text-sm font-medium text-gray-700 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Attributs
              </h4>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="flex items-center text-gray-500 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm">Le filtrage par attributs est temporairement indisponible.</p>
                </div>
                <p className="text-xs text-gray-500">Cette fonctionnalité sera bientôt disponible.</p>
              </div>
            </div>

            {/* Apply filters button with improved styling */}
            <button
              onClick={applyFilters}
              className="w-full bg-[#A67B5B] text-white py-3 px-4 rounded-md hover:bg-[#8A5A3B] transition-all duration-300 shadow-sm hover:shadow flex items-center justify-center font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Appliquer les filtres
            </button>
          </div>

          {/* Products grid */}
          <div className="w-full md:w-3/4">
            {/* Sorting options with improved styling */}
            <div className="bg-white p-5 rounded-lg shadow-md mb-8 border border-gray-100">
              <div className="flex flex-wrap items-center justify-between">
                <div className="mb-3 md:mb-0">
                  <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                    {pagination.total} produits trouvés
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                    </svg>
                    Trier par:
                  </label>
                  <div className="relative">
                    <select
                      value={`${sortBy}-${sortDirection}`}
                      onChange={(e) => {
                        const [newSortBy, newSortDirection] = e.target.value.split('-');
                        setSortBy(newSortBy);
                        setSortDirection(newSortDirection);
                      }}
                      className="appearance-none pl-3 pr-10 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-all duration-300 text-sm bg-white"
                    >
                      <option value="id-asc">ID (croissant)</option>
                      <option value="id-desc">ID (décroissant)</option>
                      <option value="nom_produit-asc">Nom (A-Z)</option>
                      <option value="nom_produit-desc">Nom (Z-A)</option>
                      <option value="prix_produit-asc">Prix (croissant)</option>
                      <option value="prix_produit-desc">Prix (décroissant)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading state with improved skeleton cards */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden skeleton-pulse">
                    {/* Image skeleton */}
                    <div className="h-56 bg-gray-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <LoadingSpinner size="sm" variant="circle" color="#A67B5B" />
                      </div>
                    </div>

                    {/* Content skeleton */}
                    <div className="p-5">
                      {/* Title skeleton */}
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>

                      {/* Description skeleton */}
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>

                      {/* Tags skeleton */}
                      <div className="flex gap-2 mb-4">
                        <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      </div>

                      {/* Price and button skeleton */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded-md w-24"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state with improved styling */}
            {error && !loading && (
              <div className="flex flex-col justify-center items-center h-96 text-center p-8 bg-white rounded-lg shadow-md border border-gray-100">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light text-gray-800 mb-4">Une erreur est survenue</h3>
                <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-4 opacity-30"></div>
                <p className="text-gray-600 mb-8 max-w-md">{error}</p>
                <button
                  onClick={resetFilters}
                  className="flex items-center bg-[#A67B5B] text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Réinitialiser les filtres</span>
                </button>
              </div>
            )}

            {/* Empty state with improved styling */}
            {!loading && !error && products.length === 0 && (
              <div className="flex flex-col justify-center items-center h-96 text-center p-8 bg-white rounded-lg shadow-md border border-gray-100">
                <div className="mb-6 text-[#A67B5B] opacity-80">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-light text-gray-800 mb-4">Aucun produit trouvé</h3>
                <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-4 opacity-30"></div>
                <p className="text-gray-600 mb-8 max-w-md">
                  Aucun produit ne correspond à vos critères de recherche. Essayez d'élargir votre recherche ou de réinitialiser les filtres.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-3 bg-[#A67B5B] text-white rounded-md hover:bg-[#8A5A3B] transition-all duration-300 shadow-sm hover:shadow flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Réinitialiser les filtres
                </button>
              </div>
            )}

            {/* Products grid */}
            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 group cursor-pointer"
                    onClick={() => navigate(`/article/${product.id}`)}
                  >
                    {/* Image container with improved hover effects */}
                    <div className="relative h-56 overflow-hidden">
                      <EnhancedLazyImage
                        src={productImages[product.id] || product.image_produit}
                        alt={product.nom_produit}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        fallbackSrc="https://via.placeholder.com/300x200?text=Image+non+disponible"
                        spinnerVariant="ripple"
                      />

                      {/* Elegant overlay on hover */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-500"></div>

                      {/* Reference badge */}
                      {product.reference && (
                        <div className="absolute top-3 left-3 bg-white bg-opacity-90 text-xs px-2 py-1 rounded-md shadow-sm z-10 font-medium">
                          Réf: {product.reference}
                        </div>
                      )}

                      {/* Promotion badge with animation */}
                      {product.en_promotion && (
                        <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-3 py-1.5 rounded-md shadow-sm z-10 font-semibold transform group-hover:scale-110 transition-transform duration-300">
                          PROMO
                        </div>
                      )}

                      {/* Brand badge */}
                      {product.marque && (
                        <div className="absolute bottom-3 left-3 bg-white bg-opacity-90 text-xs px-2 py-1 rounded-md shadow-sm z-10 font-medium">
                          {product.marque.nom_marque}
                        </div>
                      )}

                      {/* Quick view button that appears on hover */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <button
                          className="bg-white bg-opacity-90 text-gray-800 px-4 py-2 rounded-md shadow-md transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 font-medium text-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/article/${product.id}`);
                          }}
                        >
                          Voir le produit
                        </button>
                      </div>
                    </div>

                    {/* Product details with improved typography and spacing */}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-[#A67B5B] transition-colors duration-300 line-clamp-1">
                        {product.nom_produit}
                      </h3>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10 leading-tight">
                        {product.description_produit || "Aucune description disponible"}
                      </p>

                      {/* Product attributes/tags with improved styling */}
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {product.sous_sous_categorie && (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                            {product.sous_sous_categorie.nom_sous_sous_categorie}
                          </span>
                        )}
                        {(product.quantite_produit > 0 || product.stock > 0) ? (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                            En stock
                          </span>
                        ) : (
                          <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded-full font-medium flex items-center">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1"></span>
                            Rupture
                          </span>
                        )}
                        {product.attributs && product.attributs.length > 0 && product.attributs.slice(0, 2).map(attr => (
                          <span key={attr.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                            {attr.nom}: {attr.valeur}
                          </span>
                        ))}
                      </div>

                      {/* Price and action button with improved styling */}
                      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                        <div>
                          {product.prix_original && product.prix_original > product.prix_produit ? (
                            <div className="flex flex-col">
                              <span className="text-lg font-bold text-red-600">{product.prix_produit} DT</span>
                              <span className="text-sm line-through text-gray-500">{product.prix_original} DT</span>
                            </div>
                          ) : (
                            <span className="text-lg font-bold text-gray-800">{product.prix_produit} DT</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/article/${product.id}`);
                          }}
                          className="bg-[#A67B5B] text-white py-2 px-4 rounded-md hover:bg-[#8A5A3B] transition-all duration-300 shadow-sm hover:shadow group-hover:scale-105 font-medium text-sm"
                        >
                          Détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && products.length > 0 && (
              <div className="mt-12 flex justify-center">
                <nav className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`px-4 py-2 rounded-md border font-medium text-sm transition-all duration-300 ${
                      pagination.currentPage === 1
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-[#A67B5B] hover:border-[#A67B5B]"
                    }`}
                    aria-label="Page précédente"
                  >
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Précédent
                    </span>
                  </button>

                  {/* Show limited page numbers with ellipsis for better UX */}
                  {[...Array(pagination.lastPage).keys()].map((page) => {
                    const pageNumber = page + 1;
                    // Show first page, last page, current page, and pages around current
                    const showPageNumber =
                      pageNumber === 1 ||
                      pageNumber === pagination.lastPage ||
                      (pageNumber >= pagination.currentPage - 1 && pageNumber <= pagination.currentPage + 1);

                    // Show ellipsis for skipped pages
                    if (!showPageNumber) {
                      // Show ellipsis only once between ranges
                      if (pageNumber === 2 || pageNumber === pagination.lastPage - 1) {
                        return (
                          <span key={`ellipsis-${pageNumber}`} className="px-3 py-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`w-10 h-10 rounded-md border font-medium text-sm transition-all duration-300 ${
                          pagination.currentPage === pageNumber
                            ? "bg-[#A67B5B] text-white border-[#A67B5B]"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-[#A67B5B] hover:border-[#A67B5B]"
                        }`}
                        aria-label={`Page ${pageNumber}`}
                        aria-current={pagination.currentPage === pageNumber ? "page" : undefined}
                      >
                        {pageNumber}
                      </button>
                    );
                  }).filter(Boolean)}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.lastPage}
                    className={`px-4 py-2 rounded-md border font-medium text-sm transition-all duration-300 ${
                      pagination.currentPage === pagination.lastPage
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-[#A67B5B] hover:border-[#A67B5B]"
                    }`}
                    aria-label="Page suivante"
                  >
                    <span className="flex items-center">
                      Suivant
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
