import React, { useState, useEffect } from "react";
import { Button } from "@material-tailwind/react";
import "../style/style.css";
import Categorie from "../Produit/Categorie";
import axios from "axios";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Images for the Hero component
const heroImages = [
  { src: "/img/summer-2025-9435.png", text: "Discover Your Perfect Furniture" },
  { src: "/img/summer-2025-9436.png", text: "Style & Comfort in Every Detail" },
  { src: "/img/summer-2025-9437.png", text: "Find Your Dream Interior" },
];

const heroSettings = {
  dots: true,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
  arrows: false,
};

export function AllCat() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("https://laravel-api.fly.dev/api/categories")
      .then((response) => {

        setCategories(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError("Erreur lors de la récupération des catégories");
        setLoading(false);
      });
  }, []);


  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (categories.length === 0) {
    return <div>Aucune catégorie disponible pour le moment.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-serif">
      {/* Use the Hero component */}
      <section className="relative w-full">
        <Slider {...heroSettings} className="w-full">
          {heroImages.map((slide, index) => (
            <div key={index} className="relative h-[500px]">
              <img
                src={slide.src}
                alt={slide.text}
                className="w-full h-full object-cover rounded-lg shadow-md"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-center px-6">
                <h2 className="text-5xl font-bold mb-4 tracking-wide">{slide.text}</h2>
              </div>
            </div>
          ))}
        </Slider>
      </section>
      <section className="py-16 px-6">
        <h2 className="title">
        <h1 className="text-5xl font-extralight tracking-widest mb-2 transition-all duration-700 transform">NOS CATEGORIES</h1>
        <div className="w-24 h-px bg-yellow-700 mx-auto my-6"></div>
          <i>Découvrez nos produits</i>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {categories.map((cat) => (
            <Categorie
              key={cat.id}
              id={cat.id}
              name={cat.nom_categorie}
              image={cat.image_categorie}
              des={cat.description_categorie}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default AllCat;
