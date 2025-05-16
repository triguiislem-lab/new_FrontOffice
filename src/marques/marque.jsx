import { useState, useEffect } from 'react';
import { Eye, Award, Globe, ArrowRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DynamicButton from "../Components/DynamicButton";
import LoadingSpinner from "../Components/LoadingSpinner";

const Marque = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const navigate = useNavigate();

  // Fetch brands from API
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://laravel-api.fly.dev/api/marques');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des marques');
        }
        const data = await response.json();
        setBrands(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, []);

  // Get unique categories for filter
  const categories = brands.length > 0
    ? ['all', ...new Set(brands.map(brand => brand.category || 'non-catégorisé'))]
    : ['all'];

  // Filter brands based on search and category
  const filteredBrands = brands.filter(brand => {
    const matchesSearch = brand.nom_marque?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || brand.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Navigate to brand detail page
  const navigateToBrandPage = (brandId) => {
    navigate(`/brand/${brandId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif">
      <div className="pt-16">
        {/* Hero Section */}

        <div className="relative overflow-hidden bg-gradient-to-b from-gold to-transparent py-24">
        <div className="absolute inset-0 bg-pattern opacity-10 transform scale-110 rotate-3"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl font-extralight tracking-widest mb-2 transition-all duration-700 transform">NOS MARQUES PRESTIGIEUSES</h1>
            <div className="w-24 h-px bg-yellow-700 mx-auto my-6"></div>
            <p className="max-w-2xl mx-auto text-gray-600 font-light leading-relaxed text-lg">
            Découvrez notre sélection exclusive de marques pour la décoration, le linge de maison et de bain. Chaque marque est choisie pour son excellence et son savoir-faire unique.            </p>
          </div>
        </div>
      </div>



        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" variant="circle" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="bg-red-50 text-red-600 p-6 rounded-lg">
              <p className="mb-4 text-lg">Erreur: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-lg"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}

        {/* Brands List */}
        {!loading && !error && (
          <section className="container mx-auto px-4 py-8">
            {filteredBrands.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Aucune marque trouvée avec ces critères.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {filteredBrands.map((brand, index) => (
                  <div
                    key={brand.id}
                    className={`flex flex-col md:flex-row items-center bg-white rounded-lg shadow-md hover:shadow-2xl transition-shadow duration-500 p-6 transform hover:-translate-y-2 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Brand Logo */}
                    <div className="md:w-1/3 w-full h-64 flex items-center justify-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg p-4">
                      <img
                        src={brand.logo_marque || '/api/placeholder/300/200'}
                        alt={`Logo ${brand.nom_marque}`}
                        className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = '/api/placeholder/300/200';
                        }}
                      />
                    </div>
                    {/* Brand Details */}
                    <div className="md:w-2/3 w-full p-6">
                      <h2 className="text-3xl md:text-4xl font-semibold text-gray-800 mb-4 transition-colors duration-300 hover:text-yellow-700">
                        {brand.nom_marque}
                      </h2>
                      <p className="text-gray-600 text-lg leading-relaxed mb-6">
                        {brand.description_marque ||
                          'Découvrez les produits de qualité de cette marque prestigieuse, conçus pour sublimer votre intérieur avec élégance et raffinement.'}
                      </p>
                      <DynamicButton
                        label="Explorer la marque"
                        to={`/brand/${brand.id}`}
                        className="relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-black transition duration-300 ease-out border-2 border-yellow-700 rounded-lg shadow-md group hover:bg-yellow-700 hover:text-white"
                      >
                        <span className="absolute inset-0 w-full h-full bg-yellow-700 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out"></span>
                        <span className="relative z-10">Explorer la marque</span>
                      </DynamicButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Why Choose Our Brands Section */}
        <section className="bg-gradient-to-b from-gray-50 to-gray-100 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-semibold text-center mb-12 text-gray-800">Pourquoi choisir nos marques ?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Award size={32} />,
                  title: 'Qualité Supérieure',
                  description:
                    'Nous sélectionnons exclusivement des marques reconnues pour la qualité exceptionnelle de leurs produits.',
                },
                {
                  icon: <Globe size={32} />,
                  title: 'Savoir-faire International',
                  description:
                    'Des marques venues du monde entier, alliant traditions et innovations pour votre intérieur.',
                },
                {
                  icon: <ArrowRight size={32} />,
                  title: 'Tendances Actuelles',
                  description:
                    'Des collections régulièrement renouvelées pour rester à la pointe des tendances en décoration.',
                },
              ].map((item, index) => (
                <div key={index} className="text-center bg-white p-6 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-500">
                  <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-xl mb-2 text-gray-800">{item.title}</h3>
                  <p className="text-gray-600 text-lg">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Marque;