/**
 * Utility functions for standardizing loading states across the application
 */

import React from 'react';
import LoadingSpinner from '../Components/LoadingSpinner';

/**
 * Creates a full-page loading component with the standard loading spinner
 * 
 * @param {string} message - Optional message to display
 * @param {string} variant - Spinner variant (circle, dots, pulse)
 * @returns {JSX.Element} - Full page loading component
 */
export const FullPageLoading = ({ message = "Chargement...", variant = "circle" }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <LoadingSpinner size="lg" variant={variant} message={message} />
    </div>
  </div>
);

/**
 * Creates a section loading component with the standard loading spinner
 * 
 * @param {string} message - Optional message to display
 * @param {string} variant - Spinner variant (circle, dots, pulse)
 * @param {string} height - Height of the loading container
 * @returns {JSX.Element} - Section loading component
 */
export const SectionLoading = ({ 
  message = "", 
  variant = "circle", 
  height = "h-64" 
}) => (
  <div className={`flex justify-center items-center ${height}`}>
    <LoadingSpinner size="md" variant={variant} message={message} />
  </div>
);

/**
 * Creates an inline loading component with the standard loading spinner
 * 
 * @param {string} size - Size of the spinner (xs, sm, md)
 * @param {string} variant - Spinner variant (circle, dots, pulse)
 * @returns {JSX.Element} - Inline loading component
 */
export const InlineLoading = ({ size = "sm", variant = "dots" }) => (
  <span className="inline-flex items-center">
    <LoadingSpinner size={size} variant={variant} />
  </span>
);

/**
 * Creates a button loading state
 * 
 * @param {string} text - Text to display next to the spinner
 * @param {string} variant - Spinner variant (circle, dots, pulse)
 * @returns {JSX.Element} - Button loading component
 */
export const ButtonLoading = ({ text = "Chargement...", variant = "dots" }) => (
  <span className="inline-flex items-center space-x-2">
    <LoadingSpinner size="xs" variant={variant} />
    <span>{text}</span>
  </span>
);

/**
 * Creates a card loading state
 * 
 * @param {string} height - Height of the card
 * @param {string} variant - Spinner variant (circle, dots, pulse)
 * @returns {JSX.Element} - Card loading component
 */
export const CardLoading = ({ height = "h-64", variant = "circle" }) => (
  <div className={`bg-white rounded-lg shadow-md ${height} flex items-center justify-center`}>
    <LoadingSpinner size="md" variant={variant} />
  </div>
);

/**
 * Creates a table loading state
 * 
 * @param {number} rows - Number of skeleton rows to display
 * @param {number} cols - Number of skeleton columns to display
 * @returns {JSX.Element} - Table loading component
 */
export const TableLoading = ({ rows = 5, cols = 4 }) => (
  <div className="w-full">
    {/* Table header */}
    <div className="flex border-b pb-2 mb-4">
      {Array(cols).fill(0).map((_, i) => (
        <div key={`header-${i}`} className="flex-1 px-2">
          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
    
    {/* Table rows */}
    {Array(rows).fill(0).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex py-2 border-b">
        {Array(cols).fill(0).map((_, colIndex) => (
          <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1 px-2">
            <div 
              className="h-4 bg-gray-100 rounded animate-pulse" 
              style={{ 
                animationDelay: `${(rowIndex * 0.1) + (colIndex * 0.05)}s`,
                width: `${Math.floor(Math.random() * 40) + 60}%` 
              }}
            ></div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

export default {
  FullPageLoading,
  SectionLoading,
  InlineLoading,
  ButtonLoading,
  CardLoading,
  TableLoading
};
