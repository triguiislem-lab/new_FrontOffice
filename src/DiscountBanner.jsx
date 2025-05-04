import React, { useEffect, useState } from "react";

const DiscountBanner = ({ isOpen, onClose }) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu la bannière
    const hasSeenBanner = localStorage.getItem("hasSeenDiscountBanner");

    // Si ce n'est pas le cas, afficher la bannière
    if (!hasSeenBanner) {
      setShowBanner(true);
    }
  }, []);

  const handleClose = () => {
    // Fermer la bannière et marquer qu'elle a été vue
    localStorage.setItem("hasSeenDiscountBanner", "true");
    setShowBanner(false);
    if (onClose) onClose(); // Exécuter la fonction onClose, si elle est fournie
  };

  if (!showBanner) return null; // Si la bannière ne doit pas s'afficher, ne rien afficher

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Offre Spéciale</h2>
        <p className="text-lg">
          Profitez de 10% de réduction sur votre première commande avec le code "WELCOME10"
        </p>
        <div className="flex justify-end mt-6">
          <button
            className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800"
            onClick={handleClose}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscountBanner;
