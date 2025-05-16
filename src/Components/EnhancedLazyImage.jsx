import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getResponsiveImageUrl, preloadImage } from '../utils/imageOptimizer';

/**
 * Enhanced LazyImage component for optimized image loading with consistent loading animation
 *
 * @param {string} src - The image source URL
 * @param {string} alt - Alt text for the image
 * @param {string} fallbackSrc - Fallback image to use if the main image fails to load
 * @param {string} className - CSS classes to apply to the image
 * @param {object} style - Additional inline styles
 * @param {function} onLoad - Callback function when image loads successfully
 * @param {function} onError - Callback function when image fails to load
 * @param {string} spinnerVariant - Variant of spinner to use (circle, dots, pulse)
 * @param {boolean} optimize - Whether to optimize the image URL
 * @param {number} width - Desired image width for optimization
 * @param {number} height - Desired image height for optimization
 * @param {boolean} blur - Whether to apply blur effect while loading
 * @param {string} placeholderColor - Background color to show while loading
 * @param {boolean} fadeIn - Whether to fade in the image when loaded
 */
const EnhancedLazyImage = ({
  src,
  alt = "Image",
  fallbackSrc = "https://via.placeholder.com/300x300?text=Image+non+disponible",
  className = "",
  style = {},
  onLoad = () => {},
  onError = () => {},
  spinnerVariant = "circle",
  optimize = true,
  width = 0,
  height = 0,
  blur = false,
  placeholderColor = "#f3f4f6", // gray-100
  fadeIn = true,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Get optimized image URL
  useEffect(() => {
    if (!src) {
      setCurrentSrc(fallbackSrc);
      return;
    }

    // If optimization is enabled, get responsive image URL
    if (optimize) {
      const optimizedSrc = getResponsiveImageUrl(src, {
        width: width || containerDimensions.width,
        height: height || containerDimensions.height,
        maxWidth: 1200,
        maxHeight: 800
      });
      setCurrentSrc(optimizedSrc);

      // Preload the image
      preloadImage(optimizedSrc);
    } else {
      setCurrentSrc(src);
    }
  }, [src, optimize, width, height, containerDimensions, fallbackSrc]);

  // Measure container dimensions for responsive images
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        if (offsetWidth > 0 && offsetHeight > 0) {
          setContainerDimensions({
            width: offsetWidth,
            height: offsetHeight
          });
        }
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up resize observer for responsive behavior
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Reset states when src changes
  useEffect(() => {
    if (src && currentSrc !== src && !error) {
      setLoaded(false);
    }
  }, [src, currentSrc, error]);

  const handleLoad = (e) => {
    setLoaded(true);
    onLoad(e);
  };

  const handleError = (e) => {
    console.error(`Failed to load image: ${currentSrc}`);
    setError(true);
    setCurrentSrc(fallbackSrc);
    onError(e);
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        ...style,
        overflow: 'hidden',
        backgroundColor: placeholderColor
      }}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="md" variant={spinnerVariant} />
        </div>
      )}
      {currentSrc && (
        <img
          ref={imageRef}
          src={currentSrc}
          alt={alt}
          className={`w-full h-full object-cover ${fadeIn ? 'transition-all duration-500' : ''} ${
            loaded
              ? 'opacity-100'
              : blur
                ? 'opacity-40 blur-sm scale-105'
                : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
    </div>
  );
};

export default EnhancedLazyImage;
