import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import "../style/animations.css";
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

const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleItems, setVisibleItems] = useState([]);
  const headerRef = useRef(null);
  const itemsPerPage = 8; // Nombre d'éléments par page

  // Fonction pour suivre la position de défilement
  const handleScroll = () => {
    const position = window.pageYOffset;
    setScrollPosition(position);
  };

  // Effet pour gérer le défilement
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Effet pour observer les éléments visibles
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const handleIntersect = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          setVisibleItems(prev => [...prev, id]);
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    // Observer les éléments après le rendu
    const observeElements = () => {
      const elements = document.querySelectorAll('.subcategory-card');
      elements.forEach(el => observer.observe(el));
    };

    if (subCategories.length > 0) {
      setTimeout(observeElements, 100);
    }

    return () => {
      observer.disconnect();
    };
  }, [subCategories]);

  useEffect(() => {
    if (!id) {
      setError("ID de catégorie invalide.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null); // Réinitialiser les erreurs à chaque nouvelle requête
    setVisibleItems([]); // Réinitialiser les éléments visibles

    // Récupérer la catégorie
    fetch(`https://laravel-api.fly.dev/api/categories/${id}`)
      .then(res => res.json())
      .then(data => {
        setCategory(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur lors du chargement de la catégorie.");
        setLoading(false);
      });

    // Récupérer les sous-catégories
    fetch(`https://laravel-api.fly.dev/api/sousCategories?categorie_id=${id}`)
      .then(res => res.json())
      .then(data => {
        const filteredSubCategories = data.filter(sub => sub.categorie_id == id);
        setSubCategories(filteredSubCategories);
      })
      .catch(() => {
        setError("Erreur lors du chargement des sous-catégories.");
        setLoading(false);
      });
  }, [id]);

  // Loading state with elegant animation
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" key={`category-loading-${id}`}>
      <div className="text-center max-w-md mx-auto px-4 py-12 bg-white rounded-lg shadow-md">
        <LoadingSpinner size="lg" variant="elegant" color="#A67B5B" />
        <p className="mt-6 text-gray-600 font-light tracking-wide">Chargement de la catégorie...</p>
        <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-30"></div>
        <p className="text-sm text-gray-500 font-light">Veuillez patienter pendant que nous préparons votre expérience</p>
        <div className="mt-6 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className="h-full bg-[#A67B5B] animate-pulse-width"></div>
        </div>
      </div>
    </div>
  );

  // Error state with improved styling
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" key={`category-error-${id}`}>
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-gray-800 mb-4">Une erreur est survenue</h2>
        <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-4 opacity-30"></div>
        <p className="text-gray-600 mb-8 max-w-md">{error}</p>
        <Link to="/" className="flex items-center bg-[#A67B5B] text-white px-8 py-3 rounded-lg font-medium shadow-md hover:bg-[#8B5A2B] hover:shadow-lg transition-all duration-300 mx-auto w-max">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span>Retour à l'accueil</span>
        </Link>
      </div>
    </div>
  );

  // Calcul des éléments affichés avec pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = subCategories.slice(indexOfFirstItem, indexOfLastItem);

  // Fonction pour vérifier si un élément est visible
  const isItemVisible = (id) => visibleItems.includes(id.toString());

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-gray-800 font-serif" key={`category-page-${id}`}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {/* ✅ En-tête avec image de la catégorie et effet parallaxe */}
      {category && category.image_categorie && (
        <div
          ref={headerRef}
          className="relative w-full h-[500px] overflow-hidden"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Overlay élégant */}
          <div className="absolute inset-0 bg-black/30 z-10"></div>

          {/* Image avec effet parallaxe */}
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              transform: `translateY(${scrollPosition * 0.3}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <img
              src={category.image_categorie}
              alt={category.nom_categorie}
              className="w-full h-full object-cover animate-zoom-in"
              style={{
                transformOrigin: 'center center',
                objectPosition: 'center center'
              }}
            />
          </div>

          {/* Contenu centré avec animation */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <div className="text-center px-8 py-10 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-2xl transform transition-all duration-700">
              <h1 className="text-5xl font-light tracking-wider text-white mb-4 animate-fade-in">
                {category?.nom_categorie}
              </h1>
              <div className="w-32 h-px bg-[#A67B5B] mx-auto my-4 animate-slide-in"></div>
              <p className="text-xl text-white/90 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <span className="font-light">{subCategories.length}</span> sous-catégories disponibles
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Description de la catégorie */}
      <div className="container mx-auto px-4 py-12 -mt-16 relative z-30">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-xl p-8 transform transition-all duration-700 hover:shadow-2xl">
          <h2 className="text-3xl font-light text-center text-gray-800 mb-6 underline-animation">
            Explorez notre collection
          </h2>
          <p className="text-gray-600 text-center leading-relaxed">
            {category?.description_categorie || "Découvrez notre sélection raffinée de produits de luxe, conçus pour sublimer votre intérieur avec élégance et sophistication."}
          </p>
        </div>
      </div>

      {/* ✅ Liste des sous-catégories avec pagination et animations */}
      <div className="container mx-auto px-4 pb-16 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {currentItems.map((subCategory, index) => (
            <Link
              to={`/sous_souscategorie/${subCategory.id}`}
              key={subCategory.id}
              data-id={subCategory.id}
              className={`subcategory-card bg-white rounded-xl overflow-hidden elegant-border parallax-card transform transition-all duration-700 ${
                isItemVisible(subCategory.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
              }`}
              style={{
                transitionDelay: `${(index % 4) * 150}ms`,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)'
              }}
            >
              <div className="relative overflow-hidden h-56">
                <img
                  src={subCategory.image}
                  alt={subCategory.nom_sous_categorie}
                  className="w-full h-full object-cover transition-all duration-700 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-light text-gray-800 mb-2 depth-element depth-element-2">
                  <span className="relative inline-block underline-animation">
                    {subCategory.nom_sous_categorie}
                  </span>
                </h3>
                <p className="text-gray-600 text-sm mt-2 depth-element depth-element-1">
                  {subCategory.description_sous_categorie}
                </p>
                <div className="mt-4 depth-element depth-element-3">
                  <span className="inline-block px-4 py-2 bg-transparent text-[#A67B5B] border border-[#A67B5B] rounded-md hover:bg-[#A67B5B] hover:text-white transition-all duration-300">
                    Découvrir
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ✅ Pagination élégante */}
        {subCategories.length > itemsPerPage && (
          <div className="flex justify-center mt-12">
            <div className="inline-flex rounded-xl overflow-hidden shadow-lg bg-white p-1">
              {Array.from({ length: Math.ceil(subCategories.length / itemsPerPage) }, (_, i) => (
                <button
                  key={i}
                  className={`px-5 py-3 mx-1 rounded-lg transition-all duration-300 ${
                    currentPage === i + 1
                      ? "bg-[#A67B5B] text-white shadow-md"
                      : "bg-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
