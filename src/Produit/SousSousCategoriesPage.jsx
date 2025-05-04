import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DynamicButton from "@/pages/won";

const SousSousCategoriesPage = () => {
  const { id } = useParams(); // ✅ Récupère l'ID de la sous-catégorie depuis l'URL
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [categoryName, setCategoryName] = useState(""); // Nouveau state pour le nom de la catégorie
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Nombre d'éléments par page
  const navigate = useNavigate(); // Utilisation de useNavigate pour la redirection

  useEffect(() => {
    if (!id) {
      setError("ID de sous-catégorie invalide.");
      setLoading(false);
      return;
    }

    // Récupérer les sous-sous-catégories de cette sous-catégorie
    fetch(`https://laravel-api.fly.dev/api/sous_sousCategories?sous_categorie_id=${id}`)
      .then(res => res.json())
      .then(data => {
        const filteredSubSubCategories = data.filter(sub => sub.sous_categorie_id == id);
        setSubSubCategories(filteredSubSubCategories);
      })
      .catch(() => setError("Erreur lors du chargement des sous-sous-catégories."))
      .finally(() => setLoading(false));

    // Récupérer le nom de la catégorie en fonction de l'ID
    fetch(`https://laravel-api.fly.dev/api/sousCategories/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.nom_sous_categorie) {
          setCategoryName(data.nom_sous_categorie);
        }
      })
      .catch(() => setError("Erreur lors du chargement du nom de la catégorie."));
  }, [id]);

  if (loading) return <div className="text-center mt-10">Chargement...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">{error}</div>;

  // Gestion de la pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = subSubCategories.slice(indexOfFirstItem, indexOfLastItem);

  const handleClick = (subSubCategoryId) => {
    // Redirection vers la page des articles de cette sous-sous-catégorie
    navigate(`/articles/${subSubCategoryId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif">
      {/* En-tête minimaliste et élégant */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-3">Collection</p>
            <h1 className="text-4xl font-extralight tracking-[0.15em] mb-4 text-gray-900">
              {categoryName ? categoryName.toUpperCase() : "COLLECTIONS"}
            </h1>
            <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-60"></div>
            <p className="text-gray-500 font-light text-sm tracking-wide max-w-xl mx-auto">
              Découvrez notre sélection de <span className="text-[#A67B5B] font-normal">{subSubCategories.length}</span> produits exclusifs, soigneusement choisis pour leur élégance
            </p>
          </div>
        </div>
      </div>

      {/* Liste des sous-sous-catégories avec pagination */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {currentItems.map((subSubCategory) => (
            <div
              key={subSubCategory.id}
              className="group bg-white overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
              onClick={() => handleClick(subSubCategory.id)}
            >
              <div className="relative overflow-hidden">
                <img
                  src={subSubCategory.image}
                  alt={subSubCategory.nom_sous_sous_categorie}
                  className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
              <div className="p-5 relative">
                <h3 className="text-base font-light tracking-wide mb-2 text-gray-800 group-hover:text-[#A67B5B] transition-colors">
                  {subSubCategory.nom_sous_sous_categorie}
                </h3>
                <div className="w-8 h-[0.5px] bg-[#A67B5B] mb-3 transition-all duration-300 group-hover:w-16 opacity-60"></div>
                <p className="text-gray-500 text-sm font-light leading-relaxed">
                  {subSubCategory.description_sous_sous_categorie || "Découvrez notre collection exclusive"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination minimaliste */}
        {subSubCategories.length > itemsPerPage && (
          <div className="flex justify-center mt-16">
            <div className="inline-flex items-center">
              <button
                className={`w-8 h-8 flex items-center justify-center text-xs ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-[#A67B5B]'}`}
                onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {Array.from({ length: Math.ceil(subSubCategories.length / itemsPerPage) }, (_, i) => (
                <button
                  key={i}
                  className={`w-8 h-8 flex items-center justify-center text-xs transition-colors ${
                    currentPage === i + 1
                      ? "text-[#A67B5B] border-b border-[#A67B5B]"
                      : "text-gray-500 hover:text-[#A67B5B]"
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className={`w-8 h-8 flex items-center justify-center text-xs ${
                  currentPage === Math.ceil(subSubCategories.length / itemsPerPage)
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:text-[#A67B5B]'
                }`}
                onClick={() =>
                  currentPage < Math.ceil(subSubCategories.length / itemsPerPage) &&
                  setCurrentPage(currentPage + 1)
                }
                disabled={currentPage === Math.ceil(subSubCategories.length / itemsPerPage)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SousSousCategoriesPage;
