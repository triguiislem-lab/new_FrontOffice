import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import LoadingSpinner from "../Components/LoadingSpinner";
import { useWishlist } from "../Contexts/WishlistContext";
import { useCart } from "../Contexts/CartContext";

// Custom CSS for the brand page
const brandPageStyles = `
  .bg-pattern {
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a67b5b' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
`;

const BrandPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToWishlist } = useWishlist();
  const { addToCart } = useCart();

  // State management
  const [brand, setBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Reset states when brand ID changes
  useEffect(() => {
    // Reset states when brand ID changes to prevent showing old data
    setLoading(true);
    setProducts([]);
    setFilteredProducts([]);
    setBrand(null);

    // Reset filters when changing brands
    setSearchTerm('');
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    setSortOrder('default');

    // Scroll to top when changing brands
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch brand and products data
  useEffect(() => {
    const fetchBrandAndProducts = async () => {
      if (!id) return;

      try {
        // First fetch the brand data
        const brandRes = await axios.get(`https://laravel-api.fly.dev/api/marques/${id}`);
        setBrand(brandRes.data);

        // Then fetch the products for this brand
        const productsRes = await axios.get(`https://laravel-api.fly.dev/api/marques/${id}/produits`);

        if (!productsRes.data || productsRes.data.length === 0) {
          // If no products, set empty arrays and stop loading
          setProducts([]);
          setFilteredProducts([]);
          setLoading(false);
          return;
        }

        // For each product, fetch its images
        const productsWithImages = await Promise.all(
          productsRes.data.map(async (product) => {
            try {
              const imgRes = await axios.get('https://laravel-api.fly.dev/api/images/get', {
                params: {
                  model_type: 'produit',
                  model_id: product.id
                }
              });
              let imageUrl = null;
              if (imgRes.data && imgRes.data.images && imgRes.data.images.length > 0) {
                const primary = imgRes.data.images.find(img => img.is_primary) || imgRes.data.images[0];
                imageUrl = primary.direct_url;
              }
              return {
                ...product,
                image_produit: imageUrl || '/img/placeholder-product.jpg'
              };
            } catch (imgErr) {
              console.error(`Error fetching image for product ${product.id}:`, imgErr);
              return {
                ...product,
                image_produit: '/img/placeholder-product.jpg'
              };
            }
          })
        );

        setProducts(productsWithImages);
        setFilteredProducts(productsWithImages);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement :', error);
        setLoading(false);
      }
    };

    fetchBrandAndProducts();
  }, [id]);

  // Fetch categories (only once)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRes = await axios.get('https://laravel-api.fly.dev/api/categories');
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des catégories :', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    // Skip filtering if we're in the main loading state or if products array is empty
    if (loading || products.length === 0) {
      return;
    }

    setLoadingProducts(true);

    // Use a timeout to ensure the loading state is visible
    const filterTimeout = setTimeout(() => {
      let updated = [...products];
      let filterCount = 0;

      // Filter by search term
      if (searchTerm.trim() !== '') {
        updated = updated.filter((p) =>
          p.nom_produit.toLowerCase().includes(searchTerm.toLowerCase())
        );
        filterCount++;
      }

      // Filter by selected categories
      if (selectedCategories.length > 0) {
        updated = updated.filter((p) => selectedCategories.includes(p.categorie_id));
        filterCount += selectedCategories.length;
      }

      // Filter by price range
      if (priceRange[0] > 0 || priceRange[1] < 1000) {
        updated = updated.filter(
          (p) => p.prix_produit >= priceRange[0] && p.prix_produit <= priceRange[1]
        );
        filterCount++;
      }

      // Sort products
      if (sortOrder === 'asc') {
        updated.sort((a, b) => a.prix_produit - b.prix_produit);
      } else if (sortOrder === 'desc') {
        updated.sort((a, b) => b.prix_produit - a.prix_produit);
      } else if (sortOrder === 'name_asc') {
        updated.sort((a, b) => a.nom_produit.localeCompare(b.nom_produit));
      } else if (sortOrder === 'name_desc') {
        updated.sort((a, b) => b.nom_produit.localeCompare(a.nom_produit));
      }

      setActiveFilters(filterCount);
      setFilteredProducts(updated);
      setLoadingProducts(false);
    }, 500); // Slightly longer timeout for better UX

    // Clean up the timeout if the component unmounts or dependencies change
    return () => clearTimeout(filterTimeout);
  }, [searchTerm, sortOrder, selectedCategories, priceRange, products, loading]);

  // Handle category filter change
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prevSelectedCategories) => {
      if (prevSelectedCategories.includes(categoryId)) {
        // If category is already selected, remove it
        return prevSelectedCategories.filter((id) => id !== categoryId);
      } else {
        // Otherwise, add it
        return [...prevSelectedCategories, categoryId];
      }
    });
  };

  // Handle price range change
  const handlePriceRangeChange = (min, max) => {
    setPriceRange([min, max]);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    setSortOrder('default');
  };

  // Handle add to cart
  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      nom: product.nom_produit,
      prix: product.prix_produit,
      image: product.image_produit,
      quantite: 1
    });
  };

  // Handle add to wishlist
  const handleAddToWishlist = (product) => {
    addToWishlist({
      id: product.id,
      nom: product.nom_produit,
      prix: product.prix_produit,
      image: product.image_produit
    });
  };

  // Toggle filter visibility on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Toggle view mode (grid/list)
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  // Loading state with elegant animation
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" key={`brand-loading-${id}`}>
      <div className="text-center max-w-md mx-auto px-4 py-12 bg-white rounded-lg shadow-md">
        <LoadingSpinner
          size="lg"
          variant="elegant"
          color="#A67B5B"
          message="Chargement des produits de la marque..."
          showLoadingLine={true}
        />
        <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-30"></div>
        <p className="text-sm text-gray-500 font-light">Veuillez patienter pendant que nous préparons votre expérience de shopping</p>
      </div>
    </div>
  );

  // Error state
  if (!brand) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" key={`brand-error-${id}`}>
      <div className="text-center max-w-md mx-auto px-4 py-12 bg-white rounded-lg shadow-lg">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-gray-800 mb-4">Marque introuvable</h2>
        <p className="text-gray-600 mb-4">Nous n'avons pas pu trouver la marque que vous recherchez.</p>
        <p className="text-sm text-gray-500 mb-8">ID de marque: {id}</p>
        <button
          onClick={() => navigate('/marque')}
          className="flex items-center bg-[#A67B5B] text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transition-all duration-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Retour aux marques</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif" key={`brand-page-${id}`}>
      <style dangerouslySetInnerHTML={{ __html: brandPageStyles }} />
      {/* Section de logo de la marque améliorée */}
      <section className="text-center py-16 bg-gradient-to-b from-white to-gray-50 shadow-md rounded-lg mb-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 bg-pattern"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#A67B5B]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#A67B5B]/5 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="mb-8 transform transition-all duration-500 hover:scale-105">
            <img
              src={brand.logo_marque}
              alt={`${brand.nom_marque} Logo`}
              className="mx-auto w-48 h-48 object-contain border-4 border-[#A67B5B] rounded-full shadow-xl bg-white p-2"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/img/placeholder.jpg';
              }}
            />
          </div>
          <h1 className="text-4xl font-light tracking-widest mb-4 text-[#A67B5B] relative inline-block">
            <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-16 after:h-0.5 after:bg-[#A67B5B] after:transition-all after:duration-700 hover:after:w-full pb-2">
              {brand.nom_marque}
            </span>
          </h1>
          {brand.description_marque && (
            <p className="max-w-2xl mx-auto text-gray-600 font-light px-4 leading-relaxed mt-6">
              {brand.description_marque}
            </p>
          )}
        </div>
      </section>

      {/* Section Contenu principal */}
      <section className="flex flex-col md:flex-row gap-8 px-8 pb-16">
        {/* Filtres à gauche */}
        <aside className="w-full md:w-1/4 bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6 text-[#A67B5B]">Filtres</h2>

          {/* Recherche */}
          <div className="mb-6">
            <label className="block mb-2 text-sm text-gray-600">Recherche</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nom du produit"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#A67B5B] focus:border-[#A67B5B] transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Tri */}
          <div className="mb-6">
            <label className="block mb-2 text-sm text-gray-600">Trier par</label>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-[#A67B5B] focus:border-[#A67B5B] transition-all duration-300"
              >
                <option value="default">Par défaut</option>
                <option value="asc">Prix croissant</option>
                <option value="desc">Prix décroissant</option>
                <option value="name_asc">Nom (A-Z)</option>
                <option value="name_desc">Nom (Z-A)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Filtre par catégories */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-[#A67B5B]">Catégories</h3>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`category-${category.id}`}
                    value={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                    className="mr-3 h-5 w-5 rounded border-gray-300 text-[#A67B5B] focus:ring-[#A67B5B] transition-colors duration-200"
                  />
                  <label
                    htmlFor={`category-${category.id}`}
                    className="text-sm text-gray-700 hover:text-[#A67B5B] cursor-pointer transition-colors duration-200"
                  >
                    {category.nom_categorie}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Clear filters button */}
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="mt-8 w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-300 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Effacer les filtres ({activeFilters})
            </button>
          )}
        </aside>

        {/* Liste des produits */}
        <main className="w-full md:w-3/4">
          {loadingProducts ? (
            <div className="flex flex-col justify-center items-center h-64 bg-white rounded-lg shadow-sm p-8">
              <LoadingSpinner
                size="lg"
                variant="elegant"
                color="#A67B5B"
                message="Chargement des produits..."
                showLoadingLine={true}
              />
              <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-4 opacity-30"></div>
              <p className="text-sm text-gray-500 font-light">Veuillez patienter pendant que nous préparons les produits</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-600 text-lg">Aucun produit trouvé.</p>
              <p className="text-gray-500 mt-2">Essayez de modifier vos filtres de recherche.</p>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  <span className="font-medium text-[#A67B5B]">{filteredProducts.length}</span> produits trouvés
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-[#A67B5B] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-[#A67B5B] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-100 rounded-lg shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 group overflow-hidden"
                    >
                      <div className="relative overflow-hidden h-56">
                        <img
                          src={product.image_produit || "/img/default.jpg"}
                          alt={product.nom_produit}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <button
                            onClick={() => handleAddToWishlist(product)}
                            className="mx-2 p-2 rounded-full bg-white text-gray-800 hover:bg-[#A67B5B] hover:text-white transition-colors duration-300"
                            title="Ajouter aux favoris"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="mx-2 p-2 rounded-full bg-white text-gray-800 hover:bg-[#A67B5B] hover:text-white transition-colors duration-300"
                            title="Ajouter au panier"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-2 text-gray-800 hover:text-[#A67B5B] transition-colors duration-300">{product.nom_produit}</h3>
                        <div className="mt-4 flex flex-col justify-between items-start">
                          <span className="text-lg font-bold text-[#A67B5B]">{product.prix_produit} TD</span>
                          <p className="text-sm text-gray-500 mt-2">Référence: {product.reference}</p>
                          <button
                            className="bg-[#A67B5B] text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transition-all duration-300 mt-4 w-full flex items-center justify-center"
                            onClick={() => navigate(`/article/${product.id}`)}
                          >
                            <span>Détails</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white border border-gray-100 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row overflow-hidden"
                    >
                      <div className="md:w-1/3 relative">
                        <img
                          src={product.image_produit || "/img/default.jpg"}
                          alt={product.nom_produit}
                          className="w-full h-64 md:h-full object-cover"
                        />
                      </div>
                      <div className="p-6 md:w-2/3 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-semibold mb-3 text-gray-800 hover:text-[#A67B5B] transition-colors duration-300">{product.nom_produit}</h3>
                          <p className="text-gray-600 mb-4">{product.description_produit || "Aucune description disponible."}</p>
                          <p className="text-sm text-gray-500">Référence: {product.reference}</p>
                        </div>
                        <div className="mt-6 flex flex-wrap items-center justify-between">
                          <span className="text-xl font-bold text-[#A67B5B]">{product.prix_produit} TD</span>
                          <div className="flex space-x-3 mt-4 md:mt-0">
                            <button
                              onClick={() => handleAddToWishlist(product)}
                              className="p-2 rounded-full bg-gray-100 text-gray-800 hover:bg-[#A67B5B] hover:text-white transition-colors duration-300"
                              title="Ajouter aux favoris"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="p-2 rounded-full bg-gray-100 text-gray-800 hover:bg-[#A67B5B] hover:text-white transition-colors duration-300"
                              title="Ajouter au panier"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                            </button>
                            <button
                              className="bg-[#A67B5B] text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transition-all duration-300 flex items-center"
                              onClick={() => navigate(`/article/${product.id}`)}
                            >
                              <span>Voir détails</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </section>
    </div>
  );
};

export default BrandPage;
