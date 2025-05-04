import React from "react";
import Slider from "react-slick";
import { Link } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Hero = ({ title, description, images }) => {
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

  return (
    <section className="relative w-full">
      <Slider {...heroSettings} className="w-full">
        {images.map((item, index) => (
          <div key={index} className="relative h-[500px]">
            <img src={item.src} alt="Furniture" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-center px-6">
              <h2 className="text-4xl font-bold mb-4">{title || item.text}</h2>
              <p className="text-lg mb-6">{description}</p>
              <Link to="/Produit/AllCat" className="bg-white text-black px-6 py-3 rounded font-semibold">
                Shop Now
              </Link>
            </div>
          </div>
        ))}
      </Slider>
    </section>
  );
};

export default Hero;