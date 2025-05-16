import React from 'react';
import LoadingSpinner from './Components/LoadingSpinner';
import PrivateRoute from './Components/PrivateRoute.jsx';
import LoadingSpinnerDemo from './Components/LoadingSpinnerDemo';
import LoadingUtilsDemo from './pages/LoadingUtilsDemo';
// Import Profile component directly
import ProfileComponent from './pages/Profile.jsx';
import { lazyWithPreload, preloadMultipleDuringIdle } from './utils/lazyLoader.jsx';
import { LOADING_MESSAGES } from './utils/loadingConfig';

// Import BackButtonDemo
const BackButtonDemo = lazyWithPreload(
  () => import('./pages/BackButtonDemo.jsx'),
  { fallbackMessage: 'Chargement de la démo...' }
);

// Lazy load components with preloading capability
const Home = lazyWithPreload(
  () => import('./pages/Home.jsx'),
  { fallbackMessage: LOADING_MESSAGES.page }
);

// Use the directly imported Profile component
const Profile = ProfileComponent;

const CategoryPage = lazyWithPreload(
  () => import('./Produit/CategoryPage.jsx'),
  { fallbackMessage: 'Chargement de la catégorie...' }
);

const AllCat = lazyWithPreload(
  () => import('./Produit/AllCat.jsx'),
  { fallbackMessage: 'Chargement des catégories...' }
);

const ProductDetailPage = lazyWithPreload(
  () => import('./Produit/ProductDetailPage.jsx'),
  { fallbackMessage: LOADING_MESSAGES.product }
);

const InspirationPage = lazyWithPreload(
  () => import('./pages/InspirationPage.jsx'),
  { fallbackMessage: 'Chargement des inspirations...' }
);

const Promotions = lazyWithPreload(
  () => import('./Produit/Promotions.jsx'),
  { fallbackMessage: 'Chargement des promotions...' }
);

const Cart = lazyWithPreload(
  () => import('./panier/Cart.jsx'),
  { fallbackMessage: 'Chargement de votre panier...' }
);

const SousSousCategoriesPage = lazyWithPreload(
  () => import('./Produit/SousSousCategoriesPage.jsx'),
  { fallbackMessage: 'Chargement des sous-catégories...' }
);

const ArticlesPage = lazyWithPreload(
  () => import('./Produit/ArticlePage.jsx'),
  { fallbackMessage: 'Chargement des articles...' }
);

const ProductsPage = lazyWithPreload(
  () => import('./Produit/ProductsPage.jsx'),
  { fallbackMessage: LOADING_MESSAGES.products }
);

const BrandPage = lazyWithPreload(
  () => import('./marques/BrandPage.jsx'),
  { fallbackMessage: 'Chargement de la marque...' }
);

const FavoritesPage = lazyWithPreload(
  () => import('./pages/FavoritesPage.jsx'),
  { fallbackMessage: 'Chargement de vos favoris...' }
);

const DevenirAffilie = lazyWithPreload(
  () => import('./client/DevenirAffilie.jsx'),
  { fallbackMessage: 'Chargement...' }
);

const ProfessionalPage = lazyWithPreload(
  () => import('./client/ProfessionalPage.jsx'),
  { fallbackMessage: 'Chargement de l\'espace professionnel...' }
);

const Marque = lazyWithPreload(
  () => import('./marques/marque.jsx'),
  { fallbackMessage: 'Chargement des marques...' }
);

// Order management pages
const OrdersPage = lazyWithPreload(
  () => import('./commandes/OrdersPage.jsx'),
  { fallbackMessage: 'Chargement des commandes...' }
);

const OrderDetailPage = lazyWithPreload(
  () => import('./commandes/OrderDetailPage.jsx'),
  { fallbackMessage: 'Chargement des détails de la commande...' }
);

const FixedOrderDetailPage = lazyWithPreload(
  () => import('./commandes/FixedOrderDetailPage.jsx'),
  { fallbackMessage: 'Chargement des détails de la commande...' }
);

const CreateOrderPage = lazyWithPreload(
  () => import('./commandes/CreateOrderPage.jsx'),
  { fallbackMessage: 'Chargement du formulaire de commande...' }
);

