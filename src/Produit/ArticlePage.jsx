import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ArticlesPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [productImages, setProductImages] = useState({});
  const [marques, setMarques] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");
  const [subSubCategoryName, setSubSubCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (!id) {
      setError("ID de sous-sous-catégorie invalide.");
      setLoading(false);
      return;
    }

    // Charger les articles de la sous-sous-catégorie
    fetch(`https://laravel-api.fly.dev/api/produits?sous_sous_categorie_id=${id}`)
      .then(res => res.json())
      .then(async response => {
        const articlesData = Array.isArray(response) ? response : response.data;
        if (Array.isArray(articlesData)) {
          setArticles(articlesData);

          // Fetch images for each product
          const imagesMap = {};
          await Promise.all(
            articlesData.map(async (product) => {
              try {
                const imageResponse = await fetch(
                  `https://laravel-api.fly.dev/api/images/get?model_type=produit&model_id=${product.id}`
                );
                const imageData = await imageResponse.json();
                if (imageData.images && imageData.images.length > 0) {
                  // Find primary image or use the first one
                  const primaryImage = imageData.images.find(img => img.is_primary) ||
                                      imageData.images[0];
                  imagesMap[product.id] = primaryImage.direct_url;
                }
              } catch (error) {
                console.error(`Error fetching images for product ${product.id}:`, error);
              }
            })
          );

          setProductImages(imagesMap);
        } else {
          console.error('Unexpected API response format:', response);
          setArticles([]);
          setError("Format de réponse API inattendu.");
        }
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des articles:", err);
        setError("Erreur lors du chargement des articles.");
      })
      .finally(() => setLoading(false));

    // Charger les marques
    fetch("https://laravel-api.fly.dev/api/marques")
      .then(res => res.json())
      .then(response => {
        const marquesData = Array.isArray(response) ? response : response.data;
        if (Array.isArray(marquesData)) {
          setMarques(marquesData);
        } else {
          console.error('Unexpected API response format for marques:', response);
          setMarques([]);
        }
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des marques:", err);
        setError("Erreur lors du chargement des marques.");
      });

    // Charger les informations des catégories et sous-catégories
    fetch(`https://laravel-api.fly.dev/api/sous_sousCategories/${id}`)
      .then(res => res.json())
      .then(response => {
        if (response) {
          // Charger le nom de la sous-sous-catégorie
          setSubSubCategoryName(response.nom_sous_sous_categorie);
          return fetch(`https://laravel-api.fly.dev/api/sousCategories/${response.sous_categorie_id}`);
        }
        throw new Error("Sous-sous-catégorie introuvable.");
      })
      .then(res => res.json())
      .then(response => {
        if (response) {
          // Charger le nom de la sous-catégorie
          setSubCategoryName(response.nom_sous_categorie);
          return fetch(`https://laravel-api.fly.dev/api/categories/${response.categorie_id}`);
        }
        throw new Error("Sous-catégorie introuvable.");
      })
      .then(res => res.json())
      .then(response => {
        if (response) {
          // Charger le nom de la catégorie
          setCategoryName(response.nom_categorie);
        }
      })
      .catch((err) => {
        console.error("Erreur lors du chargement des catégories:", err);
        setError("Erreur lors du chargement des catégories.");
      });
  }, [id]);

  if (loading) return <div className="text-center mt-10">Chargement...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  const getMarqueName = (marqueId) => {
    if (!Array.isArray(marques)) return "Marque inconnue";
    const marque = marques.find(m => m.id === marqueId);
    return marque ? marque.nom_marque : "Marque inconnue";
  };

  // Pagination des articles
  const articlesArray = Array.isArray(articles) ? articles : [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = articlesArray.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 text-gray-800 font-serif">
      {/* ✅ Titre et navigation améliorés */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-light text-gray-800 text-center">
          <span className="block text-xs text-gray-400 uppercase tracking-widest">Parcours</span>

          <h2 className="text-[#A67B5B]">{subSubCategoryName}</h2>
          <span className="block text-sm text-gray-500 mt-2">({Array.isArray(articles) ? articles.length : 0} Produits)</span>
        </h2>
        <div className="w-12 h-[0.5px] bg-[#A67B5B] mx-auto my-3 opacity-50"></div>
      </div>

      {/* ✅ Liste des articles avec un design amélioré */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {currentItems.map((article) => (
            <div
              key={article.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform hover:shadow-lg cursor-pointer"
              onClick={() => navigate(`/article/${article.id}`)}
            >
              <div className="relative">
                <img
                  src={productImages[article.id] || article.image_produit}
                  alt={article.nom_produit}
                  className="w-full h-48 object-cover rounded-t-lg"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
                {article.reference && (
                  <div className="absolute top-2 left-2 bg-white bg-opacity-80 text-xs px-2 py-1 rounded">
                    Réf: {article.reference}
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium truncate text-gray-800 group-hover:text-[#A67B5B] transition-colors">
                    {article.nom_produit}
                  </h3>
                  <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded ml-2 whitespace-nowrap">
                    {getMarqueName(article.marque_id)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2 h-10">
                  {article.description_produit || "Aucune description disponible"}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">{article.prix_produit} DT</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/article/${article.id}`);
                    }}
                    className="bg-[#A67B5B] text-white py-1 px-3 rounded hover:bg-[#8A5A3B] transition duration-200"
                  >
                    Détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ✅ Pagination améliorée */}
        {Array.isArray(articles) && articles.length > itemsPerPage && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: Math.ceil(articles.length / itemsPerPage) }, (_, i) => (
              <button
                key={i}
                className={`px-4 py-2 border ${currentPage === i + 1 ? "bg-[#A67B5B] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"} rounded-md transition-colors`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesPage;
