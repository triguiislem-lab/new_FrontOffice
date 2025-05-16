import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';

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

  // Function to fetch entity names for dynamic routes
  const fetchEntityName = async (segment, id) => {
    setIsLoading(true);
    try {
      let endpoint = '';
      let nameField = '';

      // Determine the API endpoint and name field based on the segment
      switch (segment) {
        case 'category':
          endpoint = `https://laravel-api.fly.dev/api/categories/${id}`;
          nameField = 'nom_categorie';
          break;
        case 'sous_souscategorie':
          endpoint = `https://laravel-api.fly.dev/api/sousSousCategories/${id}`;
          nameField = 'nom_sous_sous_categorie';
          break;
        case 'articles':
          endpoint = `https://laravel-api.fly.dev/api/sousSousCategories/${id}`;
          nameField = 'nom_sous_sous_categorie';
          break;
        case 'article':
          endpoint = `https://laravel-api.fly.dev/api/produits/${id}`;
          nameField = 'nom_produit';
          break;
        case 'brand':
          endpoint = `https://laravel-api.fly.dev/api/marques/${id}`;
          nameField = 'nom_marque';
          break;
        case 'commandes':
          if (id) {
            return `Commande #${id}`;
          }
          return 'Commandes';
        default:
          return routeNameMap[segment] || segment;
      }

      if (endpoint) {
        const response = await axios.get(endpoint);
        return response.data[nameField] || `${routeNameMap[segment] || segment} ${id}`;
      }
    } catch (error) {
      console.error(`Error fetching name for ${segment}/${id}:`, error);
      return `${routeNameMap[segment] || segment} ${id}`;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const buildBreadcrumbs = async () => {
      // Skip if we're on the home page
      if (location.pathname === '/' || location.pathname === '/home') {
        setPathSegments([{ name: 'Accueil', path: '/home', isLast: true }]);
        return;
      }

      // Split the path into segments and remove empty segments
      const segments = location.pathname.split('/').filter(Boolean);
      
      // Start with home
      const breadcrumbs = [{ name: 'Accueil', path: '/home', isLast: false }];
      
      // Build the path segments
      let currentPath = '';
      
      for (let i = 0; i < segments.length; i++) {
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
        
        breadcrumbs.push({
          name,
          path,
          isLast: i === segments.length - 1 || (hasIdParam && i + 1 === segments.length - 1)
        });
      }
      
      setPathSegments(breadcrumbs);
    };

    buildBreadcrumbs();
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
          {isLoading && (
            <li className="ml-2">
              <span className="inline-block w-4 h-4 border-2 border-[#A67B5B] border-t-transparent rounded-full animate-spin"></span>
            </li>
          )}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumb;
