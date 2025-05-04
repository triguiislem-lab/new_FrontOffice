import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

/**
 * LazyImage component for optimized image loading
 *
 * @param {string} src - The image source URL
 * @param {string} alt - Alt text for the image
 * @param {string} fallbackSrc - Fallback image to use if the main image fails to load
 * @param {string} className - CSS classes to apply to the image
 * @param {object} style - Additional inline styles
 * @param {function} onLoad - Callback function when image loads successfully
 * @param {function} onError - Callback function when image fails to load
 */
const LazyImage = ({
  src,
  alt = "Image",
  fallbackSrc = "https://via.placeholder.com/300x300?text=Image+non+disponible",
  className = "",
  style = {},
  onLoad = () => {},
  onError = () => {},
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    // Reset states when src changes
    if (src !== currentSrc && !error) {
      setLoaded(false);
      setCurrentSrc(src);
    }
  }, [src, currentSrc, error]);

  const handleLoad = (e) => {
    setLoaded(true);
    onLoad(e);
  };

  const handleError = (e) => {
    setError(true);
    setCurrentSrc(fallbackSrc);
    onError(e);
  };

  return (
    <div className={`relative ${className}`} style={{ ...style, overflow: 'hidden' }}>
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <LoadingSpinner size="md" variant="circle" />
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};

export default LazyImage;
