import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import LazyImage from '../components/LazyImage';

const Categorie = ({ id, name, image, des }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const categoryRef = useRef(null);
  const cardRef = useRef(null);

  // Effet d'observation pour l'animation d'entrée
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(categoryRef.current);
        }
      },
      { threshold: 0.2 }
    );

    if (categoryRef.current) {
      observer.observe(categoryRef.current);
    }

    return () => {
      if (categoryRef.current) {
        observer.unobserve(categoryRef.current);
      }
    };
  }, []);

  // Effet de suivi du curseur pour l'effet 3D
  const handleMouseMove = (e) => {
    if (!cardRef.current || !isHovered) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // Position X relative à la carte
    const y = e.clientY - rect.top;  // Position Y relative à la carte

    // Calculer la position en pourcentage (0-100)
    const xPercent = Math.floor((x / rect.width) * 100);
    const yPercent = Math.floor((y / rect.height) * 100);

    // Limiter la rotation à un angle modéré
    const rotateY = ((xPercent - 50) / 50) * 2; // -2 à +2 degrés
    const rotateX = ((50 - yPercent) / 50) * 1; // -1 à +1 degrés

    // Mettre à jour la position pour l'effet de surbrillance
    setMousePosition({ x: xPercent, y: yPercent });

    // Appliquer la transformation 3D
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  // Réinitialiser la transformation quand la souris quitte la carte
  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }
    setIsHovered(false);
  };

  return (
    <div
      ref={categoryRef}
      className={`relative overflow-hidden transition-all duration-500 rounded-xl ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
      }`}
      style={{
        transitionDelay: `${id % 3 * 150}ms`
      }}
    >
      {/* Carte avec effet 3D */}
      <div
        ref={cardRef}
        className="bg-white elegant-highlight category-card"
        style={{
          boxShadow: isHovered
            ? '0 20px 25px -5px rgba(166, 123, 91, 0.1), 0 10px 10px -5px rgba(166, 123, 91, 0.04)'
            : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.1s ease-out',
          transformStyle: 'preserve-3d'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {/* Overlay décoratif */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-0 transition-opacity duration-500 z-10 pointer-events-none"
          style={{
            opacity: isHovered ? 0.7 : 0,
            '--x': `${mousePosition.x}%`,
            '--y': `${mousePosition.y}%`
          }}
        ></div>

        {/* Image avec effet de zoom - Optimized with LazyImage */}
        <div className="overflow-hidden h-64 relative depth-element depth-element-1">
          <LazyImage
            src={image}
            alt={name}
            className="w-full h-full transition-all duration-700"
            style={{
              transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              filter: isHovered ? 'brightness(1.05)' : 'brightness(1)'
            }}
            fallbackSrc="/img/placeholder-category.jpg"
          />

          {/* Bordure décorative élégante */}
          <div
            className="absolute inset-0 border-[1px] border-white/20 m-3 rounded-lg transition-all duration-500 depth-element depth-element-2"
            style={{
              opacity: isHovered ? 1 : 0,
              transform: isHovered ? 'scale(0.98) translateZ(10px)' : 'scale(1.02)'
            }}
          ></div>
        </div>

        {/* Contenu texte */}
        <div className="p-6 relative z-20">
          <h4
            className={`text-xl font-light tracking-wide transition-all duration-500 depth-element depth-element-2 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
            style={{
              transitionDelay: `${(id % 3 * 150) + 100}ms`,
              color: isHovered ? '#A67B5B' : '#1a202c',
              transform: isHovered ? 'translateY(-4px) translateZ(15px)' : 'translateY(0)'
            }}
          >
            <span className="relative inline-block">
              {name}
              <span
                className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#A67B5B] transition-all duration-500"
                style={{ width: isHovered ? '100%' : '0%' }}
              ></span>
            </span>
          </h4>

          <h5
            className={`text-gray-500 text-sm mt-3 transition-all duration-500 depth-element depth-element-1 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}
            style={{
              transitionDelay: `${(id % 3 * 150) + 200}ms`,
              maxHeight: isHovered ? '80px' : '40px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: isHovered ? '3' : '2',
              WebkitBoxOrient: 'vertical'
            }}
          >
            {des}
          </h5>

          {/* Bouton avec animation */}
          <div
            className={`mt-4 transition-all duration-500 depth-element depth-element-3 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              transitionDelay: `${(id % 3 * 150) + 300}ms`,
              transform: isHovered ? 'translateY(0) translateZ(20px)' : 'translateY(10px)'
            }}
          >
            <Link to={`/category/${id}`} className="inline-block w-full">
              <button
                className="group relative w-full py-3 px-6 overflow-hidden rounded-md bg-transparent text-sm font-medium transition-all duration-500"
              >
                <span className="absolute inset-0 w-0 bg-[#A67B5B] transition-all duration-500 group-hover:w-full"></span>
                <span className="relative flex items-center justify-center text-black group-hover:text-white transition-colors duration-500">
                  Voir tout
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-2 transition-all duration-500 transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categorie;
