import React from 'react';

/**
 * Enhanced LoadingSpinner component for consistent loading states across the application
 *
 * @param {string} size - Size of the spinner (xs, sm, md, lg, xl)
 * @param {string} color - Primary color of the spinner
 * @param {string} className - Additional CSS classes
 * @param {boolean} fullScreen - Whether to display the spinner in fullscreen mode
 * @param {string} message - Optional message to display below the spinner
 * @param {string} variant - Spinner style variant (circle, dots, pulse, wave, ripple, elegant)
 * @param {boolean} overlay - Whether to show a background overlay
 * @param {string} bgColor - Background color for overlay/fullscreen modes
 * @param {string} textColor - Color for the loading message
 */
const LoadingSpinner = ({
  size = "md",
  color = "#A67B5B",
  className = "",
  fullScreen = false,
  message = "",
  variant = "elegant", // Changed default to elegant
  overlay = false,
  bgColor = "bg-white",
  textColor = "text-gray-600"
}) => {
  // Size mappings
  const sizeMap = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const spinnerSize = sizeMap[size] || sizeMap.md;

  // Text size based on spinner size
  const textSizeMap = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };

  const textSize = textSizeMap[size] || textSizeMap.md;

  // Render different spinner variants
  const renderSpinner = () => {
    switch (variant) {
      case 'elegant':
        // New elegant spinner with multiple rings
        return (
          <div className={`relative ${spinnerSize} ${className}`}>
            {/* Outer ring */}
            <div
              className="absolute inset-0 border-2 rounded-full"
              style={{
                borderColor: `${color}20`,
                transform: 'scale(1.2)',
                opacity: 0.3
              }}
            />
            {/* Middle ring - rotating clockwise */}
            <div
              className="absolute inset-0 border-2 rounded-full animate-spin"
              style={{
                borderColor: `${color}30`,
                borderTopColor: color,
                borderRightColor: `${color}70`,
                animationDuration: '2s'
              }}
            />
            {/* Inner ring - rotating counter-clockwise */}
            <div
              className="absolute inset-0 border-2 rounded-full animate-spin"
              style={{
                borderColor: `${color}20`,
                borderBottomColor: color,
                borderLeftColor: `${color}70`,
                transform: 'scale(0.8)',
                animationDuration: '1.5s',
                animationDirection: 'reverse'
              }}
            />
            {/* Center dot */}
            <div
              className="absolute rounded-full animate-pulse"
              style={{
                backgroundColor: color,
                width: '25%',
                height: '25%',
                top: '37.5%',
                left: '37.5%',
                animationDuration: '1.5s'
              }}
            />
          </div>
        );

      case 'dots':
        return (
          <div className={`flex space-x-2 ${className}`}>
            {[0, 1, 2].map((dot) => (
              <div
                key={dot}
                className={`rounded-full ${size === 'xs' ? 'w-2 h-2' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`}
                style={{
                  backgroundColor: color,
                  animation: `bounce 1.4s infinite ease-in-out both`,
                  animationDelay: `${dot * 0.16}s`
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className={`${spinnerSize} ${className} relative`}>
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-75"
              style={{ backgroundColor: color }}
            />
            <div
              className="relative rounded-full w-full h-full opacity-75"
              style={{ backgroundColor: color }}
            />
          </div>
        );

      case 'wave':
        return (
          <div className={`flex items-end space-x-1 ${className}`}>
            {[0, 1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`${size === 'xs' ? 'w-1' : size === 'sm' ? 'w-1.5' : 'w-2'} bg-current rounded-t-sm`}
                style={{
                  height: `${Math.max(3, (parseInt(size === 'xs' ? 12 : size === 'sm' ? 16 : size === 'md' ? 24 : size === 'lg' ? 32 : 40) / 2))}px`,
                  backgroundColor: color,
                  animation: `waveAnimation 1.2s infinite ease-in-out`,
                  animationDelay: `${bar * 0.1}s`
                }}
              />
            ))}
          </div>
        );

      case 'ripple':
        return (
          <div className={`${spinnerSize} ${className} relative`} style={{ color }}>
            <div className="absolute inset-0 border-2 rounded-full" style={{ borderColor: 'currentColor', opacity: 0.2 }}></div>
            <div
              className="absolute inset-0 border-2 rounded-full animate-ping"
              style={{
                borderColor: 'currentColor',
                animationDuration: '1.5s',
                opacity: 0.4
              }}
            ></div>
            <div
              className="absolute inset-0 border-2 rounded-full animate-ping"
              style={{
                borderColor: 'currentColor',
                animationDuration: '2s',
                animationDelay: '0.5s',
                opacity: 0.3
              }}
            ></div>
          </div>
        );

      case 'circle':
        return (
          <div className={`relative ${spinnerSize} ${className}`}>
            <div
              className="absolute inset-0 border-2 opacity-20 rounded-full animate-ping"
              style={{ borderColor: color }}
            />
            <div
              className={`${spinnerSize} border-3 rounded-full animate-spin`}
              style={{
                borderColor: `${color}30`,
                borderTopColor: color,
                animationDuration: '0.8s'
              }}
            />
          </div>
        );
    }
  };

  // Container styles based on fullScreen and overlay props
  const containerStyles = () => {
    if (fullScreen) {
      return `fixed inset-0 ${bgColor} bg-opacity-90 flex flex-col items-center justify-center z-50 backdrop-blur-sm transition-all duration-300`;
    } else if (overlay) {
      return `absolute inset-0 ${bgColor} bg-opacity-75 flex flex-col items-center justify-center z-10 backdrop-blur-sm transition-all duration-300`;
    } else {
      return "flex flex-col items-center justify-center py-4 transition-all duration-300";
    }
  };

  return (
    <div className={containerStyles()}>
      <div className="animate-fade-in">
        {renderSpinner()}
        {message && (
          <p className={`mt-4 ${textColor} font-medium ${textSize} animate-pulse text-center`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
