import { useState } from 'react';
import { Mail, Building, Phone, UserCheck, Percent, Clock, Award, Globe, User } from 'lucide-react';
import DynamicButton from '@/Components/DynamicButton';
import DynamicSubmitButton from '@/components/DynamicSubmitButton';

export default function ProfessionalPage() {
  const [formData, setFormData] = useState({
    company_name: '',
    name: '',
    email: '',
    phone: '',
    business_type: 'Retail',
    address: '',
    website: '',
    motivation: ''
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
    const nameRegex = /^[a-zA-Z\s]+$/;
    const newErrors = {};

    if (!formData.company_name) newErrors.company_name = "Le nom de l'entreprise est requis";
    else if (formData.company_name.length > 255) newErrors.company_name = "Le nom de l'entreprise est trop long";

    if (!formData.name) {
      newErrors.name = "Le nom du demandeur est requis";
    } else if (formData.name.length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    } else if (!nameRegex.test(formData.name)) {
      newErrors.name = "Le nom ne doit contenir que des lettres et des espaces";
    }

    if (!formData.email) {
      newErrors.email = "L'email est requis";
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = "L'email doit être une adresse email valide";
    } else if (formData.email.length > 255) {
      newErrors.email = "L'email ne doit pas dépasser 255 caractères";
    }

    if (!formData.phone) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Le téléphone doit contenir 10 à 15 chiffres et commencer par un code pays (ex: +33)';
    }

    if (!formData.business_type) newErrors.business_type = "Le type d'activité est requis";

    if (!formData.address) {
      newErrors.address = "L'adresse est requise";
    } else if (formData.address.length < 5) {
      newErrors.address = "L'adresse doit contenir au moins 5 caractères";
    }

    if (!formData.motivation) {
      newErrors.motivation = "La motivation est requise";
    } else if (formData.motivation.length < 10) {
      newErrors.motivation = "La motivation doit contenir au moins 10 caractères";
    }

    if (formData.website && !urlRegex.test(formData.website)) {
      newErrors.website = 'Le site web doit être une URL valide';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);
    setIsLoading(true);

    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        company_name: formData.company_name,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        business_type: formData.business_type,
        address: formData.address,
        website: formData.website || null,
        motivation: formData.motivation
      };

      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userResponse = await fetch('https://laravel-api.fly.dev/api/clients', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            payload.user_id = userData.id;
          } else {
            console.log('Failed to fetch user data:', userResponse.status, userResponse.statusText);
          }
        } catch (userError) {
          console.log('Error fetching user data:', userError.message);
        }
      }

      console.log('Submitting payload:', payload);

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Ajout d'un timestamp pour éviter les problèmes de cache
      const url = `https://laravel-api.fly.dev/api/partner-requests?_t=${Date.now()}`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      console.log('API Response Status:', response.status, response.statusText);

      // Récupérer le texte brut de la réponse pour le débogage
      const responseText = await response.text();
      console.log('API Response Text:', responseText);

      // Essayer de parser la réponse en JSON
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('API Response Data:', responseData);
      } catch (e) {
        console.error('Erreur lors du parsing de la réponse JSON:', e);
        setGeneralError('Erreur de communication avec le serveur. Veuillez réessayer plus tard.');
        return;
      }

      if (!response.ok) {
        console.log('API Error Response:', responseData);

        if (response.status === 422) {
          setErrors(responseData.errors || {});
          setGeneralError('Veuillez corriger les erreurs dans le formulaire');
        } else {
          setGeneralError(`Erreur ${response.status}: ${responseData.message || 'Une erreur est survenue lors de l\'envoi'}`);
        }
        return;
      }

      // Si la réponse est OK mais ne contient pas de données
      if (!responseData) {
        console.warn('Réponse OK mais sans données');
        setFormSubmitted(true); // On considère que c'est un succès quand même
        return;
      }

      const successData = await response.json();
      console.log('API Success Response:', successData);

      setFormSubmitted(true);
      setFormData({
        company_name: '',
        name: '',
        email: '',
        phone: '',
        business_type: 'Retail',
        address: '',
        website: '',
        motivation: ''
      });
    } catch (err) {
      console.error('Submission Error:', err.message);
      setGeneralError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif">
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
              Partenaires Professionnels
            </h1>
            <div className="w-16 h-[0.5px] bg-[#A67B5B] mx-auto my-8 opacity-60"></div>
            <p className="text-base text-gray-600 font-light leading-relaxed tracking-wide">
              Des avantages exclusifs pour les architectes, décorateurs d'intérieur, hôteliers et tous les professionnels du design qui recherchent l'excellence et le raffinement.
            </p>
          </div>
        </div>
      </div>

      {/* Avantages Section */}
      <div className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-light tracking-wide">Pourquoi devenir partenaire ?</h2>
          <div className="w-12 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-60"></div>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          <div className="group bg-white p-10 border border-gray-100 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-6 text-[#A67B5B] opacity-80 transition-all duration-300 group-hover:opacity-100">
              <Percent size={28} strokeWidth={1.5} />
            </div>
            <h3 className="font-light text-xl mb-4 tracking-wide">Remises Exclusives</h3>
            <div className="w-8 h-[0.5px] bg-[#A67B5B] mb-5 transition-all duration-300 group-hover:w-16 opacity-60"></div>
            <p className="text-gray-500 font-light leading-relaxed">
              Bénéficiez de 15% à 25% de remise sur l'ensemble de notre catalogue de produits de luxe et collections exclusives.
            </p>
          </div>

          <div className="group bg-white p-10 border border-gray-100 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-6 text-[#A67B5B] opacity-80 transition-all duration-300 group-hover:opacity-100">
              <UserCheck size={28} strokeWidth={1.5} />
            </div>
            <h3 className="font-light text-xl mb-4 tracking-wide">Conseiller Dédié</h3>
            <div className="w-8 h-[0.5px] bg-[#A67B5B] mb-5 transition-all duration-300 group-hover:w-16 opacity-60"></div>
            <p className="text-gray-500 font-light leading-relaxed">
              Un conseiller personnel pour vous accompagner dans tous vos projets et vous offrir un service sur mesure.
            </p>
          </div>

          <div className="group bg-white p-10 border border-gray-100 transition-all duration-500 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mb-6 text-[#A67B5B] opacity-80 transition-all duration-300 group-hover:opacity-100">
              <Clock size={28} strokeWidth={1.5} />
            </div>
            <h3 className="font-light text-xl mb-4 tracking-wide">Accès Prioritaire</h3>
            <div className="w-8 h-[0.5px] bg-[#A67B5B] mb-5 transition-all duration-300 group-hover:w-16 opacity-60"></div>
            <p className="text-gray-500 font-light leading-relaxed">
              Accès en avant-première aux nouvelles collections et invitations aux événements exclusifs réservés aux partenaires.
            </p>
          </div>
        </div>

        <div className="mt-16 bg-white border border-gray-100 p-12">
          <h3 className="font-light text-xl mb-8 tracking-wide text-center">Services Premium Additionnels</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4">
              <Award className="text-[#A67B5B] mt-1 opacity-80" size={18} strokeWidth={1.5} />
              <div>
                <p className="text-gray-800 font-light mb-1">Événements networking exclusifs</p>
                <p className="text-gray-500 text-sm font-light">Rencontrez d'autres professionnels du luxe lors de nos événements privés</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Award className="text-[#A67B5B] mt-1 opacity-80" size={18} strokeWidth={1.5} />
              <div>
                <p className="text-gray-800 font-light mb-1">Livraison prioritaire et installation</p>
                <p className="text-gray-500 text-sm font-light">Service de livraison white-glove et installation par nos experts</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Award className="text-[#A67B5B] mt-1 opacity-80" size={18} strokeWidth={1.5} />
              <div>
                <p className="text-gray-800 font-light mb-1">Formations exclusives</p>
                <p className="text-gray-500 text-sm font-light">Formations sur nos produits, matériaux et techniques de fabrication</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Award className="text-[#A67B5B] mt-1 opacity-80" size={18} strokeWidth={1.5} />
              <div>
                <p className="text-gray-800 font-light mb-1">Service de personnalisation</p>
                <p className="text-gray-500 text-sm font-light">Créez des pièces uniques adaptées aux exigences de vos clients</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire Section */}
      <div className="py-24 bg-[#F5F2EE]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-light tracking-wide">Rejoignez notre cercle d'excellence</h2>
            <div className="w-12 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-60"></div>
            <p className="text-gray-600 font-light max-w-2xl mx-auto">
              Complétez le formulaire ci-dessous pour rejoindre notre programme partenaires et bénéficier de nos services exclusifs.
            </p>
          </div>

          {formSubmitted ? (
            <div className="bg-white p-16 text-center border border-gray-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F5F2EE] mb-6">
                <svg className="w-8 h-8 text-[#A67B5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-light tracking-wide mb-4">Demande envoyée avec succès</h3>
              <div className="w-12 h-[0.5px] bg-[#A67B5B] mx-auto my-6 opacity-60"></div>
              <p className="text-gray-600 font-light mb-10 max-w-lg mx-auto">
                Merci pour votre intérêt. Notre équipe vous contactera dans les plus brefs délais pour finaliser votre inscription au programme partenaires.
              </p>
              <DynamicButton
                label="NOUVELLE DEMANDE"
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  setFormSubmitted(false);
                }}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-100 p-12">
              {generalError && (
                <div className="text-center p-6 mb-8 bg-red-50/50 text-red-600 border border-red-100">
                  <p className="font-light">{generalError}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-12">
                <div>
                  <h3 className="font-light text-lg mb-8 flex items-center gap-3 text-gray-800">
                    <Building size={18} strokeWidth={1.5} className="text-[#A67B5B] opacity-80" />
                    <span>Informations de l'entreprise</span>
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="company_name" className="block mb-2 text-sm font-light text-gray-600">Nom de l'entreprise *</label>
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 bg-transparent border-b focus:outline-none transition-colors ${errors.company_name ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#A67B5B]'}`}
                      />
                      {errors.company_name && <p className="text-red-500 text-xs mt-2 font-light">{errors.company_name}</p>}
                    </div>

                    <div>
                      <label htmlFor="business_type" className="block mb-2 text-sm font-light text-gray-600">Type d'activité *</label>
                      <select
                        id="business_type"
                        name="business_type"
                        value={formData.business_type}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-transparent border-b appearance-none focus:outline-none transition-colors ${errors.business_type ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#A67B5B]'}`}
                      >
                        <option value="">Sélectionnez une activité</option>
                        <option value="Architect">Architecte</option>
                        <option value="Decorator">Décorateur d'intérieur</option>
                        <option value="Hotel">Hôtellerie</option>
                        <option value="Restaurant">Restauration</option>
                        <option value="RealEstate">Immobilier</option>
                        <option value="Retail">Retail</option>
                        <option value="Other">Autre</option>
                      </select>
                      {errors.business_type && <p className="text-red-500 text-xs mt-2 font-light">{errors.business_type}</p>}
                    </div>

                    <div>
                      <label htmlFor="address" className="block mb-2 text-sm font-light text-gray-600">Adresse *</label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        rows="3"
                        className={`w-full px-4 py-3 bg-transparent border-b resize-none focus:outline-none transition-colors ${errors.address ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#A67B5B]'}`}
                        placeholder="Adresse complète (rue, ville, code postal)"
                      />
                      {errors.address && <p className="text-red-500 text-xs mt-2 font-light">{errors.address}</p>}
                    </div>

                    <div>
                      <label htmlFor="website" className="block mb-2 text-sm font-light text-gray-600">Site web</label>
                      <div className="flex items-center border-b border-gray-200 focus-within:border-[#A67B5B] transition-colors">
                        <Globe className="text-[#A67B5B] opacity-60 ml-1" size={16} strokeWidth={1.5} />
                        <input
                          type="url"
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 bg-transparent focus:outline-none ${errors.website ? 'text-red-500' : ''}`}
                          placeholder="https://example.com"
                        />
                      </div>
                      {errors.website && <p className="text-red-500 text-xs mt-2 font-light">{errors.website}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-light text-lg mb-8 flex items-center gap-3 text-gray-800">
                    <Phone size={18} strokeWidth={1.5} className="text-[#A67B5B] opacity-80" />
                    <span>Informations de contact</span>
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block mb-2 text-sm font-light text-gray-600">Nom du demandeur *</label>
                      <div className="flex items-center border-b border-gray-200 focus-within:border-[#A67B5B] transition-colors">
                        <User className="text-[#A67B5B] opacity-60 ml-1" size={16} strokeWidth={1.5} />
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className={`w-full px-4 py-3 bg-transparent focus:outline-none ${errors.name ? 'text-red-500' : ''}`}
                        />
                      </div>
                      {errors.name && <p className="text-red-500 text-xs mt-2 font-light">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="email" className="block mb-2 text-sm font-light text-gray-600">Email professionnel *</label>
                      <div className="flex items-center border-b border-gray-200 focus-within:border-[#A67B5B] transition-colors">
                        <Mail className="text-[#A67B5B] opacity-60 ml-1" size={16} strokeWidth={1.5} />
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className={`w-full px-4 py-3 bg-transparent focus:outline-none ${errors.email ? 'text-red-500' : ''}`}
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-2 font-light">{errors.email}</p>}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block mb-2 text-sm font-light text-gray-600">Téléphone *</label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 bg-transparent border-b focus:outline-none transition-colors ${errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#A67B5B]'}`}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-2 font-light">{errors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="motivation" className="block mb-2 text-sm font-light text-gray-600">Motivation / Besoins spécifiques *</label>
                      <textarea
                        id="motivation"
                        name="motivation"
                        value={formData.motivation}
                        onChange={handleChange}
                        required
                        rows="4"
                        className={`w-full px-4 py-3 bg-transparent border-b resize-none focus:outline-none transition-colors ${errors.motivation ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#A67B5B]'}`}
                        placeholder="Décrivez vos projets actuels ou vos besoins spécifiques..."
                      />
                      {errors.motivation && <p className="text-red-500 text-xs mt-2 font-light">{errors.motivation}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 text-center">
                <DynamicSubmitButton
                  label={isLoading ? 'TRAITEMENT EN COURS...' : 'ENVOYER MA DEMANDE'}
                  isLoading={isLoading}
                  disabled={isLoading}
                />
                <p className="mt-4 text-xs text-gray-500 font-light">* Champs obligatoires</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}