import PropTypes from "prop-types";
import { Typography } from "@material-tailwind/react";

const year = new Date().getFullYear();

export function Footer({ title, description, copyright }) {

  return (
    <footer className="bg-white text-gray-700 pt-12 pb-8">
      {/* Main Footer Content - Enhanced Design */}
      <div className="container mx-auto px-6">
        {/* Footer navigation with improved styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Column 1 - Client Account */}
          <div className="transform transition-all duration-500 hover:translate-y-[-5px]">
            <Typography variant="h6" className="font-medium mb-5 text-gray-800 relative inline-block">
              <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#A67B5B] after:transition-all after:duration-700 group-hover:after:w-full pb-2">
                Mon Compte
              </span>
            </Typography>
            <ul className="space-y-3 mt-6">
              <li>
                <a href="/Profile" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Mon profil</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Mes commandes</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Mes favoris</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Suivre ma commande</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2 - Services */}
          <div className="transform transition-all duration-500 hover:translate-y-[-5px]">
            <Typography variant="h6" className="font-medium mb-5 text-gray-800 relative inline-block">
              <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#A67B5B] after:transition-all after:duration-700 group-hover:after:w-full pb-2">
                Nos Services
              </span>
            </Typography>
            <ul className="space-y-3 mt-6">
              <li>
                <a href="#" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Livraison à domicile</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Retrait en boutique</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Modes de paiement</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Programme fidélité</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Cartes cadeaux</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3 - About */}
          <div className="transform transition-all duration-500 hover:translate-y-[-5px]">
            <Typography variant="h6" className="font-medium mb-5 text-gray-800 relative inline-block">
              <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#A67B5B] after:transition-all after:duration-700 group-hover:after:w-full pb-2">
                À Propos
              </span>
            </Typography>
            <ul className="space-y-3 mt-6">
              <li>
                <a href="/marque" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Nos marques</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Notre histoire</span>
                </a>
              </li>
              <li>
                <a href="#" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Catalogues</span>
                </a>
              </li>
              <li>
                <a href="/ProfessionalPage" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Espace pro</span>
                </a>
              </li>
              <li>
                <a href="/DevenirAffilie" className="group flex items-center text-gray-600 hover:text-[#A67B5B] transition-colors duration-300">
                  <span className="mr-2 text-[#A67B5B] transition-transform duration-300 group-hover:translate-x-1">›</span>
                  <span className="transition-colors duration-300">Devenir partenaire</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4 - Contact */}
          <div className="transform transition-all duration-500 hover:translate-y-[-5px]">
            <Typography variant="h6" className="font-medium mb-5 text-gray-800 relative inline-block">
              <span className="relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-[#A67B5B] after:transition-all after:duration-700 group-hover:after:w-full pb-2">
                Besoin d'aide ?
              </span>
            </Typography>
            <p className="mb-5 text-gray-600 text-sm leading-relaxed mt-6">
              Nos conseillers sont à votre disposition pour vous accompagner dans vos choix et répondre à toutes vos questions.
            </p>

            <div className="space-y-4">
              <a href="#" className="flex items-center group p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:shadow-sm">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-green-100 transition-colors duration-300">
                  <i className="fa-brands fa-whatsapp text-green-500 text-lg"></i>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-800">WhatsApp</span>
                  <p className="text-xs text-gray-500 mt-0.5">Réponse rapide par message</p>
                </div>
              </a>

              <a href="#" className="flex items-center group p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-blue-100 transition-colors duration-300">
                  <i className="fa-solid fa-phone text-blue-500 text-lg"></i>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-800">+216 12345678</span>
                  <p className="text-xs text-gray-500 mt-0.5">Lun-Ven, 9h-18h</p>
                </div>
              </a>

              <a href="#" className="flex items-center group p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:shadow-sm">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mr-3 flex-shrink-0 group-hover:bg-purple-100 transition-colors duration-300">
                  <i className="fa-regular fa-envelope text-purple-500 text-lg"></i>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-800">Email</span>
                  <p className="text-xs text-gray-500 mt-0.5">contact@jihen-line.com</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Social Media Links - Enhanced with modern design */}
        <div className="mt-16 pt-10 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0 transform transition-all duration-500 hover:scale-105">
              <a href="/" className="block">
                <img
                  src="/img/logo.jfif"
                  alt="Logo"
                  className="h-16 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                />
              </a>
              <p className="text-sm text-gray-500 mt-3 max-w-xs">
                Votre showroom en ligne de marques prestigieuses pour sublimer votre intérieur
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end">
              <div className="flex space-x-4 mb-6">
                <a
                  href="https://www.facebook.com/CarreBlancParisSfax?locale=fr_FR"
                  className="text-gray-700 hover:text-blue-600 transition-all duration-300 w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 hover:border-blue-200 hover:bg-blue-50 shadow-sm hover:shadow-md hover:scale-110"
                  aria-label="Facebook"
                >
                  <i className="fa-brands fa-facebook-f text-xl"></i>
                </a>
                <a
                  href="https://www.instagram.com/carre_blanc_jline_sfax/"
                  className="text-gray-700 hover:text-pink-600 transition-all duration-300 w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 hover:border-pink-200 hover:bg-pink-50 shadow-sm hover:shadow-md hover:scale-110"
                  aria-label="Instagram"
                >
                  <i className="fa-brands fa-instagram text-xl"></i>
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-red-600 transition-all duration-300 w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 hover:border-red-200 hover:bg-red-50 shadow-sm hover:shadow-md hover:scale-110"
                  aria-label="Pinterest"
                >
                  <i className="fa-brands fa-pinterest text-xl"></i>
                </a>
                <a
                  href="#"
                  className="text-gray-700 hover:text-blue-400 transition-all duration-300 w-12 h-12 flex items-center justify-center rounded-full border border-gray-200 hover:border-blue-200 hover:bg-blue-50 shadow-sm hover:shadow-md hover:scale-110"
                  aria-label="Twitter"
                >
                  <i className="fa-brands fa-twitter text-xl"></i>
                </a>
              </div>

              <div className="text-sm text-gray-600 text-center md:text-right">
                <p className="mb-1 font-medium">© {year} Jihen-line</p>
                <p className="text-xs text-gray-500">Tous droits réservés | Showroom en ligne de marques prestigieuses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Service Highlights - Enhanced with modern design */}
        <div className="mt-12 pt-10 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex items-center p-6 bg-gray-50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 hover:bg-white group transform hover:scale-105">
              <div className="w-14 h-14 rounded-full bg-[#A67B5B]/10 flex items-center justify-center mr-5 flex-shrink-0 group-hover:bg-[#A67B5B]/20 transition-all duration-300 group-hover:scale-110">
                <i className="fa-solid fa-lock text-[#A67B5B] text-xl"></i>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Paiement sécurisé</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Transactions cryptées et sécurisées pour vos achats en ligne</p>
              </div>
            </div>

            <div className="flex items-center p-6 bg-gray-50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 hover:bg-white group transform hover:scale-105">
              <div className="w-14 h-14 rounded-full bg-[#A67B5B]/10 flex items-center justify-center mr-5 flex-shrink-0 group-hover:bg-[#A67B5B]/20 transition-all duration-300 group-hover:scale-110">
                <i className="fa-solid fa-truck text-[#A67B5B] text-xl"></i>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Livraison offerte</h4>
                <p className="text-xs text-gray-500 leading-relaxed">En boutique ou à domicile pour toute commande supérieure à 150€</p>
              </div>
            </div>

            <div className="flex items-center p-6 bg-gray-50 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 hover:bg-white group transform hover:scale-105">
              <div className="w-14 h-14 rounded-full bg-[#A67B5B]/10 flex items-center justify-center mr-5 flex-shrink-0 group-hover:bg-[#A67B5B]/20 transition-all duration-300 group-hover:scale-110">
                <i className="fa-solid fa-headset text-[#A67B5B] text-xl"></i>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Service client</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Assistance personnalisée 5j/7 de 9h à 18h pour vous accompagner</p>
              </div>
            </div>
          </div>

          {/* Legal links - Enhanced */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap justify-center gap-x-10 gap-y-3 text-xs text-gray-500">
            <a href="#" className="hover:text-[#A67B5B] transition-all duration-300 hover:underline">Conditions générales</a>
            <a href="#" className="hover:text-[#A67B5B] transition-all duration-300 hover:underline">Politique de confidentialité</a>
            <a href="#" className="hover:text-[#A67B5B] transition-all duration-300 hover:underline">Mentions légales</a>
            <a href="#" className="hover:text-[#A67B5B] transition-all duration-300 hover:underline">Cookies</a>
            <a href="#" className="hover:text-[#A67B5B] transition-all duration-300 hover:underline">Plan du site</a>
            <a href="#" className="hover:text-[#A67B5B] transition-all duration-300 hover:underline">FAQ</a>
          </div>


        </div>
      </div>
    </footer>
  );
}

Footer.defaultProps = {
  title: "Jihen-line",
  description: "Showroom en ligne de marques prestigieuses",
  copyright: `Copyright © ${year} Jihen-line. Tous droits réservés.`,
};

Footer.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  copyright: PropTypes.node,
};

Footer.displayName = "/src/widgets/layout/footer.jsx";

export default Footer;