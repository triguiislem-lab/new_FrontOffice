import React from "react";
import { Link } from "react-router-dom";

/**
 * A versatile button component that can function as either a link or a button
 *
 * @param {Object} props - Component props
 * @param {string} props.label - Text to display on the button
 * @param {string} [props.to] - URL to navigate to (if functioning as a link)
 * @param {Function} [props.onClick] - Click handler (if functioning as a button)
 * @param {boolean} [props.disabled] - Whether the button is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} - Button or Link component
 */
const DynamicButton = ({ label, to, onClick, disabled = false, className = "" }) => {
  // Check if the className contains a text color class
  const hasCustomTextColor = className.includes('text-');

  // Default styling that can be overridden by className
  const defaultClasses = `inline-block font-light ${hasCustomTextColor ? '' : 'text-[#9D7553]'} border border-[#9D7553] bg-transparent px-8 py-3 rounded-md text-md tracking-wider transition-all duration-300 shadow-sm relative overflow-hidden group`;

  // Combine default classes with any custom classes
  const combinedClasses = `${defaultClasses} ${className}`;

  // Check if the className contains a background color class
  const hasCustomBgColor = className.includes('bg-') && !className.includes('bg-transparent');

  // Determine the hover text color based on the background
  const hoverTextColor = hasCustomBgColor ? '' : 'group-hover:text-white';

  // If 'to' is provided, render as a Link
  if (to) {
    return (
      <Link
        to={to}
        className={combinedClasses}
      >
        <span className={`relative z-10 transition-colors duration-300 ${hoverTextColor}`}>
          {label}
        </span>
        {!hasCustomBgColor && (
          <span className="absolute inset-0 w-0 bg-[#9D7553] transition-all duration-300 ease-out group-hover:w-full left-0"></span>
        )}
      </Link>
    );
  }

  // Otherwise, render as a button
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${combinedClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`relative z-10 transition-colors duration-300 ${hoverTextColor}`}>
        {label}
      </span>
      {!hasCustomBgColor && (
        <span className="absolute inset-0 w-0 bg-[#9D7553] transition-all duration-300 ease-out group-hover:w-full left-0"></span>
      )}
    </button>
  );
};

export default DynamicButton;
