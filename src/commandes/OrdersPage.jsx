import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import orderService from '../Services/order.service';
import LoadingSpinner from '../Components/LoadingSpinner';
import DynamicButton from '../Components/DynamicButton';

const OrdersPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    user_id: '',
    date_debut: '',
    date_fin: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);


  // State for detailed orders
  const [detailedOrders, setDetailedOrders] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch orders when component mounts or filters change
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        // If user is not authenticated, show error
        if (!isAuthenticated || !user) {
          setError('Vous devez être connecté pour voir vos commandes.');
          setOrders([]);
          setLoading(false);
          return;
        }

        // Always filter by the connected user's ID
        const filterParams = {
          ...filters,
          user_id: user.id
        };

        // Remove empty filters
        Object.keys(filterParams).forEach(key => {
          if (!filterParams[key]) {
            delete filterParams[key];
          }
        });

        const response = await orderService.getOrders(filterParams);

        if (response.status === 'error') {
          setError(response.message);
          setOrders([]);
        } else {
          // Ensure we have an array of orders
          let ordersList = [];
          if (Array.isArray(response)) {
            ordersList = response;
          } else if (response && typeof response === 'object') {
            // If it's a single order object, wrap it in an array
            ordersList = [response];
          } else {
            setError('Format de réponse inattendu. Veuillez réessayer.');
            setOrders([]);
            setLoading(false);
            return;
          }

          setOrders(ordersList);

          // Now fetch detailed information for each order
          await fetchOrderDetails(ordersList);
        }
      } catch (err) {
        setError('Erreur lors du chargement des commandes. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filters, isAuthenticated, user]);

  // Function to fetch detailed information for each order
  const fetchOrderDetails = async (ordersList) => {
    if (!ordersList || ordersList.length === 0) {
      setDetailedOrders([]);
      return;
    }

    setLoadingDetails(true);

    try {
      const detailedOrdersPromises = ordersList.map(async (order) => {
        if (!order.id) {
          return order;
        }

        try {
          const detailedOrder = await orderService.getOrderById(order.id);

          if (detailedOrder.error) {
            return order;
          }

          return detailedOrder;
        } catch (detailError) {
          return order;
        }
      });

      const detailedOrdersResults = await Promise.all(detailedOrdersPromises);
      setDetailedOrders(detailedOrdersResults);
    } catch (error) {
      // Silently handle error
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      user_id: '',
      date_debut: '',
      date_fin: ''
    });
  };

  // Manual refresh function
  const refreshOrders = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // If user is not an admin, only show their own orders
      const filterParams = { ...filters };
      if (isAuthenticated && user && !user.isAdmin) {
        filterParams.user_id = user.id;
      }

      // Remove empty filters
      Object.keys(filterParams).forEach(key => {
        if (!filterParams[key]) {
          delete filterParams[key];
        }
      });

      // Add a timestamp to force a fresh request
      filterParams._t = new Date().getTime();

      const response = await orderService.getOrders(filterParams);

      if (response.status === 'error') {
        setError(response.message);
        setOrders([]);
      } else {
        // Ensure we have an array of orders
        if (Array.isArray(response)) {
          setOrders(response);
        } else if (response && typeof response === 'object') {
          // If it's a single order object, wrap it in an array
          setOrders([response]);
        } else {
          setOrders([]);
          setError('Format de réponse inattendu. Veuillez réessayer.');
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des commandes. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Navigate to order details
  const viewOrderDetails = (orderId) => {
    if (!orderId) {
      alert('Impossible d\'afficher les détails de cette commande: ID manquant');
      return;
    }
    navigate(`/commandes/${orderId}`);
  };

  // Handle order deletion
  const handleDeleteOrder = async (orderId) => {
    if (!orderId) {
      return;
    }

    // If deleteConfirm is not set to this order ID, set it to request confirmation
    if (deleteConfirm !== orderId) {
      setDeleteConfirm(orderId);
      return;
    }

    // If we get here, the user has confirmed deletion
    setDeleteLoading(true);

    try {
      const response = await orderService.deleteOrder(orderId);

      if (response.status === 'error') {
        setError(response.message || 'Erreur lors de la suppression de la commande');
        setSuccess(null);
      } else {
        // Refresh the orders list after successful deletion
        await refreshOrders();
        // Reset the confirmation state
        setDeleteConfirm(null);
        // Set success message
        setSuccess('La commande a été supprimée avec succès');
        // Clear error message if any
        setError(null);
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 5000);
      }
    } catch (err) {
      setError('Erreur lors de la suppression de la commande. Veuillez réessayer.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" variant="elegant" color="#A67B5B" />
          <p className="mt-4 text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  // Helper function to extract order ID from different possible structures
  const getOrderId = (order) => {
    if (order.id) return order.id;
    if (order.data && order.data.id) return order.data.id;
    return null;
  };

  // Helper function to extract order email from different possible structures
  const getOrderEmail = (order) => {
    if (order.email_commande) return order.email_commande;
    if (order.email) return order.email;
    if (order.data) {
      if (order.data.email_commande) return order.data.email_commande;
      if (order.data.email) return order.data.email;
    }
    return '-';
  };

  // Helper function to extract order date from different possible structures
  const getOrderDate = (order) => {
    if (order.created_at) return order.created_at;
    if (order.data && order.data.created_at) return order.data.created_at;
    return null;
  };

  // Helper function to extract order total from different possible structures
  const getOrderTotal = (order) => {
    // First, try to calculate the total from products if available
    const products = order.produits || (order.data && order.data.produits);
    if (products && Array.isArray(products) && products.length > 0) {
      let calculatedTotal = 0;

      products.forEach(product => {
        const quantity = product.quantite ||
                        (product.pivot && product.pivot.quantite) || 1;

        const price = product.prix_unitaire ||
                     (product.pivot && product.pivot.prix_unitaire) ||
                     product.prix || 0;

        // Parse the values to ensure they're numbers
        const numQuantity = typeof quantity === 'number' ? quantity : parseFloat(quantity);
        const numPrice = typeof price === 'number' ? price : parseFloat(price);

        if (!isNaN(numQuantity) && !isNaN(numPrice)) {
          calculatedTotal += numQuantity * numPrice;
        }
      });

      if (calculatedTotal > 0) {
        return calculatedTotal.toFixed(2) + ' DT';
      }
    }

    // If we couldn't calculate from products, check for total_commande
    const totalCommande = order.total_commande || (order.data && order.data.total_commande);
    if (typeof totalCommande === 'number') return totalCommande.toFixed(2) + ' DT';
    if (totalCommande && parseFloat(totalCommande) > 0) return parseFloat(totalCommande).toFixed(2) + ' DT';

    // Check for total
    const total = order.total || (order.data && order.data.total);
    if (typeof total === 'number') return total.toFixed(2) + ' DT';
    if (total && parseFloat(total) > 0) return parseFloat(total).toFixed(2) + ' DT';

    // Check for sous_total
    const sousTotal = order.sous_total || (order.data && order.data.sous_total);
    if (typeof sousTotal === 'number') return sousTotal.toFixed(2) + ' DT';
    if (sousTotal && parseFloat(sousTotal) > 0) return parseFloat(sousTotal).toFixed(2) + ' DT';

    return '0.00 DT';
  };

  // Helper function to extract order status from different possible structures
  const getOrderStatus = (order) => {
    // Check for status_label first (formatted status)
    const statusLabel = order.status_label || (order.data && order.data.status_label);
    if (statusLabel) return statusLabel;

    // Check for status
    const status = order.status || (order.data && order.data.status);
    if (!status) return '-';

    // Format the status
    switch(status.toLowerCase()) {
      case 'en_attente':
        return 'En attente';
      case 'en_cours':
        return 'En cours';
      case 'expediee':
        return 'Expédiée';
      case 'livree':
        return 'Livrée';
      case 'annulee':
        return 'Annulée';
      default:
        return status;
    }
  };

  // Helper function to get status color class
  const getStatusColorClass = (order) => {
    const status = order.status || (order.data && order.data.status) || '';

    switch(status.toLowerCase()) {
      case 'en_attente':
        return 'text-yellow-600';
      case 'en_cours':
        return 'text-blue-600';
      case 'expediee':
        return 'text-purple-600';
      case 'livree':
        return 'text-green-600';
      case 'annulee':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Helper function to check if an order has 'en_attente' status
  const isOrderPending = (order) => {
    const status = order.status || (order.data && order.data.status) || '';
    return status.toLowerCase() === 'en_attente';
  };

  // Helper function to extract order discount from different possible structures
  const getOrderDiscount = (order) => {
    // Check for remise_commande
    const remiseCommande = order.remise_commande !== undefined ?
      parseFloat(order.remise_commande) :
      (order.data && order.data.remise_commande !== undefined ?
        parseFloat(order.data.remise_commande) : NaN);

    // Check for remise
    const remise = order.remise !== undefined ?
      parseFloat(order.remise) :
      (order.data && order.data.remise !== undefined ?
        parseFloat(order.data.remise) : NaN);

    // Check for client_remise
    const clientRemise = order.client_remise !== undefined ?
      parseFloat(order.client_remise) :
      (order.data && order.data.client_remise !== undefined ?
        parseFloat(order.data.client_remise) : NaN);

    // Return formatted discount
    if (!isNaN(remiseCommande) && remiseCommande > 0) {
      return remiseCommande.toFixed(2) + '%';
    } else if (!isNaN(remise) && remise > 0) {
      return remise.toFixed(2) + '%';
    } else if (!isNaN(clientRemise) && clientRemise > 0) {
      return clientRemise.toFixed(2) + '%';
    }

    // If we have products, try to calculate the discount
    const products = order.produits || (order.data && order.data.produits);
    if (products && Array.isArray(products) && products.length > 0) {
      // Calculate the total before discount
      let totalBeforeDiscount = 0;

      products.forEach(product => {
        const quantity = product.quantite ||
                        (product.pivot && product.pivot.quantite) || 1;

        const price = product.prix_unitaire ||
                     (product.pivot && product.pivot.prix_unitaire) ||
                     product.prix || 0;

        // Parse the values to ensure they're numbers
        const numQuantity = typeof quantity === 'number' ? quantity : parseFloat(quantity);
        const numPrice = typeof price === 'number' ? price : parseFloat(price);

        if (!isNaN(numQuantity) && !isNaN(numPrice)) {
          totalBeforeDiscount += numQuantity * numPrice;
        }
      });

      // Get the final total
      const finalTotal = parseFloat(order.total_commande || order.total ||
                                   (order.data && (order.data.total_commande || order.data.total)) || 0);

      // If the final total is less than the calculated total, there's a discount
      if (totalBeforeDiscount > 0 && finalTotal > 0 && finalTotal < totalBeforeDiscount) {
        const discountAmount = totalBeforeDiscount - finalTotal;
        const discountPercentage = (discountAmount / totalBeforeDiscount) * 100;

        if (discountPercentage > 0) {
          return discountPercentage.toFixed(2) + '%';
        }
      }
    }

    // If user has remise_personnelle, show that
    if (order.user && order.user.remise_personnelle) {
      const userRemise = parseFloat(order.user.remise_personnelle);
      if (!isNaN(userRemise) && userRemise > 0) {
        return userRemise.toFixed(2) + '% (client)';
      }
    } else if (order.data && order.data.user && order.data.user.remise_personnelle) {
      const userRemise = parseFloat(order.data.user.remise_personnelle);
      if (!isNaN(userRemise) && userRemise > 0) {
        return userRemise.toFixed(2) + '% (client)';
      }
    }

    return '-';
  };

  // Determine which orders to display
  const displayOrders = detailedOrders.length > 0 ? detailedOrders : orders;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-light tracking-wider text-gray-900 mb-4">
            Gestion des Commandes
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Consultez et gérez toutes vos commandes. Vous pouvez filtrer les résultats par date ou par client.
          </p>


        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Filtres</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isAuthenticated && user && user.isAdmin && (
              <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Client
                </label>
                <input
                  type="text"
                  id="user_id"
                  name="user_id"
                  value={filters.user_id}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#A67B5B] focus:border-[#A67B5B]"
                  placeholder="ID du client"
                />
              </div>
            )}
            <div>
              <label htmlFor="date_debut" className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                id="date_debut"
                name="date_debut"
                value={filters.date_debut}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#A67B5B] focus:border-[#A67B5B]"
              />
            </div>
            <div>
              <label htmlFor="date_fin" className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                id="date_fin"
                name="date_fin"
                value={filters.date_fin}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#A67B5B] focus:border-[#A67B5B]"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between">
            <button
              onClick={refreshOrders}
              className="px-4 py-2 bg-[#A67B5B] text-white rounded-md hover:bg-[#8B5A2B] transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualiser
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders list */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loadingDetails && (
            <div className="p-4 bg-yellow-50 border-b border-yellow-100">
              <div className="flex items-center">
                <div className="mr-3">
                  <LoadingSpinner size="sm" variant="elegant" color="#A67B5B" />
                </div>
                <p className="text-sm text-yellow-700">
                  Chargement des détails des commandes...
                </p>
              </div>
            </div>
          )}
          {displayOrders.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune commande trouvée</h3>
              <p className="text-gray-500 mb-4">
                {isAuthenticated && user && !user.isAdmin ? (
                  "Vous n'avez pas encore passé de commande. Parcourez notre catalogue pour trouver des produits qui vous intéressent."
                ) : (
                  "Aucune commande ne correspond aux critères de recherche. Essayez de modifier les filtres ou de vérifier la connexion à l'API."
                )}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                <DynamicButton
                  label="Retour à l'accueil"
                  to="/home"
                  className="inline-block"
                />
                {isAuthenticated && user && !user.isAdmin && (
                  <DynamicButton
                    label="Parcourir le catalogue"
                    to="/produits"
                    className="inline-block"
                    variant="outline"
                  />
                )}
              </div>

              {/* Technical note for developers */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg max-w-lg mx-auto">
                <p className="text-xs text-gray-500 font-mono">
                  Note technique: Si vous venez de passer une commande et qu'elle n'apparaît pas ici,
                  il peut y avoir un problème avec l'API. Vérifiez la console pour plus de détails.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr key="header-row">
                    <th key="header-id" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th key="header-client" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th key="header-date" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th key="header-total" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th key="header-remise" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remise
                    </th>
                    <th key="header-status" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th key="header-actions" scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayOrders.map((order, index) => (
                    <tr key={getOrderId(order) || `order-${index}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getOrderId(order) || `#${index + 1}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getOrderEmail(order)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(getOrderDate(order))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {(() => {
                          // Check if we need to calculate the total from products
                          const products = order.produits || (order.data && order.data.produits);
                          const totalCommande = order.total_commande || (order.data && order.data.total_commande);
                          const total = order.total || (order.data && order.data.total);

                          const hasZeroTotal =
                            (totalCommande === "0.00" || parseFloat(totalCommande) === 0) &&
                            (total === "0.00" || parseFloat(total) === 0);

                          const hasProducts = products && Array.isArray(products) && products.length > 0;

                          if (hasZeroTotal && hasProducts) {
                            // Show calculated total with an indicator
                            return (
                              <div>
                                {getOrderTotal(order)}
                                <span className="text-xs text-green-600 block">
                                  (calculé)
                                </span>
                              </div>
                            );
                          } else {
                            return getOrderTotal(order);
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          // Check if we need to show a calculated discount
                          const remiseCommande = order.remise_commande !== undefined ?
                            parseFloat(order.remise_commande) :
                            (order.data && order.data.remise_commande !== undefined ?
                              parseFloat(order.data.remise_commande) : NaN);

                          const remise = order.remise !== undefined ?
                            parseFloat(order.remise) :
                            (order.data && order.data.remise !== undefined ?
                              parseFloat(order.data.remise) : NaN);

                          const hasZeroDiscount =
                            (isNaN(remiseCommande) || remiseCommande === 0) &&
                            (isNaN(remise) || remise === 0);

                          const discount = getOrderDiscount(order);

                          if (hasZeroDiscount && discount !== '-') {
                            // Show calculated discount with an indicator
                            return (
                              <div>
                                {discount}
                                <span className="text-xs text-green-600 block">
                                  (calculé)
                                </span>
                              </div>
                            );
                          } else {
                            return discount;
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`${getStatusColorClass(order)} font-medium`}>
                          {getOrderStatus(order)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              const orderId = getOrderId(order);
                              viewOrderDetails(orderId);
                            }}
                            className="text-[#A67B5B] hover:text-[#8B5A2B] transition-colors"
                            disabled={!getOrderId(order)}
                          >
                            Détails
                          </button>

                          {isOrderPending(order) && (
                            <button
                              onClick={() => handleDeleteOrder(getOrderId(order))}
                              className={`${
                                deleteConfirm === getOrderId(order)
                                  ? 'bg-red-600 text-white px-2 py-1 rounded'
                                  : 'text-red-600 hover:text-red-800'
                              } transition-colors ${deleteLoading && deleteConfirm === getOrderId(order) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              disabled={deleteLoading && deleteConfirm === getOrderId(order)}
                            >
                              {deleteLoading && deleteConfirm === getOrderId(order) ? (
                                <span className="flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Suppression...
                                </span>
                              ) : deleteConfirm === getOrderId(order) ? (
                                'Confirmer'
                              ) : (
                                'Supprimer'
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
