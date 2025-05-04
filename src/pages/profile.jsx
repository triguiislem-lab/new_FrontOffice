import { useState, useEffect } from "react";
import { Avatar, Typography, Button, Card, CardBody, Spinner, Chip } from "@material-tailwind/react";
import {
  UserIcon,
  EnvelopeIcon,
  IdentificationIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "@/Contexts/AuthContext";
import axios from "axios";
import LoadingSpinner from "../Components/LoadingSpinner";

function Profile() {
  const { user, isAuthenticated, keycloak } = useAuth();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger a refresh

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
      <section className="relative block h-[45vh]">
        <div className="bg-profile-background absolute top-0 h-full w-full bg-[url('/img/background-3.png')] bg-cover bg-center scale-105 transition-transform duration-700" />
        <div className="absolute top-0 h-full w-full bg-gradient-to-r from-black/50 to-black/30" />
        <div className="absolute bottom-0 h-24 w-full bg-gradient-to-t from-white to-transparent"></div>
      </section>

      <section className="relative bg-[#FAFAFA] py-20">
        <div className="relative mb-6 -mt-40 flex w-full px-6 min-w-0 flex-col break-words">
          <div className="container mx-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" variant="circle" />
              </div>
            ) : error ? (
              <Card className="p-8 mb-6 border border-red-200 bg-white shadow-none">
                <div className="flex flex-col items-center">
                  <Typography color="red" className="font-light mb-6 text-center">
                    {error}
                  </Typography>
                  <Button
                    className="bg-[#A67B5B] hover:bg-[#8B5A2B] transition-colors duration-300 shadow-none normal-case font-light tracking-wider px-6"
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      setRefreshKey(prev => prev + 1); // Trigger a refresh
                    }}
                  >
                    Réessayer
                  </Button>
                </div>
              </Card>
            ) : clientData ? (
              <>
                {/* Profile Header */}
                <div className="flex flex-col lg:flex-row justify-between bg-white p-8 rounded-sm border border-gray-100 shadow-sm">
                  <div className="relative flex gap-8 items-start">
                    <div className="-mt-24 w-40">
                      <Avatar
                        src="/img/default-avatar.svg"
                        alt="Photo de profil"
                        variant="circular"
                        className="h-full w-full bg-white border-4 border-white shadow-md transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute -inset-1 rounded-full bg-white opacity-10 -z-10 blur-md"></div>
                    </div>
                    <div className="flex flex-col mt-2">
                      <Typography variant="h3" className="text-gray-800 font-light tracking-wide">
                        {clientData.name}
                      </Typography>
                      <Typography variant="paragraph" className="!mt-1 font-light text-gray-500 tracking-wide">
                        {clientData.email}
                      </Typography>
                      {clientData.partenaire && (
                        <div className="mt-3">
                          <span className="px-4 py-1.5 text-xs font-light tracking-wider text-[#A67B5B] bg-[#F5F2EE] rounded-sm border border-[#A67B5B]/10">
                            Partenaire
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 mb-10 flex lg:flex-col justify-between items-center lg:justify-end lg:mb-0 lg:px-4 flex-wrap lg:-mt-5">
                    <div className="flex justify-start py-4 pt-8 lg:pt-4">
                      {clientData.partenaire && (
                        <div className="p-3 text-center lg:mr-4">
                          <Typography
                            variant="h4"
                            className="font-light text-[#A67B5B]"
                          >
                            {clientData.partenaire.remise}%
                          </Typography>
                          <Typography
                            variant="small"
                            className="font-light text-gray-500 tracking-wide"
                          >
                            Remise partenaire
                          </Typography>
                        </div>
                      )}
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
                {clientData.partenaire && (
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

                {/* Roles */}
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
                      <span
                        key={index}
                        className={`px-4 py-1.5 text-xs font-light tracking-wider rounded-sm border ${
                          role === 'client'
                            ? 'text-[#A67B5B] bg-[#F5F2EE] border-[#A67B5B]/10'
                            : 'text-gray-600 bg-gray-50 border-gray-200'
                        }`}
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
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
