import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';

// Import API service if available, otherwise use a constant
const API_URL = import.meta.env.VITE_API_URL || 'https://laravel-api.fly.dev/api';

/**
 * Breadcrumb component for displaying navigation path
 *
 * @returns {JSX.Element} Breadcrumb navigation component
 */
const Breadcrumb = () => {
  const location = useLocation();
  const params = useParams();
  const [pathSegments, setPathSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache for entity names to avoid repeated API calls
  const entityCache = useRef(new Map());

  // Abort controller for cancelling API requests
  const abortControllerRef = useRef(null);

  // Map route paths to human-readable names
  const routeNameMap = {
    '': 'Accueil',
    'home': 'Accueil',
    'Profile': 'Profil',
    'category': 'Catégorie',
    'sous_souscategorie': 'Sous-catégorie',
    'articles': 'Articles',
    'article': 'Produit',
    'Produit': 'Produits',
    'AllCat': 'Toutes les catégories',
    'inspiration': 'Inspiration',
    'inspirations': 'Inspirations',
    'Promotions': 'Promotions',
    'Cart': 'Panier',
    'products': 'Produits',
    'brand': 'Marque',
    'FavoritesPage': 'Favoris',
    'DevenirAffilie': 'Devenir Affilié',
    'ProfessionalPage': 'Espace Professionnel',
    'marque': 'Marques',
    'commandes': 'Commandes',
    'commander': 'Nouvelle Commande',
  };

  // Function to fetch entity names for dynamic routes with caching
  const fetchEntityName = async (segment, id) => {
    // Create a cache key
    const cacheKey = `${segment}_${id}`;

    // Check if we already have this entity name in cache
    if (entityCache.current.has(cacheKey)) {
      return entityCache.current.get(cacheKey);
    }

    setIsLoading(true);
    setError(null);

    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create a new abort controller
    abortControllerRef.current = new AbortController();

    try {
      let endpoint = '';
      let nameField = '';

      // Determine the API endpoint and name field based on the segment
      switch (segment) {
        case 'category':
          endpoint = `${API_URL}/categories/${id}`;
          nameField = 'nom_categorie';
          break;
        case 'sous_souscategorie':
          endpoint = `${API_URL}/sousSousCategories/${id}`;
          nameField = 'nom_sous_sous_categorie';
          break;
        case 'articles':
          endpoint = `${API_URL}/sousSousCategories/${id}`;
          nameField = 'nom_sous_sous_categorie';
          break;
        case 'article':
          endpoint = `${API_URL}/produits/${id}`;
          nameField = 'nom_produit';
          break;
        case 'brand':
          endpoint = `${API_URL}/marques/${id}`;
          nameField = 'nom_marque';
          break;
        case 'commandes':
          if (id) {
            const name = `Commande #${id}`;
            // Cache the result
            entityCache.current.set(cacheKey, name);
            return name;
          }
          return 'Commandes';
        default:
          return routeNameMap[segment] || segment;
      }

      if (endpoint) {
        // Set a timeout for the request
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
        }, 5000); // 5 second timeout

        const response = await axios.get(endpoint, {
          signal: abortControllerRef.current.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'max-age=3600' // Cache for 1 hour
          }
        });

        clearTimeout(timeoutId);

        const name = response.data[nameField] || `${routeNameMap[segment] || segment} ${id}`;

        // Cache the result
        entityCache.current.set(cacheKey, name);

        return name;
      }
    } catch (error) {
      // Only log and set error if it's not an abort error
      if (error.name !== 'AbortError') {
        console.error(`Error fetching name for ${segment}/${id}:`, error);
        setError(`Erreur lors du chargement des informations pour ${routeNameMap[segment] || segment}`);
      }
      return `${routeNameMap[segment] || segment} ${id}`;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Flag to track if the component is mounted
    let isMounted = true;

    const buildBreadcrumbs = async () => {
      // Skip if we're on the home page
      if (location.pathname === '/' || location.pathname === '/home') {
        if (isMounted) {
          setPathSegments([{ name: 'Accueil', path: '/home', isLast: true }]);
        }
        return;
      }

      // Split the path into segments and remove empty segments
      const segments = location.pathname.split('/').filter(Boolean);

      // Start with home
      const breadcrumbs = [{ name: 'Accueil', path: '/home', isLast: false }];

      // Build the path segments
      let currentPath = '';

      for (let i = 0; i < segments.length; i++) {
        // Skip if component unmounted during async operations
        if (!isMounted) return;

        const segment = segments[i];
        currentPath += `/${segment}`;

        // Check if this segment is a dynamic parameter (contains an ID)
        const isIdSegment = !isNaN(segment);

        // If this is an ID segment, skip it as we'll handle it with the previous segment
        if (isIdSegment) continue;

        // Check if the next segment is an ID
        const nextSegment = segments[i + 1];
        const hasIdParam = nextSegment && !isNaN(nextSegment);

        let name = routeNameMap[segment] || segment;
        let path = currentPath;

        // If this segment has an ID parameter, include it in the path
        if (hasIdParam) {
          path += `/${nextSegment}`;

          // Fetch the entity name for segments with IDs
          name = await fetchEntityName(segment, nextSegment);

          // Skip the next segment since we've already processed it
          i++;
        }

        // Skip if component unmounted during async operations
        if (!isMounted) return;

        breadcrumbs.push({
          name,
          path,
          isLast: i === segments.length - 1 || (hasIdParam && i + 1 === segments.length - 1)
        });
      }

      // Only update state if component is still mounted
      if (isMounted) {
        setPathSegments(breadcrumbs);
      }
    };

    buildBreadcrumbs();

    // Cleanup function to run when component unmounts or when location changes
    return () => {
      isMounted = false;

      // Abort any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [location.pathname]);

  // Don't render anything if we only have the home breadcrumb or we're on the home page
  if (pathSegments.length <= 1 || location.pathname === '/' || location.pathname === '/home') {
    return null;
  }

  return (
    <nav aria-label="Fil d'Ariane" className="bg-gray-50 py-3 px-4 border-b border-gray-100">
      <div className="container mx-auto">
        <ol className="flex flex-wrap items-center text-sm">
          {pathSegments.map((segment, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
              {segment.isLast ? (
                <span className="text-[#A67B5B] font-medium">{segment.name}</span>
              ) : (
                <Link
                  to={segment.path}
                  className="text-gray-600 hover:text-[#A67B5B] transition-colors duration-200"
                >
                  {segment.name}
                </Link>
              )}
            </li>
          ))}

          {/* Loading indicator with improved visibility */}
          {isLoading && (
            <li className="ml-3 flex items-center">
              <div className="flex items-center bg-white px-2 py-1 rounded-full shadow-sm">
                <span className="inline-block w-4 h-4 border-2 border-[#A67B5B] border-t-transparent rounded-full animate-spin mr-1"></span>
                <span className="text-xs text-gray-500">Chargement...</span>
              </div>
            </li>
          )}

          {/* Error message */}
          {error && (
            <li className="ml-3">
              <div className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            </li>
          )}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumb;
