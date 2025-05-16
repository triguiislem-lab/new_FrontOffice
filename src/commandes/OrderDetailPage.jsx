import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import orderService from '../Services/order.service';
import LoadingSpinner from '../Components/LoadingSpinner';
import DynamicButton from '../Components/DynamicButton';
import BackButton from '../Components/BackButton';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch order details when component mounts
  useEffect(() => {
    const fetchOrderDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await orderService.getOrder(id);

        if (response.status === 'error') {
          setError(response.message);
          setOrder(null);
        } else {
          // Check if the user has permission to view this order
          if (!isAuthenticated) {
            setError("Vous devez être connecté pour voir les détails de cette commande.");
            setOrder(null);
          } else if (user?.isAdmin === false && response.user_id && user?.id && response.user_id !== user.id) {
            // Only restrict access if we're sure the user is not an admin and the order belongs to someone else
            setError("Vous n'avez pas l'autorisation de voir cette commande.");
            setOrder(null);
          } else {
            // Get products from the response
            let products = [];

            // Check all possible locations for products
            if (Array.isArray(response.produits)) {
              products = response.produits;
            } else if (Array.isArray(response.products)) {
              products = response.products;
            } else if (response.items && Array.isArray(response.items)) {
              products = response.items;
            } else if (response.ligne_commandes && Array.isArray(response.ligne_commandes)) {
              products = response.ligne_commandes;
            } else {
              // Try to look for products in nested objects
              const nestedKeys = Object.keys(response).filter(key =>
                typeof response[key] === 'object' && response[key] !== null);

              for (const key of nestedKeys) {
                const nestedObj = response[key];
                if (Array.isArray(nestedObj.produits) && nestedObj.produits.length > 0) {
                  products = nestedObj.produits;
                  break;
                } else if (Array.isArray(nestedObj.products) && nestedObj.products.length > 0) {
                  products = nestedObj.products;
                  break;
                }
              }

              if (products.length === 0) {
                try {
                  const orderProducts = await orderService.getOrderProducts(id);
                  if (orderProducts && orderProducts.length > 0) {
                    products = orderProducts;
                  } else {
                    products = [];
                  }
                } catch (productError) {
                  products = [];
                }
              }
            }

            // Process each product to ensure it has the required properties
            const processedProducts = products.map((product, index) => {
              // Extract product data, handling different API response formats
              const productId = product.id || product.product_id || product.produit_id || index;
              const productName = product.nom || product.name || product.nom_produit || 'Produit';

              // Handle different ways the price and quantity might be stored
              // First check if there's a pivot object with price and quantity
              let price = 0;
              let quantity = 1;
              let pivotData = {};

              if (product.pivot) {
                pivotData = { ...product.pivot }; // Create a copy to avoid reference issues

                // Check for price in pivot - handle both number and string formats
                if (pivotData.prix_unitaire !== undefined || pivotData.price !== undefined) {
                  // Convert string values to numbers for calculations
                  if (typeof pivotData.prix_unitaire === 'string') {
                    price = parseFloat(pivotData.prix_unitaire);
                  } else if (typeof pivotData.prix_unitaire === 'number') {
                    price = pivotData.prix_unitaire;
                  } else if (typeof pivotData.price === 'string') {
                    price = parseFloat(pivotData.price);
                  } else if (typeof pivotData.price === 'number') {
                    price = pivotData.price;
                  } else {
                    price = 0;
                  }
                }

                // Check for quantity in pivot - handle both number and string formats
                if (pivotData.quantite !== undefined || pivotData.quantity !== undefined) {
                  // Convert string values to numbers for calculations
                  if (typeof pivotData.quantite === 'string') {
                    quantity = parseInt(pivotData.quantite);
                  } else if (typeof pivotData.quantite === 'number') {
                    quantity = pivotData.quantite;
                  } else if (typeof pivotData.quantity === 'string') {
                    quantity = parseInt(pivotData.quantity);
                  } else if (typeof pivotData.quantity === 'number') {
                    quantity = pivotData.quantity;
                  } else {
                    quantity = 1;
                  }
                }
              }

              // If price or quantity wasn't found in pivot, check direct properties
              if (price === 0) {
                // Check all possible price fields
                const priceData = product.prix_unitaire || product.prix || product.price || product.prix_produit || 0;

                // Convert string values to numbers for calculations
                if (typeof priceData === 'string') {
                  price = parseFloat(priceData);
                } else if (typeof priceData === 'number') {
                  price = priceData;
                } else {
                  price = 0;
                }
              }

              if (quantity === 1) {
                // Check all possible quantity fields
                const quantityData = product.quantite || product.quantity || product.quantite_produit || 1;

                // Convert string values to numbers for calculations
                if (typeof quantityData === 'string') {
                  quantity = parseInt(quantityData);
                } else if (typeof quantityData === 'number') {
                  quantity = quantityData;
                } else {
                  quantity = 1;
                }
              }

              // Create a properly formatted product object with a guaranteed pivot object
              const processedProduct = {
                id: productId,
                nom: productName,
                description: product.description || '',
                prix: price,
                prix_unitaire: price, // Add this field for compatibility
                quantite: quantity,   // Add this field for compatibility
                pivot: {
                  commande_id: pivotData.commande_id || response.id,
                  produit_id: productId,
                  prix_unitaire: price,
                  quantite: quantity
                },
                // Keep original data but ensure it doesn't override our processed fields
                ...product,
                // Override these fields again to ensure they have our processed values
                id: productId,
                nom: productName,
                prix: price
              };

              return processedProduct;
            });

            // Calculate the total from the products if not provided in the response
            let calculatedTotal = 0;
            processedProducts.forEach(product => {
              const price = product.pivot.prix_unitaire;
              const quantity = product.pivot.quantite;
              calculatedTotal += price * quantity;
            });

            // Get discount rates
            const orderRemise = typeof response.remise_commande === 'number' ?
                              response.remise_commande :
                              parseFloat(response.remise_commande || response.remise || 0);

            const clientRemise = typeof response.client_remise === 'number' ?
                               response.client_remise :
                               parseFloat(response.client_remise ||
                                         (response.user && response.user.remise_personnelle ?
                                          response.user.remise_personnelle : 0));

            // Use the higher discount rate
            const effectiveRemise = Math.max(orderRemise, clientRemise);

            // Calculate discount amount
            const remiseAmount = (calculatedTotal * effectiveRemise) / 100;

            // Calculate final total
            const finalTotal = calculatedTotal - remiseAmount;

            // Process the order data to ensure it has all required properties
            const processedOrder = {
              ...response,
              // Use the processed products
              produits: processedProducts,
              // Ensure user data is available
              user: response.user || { name: 'Client', id: response.user_id },
              // Ensure created_at is available
              created_at: response.created_at || response.date_creation || new Date().toISOString(),
              // Ensure total_commande is available - use calculated total if not provided
              total_commande: response.total_commande || response.total || finalTotal || 0,
              // Ensure remise_commande is available
              remise_commande: orderRemise,
              // Include client_remise
              client_remise: clientRemise,
              // Include effective remise
              effective_remise: effectiveRemise,
              // Include calculated values
              sous_total: calculatedTotal,
              remise_montant: remiseAmount,
              total_final: finalTotal
            };

            setOrder(processedOrder);
          }
        }
      } catch (err) {
        setError('Erreur lors du chargement des détails de la commande. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, isAuthenticated, user]);

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

  // Handle order deletion
  const handleDeleteOrder = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleteLoading(true);

    try {
      const response = await orderService.deleteOrder(id);

      if (response.status === 'error') {
        setError(response.message);
      } else {
        // Redirect to orders list after successful deletion
        navigate('/commandes', {
          state: { message: 'Commande supprimée avec succès' }
        });
      }
    } catch (err) {
      setError('Erreur lors de la suppression de la commande. Veuillez réessayer.');

    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" variant="elegant" color="#A67B5B" />
          <p className="mt-4 text-gray-600">Chargement des détails de la commande...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <BackButton
              variant="outline"
              size="sm"
              label="Retour"
              to="/commandes"
              className="inline-block mx-auto px-4 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    );
  }

  // Render when no order is found
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-medium text-gray-900 mb-4">Commande introuvable</h2>
            <p className="text-gray-600 mb-6">La commande que vous recherchez n'existe pas ou a été supprimée.</p>
            <BackButton
              variant="filled"
              size="sm"
              label="Retour"
              to="/commandes"
              className="inline-block mx-auto px-4 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-light tracking-wider text-gray-900 mb-2">
              Commande #{order.id}
            </h1>
            <p className="text-gray-600">
              Passée le {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex space-x-4">
            <BackButton
              variant="default"
              size="sm"
              label="Retour"
              to="/commandes"
              className="mr-2 px-4 py-2 text-sm"
            />
            {user && (user.isAdmin || order.user_id === user.id) && (
              <button
                onClick={handleDeleteOrder}
                disabled={deleteLoading}
                className={`px-4 py-2 rounded-md ${
                  deleteConfirm
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                } transition-colors`}
              >
                {deleteLoading ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="xs" variant="circle" color="#FFFFFF" className="mr-2" />
                    Suppression...
                  </span>
                ) : deleteConfirm ? (
                  'Confirmer la suppression'
                ) : (
                  'Supprimer la commande'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Order information */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-xl font-medium text-gray-800">Informations de la commande</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Informations client
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-800">
                    <span className="font-medium">Nom:</span> {order.user?.name || 'Non spécifié'}
                  </p>
                  <p className="text-gray-800">
                    <span className="font-medium">Email:</span> {order.email_commande}
                  </p>
                  <p className="text-gray-800">
                    <span className="font-medium">Téléphone:</span> {order.telephone_commande}
                  </p>
                  <p className="text-gray-800">
                    <span className="font-medium">Type de client:</span> {order.user?.type_client || 'Normal'}
                  </p>
                  <p className="text-gray-800">
                    <span className="font-medium">Remise personnelle:</span> {order.user?.remise_personnelle ? `${order.user.remise_personnelle}%` : 'Aucune'}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Adresse de livraison
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-800">{order.adresse_commande}</p>
                  <p className="text-gray-800">{order.code_postal_commande} {order.ville_commande}</p>
                </div>
              </div>
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
                    const productId = produit.id;
                    let productName = produit.nom || produit.nom_produit || produit.name || 'Produit';

                    // If the product name is a dummy product, make it more user-friendly
                    if (productName.includes('Produit de la commande') || productName === 'Produit') {
                      productName = 'Article de la commande';
                    }

                    // Get price and quantity, checking multiple possible locations
                    // First try pivot object, then direct properties
                    let price = 0;
                    let quantity = 1;

                    // Check pivot first (this should always be present after our processing)
                    if (produit.pivot && (produit.pivot.prix_unitaire !== undefined || produit.pivot.price !== undefined)) {
                      price = typeof produit.pivot.prix_unitaire === 'number' ?
                        produit.pivot.prix_unitaire :
                        (typeof produit.pivot.price === 'number' ?
                          produit.pivot.price :
                          parseFloat(produit.pivot.prix_unitaire || produit.pivot.price || 0));

                      quantity = typeof produit.pivot.quantite === 'number' ?
                        produit.pivot.quantite :
                        (typeof produit.pivot.quantity === 'number' ?
                          produit.pivot.quantity :
                          parseFloat(produit.pivot.quantite || produit.pivot.quantity || 1));
                    }

                    // If price is still 0, check direct properties
                    if (price === 0) {
                      const priceData = produit.prix_unitaire || produit.prix || produit.price || produit.prix_produit || 0;
                      price = typeof priceData === 'number' ? priceData : parseFloat(priceData || 0);
                    }

                    // If quantity is still 1, check direct properties
                    if (quantity === 1 && (produit.quantite !== undefined || produit.quantity !== undefined)) {
                      const quantityData = produit.quantite || produit.quantity || produit.quantite_produit || 1;
                      quantity = typeof quantityData === 'number' ? quantityData : parseFloat(quantityData || 1);
                    }

                    // Calculate total
                    const total = price * quantity;

                    return (
                      <tr key={`product-${productId}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {productName}
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
                      Aucun produit trouvé dans cette commande.
                      <br />
                      <span className="text-sm text-gray-400 mt-2 block">
                        Il peut s'agir d'un problème de format de données ou d'une commande vide.
                      </span>
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
              {/* Use pre-calculated values from the order object */}
              {(() => {
                // Use the pre-calculated values from the order object
                const subtotal = order.sous_total || 0;
                const orderRemise = order.remise_commande || 0;
                const clientRemise = order.client_remise || 0;
                const effectiveRemise = order.effective_remise || 0;
                const remiseAmount = order.remise_montant || 0;
                const finalTotal = order.total_final || 0;

                // Determine which discount is being applied for display purposes
                const discountSource = orderRemise > clientRemise ?
                                     'commande' :
                                     (clientRemise > 0 ? 'client' : 'aucune');

                return (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sous-total:</span>
                      <span className="text-gray-800 font-medium">
                        {subtotal.toFixed(2)} DT
                      </span>
                    </div>

                    {/* Show client's personal discount if available */}
                    {clientRemise > 0 && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Remise personnelle client:</span>
                        <span>{clientRemise.toFixed(2)}%</span>
                      </div>
                    )}

                    {/* Show order-specific discount if available */}
                    {orderRemise > 0 && (
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Remise spécifique commande:</span>
                        <span>{orderRemise.toFixed(2)}%</span>
                      </div>
                    )}

                    {/* Show effective discount being applied */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Remise appliquée ({effectiveRemise.toFixed(2)}%):
                        {discountSource === 'client' && (
                          <span className="ml-1 text-xs text-green-600">(remise client)</span>
                        )}
                        {discountSource === 'commande' && (
                          <span className="ml-1 text-xs text-blue-600">(remise commande)</span>
                        )}
                      </span>
                      <span className="text-gray-800 font-medium">
                        {remiseAmount.toFixed(2)} DT
                      </span>
                    </div>

                    <div className="flex justify-between border-t border-gray-200 pt-4">
                      <span className="text-gray-800 font-medium">Total:</span>
                      <span className="text-gray-900 font-bold text-xl">
                        {finalTotal.toFixed(2)} DT
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

export default OrderDetailPage;
