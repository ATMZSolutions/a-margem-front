import React from "react";
import PhotoCarousel from "../PhotoCarousel";

const randomImages = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308",
];


const Sobre = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-black text-white">
      <PhotoCarousel images={randomImages} />
    </section>
  );
};

export default Sobre;
