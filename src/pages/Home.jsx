import React, { useEffect, useState, useCallback } from "react";
import "../style/style.css";
import { useNavigate } from "react-router-dom";
import Categorie from '../Produit/Categorie.jsx';
import DiscountModal from "@/DiscountBanner";
import { useAuth } from "@/Contexts/AuthContext";
import EnhancedLazyImage from "../Components/EnhancedLazyImage";
import OptimizedCarousel from "../Components/OptimizedCarousel";
import apiService from "../utils/apiService";
import LoadingSpinner from "../Components/LoadingSpinner";
import DynamicButton from "../Components/DynamicButton";
import { preloadImages } from "../utils/imageOptimizer";

// Carousel settings for the OptimizedCarousel component
const heroSettings = {
  dots: true,
  infinite: true,
  speed: 800,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 5000,
  arrows: true,
  fade: true,
  cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)',
  responsive: [
    {
      breakpoint: 768,
      settings: {
        arrows: false,
        dots: true
      }
    }
  ]
};



function Home() {
  const [categoriesEnVedette, setCategoriesEnVedette] = useState([]); // État pour les catégories en vedette
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isFirstLogin, isAuthenticated } = useAuth();
  const [carrouselSlides, setCarrouselSlides] = useState([]);
  const [isCarouselLoading, setIsCarouselLoading] = useState(true);
  const [carouselError, setCarouselError] = useState(null);



  const navigate = useNavigate();

  // We'll use a simpler approach for CSS loading
  // The slick carousel CSS is now included in the main CSS file or index.html
  useEffect(() => {
    // Add any component initialization logic here if needed
    // This keeps the component lifecycle hook for future use
  }, []);

  // Afficher la modale si c'est la première connexion
  useEffect(() => {
    if (isFirstLogin) {
      setIsModalOpen(true);
    }
  }, [isFirstLogin]);

  // Récupération optimisée des catégories en vedette
  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiService.get('/categories/featured', {}, {
        useCache: true,
        cacheMaxAge: 60 * 60 * 1000, // Cache for 1 hour
        timeout: 8000, // 8 second timeout
        deduplicate: true // Avoid duplicate requests
      });

      setCategoriesEnVedette(data);

      // Preload category images for better performance
      if (data && data.length > 0) {
        const categoryImages = data
          .filter(cat => cat.image_categorie)
          .map(cat => cat.image_categorie);

        // Preload with priority (first 2 images load immediately, rest during idle time)
        preloadImages(categoryImages, 2);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories en vedette", error);
    }
  }, []);

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Check for redirect path in sessionStorage after successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = sessionStorage.getItem('redirectPath');
      if (redirectPath) {
        // Clear the redirect path from sessionStorage
        sessionStorage.removeItem('redirectPath');
        // Navigate to the stored path
        navigate(redirectPath);
      }
    }
  }, [isAuthenticated, navigate]);

  const closeModal = () => {
    setIsModalOpen(false);
  };



  // Optimized carousel loading with enhanced caching and preloading
  const fetchCarrousels = useCallback(async () => {
    try {
      setIsCarouselLoading(true);
      setCarouselError(null);

      // Use the enhanced API service with longer cache duration
      const carrousels = await apiService.get('/carousels/actifs', {}, {
        useCache: true,
        cacheMaxAge: 30 * 60 * 1000, // Cache for 30 minutes
        timeout: 8000 // 8 second timeout
      });

      if (carrousels.length > 0) {
        const firstCarrouselId = carrousels[0].id;

        // Use the enhanced API service for slides
        const slides = await apiService.get(`/carousels/${firstCarrouselId}/slides`, {}, {
          useCache: true,
          cacheMaxAge: 30 * 60 * 1000, // Cache for 30 minutes
          timeout: 8000 // 8 second timeout
        });

        // Preload images for faster rendering using our optimized utility
        if (slides.length > 0) {
          // Extract image URLs from slides
          const imageUrls = slides
            .filter(slide => slide.primary_image_url)
            .map(slide => slide.primary_image_url);

          // Preload images with priority (first image loads immediately, rest during idle time)
          preloadImages(imageUrls, 1);
        }

        setCarrouselSlides(slides);
      } else {
        setCarrouselSlides([]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des carrousels:", error);
      setCarouselError("Impossible de charger le carrousel. Veuillez réessayer plus tard.");
      setCarrouselSlides([]);
    } finally {
      setIsCarouselLoading(false);
    }
  }, []);

  // Load carousel data on component mount
  useEffect(() => {
    fetchCarrousels();

    // Prefetch categories data for better performance when user navigates
    apiService.prefetch([
      {
        endpoint: '/categories/featured',
        options: { cacheMaxAge: 60 * 60 * 1000 } // 1 hour cache
      }
    ]);
  }, [fetchCarrousels]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif">
      {/* 🔹 Modale de réduction */}
      <DiscountModal isOpen={isModalOpen} onClose={closeModal} />

      {/* 🔹 HERO CAROUSEL - Enhanced with better styling */}
      <section className="relative w-full overflow-hidden">
        {/* Optimized Carousel Component */}
        <OptimizedCarousel
          slides={carrouselSlides}
          settings={{
            ...heroSettings,
            arrows: true,
            autoplaySpeed: 6000,
            speed: 1000,
            cssEase: 'cubic-bezier(0.45, 0, 0.2, 1)'
          }}
          loading={isCarouselLoading}
          error={carouselError}
          emptyMessage="Aucune diapositive disponible"
          className="hero-carousel"
        />
      </section>

      {/* 🔹 CATEGORIES EN VEDETTE - Enhanced */}
      <section className="pt-16 pb-24 px-6 overflow-hidden bg-gradient-to-b from-white to-gray-50 relative">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#A67B5B]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#A67B5B]/5 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-light tracking-widest mb-4 relative inline-block">
              <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-16 after:h-0.5 after:bg-[#A67B5B] after:transition-all after:duration-700 hover:after:w-full pb-2">
                NOS CATÉGORIES
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto mt-6 leading-relaxed">
              Découvrez notre sélection raffinée de produits de luxe, organisés par catégories pour faciliter votre navigation
              et vous inspirer dans l'aménagement de vos espaces.
            </p>
          </div>

          {/* Loading state */}
          {categoriesEnVedette.length === 0 && (
            <div className="flex justify-center py-12">
              <LoadingSpinner
                size="lg"
                variant="elegant"
                message="Chargement des catégories..."
                color="#A67B5B"
              />
            </div>
          )}

          {/* Conteneur des cartes avec effet de parallaxe amélioré */}
          {categoriesEnVedette.length > 0 && (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12"
              style={{
                perspective: '1200px',
                transformStyle: 'preserve-3d'
              }}
            >
              {categoriesEnVedette.slice(0, 6).map((cat, index) => (
                <div
                  key={cat.id}
                  className="transform transition-all duration-700 hover:translate-z-20 hover:scale-105"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(0) rotateX(0) rotateY(0)`,
                    transition: 'all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1)',
                    opacity: 0,
                    animation: 'fadeInUp 0.8s forwards',
                    animationDelay: `${index * 0.15}s`
                  }}
                >
                  <Categorie
                    id={index + 1}
                    name={cat.nom_categorie}
                    image={cat.image_categorie}
                    des={cat.description_categorie}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Bouton élégant amélioré */}
          <div className="flex justify-center mt-20">
            <div className="transform transition-all duration-500 hover:scale-105 hover:shadow-lg">
              <DynamicButton
                label="Explorer toutes les catégories"
                to="/Produit/AllCat"
                className="btn-primary px-8 py-4 rounded-lg font-medium shadow-md hover:shadow-xl"
              >
                <span className="relative z-10 flex items-center">
                  <span>Explorer toutes les catégories</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
                <span className="absolute inset-0 bg-[#8B5A2B] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
              </DynamicButton>
            </div>
          </div>
        </div>
      </section>

      {/* 🔹 À PROPOS - Simplified and well-organized layout */}
      <section className="py-20 px-6 bg-gray-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('/img/texture-bg.jpg')] opacity-5"></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-4 relative inline-block">
              <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-16 after:h-0.5 after:bg-[#A67B5B] after:transition-all after:duration-700 hover:after:w-full pb-2">
                À propos de nous
              </span>
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Left side - Image */}
              <div className="w-full md:w-1/2">
                <div className="h-full">
                  <EnhancedLazyImage
                    src="/img/interior-moodboard.png"
                    alt="Design d'intérieur - Style chaleureux"
                    className="w-full h-full object-cover"
                    fallbackSrc="/img/placeholder.jpg"
                    width={600}
                    height={450}
                    optimize={true}
                    blur={true}
                    fadeIn={true}
                    spinnerVariant="elegant"
                  />
                </div>
              </div>

              {/* Right side - Content */}
              <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                <p className="text-gray-700 leading-relaxed mb-6">
                  Bienvenue sur notre showroom en ligne, une vitrine dédiée à l'élégance et au design d'intérieur.
                  Nous vous proposons une sélection raffinée de marques prestigieuses, alliant qualité et style.
                </p>

                <p className="text-gray-700 leading-relaxed mb-8">
                  Notre équipe de passionnés sélectionne avec soin chaque article pour vous offrir le meilleur du design et de l'artisanat.
                  Nous croyons que votre intérieur devrait refléter votre personnalité et votre style de vie.
                </p>

                {/* Features list */}
                <div className="mb-8 space-y-3">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#A67B5B]/10 flex items-center justify-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#A67B5B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Des marques prestigieuses sélectionnées avec soin</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#A67B5B]/10 flex items-center justify-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#A67B5B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Un service client attentif et personnalisé</p>
                  </div>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#A67B5B]/10 flex items-center justify-center mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#A67B5B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="ml-3 text-gray-700">Des conseils déco pour sublimer votre intérieur</p>
                  </div>
                </div>

                {/* Call to action button */}
                <div className="transform transition-all duration-500 hover:scale-105 inline-block">
                  <DynamicButton
                    label="Découvrir notre histoire"
                    to="/about"
                    className="px-6 py-3 btn-primary rounded-lg font-medium shadow-md hover:shadow-lg flex items-center"
                  >
                    <span>Découvrir notre histoire</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </DynamicButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔹 NEWSLETTER SECTION - More compact design with less empty space */}
      <section className="py-12 px-6 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('/img/texture-bg.jpg')] opacity-5"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#A67B5B]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#A67B5B]/5 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl">
            <div className="p-6 md:p-8">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-light tracking-wide mb-2 relative inline-block">
                  <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-16 after:h-0.5 after:bg-[#A67B5B] after:transition-all after:duration-700 hover:after:w-full pb-2">
                    Newsletter
                  </span>
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-sm">
                  Inscrivez-vous pour recevoir nos dernières actualités et offres exclusives
                </p>
              </div>

              <form className="max-w-xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-grow">
                    <input
                      type="email"
                      placeholder="Votre adresse e-mail"
                      className="w-full p-3 pl-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-all duration-300 shadow-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>

                  <button className="px-6 py-3 bg-[#A67B5B] text-white rounded-lg font-medium transition-all duration-300 transform hover:translate-y-[-2px] hover:bg-[#8B5A2B] shadow-md hover:shadow-lg flex items-center justify-center whitespace-nowrap">
                    <span>JE M'ABONNE</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-center">
                  <input id="privacy" type="checkbox" className="h-4 w-4 text-[#A67B5B] focus:ring-[#A67B5B]/20 border-gray-300 rounded" />
                  <label htmlFor="privacy" className="ml-2 block text-xs text-gray-500">
                    J'accepte de recevoir des communications marketing
                  </label>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap justify-center gap-4">
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-[#A67B5B]/10 flex items-center justify-center mr-1 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#A67B5B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Offres exclusives</span>
                </div>

                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-[#A67B5B]/10 flex items-center justify-center mr-1 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#A67B5B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Tendances déco</span>
                </div>

                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-[#A67B5B]/10 flex items-center justify-center mr-1 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#A67B5B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-600">Désinscription facile</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
