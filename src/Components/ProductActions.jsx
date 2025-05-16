import React, { useState, useEffect } from 'react';
import { useCart } from '../Contexts/CartContext';
import { useWishlist } from '../Contexts/WishlistContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * ProductActions component for adding products to cart and wishlist
 *
 * @param {Object} product - The product object
 * @param {Object} selectedVariant - The selected variant (optional)
 * @param {number} quantity - The quantity to add (default: 1)
 * @param {boolean} showQuantity - Whether to show quantity controls (default: true)
 * @param {boolean} showWishlist - Whether to show wishlist button (default: true)
 * @param {string} buttonStyle - Style for the add to cart button (default: 'primary')
 */
const ProductActions = ({
  product,
  selectedVariant = null,
  quantity: initialQuantity = 1,
  showQuantity = true,
  showWishlist = true,
  buttonStyle = 'primary'
}) => {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);
  const [message, setMessage] = useState(null);

  const { addToCart } = useCart();
  const { isInWishlist: checkWishlist, toggleWishlist } = useWishlist();

  // Check if product is in wishlist
  useEffect(() => {
    const checkIfInWishlist = async () => {
      const result = await checkWishlist(product.id, selectedVariant?.id);
      setIsInWishlist(result);
    };

    checkIfInWishlist();
  }, [product.id, selectedVariant?.id, checkWishlist]);

  // Handle quantity change
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  // Handle add to cart - optimized version
  const handleAddToCart = async () => {
    // Prevent multiple clicks
    if (isAddingToCart) return;

    setIsAddingToCart(true);
    setMessage(null);

    try {
      // Use a timeout to ensure the loading state is visible
      const addCartPromise = addToCart(product, selectedVariant, quantity);

      // Show success message immediately without waiting for the promise
      setMessage({
        type: 'success',
        text: 'Produit ajouté au panier'
      });

      // Process the promise in the background
      addCartPromise.catch(() => {
        setMessage({
          type: 'error',
          text: 'Erreur lors de l\'ajout au panier'
        });
      });

      // Clear message after 2 seconds
      setTimeout(() => {
        setMessage(null);
        setIsAddingToCart(false);
      }, 2000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erreur lors de l\'ajout au panier'
      });
      setIsAddingToCart(false);
    }
  };

  // Handle toggle wishlist
  const handleToggleWishlist = async () => {
    setIsTogglingWishlist(true);

    try {
      await toggleWishlist(product, selectedVariant);
      setIsInWishlist(!isInWishlist);
    } catch (error) {
      // Silent fail
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  // Button styles
  const buttonStyles = {
    primary: 'bg-[#A67B5B] text-white py-3 px-6 hover:bg-[#8B5A2B] transition-colors',
    secondary: 'border border-[#A67B5B] text-[#A67B5B] py-3 px-6 hover:bg-[#A67B5B] hover:text-white transition-colors',
    small: 'bg-[#A67B5B] text-white py-2 px-4 text-sm hover:bg-[#8B5A2B] transition-colors'
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Quantity selector */}
      {showQuantity && (
        <div className="flex items-center space-x-4">
          <span className="text-gray-700">Quantité:</span>
          <div className="flex items-center border border-gray-300 rounded">
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="px-3 py-1 border-x border-gray-300">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart}
          className={`${buttonStyles[buttonStyle]} flex items-center justify-center min-w-[150px]`}
        >
          {isAddingToCart ? (
            <span className="flex items-center">
              <LoadingSpinner size="xs" variant="circle" color="#FFFFFF" className="mr-2" />
              Ajout...
            </span>
          ) : (
            'Ajouter au panier'
          )}
        </button>

        {showWishlist && (
          <button
            onClick={handleToggleWishlist}
            disabled={isTogglingWishlist}
            className="flex items-center justify-center border border-gray-300 hover:border-gray-500 py-3 px-4 transition-colors"
            aria-label={isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            {isTogglingWishlist ? (
              <LoadingSpinner size="xs" variant="circle" color="#6B7280" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill={isInWishlist ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Status message */}
      {message && (
        <div className={`mt-2 py-2 px-3 rounded text-sm ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default ProductActions;
