import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from '../../Contexts/AuthContext.jsx';
import { useCart } from '../../Contexts/CartContext.jsx';
import { useWishlist } from '../../Contexts/WishlistContext.jsx';

// Error boundary component for navbar
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  // Reset error state when children change
  useEffect(() => {
    setHasError(false);
    setError(null);
  }, [children]);

  // If there's an error, show a fallback UI
  if (hasError) {
    return (
      <div className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/img/logo.jfif"
              alt="Jihen-line Logo"
              className="h-14 rounded-lg shadow-sm"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/img/placeholder-logo.svg";
              }}
            />
          </Link>
        </div>
        <div className="text-red-500 text-sm">
          <p>Problème de chargement du menu. <button onClick={() => window.location.reload()} className="underline">Rafraîchir</button></p>
        </div>
      </div>
    );
  }

  // Try to render children, catch errors
  try {
    return children;
  } catch (error) {

    setHasError(true);
    setError(error);
    return null;
  }
}

function Navbar() {
  const { isAuthenticated, keycloak, loading, user } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [brands, setBrands] = useState([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isContactPopupOpen, setIsContactPopupOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Function to check if a path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/home';
    }
    return location.pathname.startsWith(path);
  };

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
  });

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // State to track API errors
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    // Fetch brands with error handling
    const fetchBrands = async () => {
      try {
        const response = await axios.get("https://laravel-api.fly.dev/api/marques");
        setBrands(response.data);
        setApiError(false);
      } catch (error) {

        setApiError(true);
        // Set empty brands array to prevent UI errors
        setBrands([]);
      }
    };

    fetchBrands();
  }, []);


  const handleLogin = () => {
    try {
      keycloak.login({ redirectUri: window.location.origin + '/home' });
    } catch (error) {

      alert('Problème de connexion. Veuillez réessayer plus tard.');
    }
  };

  const handleRegister = () => {
    try {
      keycloak.register({ redirectUri: window.location.origin + '/home' });
    } catch (error) {

      alert('Problème d\'inscription. Veuillez réessayer plus tard.');
    }
  };

  const handleLogout = () => {
    try {
      keycloak.logout({ redirectUri: window.location.origin + '/home' });
    } catch (error) {

      alert('Problème de déconnexion. Veuillez réessayer plus tard.');
    }
  };

  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const toggleSidebar = (sidebarName) => setActiveSidebar(activeSidebar === sidebarName ? null : sidebarName);
  const closeSidebar = () => setActiveSidebar(null);

  const toggleContactPopup = () => setIsContactPopupOpen(!isContactPopupOpen);

  if (loading) {
    return (
      <div className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        {/* Logo skeleton */}
        <div className="h-12 w-12 rounded-lg bg-gray-200 animate-pulse"></div>

        {/* Navigation skeleton */}
        <div className="flex items-center space-x-6">
          <div className="hidden lg:flex space-x-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-20 bg-gray-200 rounded-md animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
            ))}
          </div>

          {/* Icons skeleton */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <header className={`bg-white shadow-md py-4 px-6 flex justify-between items-center transition-all duration-500 ${isNavOpen ? 'shadow-lg' : ''} sticky top-0 z-50`}>
        <Link to="/" className="flex items-center">
          <img
            src="/img/logo.jfif"
            alt="Jihen-line Logo"
            className="h-14 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
            onError={(e) => {

              e.target.onerror = null;
              e.target.src = "/img/placeholder-logo.svg";
            }}
          />
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={toggleNav}
          className="lg:hidden text-gray-600 hover:text-[#A67B5B] focus:outline-none transition-all duration-300 p-2 rounded-md hover:bg-gray-100 hover:shadow-sm"
          aria-label={isNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <i className={`fa fa-${isNavOpen ? "times" : "bars"} text-2xl`} />
        </button>

        {/* Desktop navigation */}
        <nav className={`space-x-6 ${isNavOpen ? "block absolute top-full left-0 right-0 bg-white shadow-lg p-4 z-50 border-t border-gray-100" : "hidden"} lg:flex lg:static lg:shadow-none lg:p-0 lg:border-0`}>
          <Link
            to="/"
            className={`nav-item transition-all duration-300 py-2 px-3 block lg:inline-block border-b border-gray-100 lg:border-0 font-medium text-sm uppercase tracking-wide relative ${
              isActive('/') ? 'text-[#A67B5B] font-semibold' : 'text-gray-700 hover:text-[#A67B5B]'
            }`}
          >
            Accueil
            {isActive('/') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A67B5B] hidden lg:block"></span>}
          </Link>
          <button
            className={`nav-item transition-all duration-300 py-2 px-3 block lg:inline-block border-b border-gray-100 lg:border-0 font-medium text-sm uppercase tracking-wide w-full lg:w-auto text-left relative ${
              activeSidebar === "marques" || isActive('/brand') || isActive('/marques') ? 'text-[#A67B5B] font-semibold' : 'text-gray-700 hover:text-[#A67B5B]'
            }`}
            onClick={() => toggleSidebar("marques")}
          >
            Marques
            {(isActive('/brand') || isActive('/marques')) && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A67B5B] hidden lg:block"></span>}
          </button>
          <Link
            to="/products"
            className={`nav-item transition-all duration-300 py-2 px-3 block lg:inline-block border-b border-gray-100 lg:border-0 font-medium text-sm uppercase tracking-wide relative ${
              isActive('/products') || isActive('/article') ? 'text-[#A67B5B] font-semibold' : 'text-gray-700 hover:text-[#A67B5B]'
            }`}
          >
            Produits
            {(isActive('/products') || isActive('/article')) && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A67B5B] hidden lg:block"></span>}
          </Link>
          <Link
            to="/promotions"
            className={`nav-item transition-all duration-300 py-2 px-3 block lg:inline-block border-b border-gray-100 lg:border-0 font-medium text-sm uppercase tracking-wide relative ${
              isActive('/promotions') ? 'text-[#A67B5B] font-semibold' : 'text-gray-700 hover:text-[#A67B5B]'
            }`}
          >
            Promotions
            {isActive('/promotions') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A67B5B] hidden lg:block"></span>}
          </Link>
          <Link
            to="/inspirations"
            className={`nav-item transition-all duration-300 py-2 px-3 block lg:inline-block border-b border-gray-100 lg:border-0 font-medium text-sm uppercase tracking-wide relative ${
              isActive('/inspirations') || isActive('/inspiration') ? 'text-[#A67B5B] font-semibold' : 'text-gray-700 hover:text-[#A67B5B]'
            }`}
          >
            Inspirations
            {(isActive('/inspirations') || isActive('/inspiration')) && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A67B5B] hidden lg:block"></span>}
          </Link>
          <button
            onClick={toggleContactPopup}
            className="nav-item transition-all duration-300 py-2 px-3 block lg:inline-block border-b border-gray-100 lg:border-0 font-medium text-sm uppercase tracking-wide w-full lg:w-auto text-left relative text-gray-700 hover:text-[#A67B5B]"
          >
            Contact
          </button>
        </nav>

        {/* User actions */}
        <div className="flex items-center space-x-1 md:space-x-3">
          {/* Wishlist */}
          <Link
            to="/FavoritesPage"
            className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 focus:outline-none transition-all duration-300 hover:shadow-sm"
            aria-label="Favoris"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 hover:text-[#A67B5B] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 010 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {wishlist && wishlist.items && wishlist.items.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#A67B5B] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                {wishlist.items.length}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/Cart"
            className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 focus:outline-none transition-all duration-300 hover:shadow-sm"
            aria-label="Panier"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 hover:text-[#A67B5B] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {cart && cart.nombre_items > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#A67B5B] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                {cart.nombre_items}
              </span>
            )}
          </Link>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center focus:outline-none transition-all duration-300 hover:shadow-sm"
              aria-label="Menu utilisateur"
              aria-expanded={isUserMenuOpen}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 hover:text-[#A67B5B] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100 transform transition-all duration-300 origin-top-right">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name || "Utilisateur"}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                    </div>
                    <Link to="/profile" className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center group transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-[#A67B5B] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mon profil
                    </Link>
                    <Link to="/commandes" className="px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center group transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-[#A67B5B] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Mes commandes
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center group transition-colors duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-[#A67B5B] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">Bienvenue</p>
                      <p className="text-xs text-gray-500">Connectez-vous pour accéder à votre compte</p>
                    </div>
                    <button
                      onClick={handleLogin}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center group transition-colors duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-[#A67B5B] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Se connecter
                    </button>
                    <button
                      onClick={handleRegister}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center group transition-colors duration-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400 group-hover:text-[#A67B5B] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      S'inscrire
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar pour les marques */}
      {activeSidebar === "marques" && (
        <>
          {/* Overlay to close sidebar when clicking outside */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeSidebar}
          ></div>

          {/* Sidebar content */}
          <div className="fixed top-0 left-0 w-80 h-full bg-white z-50 shadow-xl p-6 overflow-y-auto transition-all duration-500 transform animate-slide-in-left">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-xl font-medium text-gray-800">Nos Marques</h3>
              <button
                onClick={closeSidebar}
                className="text-gray-500 hover:text-[#A67B5B] transition-colors duration-300 p-2 rounded-full hover:bg-gray-100"
                aria-label="Fermer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search brands */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une marque..."
                  className="w-full p-3 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-all duration-300 text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Brands list */}
            <div className="flex flex-col space-y-1">
              {brands.length > 0 ? (
                brands.map((brand) => (
                  <Link
                    key={brand.id}
                    to={`/brand/${brand.id}`}
                    onClick={() => closeSidebar()}
                    className="flex w-full items-center text-left p-3 text-gray-700 hover:bg-gray-50 hover:text-[#A67B5B] rounded-md transition-colors duration-300"
                  >
                    {brand.logo_marque ? (
                      <img
                        src={brand.logo_marque}
                        alt={brand.nom_marque}
                        className="w-6 h-6 object-contain mr-3"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                    {brand.nom_marque}
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-gray-500">Chargement des marques...</p>
                </div>
              )}
            </div>

            {/* View all brands button */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <Link
                to="/marques"
                onClick={() => closeSidebar()}
                className="block w-full text-center p-3 bg-[#A67B5B] text-white rounded-md hover:bg-[#8A5A3B] transition-colors duration-300 font-medium"
              >
                Voir toutes les marques
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Popup contact with improved styling */}
      {isContactPopupOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm transition-opacity duration-300"
            onClick={toggleContactPopup}
          ></div>

          {/* Contact form popup */}
          <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg relative animate-fade-in overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#A67B5B]/10 rounded-full"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#A67B5B]/10 rounded-full"></div>

              {/* Close button */}
              <button
                onClick={toggleContactPopup}
                className="absolute top-4 right-4 text-gray-400 hover:text-[#A67B5B] p-2 rounded-full hover:bg-gray-100 transition-all duration-300 focus:outline-none z-10"
                aria-label="Fermer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="relative z-10">
                <h2 className="text-2xl font-medium mb-2 text-center text-gray-800">
                  Contactez-nous
                </h2>
                <div className="w-16 h-1 bg-[#A67B5B] mx-auto mb-4"></div>
                <p className="text-center text-gray-600 mb-6 text-sm">
                  Nous sommes là pour répondre à toutes vos questions. Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
                </p>
              </div>

              {/* Contact form */}
              <form className="space-y-5 relative z-10">
                <div className="animate-fade-in">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      placeholder="Votre nom"
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-all duration-300"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="animate-fade-in delay-100">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      placeholder="Votre email"
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-all duration-300"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="animate-fade-in delay-200">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <div className="relative">
                    <textarea
                      id="message"
                      placeholder="Votre message"
                      rows="4"
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A67B5B]/20 focus:border-[#A67B5B] transition-all duration-300"
                    ></textarea>
                    <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#A67B5B] hover:bg-[#8A5A3B] text-white font-medium py-3 rounded-md shadow-md transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Envoyer</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Alternative contact methods */}
                <div className="pt-4 mt-6 border-t border-gray-100 text-center">
                  <p className="text-sm text-gray-500 mb-2">Ou contactez-nous directement</p>
                  <div className="flex justify-center space-x-4">
                    <a href="tel:+21612345678" className="text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </a>
                    <a href="mailto:contact@jihen-line.com" className="text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </a>
                    <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

// Export the Navbar wrapped in an ErrorBoundary
export default function SafeNavbar() {
  return (
    <ErrorBoundary>
      <Navbar />
    </ErrorBoundary>
  );
}
