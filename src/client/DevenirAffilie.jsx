import React from "react";
import { Typography, Input, Textarea, Select, Option } from "@material-tailwind/react";
import DynamicSubmitButton from "../components/DynamicSubmitButton";

export function DevenirAffilie() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 font-serif">
      {/* Hero Section */}
      <div className="relative py-28 bg-[#F5F2EE]">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute w-96 h-96 rounded-full bg-[#D4B78F] blur-3xl -top-20 -left-20"></div>
          <div className="absolute w-96 h-96 rounded-full bg-[#D4B78F] blur-3xl -bottom-20 -right-20"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-xs uppercase tracking-[0.3em] text-[#A67B5B] mb-4">Programme Exclusif</p>
            <h1 className="text-4xl md:text-5xl font-extralight tracking-wide mb-6">
              Devenir Distributeur
            </h1>
            <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-8 opacity-60"></div>
            <p className="text-base text-gray-600 font-light leading-relaxed tracking-wide">
              Rejoignez notre réseau de distributeurs d'exception et bénéficiez de notre expertise, notre support et nos produits exclusifs pour une clientèle exigeante.
            </p>
          </div>
        </div>
      </div>

      {/* Avantages Section */}
      <div className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-light tracking-wide">Pourquoi devenir distributeur ?</h2>
          <div className="w-12 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-60"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Box 1 */}
          <div className="group bg-white p-10 border border-gray-100 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-6 text-[#A67B5B] opacity-80 transition-all duration-300 group-hover:opacity-100">
              <i className="fas fa-globe text-2xl"></i>
            </div>
            <h3 className="font-light text-xl mb-4 tracking-wide">Entreprise internationale</h3>
            <div className="w-8 h-[0.5px] bg-[#A67B5B] mb-5 transition-all duration-300 group-hover:w-16 opacity-60"></div>
            <p className="text-gray-500 font-light leading-relaxed">
              Avec une implantation unique et aux dimensions exceptionnelles, notre entreprise compte plus de 100 collaborateurs et est le commerce de gros pour l'intérieur et la décoration de luxe.
            </p>
          </div>

          {/* Box 2 */}
          <div className="group bg-white p-10 border border-gray-100 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-6 text-[#A67B5B] opacity-80 transition-all duration-300 group-hover:opacity-100">
              <i className="fas fa-star text-2xl"></i>
            </div>
            <h3 className="font-light text-xl mb-4 tracking-wide">Une marque forte</h3>
            <div className="w-8 h-[0.5px] bg-[#A67B5B] mb-5 transition-all duration-300 group-hover:w-16 opacity-60"></div>
            <p className="text-gray-500 font-light leading-relaxed">
              Notre marque mise entièrement sur des collections tendance et qui lancent la mode. Deux fois par an, nous sortons une collection exclusive avec des pièces uniques et raffinées.
            </p>
          </div>

          {/* Box 3 */}
          <div className="group bg-white p-10 border border-gray-100 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-6 text-[#A67B5B] opacity-80 transition-all duration-300 group-hover:opacity-100">
              <i className="fas fa-bolt text-2xl"></i>
            </div>
            <h3 className="font-light text-xl mb-4 tracking-wide">Service premium</h3>
            <div className="w-8 h-[0.5px] bg-[#A67B5B] mb-5 transition-all duration-300 group-hover:w-16 opacity-60"></div>
            <p className="text-gray-500 font-light leading-relaxed">
              En tant que distributeur, vous bénéficiez d'un service premium avec une approche personnalisée. Nous visons l'excellence à chaque étape, de la commande à la livraison et au service après-vente.
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire Section */}
      <div className="py-24 bg-[#F5F2EE]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-light tracking-wide">Formulaire de demande</h2>
            <div className="w-12 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-60"></div>
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              Complétez le formulaire ci-dessous pour rejoindre notre réseau de distributeurs et bénéficier de nos services exclusifs.
            </p>
          </div>

          <form className="bg-white border border-gray-100 p-12">
            <div className="grid md:grid-cols-2 gap-12">
              {/* Colonne gauche */}
              <div className="space-y-6">
                <div>
                  <label className="block mb-2 text-sm font-light text-gray-600">Nom de l'entreprise *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors"
                    placeholder="Votre entreprise"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-light text-gray-600">Type d'entreprise *</label>
                  <select
                    className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors appearance-none"
                  >
                    <option value="">Sélectionnez le type</option>
                    <option value="retail">Commerce de détail</option>
                    <option value="wholesale">Commerce de gros</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-light text-gray-600">Code postal *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors"
                      placeholder="Code postal"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-light text-gray-600">Ville *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors"
                      placeholder="Votre ville"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-light text-gray-600">Rue et numéro *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors"
                    placeholder="Votre adresse complète"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-light text-gray-600">Pays</label>
                  <input
                    type="text"
                    value="TUNISIE"
                    readOnly
                    className="w-full px-4 py-3 bg-transparent border-b border-gray-200 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Colonne droite */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-light text-gray-600">Prénom *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors"
                      placeholder="Votre prénom"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-light text-gray-600">Nom *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors"
                      placeholder="Votre nom"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-light text-gray-600">Adresse email *</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors"
                    placeholder="votre@email.com"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block mb-2 text-sm font-light text-gray-600">Téléphone *</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors"
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-light text-gray-600">Mobile</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors"
                      placeholder="+216 XX XXX XXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-light text-gray-600">Numéro de TVA</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors"
                    placeholder="TN XXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-light text-gray-600">Commentaire</label>
                  <textarea
                    className="w-full px-4 py-3 bg-transparent border-b border-gray-200 focus:border-[#A67B5B] focus:outline-none transition-colors resize-none"
                    placeholder="Partagez-nous des informations supplémentaires concernant votre demande..."
                    rows={4}
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="mt-16 text-center">
              <DynamicSubmitButton
                label="ENVOYER MA DEMANDE"
                isLoading={false}
                disabled={false}
              />
              <p className="mt-4 text-xs text-gray-500 font-light">* Champs obligatoires</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DevenirAffilie;