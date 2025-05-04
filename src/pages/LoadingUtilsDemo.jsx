import React, { useState } from 'react';
import LoadingSpinner from '../Components/LoadingSpinner';
import EnhancedLazyImage from '../Components/EnhancedLazyImage';
import {
  FullPageLoading,
  SectionLoading,
  InlineLoading,
  ButtonLoading,
  CardLoading,
  TableLoading
} from '../utils/loadingUtils.jsx';

const LoadingUtilsDemo = () => {
  const [showFullPage, setShowFullPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleButtonClick = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleFullPageClick = () => {
    setShowFullPage(true);
    setTimeout(() => setShowFullPage(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showFullPage && <FullPageLoading message="Chargement de la page..." />}

      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Composants de Chargement Standardisés</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">LoadingSpinner</h2>
            <p className="mb-4 text-gray-600">
              Composant de base pour tous les états de chargement. Disponible en plusieurs variantes et tailles.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium mb-2">Circle</h3>
                <LoadingSpinner variant="circle" size="md" />
              </div>
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium mb-2">Dots</h3>
                <LoadingSpinner variant="dots" size="md" />
              </div>
              <div className="flex flex-col items-center">
                <h3 className="text-sm font-medium mb-2">Pulse</h3>
                <LoadingSpinner variant="pulse" size="md" />
              </div>
            </div>

            <div className="mt-4">
              <button
                className="px-4 py-2 bg-[#A67B5B] text-white rounded hover:bg-[#8B5A2B] transition-colors"
                onClick={handleFullPageClick}
              >
                Afficher en plein écran
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">EnhancedLazyImage</h2>
            <p className="mb-4 text-gray-600">
              Composant pour le chargement optimisé des images avec animation de chargement standardisée.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Circle Spinner</h3>
                <EnhancedLazyImage
                  src="https://source.unsplash.com/random/300x200?furniture"
                  className="h-40 w-full rounded"
                  spinnerVariant="circle"
                />
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">Dots Spinner</h3>
                <EnhancedLazyImage
                  src="https://source.unsplash.com/random/300x200?interior"
                  className="h-40 w-full rounded"
                  spinnerVariant="dots"
                />
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Utilitaires de Chargement</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">SectionLoading</h3>
            <p className="mb-4 text-gray-600">
              Pour les sections de page en chargement.
            </p>
            <div className="border rounded">
              <SectionLoading height="h-40" message="Chargement de la section..." />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">InlineLoading</h3>
            <p className="mb-4 text-gray-600">
              Pour les chargements en ligne de texte.
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <span>Chargement des données</span>
              <InlineLoading size="xs" />
            </div>
            <div className="flex items-center space-x-2 mb-2">
              <span>Mise à jour du profil</span>
              <InlineLoading size="xs" variant="circle" />
            </div>
            <div className="flex items-center space-x-2">
              <span>Synchronisation</span>
              <InlineLoading size="xs" variant="pulse" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">ButtonLoading</h3>
            <p className="mb-4 text-gray-600">
              Pour les boutons en état de chargement.
            </p>
            <button
              className="w-full px-4 py-2 bg-[#A67B5B] text-white rounded hover:bg-[#8B5A2B] transition-colors mb-4"
              onClick={handleButtonClick}
              disabled={isLoading}
            >
              {isLoading ? <ButtonLoading text="Envoi en cours..." /> : "Cliquez pour tester"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button className="px-3 py-2 bg-gray-200 text-gray-800 rounded">
                <ButtonLoading text="Chargement..." variant="circle" />
              </button>
              <button className="px-3 py-2 bg-gray-200 text-gray-800 rounded">
                <ButtonLoading text="Patientez..." variant="pulse" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">CardLoading</h3>
            <p className="mb-4 text-gray-600">
              Pour les cartes de produits ou d'articles en chargement.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <CardLoading height="h-40" variant="circle" />
              <CardLoading height="h-40" variant="dots" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">TableLoading</h3>
            <p className="mb-4 text-gray-600">
              Pour les tableaux de données en chargement.
            </p>
            <TableLoading rows={3} cols={3} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md mb-12">
          <h2 className="text-xl font-semibold mb-4">Guide d'utilisation</h2>

          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Importation</h3>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
              {`import {
  FullPageLoading,
  SectionLoading,
  InlineLoading,
  ButtonLoading,
  CardLoading,
  TableLoading
} from '../utils/loadingUtils.jsx';`}
            </pre>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Exemple d'utilisation</h3>
            <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
              {`// Dans un composant React
const MyComponent = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler un chargement
    setTimeout(() => setLoading(false), 2000);
  }, []);

  if (loading) {
    return <SectionLoading message="Chargement des données..." />;
  }

  return (
    <div>Contenu chargé</div>
  );
};`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingUtilsDemo;
