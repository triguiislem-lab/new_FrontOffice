import React, { useState, useEffect } from 'react';
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
  // Default settings with performance optimizations
  const defaultSettings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    fade: true,
    cssEase: 'cubic-bezier(0.7, 0, 0.3, 1)',
    lazyLoad: 'progressive', // Use progressive loading
    pauseOnHover: true,
    swipeToSlide: true,
    // Reduce animation work for better performance
    beforeChange: (current, next) => {
      // Only update the active class on the slides that are changing
      const currentSlide = document.querySelector(`.hero-slide-${current}`);
      if (currentSlide) currentSlide.classList.remove('active');
      
      const nextSlide = document.querySelector(`.hero-slide-${next}`);
      if (nextSlide) nextSlide.classList.add('active');
    }
  };

  // Merge default settings with custom settings
  const mergedSettings = { ...defaultSettings, ...settings };

  // Preload the first image for faster initial render
  useEffect(() => {
    if (slides.length > 0 && slides[0].primary_image_url) {
      const img = new Image();
      img.src = slides[0].primary_image_url;
    }
  }, [slides]);

  if (loading) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={{ height }}>
        <LoadingSpinner 
          {...COMPONENT_LOADING.pageLoading} 
          message={LOADING_MESSAGES.images} 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-center">
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <Slider {...mergedSettings} className={`w-full ${className}`}>
      {slides.map((slide, index) => (
        <div 
          key={slide.id || index} 
          className={`relative hero-slide hero-slide-${index} ${index === 0 ? 'active' : ''}`}
          style={{ height }}
        >
          <EnhancedLazyImage
            src={slide.primary_image_url}
            alt={slide.titre || 'Slide'}
            className="w-full h-full rounded-lg shadow-md transition-all-smooth duration-1000 transform scale-100 active:scale-105"
            fallbackSrc="/img/placeholder-slide.jpg"
            spinnerVariant="circle"
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-center px-6">
            <h2 className="text-5xl font-bold mb-4 tracking-wide transition-all-smooth duration-700 transform translate-y-0 opacity-100 hero-slide-title">
              {slide.titre}
            </h2>
            <p className="text-2xl mb-6 transition-all-smooth duration-700 delay-100 transform translate-y-0 opacity-100 hero-slide-desc">
              {slide.description}
            </p>
            {slide.bouton_texte && slide.bouton_lien && (
              <a
                href={slide.bouton_lien}
                className="inline-block font-medium text-white border border-white bg-transparent px-6 py-3 rounded-md hover:bg-[#A67B5B] hover:border-[#A67B5B] hover:text-white transition-all-smooth duration-300 transform hover:scale-105 hero-slide-btn"
              >
                {slide.bouton_texte}
              </a>
            )}
          </div>
        </div>
      ))}
    </Slider>
  );
};

export default OptimizedCarousel;
