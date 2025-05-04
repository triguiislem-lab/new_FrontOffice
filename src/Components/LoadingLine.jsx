import React from 'react';
import { DEFAULT_SPINNER } from '../utils/loadingConfig';

/**
 * Standardized loading line component for consistent loading animations across the application
 * 
 * @param {string} color - Color of the loading line (defaults to the standard brand color)
 * @param {string} height - Height of the loading line (e.g., "2px", "0.5rem")
 * @param {string} className - Additional CSS classes
 * @param {boolean} showBackground - Whether to show a background track
 * @param {string} bgColor - Background color of the track
 */
const LoadingLine = ({
  color = DEFAULT_SPINNER.loadingLineColor,
  height = "2px",
  className = "",
  showBackground = true,
  bgColor = "bg-gray-100"
}) => {
  return (
    <div className={`w-full ${showBackground ? bgColor : ''} ${height === "2px" ? "h-2" : `h-[${height}]`} rounded-full overflow-hidden ${className}`}>
      <div 
        className="h-full animate-pulse-width"
        style={{ backgroundColor: color }}
      ></div>
    </div>
  );
};

export default LoadingLine;
