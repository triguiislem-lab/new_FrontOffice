import { useState, useEffect, useRef } from "react";
import { Avatar, Typography, Button, Card, CardBody, Spinner, Chip, Progress, Tooltip } from "@material-tailwind/react";
import {
  UserIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  HeartIcon,
  ClockIcon,
  BellIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  PencilIcon,
  ArrowPathIcon,
  CameraIcon,
  EyeIcon
} from "@heroicons/react/24/solid";
import { useAuth } from "../Contexts/AuthContext";
import axios from "axios";
import LoadingSpinner from "../Components/LoadingSpinner";
import EnhancedLazyImage from "../Components/EnhancedLazyImage";
import LoadingLine from "../Components/LoadingLine";

function Profile() {
  const { user, isAuthenticated, keycloak } = useAuth();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger a refresh
  const [activeTab, setActiveTab] = useState('profile'); // For tab navigation

  // Real data for statistics and activity
  const [stats, setStats] = useState({
    orders: 0,
    wishlist: 0,
    lastLogin: null,
    accountCompletion: 0
  });

  // Activity data
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchClientData = async () => {
      if (!isAuthenticated || !keycloak?.token) {
        setLoading(false);
        return;
      }

      // Set up the authorization header for all requests
      const authHeader = {
        headers: {
          Authorization: `Bearer ${keycloak.token}`
        }
      };

      try {
        // Validate that we have the necessary authentication data
        if (!user) {
          throw new Error('Informations utilisateur non disponibles. Veuillez vous reconnecter.');
        }

        // Get the current user ID directly from the backend
        let clientId;
        try {
          // Make a direct call to the backend to get the current user's ID
          const userResponse = await axios.get(`${import.meta.env.VITE_API_URL}/auth/user`, authHeader);

          // Extract the ID from the response - the ID is nested in a user object
          if (userResponse.data && userResponse.data.user && userResponse.data.user.id) {
            clientId = userResponse.data.user.id;
          } else if (userResponse.data && userResponse.data.id) {
            // Try direct ID if available
            clientId = userResponse.data.id;
          } else {
            // If we can't find the ID in the response, throw an error
            throw new Error('ID utilisateur non trouvé dans la réponse du serveur');
          }
        } catch (idError) {
          // Check if we have a user object with nested user property
          if (user && user.user && user.user.id) {
            clientId = user.user.id;
          } else if (user && user.id) {
            // Try direct user.id if available
            clientId = user.id;
          } else {
            // If we still can't find the ID, throw an error
            throw new Error('Impossible de récupérer l\'ID utilisateur. Veuillez vous reconnecter.');
          }
        }

        // Fetch client data from the API with proper authorization
        const response = await axios.get(`https://laravel-api.fly.dev/api/clients/${clientId}`, authHeader);
        setClientData(response.data);

        try {
          // Fetch wishlist data to get real count
          const wishlistResponse = await axios.get(`https://laravel-api.fly.dev/api/wishlist`, authHeader);
          const wishlistCount = wishlistResponse.data?.data?.items?.length || 0;

          // Fetch orders data if available
          let ordersCount = 0;
          let lastLoginDate = null;
          let recentActivityData = [];

          try {
            // Try to get orders data
            const ordersResponse = await axios.get(`https://laravel-api.fly.dev/api/orders`, authHeader);
            if (ordersResponse.data?.data?.orders) {
              ordersCount = ordersResponse.data.data.orders.length;

              // Create activity items from orders
              const orderActivities = ordersResponse.data.data.orders.slice(0, 5).map(order => ({
                id: `order-${order.id}`,
                type: 'order',
                title: `Commande #${order.reference || order.id}`,
                description: `Statut: ${order.statut || 'En traitement'}`,
                date: new Date(order.date_creation || Date.now()),
                status: order.statut === 'completed' ? 'success' : 'info',
                link: `/orders/${order.id}`
              }));

              recentActivityData = [...recentActivityData, ...orderActivities];
            }
          } catch (ordersError) {
            // Fallback to a reasonable default
            ordersCount = response.data.commandes?.length || 0;
          }

          // Try to get last login date from user data
          if (response.data.last_login) {
            lastLoginDate = new Date(response.data.last_login);
          } else if (user && user.last_login) {
            lastLoginDate = new Date(user.last_login);
          } else {
            // Fallback to a reasonable default
            lastLoginDate = new Date();
          }

          // Add wishlist activity if we have wishlist items
          if (wishlistCount > 0) {
            const wishlistItems = wishlistResponse.data?.data?.items || [];
            const wishlistActivities = wishlistItems.slice(0, 3).map((item, index) => ({
              id: `wishlist-${item.id || index}`,
              type: 'wishlist',
              title: 'Liste de souhaits',
              description: `Produit ajouté: ${item.produit?.nom || 'Article'}`,
              date: new Date(item.date_ajout || Date.now() - (index * 24 * 60 * 60 * 1000)),
              status: 'info',
              link: '/favoris'
            }));

            recentActivityData = [...recentActivityData, ...wishlistActivities];
          }

          // Add login activity
          recentActivityData.push({
            id: 'login-recent',
            type: 'login',
            title: 'Connexion',
            description: 'Dernière connexion',
            date: lastLoginDate,
            status: 'success',
            link: null
          });

          // Sort activities by date (newest first)
          recentActivityData.sort((a, b) => b.date - a.date);

          // Calculate account completion based on available data
          const requiredFields = ['name', 'email', 'created_at'];
          const optionalFields = ['phone', 'address', 'city', 'country', 'postal_code'];

          let completedFields = 0;
          requiredFields.forEach(field => {
            if (response.data[field]) completedFields++;
          });

          optionalFields.forEach(field => {
            if (response.data[field]) completedFields++;
          });

          const totalFields = requiredFields.length + optionalFields.length;
          const accountCompletion = Math.round((completedFields / totalFields) * 100);

          // Set real statistics data
          setStats({
            orders: ordersCount,
            wishlist: wishlistCount,
            lastLogin: lastLoginDate,
            accountCompletion: accountCompletion
          });

          // Set activity data
          setRecentActivity(recentActivityData);

        } catch (statsError) {
          // Fallback to reasonable defaults if API calls fail
          setStats({
            orders: response.data.commandes?.length || 0,
            wishlist: 0,
            lastLogin: new Date(),
            accountCompletion: 70 // Default reasonable value
          });
        }

        setLoading(false);
      } catch (err) {
        // Provide more specific error messages based on the error type
        if (err.response && err.response.status === 404) {
          setError("Profil utilisateur non trouvé. Veuillez contacter le support.");
        } else if (err.response && err.response.status === 401) {
          setError("Session expirée. Veuillez vous reconnecter.");
        } else if (err.message) {
          setError(err.message);
        } else {
          setError("Erreur lors de la récupération des données client. Veuillez réessayer plus tard.");
        }
        setLoading(false);
      }
    };

    fetchClientData();
  }, [isAuthenticated, user, keycloak, refreshKey]);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "Non disponible";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Animation references
  const headerRef = useRef(null);

  // Parallax effect for header background
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const scrollY = window.scrollY;
        const translateY = scrollY * 0.3; // Adjust the parallax speed
        headerRef.current.style.transform = `translateY(${translateY}px) scale(1.05)`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif">
      <section className="relative block h-[40vh] overflow-hidden">
        <div
          ref={headerRef}
          className="bg-profile-background absolute top-0 h-full w-full bg-[url('/img/interior-moodboard.png')] bg-cover bg-center scale-105 transition-transform duration-700"
        />
        <div className="absolute top-0 h-full w-full bg-gradient-to-r from-[#A67B5B]/40 to-[#A67B5B]/10" />
        <div className="absolute bottom-0 h-32 w-full bg-gradient-to-t from-white to-transparent"></div>

        {/* Enhanced decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-pulse-slow"></div>
          <div className="absolute top-20 left-20 w-20 h-20 bg-white/20 rounded-full blur-lg animate-float"></div>
          <div className="absolute bottom-40 right-20 w-16 h-16 bg-[#A67B5B]/10 rounded-full blur-md animate-float-delayed"></div>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 bg-[url('/img/subtle-pattern.png')] bg-repeat opacity-5"></div>

          {/* Page title */}
          <div className="absolute bottom-20 left-0 w-full text-center">
            <h1 className="text-white text-3xl md:text-4xl font-light tracking-wider drop-shadow-md">
              Votre Profil
            </h1>
          </div>
        </div>
      </section>

      <section className="relative bg-[#FAFAFA] py-20">
        <div className="relative mb-6 -mt-40 flex w-full px-6 min-w-0 flex-col break-words">
          <div className="container mx-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-center max-w-md mx-auto px-6 py-12 bg-white rounded-lg shadow-md animate-fade-in">
                  <LoadingSpinner
                    size="lg"
                    variant="elegant"
                    color="#A67B5B"
                    message="Chargement de votre profil..."
                    showLoadingLine={true}
                  />
                  <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-30"></div>
                  <p className="text-sm text-gray-500 font-light">Veuillez patienter pendant que nous préparons vos informations</p>
                </div>
              </div>
            ) : error ? (
              <Card className="p-8 mb-6 border border-red-200 bg-white shadow-none animate-fade-in">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <Typography variant="h5" color="red" className="font-light mb-2 text-center">
                    Erreur de chargement
                  </Typography>
                  <Typography color="gray" className="font-light mb-6 text-center max-w-md">
                    {error}
                  </Typography>
                  <div className="flex gap-4">
                    <Button
                      className="bg-[#A67B5B] hover:bg-[#8B5A2B] transition-all duration-300 shadow-none normal-case font-light tracking-wider px-6 flex items-center gap-2"
                      onClick={() => {
                        setLoading(true);
                        setError(null);
                        setRefreshKey(prev => prev + 1); // Trigger a refresh
                      }}
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Réessayer
                    </Button>
                    <Button
                      variant="outlined"
                      className="border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-300 shadow-none normal-case font-light tracking-wider px-6"
                      onClick={() => {
                        if (keycloak && typeof keycloak.login === 'function') {
                          keycloak.login({ redirectUri: window.location.href });
                        }
                      }}
                    >
                      Rafraîchir la session
                    </Button>
                  </div>
                </div>
              </Card>
            ) : clientData ? (
              <>
                {/* Profile Header - Enhanced with better styling */}
                <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-lg transition-all duration-500 hover:shadow-xl animate-fade-in">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                    {/* Left side - User info */}
                    <div className="flex flex-col md:flex-row items-start gap-8 w-full lg:w-2/3">
                      {/* Enhanced Avatar with interactive effects */}
                      <div className="relative -mt-28 w-44 group">
                        {/* Multi-layered glow effect */}
                        <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-[#A67B5B]/30 to-[#A67B5B]/10 opacity-0 blur-xl transition-all duration-700 group-hover:opacity-100 group-hover:blur-xl"></div>
                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#A67B5B]/40 to-[#A67B5B]/20 opacity-70 blur-md transition-all duration-500 group-hover:opacity-100 group-hover:blur-lg"></div>

                        {/* Avatar container with subtle animation */}
                        <div className="relative rounded-full p-1 bg-white shadow-lg transition-all duration-500 group-hover:shadow-xl">
                          <Avatar
                            src="/img/default-avatar.svg"
                            alt="Photo de profil"
                            variant="circular"
                            className="h-full w-full bg-white border-2 border-white shadow-lg transition-all duration-500 group-hover:scale-105 relative z-10"
                            withBorder={true}
                          />

                          {/* Decorative ring */}
                          <div className="absolute inset-0 rounded-full border border-[#A67B5B]/20 animate-pulse-slow"></div>
                        </div>

                        {/* Edit button with tooltip */}
                        <Tooltip content="Modifier la photo de profil">
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#A67B5B] rounded-full flex items-center justify-center text-white shadow-md z-20 transition-all duration-300 hover:scale-110 hover:bg-[#8B5A2B] cursor-pointer">
                            <CameraIcon className="h-5 w-5" />
                          </div>
                        </Tooltip>

                        {/* View button with tooltip */}
                        <Tooltip content="Voir la photo en grand">
                          <div className="absolute -bottom-2 left-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#A67B5B] shadow-md z-20 transition-all duration-300 hover:scale-110 cursor-pointer opacity-0 group-hover:opacity-100 group-hover:left-2">
                            <EyeIcon className="h-4 w-4" />
                          </div>
                        </Tooltip>
                      </div>

                      {/* User details with enhanced typography and animations */}
                      <div className="flex flex-col mt-2 animate-fade-in">
                        <div className="flex flex-wrap items-center gap-3">
                          <Typography variant="h3" className="text-gray-800 font-light tracking-wide relative group">
                            {clientData.name}
                            <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#A67B5B]/50 transition-all duration-500 group-hover:w-full"></div>
                          </Typography>
                          {clientData.partenaire && (
                            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-[#A67B5B]/20 to-[#A67B5B]/10 rounded-full transition-all duration-300 hover:from-[#A67B5B]/30 hover:to-[#A67B5B]/20 cursor-default">
                              <ShieldCheckIcon className="h-4 w-4 text-[#A67B5B]" />
                              <span className="text-xs font-medium text-[#A67B5B]">Partenaire</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-3 group">
                          <div className="w-8 h-8 rounded-full bg-[#F5F2EE] flex items-center justify-center transition-all duration-300 group-hover:bg-[#A67B5B]/20">
                            <EnvelopeIcon className="h-4 w-4 text-[#A67B5B]" />
                          </div>
                          <div className="flex flex-col">
                            <Typography variant="small" className="font-light text-gray-500">
                              Email
                            </Typography>
                            <Typography variant="paragraph" className="font-light text-gray-700 tracking-wide">
                              {clientData.email}
                            </Typography>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-3 group">
                          <div className="w-8 h-8 rounded-full bg-[#F5F2EE] flex items-center justify-center transition-all duration-300 group-hover:bg-[#A67B5B]/20">
                            <CalendarIcon className="h-4 w-4 text-[#A67B5B]" />
                          </div>
                          <div className="flex flex-col">
                            <Typography variant="small" className="font-light text-gray-500">
                              Membre depuis
                            </Typography>
                            <Typography variant="paragraph" className="font-light text-gray-700">
                              {formatDate(clientData.created_at)}
                            </Typography>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          {clientData.roles && clientData.roles.map((role, index) => (
                            <Tooltip key={index} content={role === 'client' ? "Compte client standard" : `Rôle: ${role}`}>
                              <span
                                className={`px-3 py-1 text-xs font-light tracking-wider rounded-full transition-all duration-300 ${
                                  role === 'client'
                                    ? 'text-[#A67B5B] bg-[#F5F2EE] border border-[#A67B5B]/10 hover:bg-[#A67B5B]/20'
                                    : 'text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                } cursor-default`}
                              >
                                {role}
                              </span>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right side - Enhanced Stats with animations */}
                    <div className="w-full lg:w-1/3 mt-6 lg:mt-0">
                      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-md animate-fade-in">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-full bg-[#F5F2EE] flex items-center justify-center">
                            <UserIcon className="h-4 w-4 text-[#A67B5B]" />
                          </div>
                          <Typography variant="h6" className="font-light text-gray-700">
                            Aperçu du compte
                          </Typography>
                        </div>

                        <div className="space-y-5">
                          {/* Account completion with enhanced styling */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                              <Typography variant="small" className="font-light text-gray-600 flex items-center gap-2">
                                <CheckCircleIcon className="h-4 w-4 text-[#A67B5B]" />
                                Profil complété
                              </Typography>
                              <Typography variant="small" className="font-medium text-[#A67B5B]">
                                {stats.accountCompletion}%
                              </Typography>
                            </div>
                            <Progress value={stats.accountCompletion} size="sm" color="brown" className="h-1.5 rounded-full" />

                            {/* Completion status text */}
                            <div className="mt-2 text-xs text-gray-500 font-light">
                              {stats.accountCompletion < 70 ? (
                                <p className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                  Complétez votre profil pour débloquer plus de fonctionnalités
                                </p>
                              ) : stats.accountCompletion < 100 ? (
                                <p className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Bon niveau de complétion, quelques détails manquants
                                </p>
                              ) : (
                                <p className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  Profil complet, toutes les fonctionnalités débloquées
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Stats grid with enhanced cards */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-sm group">
                              <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center transition-all duration-300 group-hover:bg-[#A67B5B]/10">
                                  <ShoppingBagIcon className="h-4 w-4 text-[#A67B5B]" />
                                </div>
                                <div>
                                  <Typography variant="h6" className="text-[#A67B5B] font-medium">
                                    {stats.orders}
                                  </Typography>
                                </div>
                              </div>
                              <Typography variant="small" className="text-gray-500 font-light pl-11">
                                Commandes
                              </Typography>

                              {/* Subtle action link */}
                              <div className="mt-2 text-xs text-[#A67B5B] font-light pl-11 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <a href="#" className="flex items-center gap-1 hover:underline">
                                  Voir l'historique
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                </a>
                              </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-sm group">
                              <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center transition-all duration-300 group-hover:bg-[#A67B5B]/10">
                                  <HeartIcon className="h-4 w-4 text-[#A67B5B]" />
                                </div>
                                <div>
                                  <Typography variant="h6" className="text-[#A67B5B] font-medium">
                                    {stats.wishlist}
                                  </Typography>
                                </div>
                              </div>
                              <Typography variant="small" className="text-gray-500 font-light pl-11">
                                Favoris
                              </Typography>

                              {/* Subtle action link */}
                              <div className="mt-2 text-xs text-[#A67B5B] font-light pl-11 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <a href="/favoris" className="flex items-center gap-1 hover:underline">
                                  Voir les favoris
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                          </div>

                          {/* Last login info */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                <ClockIcon className="h-4 w-4 text-[#A67B5B]" />
                              </div>
                              <div>
                                <Typography variant="small" className="text-gray-500 font-light">
                                  Dernière connexion
                                </Typography>
                                <Typography variant="paragraph" className="text-gray-700 font-light">
                                  {stats.lastLogin ? formatDate(stats.lastLogin) : "Aujourd'hui"}
                                </Typography>
                              </div>
                            </div>
                          </div>

                          {/* Partner discount with enhanced styling */}
                          {clientData.partenaire && (
                            <div className="p-4 bg-gradient-to-r from-[#A67B5B]/20 to-[#A67B5B]/5 rounded-lg border border-[#A67B5B]/10 transition-all duration-500 hover:from-[#A67B5B]/30 hover:to-[#A67B5B]/10">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center">
                                  <TagIcon className="h-4 w-4 text-[#A67B5B]" />
                                </div>
                                <Typography variant="small" className="font-light text-gray-700">
                                  Remise partenaire
                                </Typography>
                              </div>
                              <div className="flex justify-between items-center">
                                <Typography variant="small" className="font-light text-gray-600 pl-11">
                                  Remise applicable sur tous vos achats
                                </Typography>
                                <Typography variant="h5" className="font-medium text-[#A67B5B]">
                                  {clientData.partenaire.remise}%
                                </Typography>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Navigation tabs with icons and animations */}
                  <div className="mt-8 border-t border-gray-100 pt-6">
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                          activeTab === 'profile'
                            ? 'bg-[#A67B5B] text-white shadow-md transform scale-105'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <UserIcon className="h-4 w-4" />
                        <span>Informations personnelles</span>
                        {activeTab === 'profile' && (
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A67B5B] rounded-full"></span>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveTab('commercial')}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                          activeTab === 'commercial'
                            ? 'bg-[#A67B5B] text-white shadow-md transform scale-105'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <TagIcon className="h-4 w-4" />
                        <span>Informations commerciales</span>
                        {activeTab === 'commercial' && (
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A67B5B] rounded-full"></span>
                        )}
                      </button>

                      {clientData.partenaire && (
                        <button
                          onClick={() => setActiveTab('partner')}
                          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                            activeTab === 'partner'
                              ? 'bg-[#A67B5B] text-white shadow-md transform scale-105'
                              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                          }`}
                        >
                          <ShieldCheckIcon className="h-4 w-4" />
                          <span>Partenariat</span>
                          {activeTab === 'partner' && (
                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A67B5B] rounded-full"></span>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setActiveTab('activity')}
                        className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                          activeTab === 'activity'
                            ? 'bg-[#A67B5B] text-white shadow-md transform scale-105'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                        }`}
                      >
                        <ClockIcon className="h-4 w-4" />
                        <span>Activité récente</span>
                        {activeTab === 'activity' && (
                          <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#A67B5B] rounded-full"></span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-[#F5F2EE] flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-[#A67B5B]" />
                      </div>
                      <Typography variant="h6" className="font-light tracking-wide text-gray-800">
                        Informations personnelles
                      </Typography>
                    </div>
                    <div className="space-y-5">
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Nom
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {clientData.name}
                        </Typography>
                      </div>
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Email
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {clientData.email}
                        </Typography>
                      </div>
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Inscrit depuis
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {formatDate(clientData.created_at)}
                        </Typography>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-[#F5F2EE] flex items-center justify-center">
                        <TagIcon className="h-4 w-4 text-[#A67B5B]" />
                      </div>
                      <Typography variant="h6" className="font-light tracking-wide text-gray-800">
                        Informations commerciales
                      </Typography>
                    </div>
                    <div className="space-y-5">
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Profil de remise
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {clientData.profil_remise || "Standard"}
                        </Typography>
                      </div>
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Remise personnelle
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {clientData.remise_personnelle}%
                        </Typography>
                      </div>
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Remise effective
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {clientData.remise_effective}%
                        </Typography>
                      </div>
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Point de vente
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {clientData.point_de_vente ? clientData.point_de_vente.nom : "Non assigné"}
                        </Typography>
                      </div>
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Groupe client
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {clientData.groupe_client ? clientData.groupe_client.nom : "Non assigné"}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Partenaire Information */}
                {clientData.partenaire && activeTab !== 'activity' && (
                  <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm mt-8 transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-[#F5F2EE] flex items-center justify-center">
                        <IdentificationIcon className="h-4 w-4 text-[#A67B5B]" />
                      </div>
                      <Typography variant="h6" className="font-light tracking-wide text-gray-800">
                        Informations partenaire
                      </Typography>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          ID Partenaire
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {clientData.partenaire.id}
                        </Typography>
                      </div>
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Remise partenaire
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {clientData.partenaire.remise}%
                        </Typography>
                      </div>
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Statut
                        </Typography>
                        <Typography className="font-light text-gray-800 capitalize">
                          {clientData.partenaire.statut}
                        </Typography>
                      </div>
                      <div className="group border-b border-gray-100 pb-3 transition-all duration-300">
                        <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                          Partenaire depuis
                        </Typography>
                        <Typography className="font-light text-gray-800">
                          {formatDate(clientData.partenaire.created_at)}
                        </Typography>
                      </div>
                      {clientData.partenaire.description && (
                        <div className="col-span-1 md:col-span-2 group border-b border-gray-100 pb-3 transition-all duration-300 mt-2">
                          <Typography className="text-sm font-light text-gray-500 mb-1 group-hover:text-[#A67B5B]">
                            Description
                          </Typography>
                          <Typography className="font-light text-gray-800">
                            {clientData.partenaire.description}
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Timeline Section */}
                {activeTab === 'activity' && (
                  <div className="bg-white border border-gray-100 p-8 rounded-lg shadow-sm mt-8 transition-all duration-300 hover:shadow-md animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-[#F5F2EE] flex items-center justify-center">
                        <ClockIcon className="h-5 w-5 text-[#A67B5B]" />
                      </div>
                      <div>
                        <Typography variant="h5" className="font-light tracking-wide text-gray-800">
                          Activité récente
                        </Typography>
                        <Typography variant="small" className="font-light text-gray-500">
                          Historique de vos dernières actions et commandes
                        </Typography>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative mt-8 pl-8 border-l-2 border-gray-100">
                      {recentActivity.map((activity, index) => (
                        <div key={activity.id} className="mb-8 relative animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                          {/* Timeline dot */}
                          <div className={`absolute -left-[25px] w-12 h-12 rounded-full flex items-center justify-center ${
                            activity.status === 'success' ? 'bg-green-50' :
                            activity.status === 'warning' ? 'bg-yellow-50' :
                            activity.status === 'error' ? 'bg-red-50' : 'bg-blue-50'
                          }`}>
                            {activity.type === 'order' && (
                              <ShoppingBagIcon className={`h-5 w-5 ${
                                activity.status === 'success' ? 'text-green-500' :
                                activity.status === 'warning' ? 'text-yellow-500' :
                                activity.status === 'error' ? 'text-red-500' : 'text-blue-500'
                              }`} />
                            )}
                            {activity.type === 'wishlist' && (
                              <HeartIcon className={`h-5 w-5 ${
                                activity.status === 'success' ? 'text-green-500' :
                                activity.status === 'warning' ? 'text-yellow-500' :
                                activity.status === 'error' ? 'text-red-500' : 'text-blue-500'
                              }`} />
                            )}
                            {activity.type === 'login' && (
                              <UserIcon className={`h-5 w-5 ${
                                activity.status === 'success' ? 'text-green-500' :
                                activity.status === 'warning' ? 'text-yellow-500' :
                                activity.status === 'error' ? 'text-red-500' : 'text-blue-500'
                              }`} />
                            )}
                            {activity.type === 'profile' && (
                              <IdentificationIcon className={`h-5 w-5 ${
                                activity.status === 'success' ? 'text-green-500' :
                                activity.status === 'warning' ? 'text-yellow-500' :
                                activity.status === 'error' ? 'text-red-500' : 'text-blue-500'
                              }`} />
                            )}
                          </div>

                          {/* Activity content */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 ml-4 transition-all duration-300 hover:shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                              <Typography variant="h6" className="font-medium text-gray-800">
                                {activity.title}
                              </Typography>
                              <Typography variant="small" className="font-light text-gray-500">
                                {formatDate(activity.date)}
                              </Typography>
                            </div>
                            <Typography variant="paragraph" className="font-light text-gray-700 mb-3">
                              {activity.description}
                            </Typography>

                            {activity.link && (
                              <a
                                href={activity.link}
                                className="inline-flex items-center gap-1 text-sm font-medium text-[#A67B5B] hover:text-[#8B5A2B] transition-colors duration-300"
                              >
                                Voir les détails
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Load more button */}
                    <div className="mt-6 text-center">
                      <Button
                        variant="outlined"
                        className="border-gray-300 text-gray-700 hover:border-gray-400 transition-all duration-300 shadow-none normal-case font-light tracking-wider px-6"
                      >
                        Voir plus d'activités
                      </Button>
                    </div>
                  </div>
                )}

                {/* Roles - Only show when not in activity tab */}
                {activeTab !== 'activity' && (
                  <div className="bg-white border border-gray-100 p-8 rounded-sm shadow-sm mt-8 transition-all duration-300 hover:shadow-md">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-[#F5F2EE] flex items-center justify-center">
                        <UserGroupIcon className="h-4 w-4 text-[#A67B5B]" />
                      </div>
                      <Typography variant="h6" className="font-light tracking-wide text-gray-800">
                        Rôles et permissions
                      </Typography>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {clientData.roles && clientData.roles.map((role, index) => (
                        <Tooltip key={index} content={role === 'client' ? "Compte client standard" : `Rôle: ${role}`}>
                          <span
                            className={`px-4 py-1.5 text-xs font-light tracking-wider rounded-sm border transition-all duration-300 ${
                              role === 'client'
                                ? 'text-[#A67B5B] bg-[#F5F2EE] border-[#A67B5B]/10 hover:bg-[#A67B5B]/20'
                                : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'
                            } cursor-default`}
                          >
                            {role}
                          </span>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card className="p-6">
                <Typography color="blue-gray" className="font-normal text-center mb-4">
                  {isAuthenticated ?
                    "Impossible de charger votre profil. Veuillez réessayer ou contacter le support." :
                    "Veuillez vous connecter pour voir votre profil."}
                </Typography>
                <div className="flex justify-center">
                  <Button
                    color="blue"
                    onClick={() => {
                      if (keycloak && typeof keycloak.login === 'function') {
                        keycloak.login({ redirectUri: window.location.href });
                      }
                    }}
                  >
                    {isAuthenticated ? "Rafraîchir la session" : "Se connecter"}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

export default Profile;
