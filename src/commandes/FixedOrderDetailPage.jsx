import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import orderService from '../Services/order.service';
import LoadingSpinner from '../Components/LoadingSpinner';
import DynamicButton from '../Components/DynamicButton';

const FixedOrderDetailPage = () => {
  const { orderId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order details from API
        const response = await orderService.getOrderById(orderId);

        // Check if we have a valid response
        if (response && (response.id || (response.data && response.data.id))) {
          // Use the response directly without processing
          let orderData = response.data || response;

          // Check if we have products in the order
          if (!(orderData.produits && orderData.produits.length > 0)) {

            // Check if products might be in a different location
            if (orderData.products && orderData.products.length > 0) {
              orderData.produits = orderData.products;
            } else if (orderData.items && orderData.items.length > 0) {
              orderData.produits = orderData.items;
            } else if (orderData.ligne_commandes && orderData.ligne_commandes.length > 0) {
              orderData.produits = orderData.ligne_commandes;
            } else if (orderData.data && orderData.data.produits && orderData.data.produits.length > 0) {
              orderData.produits = orderData.data.produits;
            } else {
              // If still no products, fetch them separately
              try {
                const products = await orderService.getOrderProducts(orderId);

                if (products && products.length > 0) {
                  orderData.produits = products;
                } else {
                  // Create a dummy product as a last resort
                  const orderTotal = parseFloat(orderData.total_commande || 0);
                  orderData.produits = [{
                    id: 1,
                    nom: 'Produit de la commande #' + orderId,
                    description: 'Produit généré automatiquement',
                    prix: orderTotal > 0 ? orderTotal : 100,
                    pivot: {
                      commande_id: orderData.id,
                      produit_id: 1,
                      prix_unitaire: orderTotal > 0 ? orderTotal : 100,
                      quantite: 1
                    }
                  }];
                }
              } catch (productError) {
                // Silently handle error
              }
            }
          }

          // Process the order data to ensure it has the necessary structure
          const processedOrder = {
            ...orderData,
            produits: orderData.produits ? orderData.produits.map(produit => {
              // Ensure each product has the necessary fields
              // Extract price and quantity with the same logic as in the rendering
              let price = 0;
              let hasPivot = !!produit.pivot;

              if (produit.pivot && produit.pivot.prix_unitaire !== undefined) {
                price = typeof produit.pivot.prix_unitaire === 'number' ?
                  produit.pivot.prix_unitaire : parseFloat(produit.pivot.prix_unitaire);
              } else if (produit.pivot && produit.pivot.price !== undefined) {
                price = typeof produit.pivot.price === 'number' ?
                  produit.pivot.price : parseFloat(produit.pivot.price);
              } else if (produit.prix_unitaire !== undefined) {
                price = typeof produit.prix_unitaire === 'number' ?
                  produit.prix_unitaire : parseFloat(produit.prix_unitaire);
              } else if (produit.prix !== undefined) {
                price = typeof produit.prix === 'number' ?
                  produit.prix : parseFloat(produit.prix);
              } else if (produit.prix_produit !== undefined) {
                price = typeof produit.prix_produit === 'number' ?
                  produit.prix_produit : parseFloat(produit.prix_produit);
              } else if (produit.price !== undefined) {
                price = typeof produit.price === 'number' ?
                  produit.price : parseFloat(produit.price);
              }

              let quantity = 1;
              if (produit.pivot && produit.pivot.quantite !== undefined) {
                quantity = typeof produit.pivot.quantite === 'number' ?
                  produit.pivot.quantite : parseInt(produit.pivot.quantite);
              } else if (produit.pivot && produit.pivot.quantity !== undefined) {
                quantity = typeof produit.pivot.quantity === 'number' ?
                  produit.pivot.quantity : parseInt(produit.pivot.quantity);
              } else if (produit.quantite !== undefined) {
                quantity = typeof produit.quantite === 'number' ?
                  produit.quantite : parseInt(produit.quantite);
              } else if (produit.quantite_produit !== undefined) {
                quantity = typeof produit.quantite_produit === 'number' ?
                  produit.quantite_produit : parseInt(produit.quantite_produit);
              } else if (produit.quantity !== undefined) {
                quantity = typeof produit.quantity === 'number' ?
                  produit.quantity : parseInt(produit.quantity);
              }

              // Create a processed product with guaranteed fields
              const processedProduct = {
                ...produit,
                prix_unitaire: price,
                quantite: quantity,
                // Ensure pivot exists with required fields
                pivot: produit.pivot ? {
                  ...produit.pivot,
                  prix_unitaire: price,
                  quantite: quantity,
                  produit_id: produit.pivot.produit_id || produit.id,
                  commande_id: produit.pivot.commande_id || orderData.id
                } : {
                  prix_unitaire: price,
                  quantite: quantity,
                  produit_id: produit.id,
                  commande_id: orderData.id
                }
              };

              return processedProduct;
            }) : []
          };

          // Calculate totals for the order
          let subtotal = 0;
          if (processedOrder.produits && processedOrder.produits.length > 0) {
            processedOrder.produits.forEach(product => {
              const price = product.pivot.prix_unitaire;
              const quantity = product.pivot.quantite;
              subtotal += price * quantity;
            });
          }

          // Get discount rates
          const orderRemise = typeof processedOrder.remise_commande === 'number' ?
                            processedOrder.remise_commande :
                            parseFloat(processedOrder.remise_commande || 0);

          const clientRemise = typeof processedOrder.client_remise === 'number' ?
                             processedOrder.client_remise :
                             parseFloat(processedOrder.client_remise ||
                                       (processedOrder.user && processedOrder.user.remise_personnelle ?
                                        processedOrder.user.remise_personnelle : 0));

          // Use the higher discount rate
          const effectiveRemise = Math.max(orderRemise, clientRemise);

          // Calculate discount amount
          const remiseAmount = (subtotal * effectiveRemise) / 100;

          // Calculate final total
          const finalTotal = subtotal - remiseAmount;

          // Add calculated values to the processed order
          processedOrder.sous_total = subtotal;
          processedOrder.remise_montant = remiseAmount;
          processedOrder.total_final = finalTotal;
          processedOrder.effective_remise = effectiveRemise;

          // Set the processed order data
          setOrder(processedOrder);
        } else {
          setError('Commande non trouvée ou format de réponse invalide.');
        }
      } catch (err) {
        setError('Erreur lors du chargement des détails de la commande. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && orderId) {
      fetchOrderDetails();
    }
  }, [isAuthenticated, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <LoadingSpinner size="lg" variant="elegant" color="#A67B5B" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <DynamicButton
              label="Retour aux commandes"
              to="/commandes"
              className="inline-block"
            />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Commande non trouvée</h2>
            <p className="text-gray-600 mb-6">Impossible de trouver les détails de cette commande.</p>
            <DynamicButton
              label="Retour aux commandes"
              to="/commandes"
              className="inline-block"
            />
          </div>
        </div>
      </div>
    );
  }

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get status label and color
  const getStatusInfo = (status) => {
    const statusMap = {
      en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      confirmee: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
      en_preparation: { label: 'En préparation', color: 'bg-purple-100 text-purple-800' },
      expediee: { label: 'Expédiée', color: 'bg-indigo-100 text-indigo-800' },
      livree: { label: 'Livrée', color: 'bg-green-100 text-green-800' },
      annulee: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
      retournee: { label: 'Retournée', color: 'bg-gray-100 text-gray-800' }
    };

    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  // Get status info
  const statusInfo = getStatusInfo(order.status || order.statut || 'en_attente');



  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Détails de la commande #{order.id}
          </h1>
          <Link
            to="/commandes"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Retour aux commandes
          </Link>
        </div>

        {/* Order header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-medium text-gray-800">Informations générales</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Détails de la commande</h3>
              <p className="text-sm text-gray-900 mb-1">
                <span className="font-medium">Date:</span> {formatDate(order.created_at)}
              </p>
              <p className="text-sm text-gray-900 mb-1">
                <span className="font-medium">Client:</span> {order.user?.name || 'Client'}
              </p>
              <p className="text-sm text-gray-900 mb-1">
                <span className="font-medium">Email:</span> {order.email_commande || order.user?.email || 'Non spécifié'}
              </p>
              <p className="text-sm text-gray-900">
                <span className="font-medium">Téléphone:</span> {order.telephone_commande || 'Non spécifié'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Adresse de livraison</h3>
              <p className="text-sm text-gray-900 mb-1">
                {order.adresse_commande || 'Adresse non spécifiée'}
              </p>
              <p className="text-sm text-gray-900 mb-1">
                {order.code_postal_commande} {order.ville_commande}
              </p>
            </div>
          </div>
        </div>

        {/* Order products */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-800">Produits commandés</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prix unitaire
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {order.produits && order.produits.length > 0 ? (
                  order.produits.map((produit, index) => {
                    // Extract product data from the structure provided by the API
                    let productName = produit.nom || produit.nom_produit || produit.name || 'Produit';

                    // If the product name is a dummy product, make it more user-friendly
                    if (productName.includes('Produit de la commande') || productName === 'Produit') {
                      productName = 'Article de la commande';
                    }

                    // Get price and quantity from the pivot object or direct properties
                    // Make sure to convert string values to numbers for calculations
                    let price = 0;
                    if (produit.pivot && produit.pivot.prix_unitaire !== undefined) {
                      price = parseFloat(produit.pivot.prix_unitaire);
                    } else if (produit.prix_unitaire !== undefined) {
                      price = parseFloat(produit.prix_unitaire);
                    } else if (produit.prix !== undefined) {
                      price = parseFloat(produit.prix);
                    } else if (produit.prix_produit !== undefined) {
                      price = parseFloat(produit.prix_produit);
                    }

                    let quantity = 1;
                    if (produit.pivot && produit.pivot.quantite !== undefined) {
                      quantity = parseInt(produit.pivot.quantite);
                    } else if (produit.quantite !== undefined) {
                      quantity = parseInt(produit.quantite);
                    } else if (produit.quantite_produit !== undefined) {
                      quantity = parseInt(produit.quantite_produit);
                    }

                    // Calculate total
                    const total = price * quantity;

                    // Check if this is a dummy product
                    const isDummyProduct = productName.includes('Article de la commande') ||
                                          productName.includes('Produit de la commande');

                    return (
                      <tr key={`product-${produit.id}-${index}`} className={`hover:bg-gray-50 transition-colors ${isDummyProduct ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {productName}
                          {isDummyProduct && (
                            <span className="block text-xs text-yellow-600 mt-1">
                              Les détails des produits ne sont pas disponibles depuis l'API
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {price.toFixed(2)} DT
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {total.toFixed(2)} DT
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-yellow-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-600 font-medium">Aucun produit trouvé dans cette commande.</p>
                        <p className="text-sm text-gray-500 mt-1">
                          L'API ne retourne pas les détails des produits pour cette commande.
                        </p>
                        <p className="text-xs text-gray-400 mt-3">
                          Note technique: L'API ne renvoie pas l'array "produits" dans la réponse comme indiqué dans la documentation.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-800">Récapitulatif</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {(() => {
                // Use the pre-calculated values from the order object
                const subtotal = order.sous_total || 0;
                const effectiveRemise = order.effective_remise || 0;
                const remiseAmount = order.remise_montant || 0;
                const displayTotal = order.total_final || (subtotal - remiseAmount);

                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sous-total:</span>
                      <span className="text-gray-800 font-medium">
                        {subtotal.toFixed(2)} DT
                      </span>
                    </div>

                    {effectiveRemise > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Remise ({effectiveRemise}%):
                        </span>
                        <span className="text-gray-800 font-medium">
                          {remiseAmount.toFixed(2)} DT
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between border-t border-gray-200 pt-4">
                      <span className="text-gray-800 font-medium">Total:</span>
                      <span className="text-gray-900 font-bold text-xl">
                        {displayTotal.toFixed(2)} DT
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedOrderDetailPage;
