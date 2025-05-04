import React from "react";

const DynamicSubmitButton = ({ label, isLoading, disabled }) => {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className={`inline-block font-light text-white border-[0.5px] border-[#A67B5B] px-12 py-3 text-sm tracking-[0.2em] transition-all duration-300 relative overflow-hidden group ${
        disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      <span className="relative z-10">{label}</span>
      {/* Fond initial */}
      <span className="absolute inset-0 bg-[#A67B5B]"></span>
      {/* Animation de gauche à droite avec couleur moka */}
      <span
        className="absolute inset-0 bg-[#8B5A2B] transform -translate-x-full transition-transform duration-500 ease-out group-hover:translate-x-0"
      ></span>
    </button>
  );
};

export default DynamicSubmitButton;
