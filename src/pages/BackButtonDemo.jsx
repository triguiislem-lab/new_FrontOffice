import React from "react";
import BackButton from "../Components/BackButton";

/**
 * Demo page to showcase the BackButton component variants
 */
const BackButtonDemo = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-light text-gray-900 mb-8 text-center">Composant Bouton Retour</h1>
      
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h2 className="text-xl font-medium text-gray-800 mb-6">Variantes de style</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Variante par défaut</h3>
            <div className="flex flex-col space-y-4">
              <BackButton variant="default" size="sm" label="Retour (petit)" />
              <BackButton variant="default" label="Retour (moyen)" />
              <BackButton variant="default" size="lg" label="Retour (grand)" />
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Variante contour</h3>
            <div className="flex flex-col space-y-4">
              <BackButton variant="outline" size="sm" label="Retour (petit)" />
              <BackButton variant="outline" label="Retour (moyen)" />
              <BackButton variant="outline" size="lg" label="Retour (grand)" />
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Variante texte</h3>
            <div className="flex flex-col space-y-4">
              <BackButton variant="text" size="sm" label="Retour (petit)" />
              <BackButton variant="text" label="Retour (moyen)" />
              <BackButton variant="text" size="lg" label="Retour (grand)" />
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Variante remplie</h3>
            <div className="flex flex-col space-y-4">
              <BackButton variant="filled" size="sm" label="Retour (petit)" />
              <BackButton variant="filled" label="Retour (moyen)" />
              <BackButton variant="filled" size="lg" label="Retour (grand)" />
            </div>
          </div>
        </div>
        
        <h2 className="text-xl font-medium text-gray-800 mb-6">Options supplémentaires</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Sans icône</h3>
            <div className="flex flex-col space-y-4">
              <BackButton variant="default" showIcon={false} label="Retour sans icône" />
              <BackButton variant="outline" showIcon={false} label="Retour sans icône" />
              <BackButton variant="filled" showIcon={false} label="Retour sans icône" />
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Textes personnalisés</h3>
            <div className="flex flex-col space-y-4">
              <BackButton variant="default" label="Retour à l'accueil" />
              <BackButton variant="outline" label="Page précédente" />
              <BackButton variant="filled" label="Annuler" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <BackButton 
          variant="outline" 
          label="Retour à la page précédente" 
          className="mx-auto"
        />
      </div>
    </div>
  );
};

export default BackButtonDemo;
