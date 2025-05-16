import React from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

/**
 * A professional and elegant back button component
 *
 * @param {Object} props - Component props
 * @param {string} [props.label="Retour"] - Text to display on the button
 * @param {string} [props.to] - URL to navigate to (if not provided, will navigate back in history)
 * @param {Function} [props.onClick] - Custom click handler (overrides default navigation)
 * @param {string} [props.variant="default"] - Button style variant: "default", "outline", "text", "filled"
 * @param {string} [props.size="md"] - Button size: "sm", "md", "lg"
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showIcon=true] - Whether to show the back arrow icon
 * @returns {JSX.Element} - Back button component
 */
const BackButton = ({
  label = "Retour",
  to,
  onClick,
  variant = "default",
  size = "md",
  className = "",
  showIcon = true,
}) => {
  const navigate = useNavigate();

  // Handle button click
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }

    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  // Size classes - these are defaults that can be overridden by className
  const sizeClasses = {
    sm: "px-3 py-1 text-xs",
    md: "px-5 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  // Variant classes
  const variantClasses = {
    default: "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200",
    outline: "bg-transparent text-gray-600 border border-gray-300 hover:bg-gray-50",
    text: "bg-transparent text-gray-600 hover:bg-gray-50",
    filled: "bg-gray-200 text-gray-700 hover:bg-gray-300",
  };

  // Icon color is always gray-600 for consistency
  const iconColor = 'text-gray-600';

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center justify-center font-medium rounded
        transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-300
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label={label}
    >
      {showIcon && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`${size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'} mr-1.5 ${iconColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
};

BackButton.propTypes = {
  label: PropTypes.string,
  to: PropTypes.string,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(["default", "outline", "text", "filled"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  showIcon: PropTypes.bool,
};

export default BackButton;
