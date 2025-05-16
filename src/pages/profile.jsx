import React, { useState, useEffect, useRef } from "react";
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
          const userResponse = await axios.get(`${import.meta.env.VITE_API_URL || 'https://laravel-api.fly.dev/api'}/auth/user`, authHeader);

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
        const response = await axios.get(`${import.meta.env.VITE_API_URL || 'https://laravel-api.fly.dev/api'}/clients/${clientId}`, authHeader);
        setClientData(response.data);

        // Set loading to false
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif">
      <section className="relative block h-[40vh] overflow-hidden">
        <div className="absolute top-0 h-full w-full bg-gradient-to-r from-[#A67B5B]/40 to-[#A67B5B]/10" />
        <div className="absolute bottom-0 h-32 w-full bg-gradient-to-t from-white to-transparent"></div>

        {/* Page title */}
        <div className="absolute bottom-20 left-0 w-full text-center">
          <h1 className="text-white text-3xl md:text-4xl font-light tracking-wider drop-shadow-md">
            Votre Profil
          </h1>
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
              <Card className="p-6">
                <Typography variant="h4" color="blue-gray" className="mb-4">
                  Profil de {clientData.name || clientData.prenom + ' ' + clientData.nom || 'Utilisateur'}
                </Typography>
                <Typography color="blue-gray" className="font-normal">
                  Votre profil a été chargé avec succès.
                </Typography>
              </Card>
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
