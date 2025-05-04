import React, { useState, useEffect, useRef } from 'react';
import Slider from 'react-slick';
import EnhancedLazyImage from './EnhancedLazyImage';
import LoadingSpinner from './LoadingSpinner';
import { COMPONENT_LOADING, LOADING_MESSAGES } from '../utils/loadingConfig';

/**
 * OptimizedCarousel component for better performance
 *
 * @param {Array} slides - Array of slide objects
 * @param {Object} settings - Slider settings
 * @param {boolean} loading - Loading state
 * @param {string} error - Error message
 * @param {string} emptyMessage - Message to display when no slides are available
 * @param {string} className - Additional CSS classes
 */
const OptimizedCarousel = ({
  slides = [],
  settings = {},
  loading = false,
  error = null,
  emptyMessage = "Aucune diapositive disponible",
  className = "",
  height = "500px"
}) => {
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Default settings with performance optimizations
  const defaultSettings = {
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
    lazyLoad: 'progressive', // Use progressive loading
    pauseOnHover: true,
    swipeToSlide: true,
    // Reduce animation work for better performance
    beforeChange: (current, next) => {
      // Only update the active class on the slides that are changing
      const currentSlideEl = document.querySelector(`.hero-slide-${current}`);
      if (currentSlideEl) currentSlideEl.classList.remove('active');

      const nextSlideEl = document.querySelector(`.hero-slide-${next}`);
      if (nextSlideEl) nextSlideEl.classList.add('active');

      setCurrentSlide(next);
    }
  };

  // Merge default settings with custom settings
  const mergedSettings = { ...defaultSettings, ...settings };

  // Preload images for better performance
  useEffect(() => {
    if (slides.length > 0) {
      // Preload first image immediately
      if (slides[0].primary_image_url) {
        const firstImg = new Image();
        firstImg.src = slides[0].primary_image_url;
      }

      // Preload remaining images during idle time
      if (window.requestIdleCallback && slides.length > 1) {
        window.requestIdleCallback(() => {
          slides.slice(1).forEach(slide => {
            if (slide.primary_image_url) {
              const img = new Image();
              img.src = slide.primary_image_url;
            }
          });
        });
      }
    }
  }, [slides]);

  // Custom navigation functions
  const goToNext = () => {
    if (sliderRef.current) {
      sliderRef.current.slickNext();
    }
  };

  const goToPrev = () => {
    if (sliderRef.current) {
      sliderRef.current.slickPrev();
    }
  };

  const goToSlide = (index) => {
    if (sliderRef.current) {
      sliderRef.current.slickGoTo(index);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <LoadingSpinner
          {...COMPONENT_LOADING.pageLoading}
          message={LOADING_MESSAGES.images}
          color="#A67B5B"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-red-600 max-w-md px-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-lg font-medium mb-2">Erreur de chargement</p>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#A67B5B] text-white rounded-lg hover:bg-[#8B5A2B] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="carousel-container relative">
      <Slider ref={sliderRef} {...mergedSettings} className={`w-full ${className}`}>
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`relative hero-slide hero-slide-${index} ${index === 0 ? 'active' : ''}`}
          >
            <EnhancedLazyImage
              src={slide.primary_image_url}
              alt={slide.titre || 'Slide'}
              className="w-full h-full object-cover"
              fallbackSrc="/img/placeholder-slide.jpg"
              spinnerVariant="circle"
            />
            <div className="hero-slide-content">
              <h2 className="hero-slide-title">
                {slide.titre}
              </h2>
              <p className="hero-slide-desc">
                {slide.description}
              </p>
              {slide.bouton_texte && slide.bouton_lien && (
                <a
                  href={slide.bouton_lien}
                  className="hero-slide-btn"
                >
                  {slide.bouton_texte}
                </a>
              )}
            </div>
          </div>
        ))}
      </Slider>

      {/* Bottom gradient overlay */}
      <div className="carousel-bottom-gradient"></div>
    </div>
  );
};

export default OptimizedCarousel;
