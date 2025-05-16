import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/Contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import axios from "axios";
import DynamicButton from "../Components/DynamicButton";
import BackButton from "../Components/BackButton";
import SimilarProducts from "./SimilarProducts";
import "../style/animations.css";
import LoadingSpinner from "../Components/LoadingSpinner";
import EnhancedLazyImage from "../Components/EnhancedLazyImage";
import apiService from "../utils/apiService";

// Custom CSS for animations
const customStyles = `
  @keyframes pulse-width {
    0% { width: 15%; }
    50% { width: 85%; }
    100% { width: 15%; }
  }

  .animate-pulse-width {
    animation: pulse-width 2s ease-in-out infinite;
  }
`;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();
  const mainImageRef = useRef(null);
  const [article, setArticle] = useState(null);
  const [marque, setMarque] = useState("");
  const [attributs, setAttributs] = useState([]);
  const [attributGroups, setAttributGroups] = useState({});
  const [attributCache, setAttributCache] = useState({});
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [variantes, setVariantes] = useState([]);
  const [selectedVariante, setSelectedVariante] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [productImages, setProductImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageTransition, setImageTransition] = useState(false);

  const isInStock = (item) => {
    return item && (item.quantite_produit > 0 || item.stock > 0);
  };

  const commonAttributeNames = {
    3: 'Couleur',
    4: 'Taille',
    5: 'Matériau',
    6: 'Dimensions',
    7: 'Fils au cm²',
    8: 'Entretien',
    9: 'Certification',
    10: 'Saison',
    11: 'Contenu du set',
    12: 'Empreinte carbone',
    13: 'Origine',
    14: 'Recyclable'
  };

  const fetchAttributeDetails = async (attributId) => {
    if (attributCache[attributId]) {
      return attributCache[attributId];
    }

    if (commonAttributeNames[attributId]) {
      const fallbackData = {
        id: attributId,
        nom: commonAttributeNames[attributId],
        attribut_id: attributId
      };
      setAttributCache(prev => ({
        ...prev,
        [attributId]: fallbackData
      }));
      return fallbackData;
    }

    try {
      const response = await fetch(`https://laravel-api.fly.dev/api/attributs/${attributId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch attribute: ${response.status}`);
      }
      const data = await response.json();
      setAttributCache(prev => ({
        ...prev,
        [attributId]: data
      }));
      return data;
    } catch (error) {
      console.error(`Error fetching attribute ${attributId}:`, error);
      if (commonAttributeNames[attributId]) {
        const fallbackData = {
          id: attributId,
          nom: commonAttributeNames[attributId],
          attribut_id: attributId
        };
        setAttributCache(prev => ({
          ...prev,
          [attributId]: fallbackData
        }));
        return fallbackData;
      }
      return null;
    }
  };

  const handleMouseMove = (e) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Limiter les valeurs x et y entre 0.1 et 0.9 pour éviter que l'image ne sorte trop des bords
    const boundedX = Math.max(0.1, Math.min(0.9, x));
    const boundedY = Math.max(0.1, Math.min(0.9, y));

    // Mettre à jour la position du zoom
    setZoomPosition({ x: boundedX, y: boundedY });

    // Mettre à jour la position du curseur personnalisé et de l'effet de surbrillance
    if (container) {
      // Positionner le pseudo-élément ::before (curseur personnalisé)
      container.style.setProperty('--x', `${e.clientX - rect.left}px`);
      container.style.setProperty('--y', `${e.clientY - rect.top}px`);

      // Mettre à jour la position du gradient radial dans le pseudo-élément ::after
      container.style.setProperty('--x', `${x * 100}%`);
      container.style.setProperty('--y', `${y * 100}%`);
    }
  };

  const handleImageChange = (image) => {
    setImageLoading(true);
    setImageTransition(true);

    // Ajouter un léger délai pour l'animation
    setTimeout(() => {
      setSelectedImage(image);
      setImageTransition(false);
      setTimeout(() => {
        setImageLoading(false);
      }, 300);
    }, 200);
  };

  const mapCouleurs = {
    blanc: '#ffffff',
    beige: '#f5f5dc',
    gris: '#808080',
    'gris clair': '#d3d3d3',
    noir: '#000000',
    bleu: '#92b6d5',
    'bleu foncé': '#1e3a8a',
    rouge: '#ff0000',
    vert: '#00ff00',
    jaune: '#ffff00',
    rose: '#ffc0cb',
    orange: '#ffa500',
    violet: '#800080',
    turquoise: '#40e0d0',
    marron: '#8b4513',
    or: '#ffd700',
    argent: '#c0c0c0'
  };

  // Effet pour initialiser l'image sélectionnée quand les images sont chargées
  useEffect(() => {
    if (productImages && productImages.length > 0 && !selectedImage) {
      const primaryImage = productImages.find(img => img.is_primary) || productImages[0];
      setSelectedImage(primaryImage);
      setImageLoading(false);
    }
  }, [productImages, selectedImage]);

  // Reset states when product ID changes
  useEffect(() => {
    // Reset all states when product ID changes to prevent showing old data
    setLoading(true);
    setArticle(null);
    setMarque("");
    setAttributs([]);
    setAttributGroups({});
    setVariantes([]);
    setSelectedVariante(null);
    setError(null);
    setProductImages([]);
    setSelectedImage(null);
    setImageLoading(true);

    // Scroll to top when changing products
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch product data
  useEffect(() => {
    if (!id) {
      setError("ID d'article invalide.");
      setLoading(false);
      return;
    }

    const fetchProductData = async () => {
      try {
        const productResponse = await fetch(`https://laravel-api.fly.dev/api/produits/${id}`);
        if (!productResponse.ok) {
          throw new Error(`Erreur lors du chargement du produit: ${productResponse.status}`);
        }

        const productData = await productResponse.json();
        setArticle(productData);

        // Fetch brand data
        try {
          const brandResponse = await fetch(`https://laravel-api.fly.dev/api/marques/${productData.marque_id}`);
          if (brandResponse.ok) {
            const brandData = await brandResponse.json();
            setMarque(brandData.nom_marque);
          } else {
            setMarque("Marque inconnue");
          }
        } catch (brandError) {
          setMarque("Marque inconnue");
        }

        // Use apiService for optimized image loading with caching
        try {
          const imageData = await apiService.getProductImages(id);
          if (imageData.images && imageData.images.length > 0) {
            setProductImages(imageData.images);
            const primaryImage = imageData.images.find(img => img.is_primary) || imageData.images[0];
            setSelectedImage(primaryImage);
            setImageLoading(false);
          } else {
            // Log warning only in development
            if (process.env.NODE_ENV !== 'production') {
              console.warn("Aucune image trouvée pour ce produit");
            }
          }
        } catch (imageError) {
          // Log error only in development
          if (process.env.NODE_ENV !== 'production') {
            console.error("Erreur lors du chargement des images du produit:", imageError);
          }
        }
      } catch (error) {
        // Log error only in development
        if (process.env.NODE_ENV !== 'production') {
          console.error("Erreur lors du chargement des détails du produit:", error);
        }
        setError("Erreur lors du chargement des détails du produit.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id]);

  // Fetch product attributes
  useEffect(() => {
    if (!id) return;

    fetch(`https://laravel-api.fly.dev/api/produits/${id}/attributs`)
      .then(res => res.json())
      .then(data => {
        const attributsArray = Array.isArray(data) ? data : [];
        const normalizedAttributes = attributsArray.map(attr => {
          const attrId = attr.id || attr.attribut_id || (attr.attribut ? attr.attribut.id : null);
          let attrName = 'Attribut';
          if (attr.attribut && attr.attribut.nom) {
            attrName = attr.attribut.nom;
          } else if (attr.nom) {
            attrName = attr.nom;
          } else if (attr.label) {
            attrName = attr.label;
          } else if (attr.nom_attribut) {
            attrName = attr.nom_attribut;
          } else if (commonAttributeNames[attrId]) {
            attrName = commonAttributeNames[attrId];
          }

          let attrValue = null;
          if (attr.valeur !== undefined) {
            attrValue = attr.valeur;
          } else if (attr.valeur_texte !== undefined) {
            attrValue = attr.valeur_texte;
          } else if (attr.valeur_nombre !== undefined) {
            attrValue = attr.valeur_nombre;
          } else if (attr.valeur_date !== undefined) {
            attrValue = attr.valeur_date;
          } else if (attr.valeur_booleen !== undefined) {
            attrValue = attr.valeur_booleen;
          }

          let groupInfo = null;
          if (attr.attribut && attr.attribut.groupe) {
            groupInfo = attr.attribut.groupe;
          } else if (attr.groupe_attribut) {
            groupInfo = attr.groupe_attribut;
          } else if (attr.groupe) {
            groupInfo = attr.groupe;
          }

          if (attrId === 3) {
            attrName = 'Couleur';
          } else if (attrId === 4) {
            attrName = 'Taille';
          } else if (attrId === 5) {
            attrName = 'Matériau';
            if (attr.attribut && attr.attribut.nom === 'Materiau') {
              attr.attribut.nom = 'Matériau';
            }
          } else if (attrId === 6) {
            attrName = 'Dimensions';
          }

          return {
            ...attr,
            id: attrId,
            attribut_id: attrId,
            nom: attrName,
            valeur: attrValue,
            groupe: groupInfo,
            attribut: attr.attribut || { id: attrId, nom: attrName }
          };
        });

        const newCache = { ...attributCache };
        normalizedAttributes.forEach(attr => {
          if (attr.id) {
            newCache[attr.id] = attr;
          }
        });
        setAttributCache(newCache);
        setAttributs(normalizedAttributes);

        const groups = {};
        normalizedAttributes.forEach(attr => {
          let groupInfo = null;
          if (attr.groupe) {
            groupInfo = attr.groupe;
          } else if (attr.attribut && attr.attribut.groupe) {
            groupInfo = attr.attribut.groupe;
          } else if (attr.groupe_attribut) {
            groupInfo = attr.groupe_attribut;
          }

          const groupName = groupInfo?.nom || 'Caractéristiques générales';
          const groupId = groupInfo?.id || 'default';

          if (groupInfo && groupInfo.id) {
            if (!groups[groupId]) {
              groups[groupId] = {
                id: groupId,
                nom: groupName,
                attributs: []
              };
            }
            groups[groupId].attributs.push(attr);
          } else {
            if (!groups['default']) {
              groups['default'] = {
                id: 'default',
                nom: 'Caractéristiques générales',
                attributs: []
              };
            }
            groups['default'].attributs.push(attr);
          }
        });

        setAttributGroups(groups);
      })
      .catch((error) => {
        // Log error only in development
        if (process.env.NODE_ENV !== 'production') {
          console.error('Error loading attributes:', error);
        }
        setError("Erreur lors du chargement des attributs.");
      });
  }, [id, commonAttributeNames]);

  // Fetch product variants
  useEffect(() => {
    if (!id) return;

    fetch(`https://laravel-api.fly.dev/api/produits/${id}/variantes`)
      .then(res => res.json())
      .then(async data => {
        const variantesAvecImages = await Promise.all(data.map(async (variante) => {
          try {
            const res = await fetch(`https://laravel-api.fly.dev/api/images/get?model_type=produit_variante&model_id=${variante.id}`);
            const imageData = await res.json();
            const imageUrl = imageData.images?.[0]?.direct_url || "";
            return { ...variante, imageUrl, images: imageData.images || [] };
          } catch {
            return { ...variante, imageUrl: "", images: [] };
          }
        }));
        setVariantes(variantesAvecImages);
        if (variantesAvecImages.length > 0) {
          setSelectedVariante(variantesAvecImages[0]);
        }
      })
      .catch(() => setError("Erreur lors du chargement des variantes."));
  }, [id]);

  // Check if product is in favorites
  useEffect(() => {
    if (!id) return;

    const storageKey = isAuthenticated ? `favorites_user_${user?.id}` : "favorites";
    const favorites = JSON.parse(localStorage.getItem(storageKey)) || [];
    const isFav = favorites.some(item => item.id === parseInt(id));
    setIsFavorite(isFav);
  }, [id, user, isAuthenticated]);

  const toggleFavorite = () => {
    const storageKey = isAuthenticated ? `favorites_user_${user?.id}` : "favorites";
    const favorites = JSON.parse(localStorage.getItem(storageKey)) || [];

    if (isFavorite) {
      const updated = favorites.filter(item => item.id !== article.id);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setIsFavorite(false);
    } else {
      let imageUrl = article.image_produit;
      if (selectedVariante) {
        if (selectedVariante.images && selectedVariante.images.length > 0) {
          imageUrl = selectedVariante.images[0].direct_url;
        } else if (selectedVariante.imageUrl) {
          imageUrl = selectedVariante.imageUrl;
        }
      } else if (selectedImage) {
        imageUrl = selectedImage.direct_url;
      } else if (productImages && Array.isArray(productImages) && productImages.length > 0) {
        imageUrl = productImages[0].direct_url;
      }

      const newFavorite = {
        id: article.id,
        nom_produit: article.nom_produit,
        prix_produit: article.prix_produit,
        image_produit: imageUrl,
        variante_id: selectedVariante?.id || null,
        variante_sku: selectedVariante?.sku || null
      };
      favorites.push(newFavorite);
      localStorage.setItem(storageKey, JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  const getVariantAttributeValues = (attributId) => {
    const values = new Set();
    variantes.forEach(variante => {
      if (variante.valeurs) {
        const attrValue = variante.valeurs.find(val => val.attribut_id === attributId);
        if (attrValue) {
          const value = attrValue.valeur || attrValue.valeur_texte || attrValue.valeur_nombre || attrValue.valeur_date;
          if (value) {
            values.add(value);
          }
        }
      }
    });
    return Array.from(values);
  };

  const getVariantAttributeValuesFromSku = (position) => {
    const values = new Set();
    variantes.forEach(variante => {
      if (variante.sku) {
        const parts = variante.sku.split('-');
        if (parts.length > position && parts[position]) {
          values.add(position === 1 ? parts[position].toLowerCase() : parts[position]);
        }
      }
    });
    return Array.from(values);
  };

  const colorAttribute = attributs.find(attr =>
    attr && (attr.id === 3 || attr.attribut_id === 3 ||
    (attr.nom && (attr.nom.toLowerCase().includes('couleur') || attr.nom.toLowerCase().includes('color')))
  )) || { id: 3, nom: 'Couleur' };

  const sizeAttribute = attributs.find(attr =>
    attr && (attr.id === 4 || attr.attribut_id === 4 || attr.id === 6 || attr.attribut_id === 6 ||
    (attr.nom && (attr.nom.toLowerCase().includes('taille') || attr.nom.toLowerCase().includes('dimension') || attr.nom.toLowerCase().includes('size')))
  )) || { id: 4, nom: 'Taille' };

  let couleurs = colorAttribute ? getVariantAttributeValues(colorAttribute.id) : [];
  let tailles = sizeAttribute ? getVariantAttributeValues(sizeAttribute.id) : [];

  const couleursFromSku = Array.from(new Set(
    variantes.map(v => v.sku.split('-')[1]?.toLowerCase() || '')
  )).filter(c => c);

  const taillesFromSku = Array.from(new Set(
    variantes.map(v => {
      const parts = v.sku.split('-');
      return parts.length > 2 ? parts[2] : "";
    })
  )).filter(t => t);

  if (!couleurs || couleurs.length === 0) {
    couleurs = couleursFromSku || [];
  }

  if (!tailles || tailles.length === 0) {
    tailles = taillesFromSku || [];
  }

  const findVariantByAttributes = (colorValue, sizeValue) => {
    const variantByAttr = variantes.find(variante => {
      if (!variante.valeurs || variante.valeurs.length === 0) return false;

      const hasColor = !colorValue || variante.valeurs.some(val => {
        const valAttr = val.attribut_id === colorAttribute?.id;
        const valMatch = val.valeur === colorValue || val.valeur_texte === colorValue;
        return valAttr && valMatch;
      });

      const hasSize = !sizeValue || variante.valeurs.some(val => {
        const valAttr = val.attribut_id === sizeAttribute?.id;
        const valMatch = val.valeur === sizeValue || val.valeur_texte === sizeValue;
        return valAttr && valMatch;
      });

      return hasColor && hasSize;
    });

    if (variantByAttr) return variantByAttr;
    return findVariantBySku(colorValue, sizeValue);
  };

  const findVariantBySku = (color, size) => {
    return variantes.find(v => {
      if (!v.sku) return false;

      const skuParts = v.sku.split('-');
      const skuColor = skuParts[1]?.toLowerCase() || '';
      const skuSize = skuParts[2] || '';

      if (color && size) {
        return skuColor === color.toLowerCase() && skuSize === size;
      }
      if (color && !size) {
        return skuColor === color.toLowerCase();
      }
      if (!color && size) {
        return skuSize === size;
      }
      return true;
    });
  };

  const handleColorClick = (couleur) => {
    let currentSize;
    if (selectedVariante?.valeurs) {
      const sizeVal = selectedVariante.valeurs.find(val =>
        val.attribut_id === sizeAttribute?.id
      );
      currentSize = sizeVal?.valeur || sizeVal?.valeur_texte;
    }
    if (!currentSize && selectedVariante?.sku) {
      const skuParts = selectedVariante.sku.split('-');
      if (skuParts.length > 2) {
        currentSize = skuParts[2];
      }
    }
    const variant = findVariantByAttributes(couleur, currentSize);
    if (variant) setSelectedVariante(variant);
  };

  const handleSizeChange = (size) => {
    let currentColor;
    if (selectedVariante?.valeurs) {
      const colorVal = selectedVariante.valeurs.find(val =>
        val.attribut_id === colorAttribute?.id
      );
      currentColor = colorVal?.valeur || colorVal?.valeur_texte;
    }
    if (!currentColor && selectedVariante?.sku) {
      const skuParts = selectedVariante.sku.split('-');
      if (skuParts.length > 1) {
        currentColor = skuParts[1];
      }
    }
    const variant = findVariantByAttributes(currentColor, size);
    if (variant) setSelectedVariante(variant);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = async () => {
    if (!article || cartLoading) return;

    // Show immediate feedback to user
    setAddedToCart(true);

    try {
      // Use a cached image URL to avoid recomputing
      const imageUrl = selectedImage?.direct_url || article.image_produit;

      // Create a minimal product object with only essential data
      const productObj = {
        id: article.id,
        nom: article.nom_produit,
        prix: selectedVariante?.prix || article.prix_produit,
        image: imageUrl
      };

      // Create a minimal variant object if needed
      const variantObj = selectedVariante ? {
        id: selectedVariante.id,
        sku: selectedVariante.sku,
        prix: selectedVariante.prix
      } : null;

      // Add to cart in the background without awaiting
      const cartPromise = addToCart(productObj, variantObj, quantity);

      // Set a timeout to hide the success message
      setTimeout(() => setAddedToCart(false), 2000);

      // Handle any errors in the background
      cartPromise.catch(error => {
        // Don't show alert as it blocks the UI
        setAddedToCart(false);
      });
    } catch (error) {
      setAddedToCart(false);
    }
  };

  const toggleSpecModal = () => {
    setShowSpecModal(!showSpecModal);
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" variant="circle" />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Erreur</h2>
        <p className="text-gray-600">{error}</p>
        <BackButton
          variant="filled"
          size="sm"
          className="mt-4 px-4 py-2 text-sm"
          label="Retour"
        />
      </div>
    </div>
  );

  // Loading state with elegant animation
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" key={`product-loading-${id}`}>
      <div className="text-center max-w-md mx-auto px-4 py-12 bg-white rounded-lg shadow-md">
        <LoadingSpinner size="lg" variant="elegant" color="#A67B5B" />
        <p className="mt-6 text-gray-600 font-light tracking-wide">Chargement des détails du produit...</p>
        <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-30"></div>
        <p className="text-sm text-gray-500 font-light">Veuillez patienter pendant que nous préparons les informations</p>
        <div className="mt-6 w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div className="h-full bg-[#A67B5B] animate-pulse-width"></div>
        </div>
      </div>
    </div>
  );

  // Error state
  if (!article) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center" key={`product-error-${id}`}>
      <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-gray-800 mb-4">Article introuvable</h2>
        <p className="text-gray-600 mb-4">Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
        <p className="text-sm text-gray-500 mb-8">ID du produit: {id}</p>
        <BackButton
          variant="filled"
          size="sm"
          className="mx-auto px-4 py-2 text-sm"
          label="Retour"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif" key={`product-detail-${id}`}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-start mb-6">
          <BackButton
            variant="outline"
            size="sm"
            className="px-4 py-2 text-sm"
            label="Retour"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left side: Image section */}
          <div className="md:w-3/5">
            {/* Grande image principale avec zoom */}
            <div
              className="relative overflow-hidden shadow-xl h-[600px] rounded-lg mb-6 dynamic-zoom cursor-none"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              ref={mainImageRef}
            >
              <div className={`w-full h-full transition-all-smooth ${isZoomed ? 'scale-150' : 'scale-100'}`}
                style={isZoomed ? {
                  transformOrigin: `${zoomPosition.x * 100}% ${zoomPosition.y * 100}%`
                } : {}}>
                <EnhancedLazyImage
                  src={selectedImage?.direct_url || article?.image_produit}
                  alt={selectedImage?.alt_text || article?.nom_produit || 'Image du produit'}
                  className="w-full h-full"
                  fallbackSrc="https://via.placeholder.com/800x600?text=Image+non+disponible"
                  spinnerVariant="circle"
                />
              </div>
              {isZoomed && (
                <div className="absolute bottom-4 right-4 bg-white bg-opacity-70 px-3 py-1 rounded-full text-xs text-gray-700 z-10">
                  Zoom actif
                </div>
              )}
            </div>

            {/* Autres images en colonnes de 2 avec défilement */}
            <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto scrollbar-elegant pr-2">
              {productImages && productImages.map((image, index) => (
                <div
                  key={index}
                  className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 mb-4 transition-all duration-300 hover:shadow-lg ${
                    selectedImage?.id === image.id ? 'border-gray-900 ring-2 ring-gray-300' : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => handleImageChange(image)}
                >
                  <EnhancedLazyImage
                    src={image.direct_url || image.getThumbnailUrl?.('medium')}
                    alt={image.alt_text || `${article?.nom_produit} - ${index + 1}`}
                    className="w-full h-full hover:scale-110 transition-all duration-500"
                    fallbackSrc="https://via.placeholder.com/300x300?text=Image+non+disponible"
                    spinnerVariant="dots"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right side: Details section */}
          <div className="md:w-2/5 sticky top-0 self-start max-h-screen overflow-y-auto scrollbar-hidden">
            <div className="text-sm text-gray-500 uppercase tracking-wide mb-2">{marque}</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 font-sans">{article.nom_produit}</h1>

            {article.reference && (
              <div className="text-sm text-gray-600 mb-4">
                Référence: {article.reference}
              </div>
            )}

            <div className="mb-6">
              <div className="text-3xl font-semibold text-gray-900">{article.prix_produit} DT</div>
              <div className="mt-2">
                {(isInStock(article) || isInStock(selectedVariante)) ? (
                  <span className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    En stock
                  </span>
                ) : (
                  <span className="inline-block bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                    Rupture de stock
                  </span>
                )}
              </div>
            </div>

            {article.description_produit && (
              <div className="mb-8">
                <p className="text-gray-600 leading-relaxed text-base">{article.description_produit}</p>
              </div>
            )}

            {variantes.length > 0 && couleurs.length > 0 && (
              <div className="mb-8">
                <p className="font-medium text-gray-800 mb-3">Couleur</p>
                <div className="flex flex-wrap gap-3">
                  {couleurs.filter(couleur => couleur).map((couleur, index) => {
                    const isSelectedByAttr = selectedVariante?.valeurs?.some(val =>
                      val.attribut_id === colorAttribute?.id &&
                      (val.valeur === couleur || val.valeur_texte === couleur)
                    );
                    const isSelectedBySku = selectedVariante?.sku && couleur ? selectedVariante.sku.toLowerCase().includes(couleur.toLowerCase()) : false;
                    const isSelected = isSelectedByAttr || isSelectedBySku;

                    return (
                      <button
                        key={index}
                        onClick={() => handleColorClick(couleur)}
                        className={`w-12 h-12 rounded-full border-2 ${
                          isSelected ? 'border-gray-900 shadow-lg' : 'border-gray-200'
                        } hover:scale-110 transition-all duration-300 ease-in-out`}
                        style={{
                          backgroundColor: (couleur && (
                            mapCouleurs[couleur.toLowerCase()] ||
                            (couleur.toLowerCase() === 'gris clair' ? '#d3d3d3' : null)
                          )) || 'gray'
                        }}
                        title={couleur ? couleur.charAt(0).toUpperCase() + couleur.slice(1) : 'Couleur'}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {variantes.length > 0 && tailles.length > 0 && (
              <div className="mb-8">
                <p className="font-medium text-gray-800 mb-3">Dimensions</p>
                <div className="flex flex-wrap gap-3">
                  {tailles.filter(taille => taille).map((taille, index) => {
                    const isSelectedByAttr = selectedVariante?.valeurs?.some(val =>
                      val.attribut_id === sizeAttribute?.id &&
                      (val.valeur === taille || val.valeur_texte === taille)
                    );
                    const isSelectedBySku = selectedVariante?.sku && taille ? selectedVariante.sku.includes(taille) : false;
                    const isSelected = isSelectedByAttr || isSelectedBySku;

                    return (
                      <button
                        key={index}
                        onClick={() => handleSizeChange(taille)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all duration-300 ${
                          isSelected ? 'bg-[#A67B5B] text-white shadow-md' : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {taille}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center mb-6">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <p className="text-sm text-gray-600">Livraison à domicile sous 24 à 48h ouvrés.</p>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className="relative w-16 h-12 flex items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm">
                <select
                  className="w-full h-full rounded-lg appearance-none bg-transparent text-center text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-gray-900"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <DynamicButton
                label={cartLoading ? "AJOUT EN COURS..." : addedToCart ? "AJOUTÉ AU PANIER ✓" : (isInStock(article) || isInStock(selectedVariante)) ? "AJOUTER AU PANIER" : "PRODUIT INDISPONIBLE"}
                onClick={handleAddToCart}
                disabled={!(isInStock(article) || isInStock(selectedVariante)) || cartLoading}
                className="flex-1 py-3 btn-primary rounded-lg shadow-md transition-all duration-300"
              />
            </div>

            <button
              onClick={toggleSpecModal}
              className="w-full py-4 border-t border-b flex justify-between items-center text-gray-800 hover:bg-gray-50 transition-all duration-300"
            >
              <span className="font-medium">Caractéristiques & Entretien</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal pour Spécifications & Entretien */}
      {showSpecModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end items-center animate-fade-in">
          <div
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl animate-slide-in"
            style={{
              borderLeft: '1px solid rgba(166, 123, 91, 0.3)',
              boxShadow: '0 0 40px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-light text-gray-800">Spécifications & Entretien</h2>
                <button
                  onClick={toggleSpecModal}
                  className="text-gray-500 hover:text-[#A67B5B] transition-colors p-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Caractéristiques</h3>
                {Object.keys(attributGroups).length > 0 ? (
                  <div>
                    {Object.values(attributGroups).map(group => (
                      <div key={group.id} className="mb-6">
                        <h4 className="font-medium text-gray-800 mb-3">{group.nom}</h4>
                        <div className="space-y-4">
                          {group.attributs.map(attr => {
                            if (attr.affichable === false) return null;
                            const attrId = attr.id || attr.attribut_id || (attr.attribut ? attr.attribut.id : null);
                            if (!attrId) return null;

                            let attrName = attr.nom;
                            if (!attrName || attrName === 'Attribut') {
                              attrName = attributCache[attrId]?.nom || attributCache[attrId]?.attribut?.nom;
                              if (!attrName || attrName === 'Attribut') {
                                React.useEffect(() => {
                                  const getAttributeDetails = async () => {
                                    await fetchAttributeDetails(attrId);
                                  };
                                  getAttributeDetails();
                                }, [attrId]);
                                attrName = attributCache[attrId]?.nom || attributCache[attrId]?.attribut?.nom;
                                if (!attrName || attrName === 'Attribut') {
                                  if (attrId === 3) {
                                    attrName = 'Couleur';
                                  } else if (attrId === 4) {
                                    attrName = 'Taille';
                                  } else if (attrId === 5) {
                                    attrName = 'Matériau';
                                  } else if (attrId === 6) {
                                    attrName = 'Dimensions';
                                  } else if (commonAttributeNames[attrId]) {
                                    attrName = commonAttributeNames[attrId];
                                  } else {
                                    return null;
                                  }
                                }
                              }
                            }

                            let value = '-';
                            if (selectedVariante?.valeurs) {
                              const variantValue = selectedVariante.valeurs.find(val => val.attribut_id === attrId);
                              if (variantValue) {
                                if (variantValue.valeur !== undefined) value = variantValue.valeur;
                                else if (variantValue.valeur_texte !== undefined) value = variantValue.valeur_texte;
                                else if (variantValue.valeur_nombre !== undefined) value = variantValue.valeur_nombre;
                                else if (variantValue.valeur_date !== undefined) value = variantValue.valeur_date;
                                else if (variantValue.valeur_booleen !== undefined) value = variantValue.valeur_booleen;
                              }
                            }

                            if (value === '-') {
                              if (attr.valeur !== undefined) value = attr.valeur;
                              else if (attr.valeur_texte !== undefined) value = attr.valeur_texte;
                              else if (attr.valeur_nombre !== undefined) value = attr.valeur_nombre;
                              else if (attr.valeur_date !== undefined) value = attr.valeur_date;
                              else if (attr.valeur_booleen !== undefined) value = attr.valeur_booleen;
                              else value = '-';
                            }

                            if (attrId === 3 && value === '-') {
                              if (selectedVariante?.sku) {
                                try {
                                  const skuParts = selectedVariante.sku.split('-');
                                  if (skuParts.length > 1) {
                                    const skuColor = skuParts[1];
                                    if (skuColor) value = skuColor.charAt(0).toUpperCase() + skuColor.slice(1);
                                  }
                                } catch (error) {
                                  console.error('Error extracting color from SKU:', error);
                                }
                              }
                            } else if ((attrId === 4 || attrId === 6) && value === '-') {
                              if (selectedVariante?.sku) {
                                try {
                                  const skuParts = selectedVariante.sku.split('-');
                                  if (skuParts.length > 2) {
                                    value = skuParts[2];
                                  }
                                } catch (error) {
                                  console.error('Error extracting size from SKU:', error);
                                }
                              }
                            }

                            if (typeof value === 'boolean') {
                              value = value ? 'Oui' : 'Non';
                            } else if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
                              const num = parseFloat(value);
                              value = Number.isInteger(num) ? num.toString() : num.toFixed(1).replace(/\.0$/, '');
                            }

                            if (value === '-' || value === '') return null;

                            return (
                              <div key={attrId} className="border-b pb-3">
                                <div className="text-gray-600 mb-1">{attrName}</div>
                                <div className="font-medium">{value}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {attributs.map(attr => {
                      if (attr.affichable === false) return null;
                      const attrId = attr.id || attr.attribut_id || (attr.attribut ? attr.attribut.id : null);
                      if (!attrId) return null;

                      let attrName = attr.nom;
                      if (!attrName || attrName === 'Attribut') {
                        attrName = attributCache[attrId]?.nom || attributCache[attrId]?.attribut?.nom;
                        if (!attrName || attrName === 'Attribut') {
                          React.useEffect(() => {
                            const getAttributeDetails = async () => {
                              await fetchAttributeDetails(attrId);
                            };
                            getAttributeDetails();
                          }, [attrId]);
                          attrName = attributCache[attrId]?.nom || attributCache[attrId]?.attribut?.nom;
                          if (!attrName || attrName === 'Attribut') {
                            if (attrId === 3) {
                              attrName = 'Couleur';
                            } else if (attrId === 4) {
                              attrName = 'Taille';
                            } else if (attrId === 5) {
                              attrName = 'Matériau';
                            } else if (attrId === 6) {
                              attrName = 'Dimensions';
                            } else if (commonAttributeNames[attrId]) {
                              attrName = commonAttributeNames[attrId];
                            } else {
                              return null;
                            }
                          }
                        }
                      }

                      let value = '-';
                      if (selectedVariante?.valeurs) {
                        const variantValue = selectedVariante.valeurs.find(val => val.attribut_id === attrId);
                        if (variantValue) {
                          if (variantValue.valeur !== undefined) value = variantValue.valeur;
                          else if (variantValue.valeur_texte !== undefined) value = variantValue.valeur_texte;
                          else if (variantValue.valeur_nombre !== undefined) value = variantValue.valeur_nombre;
                          else if (variantValue.valeur_date !== undefined) value = variantValue.valeur_date;
                          else if (variantValue.valeur_booleen !== undefined) value = variantValue.valeur_booleen;
                        }
                      }

                      if (value === '-') {
                        if (attr.valeur !== undefined) value = attr.valeur;
                        else if (attr.valeur_texte !== undefined) value = attr.valeur_texte;
                        else if (attr.valeur_nombre !== undefined) value = attr.valeur_nombre;
                        else if (attr.valeur_date !== undefined) value = attr.valeur_date;
                        else if (attr.valeur_booleen !== undefined) value = attr.valeur_booleen;
                        else value = '-';
                      }

                      if (attrId === 3 && value === '-') {
                        if (selectedVariante?.sku) {
                          try {
                            const skuParts = selectedVariante.sku.split('-');
                            if (skuParts.length > 1) {
                              const skuColor = skuParts[1];
                              if (skuColor) value = skuColor.charAt(0).toUpperCase() + skuColor.slice(1);
                            }
                          } catch (error) {
                            console.error('Error extracting color from SKU:', error);
                          }
                        }
                      } else if ((attrId === 4 || attrId === 6) && value === '-') {
                        if (selectedVariante?.sku) {
                          try {
                            const skuParts = selectedVariante.sku.split('-');
                            if (skuParts.length > 2) {
                              value = skuParts[2];
                            }
                          } catch (error) {
                            console.error('Error extracting size from SKU:', error);
                          }
                        }
                      }

                      if (typeof value === 'boolean') {
                        value = value ? 'Oui' : 'Non';
                      } else if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)))) {
                        const num = parseFloat(value);
                        value = Number.isInteger(num) ? num.toString() : num.toFixed(1).replace(/\.0$/, '');
                      }

                      if (value === '-' || value === '') return null;

                      return (
                        <div key={attrId} className="border-b pb-3">
                          <div className="text-gray-600 mb-1">{attrName}</div>
                          <div className="font-medium">{value}</div>
                        </div>
                      );
                    })}

                    {attributs.length === 0 && (
                      <div className="text-gray-500 italic">Aucune caractéristique disponible pour ce produit.</div>
                    )}
                  </div>
                )}
              </div>

              {selectedVariante && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Spécifications de la variante</h3>
                  <div className="space-y-4">
                    <div className="border-b pb-3">
                      <div className="text-gray-600 mb-1">SKU</div>
                      <div className="font-medium">{selectedVariante.sku}</div>
                    </div>
                    <div className="border-b pb-3">
                      <div className="text-gray-600 mb-1">Prix</div>
                      <div className="font-medium">{selectedVariante.prix || article?.prix_produit} DT</div>
                    </div>
                    <div className="border-b pb-3">
                      <div className="text-gray-600 mb-1">Stock</div>
                      <div className="font-medium">
                        {isInStock(selectedVariante) ?
                          (selectedVariante.quantite_produit || selectedVariante.stock) + ' unités disponibles' :
                          'Rupture de stock'}
                      </div>
                    </div>
                    {selectedVariante.valeurs && selectedVariante.valeurs.map(val => {
                      const attribute = attributs.find(attr => {
                        const attrId = attr.id || attr.attribut_id || (attr.attribut ? attr.attribut.id : null);
                        return attrId === val.attribut_id;
                      }) || attributCache[val.attribut_id];

                      let attrName = attribute?.nom;
                      if (!attrName || attrName === 'Attribut') {
                        attrName = attributCache[val.attribut_id]?.nom ||
                                  attributCache[val.attribut_id]?.attribut?.nom ||
                                  attribute?.attribut?.nom;
                        if (!attrName || attrName === 'Attribut') {
                          React.useEffect(() => {
                            const getAttributeDetails = async () => {
                              await fetchAttributeDetails(val.attribut_id);
                            };
                            getAttributeDetails();
                          }, [val.attribut_id]);
                          attrName = attributCache[val.attribut_id]?.nom ||
                                    attributCache[val.attribut_id]?.attribut?.nom;
                          if (!attrName || attrName === 'Attribut') {
                            if (val.attribut_id === 3) {
                              attrName = 'Couleur';
                            } else if (val.attribut_id === 4) {
                              attrName = 'Taille';
                            } else if (val.attribut_id === 5) {
                              attrName = 'Matériau';
                            } else if (val.attribut_id === 6) {
                              attrName = 'Dimensions';
                            } else if (commonAttributeNames[val.attribut_id]) {
                              attrName = commonAttributeNames[val.attribut_id];
                            } else {
                              attrName = `Attribut ${val.attribut_id}`;
                            }
                          }
                        }
                      }

                      let displayValue;
                      if (val.valeur !== undefined) displayValue = val.valeur;
                      else if (val.valeur_texte !== undefined) displayValue = val.valeur_texte;
                      else if (val.valeur_nombre !== undefined) displayValue = val.valeur_nombre;
                      else if (val.valeur_date !== undefined) displayValue = val.valeur_date;
                      else if (val.valeur_booleen !== undefined) displayValue = val.valeur_booleen;

                      if ((!displayValue && displayValue !== 0) || displayValue === '') {
                        if (val.attribut_id === 3 && selectedVariante?.sku) {
                          try {
                            const skuParts = selectedVariante.sku.split('-');
                            if (skuParts.length > 1) {
                              const skuColor = skuParts[1];
                              if (skuColor) displayValue = skuColor.charAt(0).toUpperCase() + skuColor.slice(1);
                            }
                          } catch (error) {
                            console.error('Error extracting color from SKU:', error);
                          }
                        } else if ((val.attribut_id === 4 || val.attribut_id === 6) && selectedVariante?.sku) {
                          try {
                            const skuParts = selectedVariante.sku.split('-');
                            if (skuParts.length > 2) {
                              displayValue = skuParts[2];
                            }
                          } catch (error) {
                            console.error('Error extracting size from SKU:', error);
                          }
                        }
                      }

                      if ((!displayValue && displayValue !== 0) || displayValue === '') return null;

                      if (typeof displayValue === 'boolean') {
                        displayValue = displayValue ? 'Oui' : 'Non';
                      } else if (typeof displayValue === 'number' || (typeof displayValue === 'string' && !isNaN(parseFloat(displayValue)))) {
                        const num = parseFloat(displayValue);
                        displayValue = Number.isInteger(num) ? num.toString() : num.toFixed(1).replace(/\.0$/, '');
                      }

                      return (
                        <div key={val.attribut_id} className="border-b pb-3">
                          <div className="text-gray-600 mb-1">{attrName}</div>
                          <div className="font-medium">{displayValue}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <SimilarProducts
        productId={id}
        categorieId={article?.sous_sous_categorie_id}
        marqueId={article?.marque_id}
        description={article?.description_produit}
        isInStock={isInStock}
      />
    </div>
  );
};

export default ProductDetailPage;