// Preload frequently accessed pages during idle time
if (typeof window !== 'undefined') {
  preloadMultipleDuringIdle([
    Home.preload,
    ProductsPage.preload,
    ProductDetailPage.preload,
    Cart.preload,
    OrdersPage.preload,
    CreateOrderPage.preload
  ]);
}

// No need for LazyLoadFallback or withSuspense anymore since we're using lazyWithPreload
// which already handles the Suspense and loading fallback



export const routes = [
  {
    name: "home",
    path: "/home",
    element: <Home />,
  },
  {
    name: "profile",
    path: "/Profile",
    element: <PrivateRoute><Profile /></PrivateRoute>,
  },
  // Remove the Sign In and Sign Up routes since they're handled by Keycloak
  {
    name: "Docs",
    href: "https://www.material-tailwind.com/docs/react/installation",
    target: "_blank",
    element: "",
  },
  {
    name: "CategoryPage",
    path: "/category/:id", // Route dynamique avec l'ID de la catégorie
    element: <CategoryPage />,
  },
  {
    name: "SousSousCategoriesPage",
    path: "/sous_souscategorie/:id", // Route dynamique avec l'ID de la catégorie
    element: <SousSousCategoriesPage />,
  },
  {
    name: "ArticlesPage",
    path: "/articles/:id", // Route dynamique avec l'ID de la catégorie
    element: <ArticlesPage />,
  },
  {
    name: "AllCat",
    path: "/Produit/AllCat", // Route dynamique avec l'ID de la catégorie
    element: <AllCat />,
  },
  {
    name: "products",
    path: "article/:id", // Route dynamique avec l'ID de la catégorie
    element: <ProductDetailPage />,
  },
  {
    name: "InspirationPage",
    path: "/inspiration", // Route pour la page d'inspiration
    element: <InspirationPage />,
  },
  {
    name: "InspirationPageAlt",
    path: "/inspirations", // Route alternative
    element: <InspirationPage />,
  },
  {
    name: "Promotions",
    path: "/Promotions", // Route dynamique avec l'ID de la catégorie
    element: <Promotions />,
  },
  {
    name: "Cart",
    path: "/Cart", // Route dynamique avec l'ID de la catégorie
    element: <Cart />,
  },
  {
    name: "products",
    path: "/products", // Route dynamique avec l'ID de la catégorie
    element: <ProductsPage />,
    // Preload ProductsPage when user hovers over any link to products
    onMouseEnter: () => ProductsPage.preload()
  },
  {
    name: "BrandPage",
    path: "/brand/:id", // Route dynamique avec l'ID de la catégorie
    element: <BrandPage />,
  },
  {
    name: "FavoritesPage",
    path: "/FavoritesPage", // Route dynamique avec l'ID de la catégorie
    element: <FavoritesPage />,
  },
  {
    name: "DevenirAffilie",
    path: "/DevenirAffilie", // Route dynamique avec l'ID de la catégorie
    element: <DevenirAffilie />,
  },
  {
    name: "ProfessionalPage",
    path: "/ProfessionalPage", // Route dynamique avec l'ID de la catégorie
    element: <ProfessionalPage />,
  },
  {
    name: "marque",
    path: "/marque", // Route dynamique avec l'ID de la catégorie
    element: <Marque />,
  },
  {
    name: "LoadingDemo",
    path: "/loading-demo", // Route pour la démo des animations de chargement
    element: <LoadingSpinnerDemo />,
  },
  {
    name: "LoadingUtilsDemo",
    path: "/loading-utils", // Route pour la démo des utilitaires de chargement
    element: <LoadingUtilsDemo />,
  },
  {
    name: "BackButtonDemo",
    path: "/back-button-demo", // Route pour la démo du bouton retour
    element: <BackButtonDemo />,
  },
  // Order management routes
  {
    name: "OrdersPage",
    path: "/commandes",
    element: <PrivateRoute><OrdersPage /></PrivateRoute>,
  },
  {
    name: "OrderDetailPage",
    path: "/commandes/:orderId",
    element: <PrivateRoute><FixedOrderDetailPage /></PrivateRoute>,
  },
  {
    name: "CreateOrderPage",
    path: "/commander",
    element: <PrivateRoute><CreateOrderPage /></PrivateRoute>,
  },
];


export default routes;

