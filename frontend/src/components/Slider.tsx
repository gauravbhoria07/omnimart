import { useState, useEffect } from 'react';
import techBanner from '../assets/tech_banner.png';
import fashionBanner from '../assets/fashion_banner.png';
import luxuryBanner from '../assets/luxury_banner.png';

interface Slide {
  id: number;
  tag: string;
  title: string;
  description: string;
  image: string;
}

const slides: Slide[] = [
  {
    id: 1,
    tag: 'Next-Gen Technology',
    title: 'OMNIMART TECH COLLECTION',
    description: 'Elevate your workspace with our curated range of minimalist mechanical keyboards and high-precision mice.',
    image: techBanner,
  },
  {
    id: 2,
    tag: 'Curated Apparel',
    title: 'THE MINIMALIST ATTIRE',
    description: 'Discover luxury organic clothing designed for timeless comfort, styling, and modern aesthetics.',
    image: fashionBanner,
  },
  {
    id: 3,
    tag: 'Premium Aromas',
    title: 'SIGNATURE FRAGRANCES',
    description: 'Immerse yourself in our premium selection of dark, mysterious perfumes crafted for true sophistication.',
    image: luxuryBanner,
  },
];

export default function Slider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrent((current + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrent((current - 1 + slides.length) % slides.length);
  };

  return (
    <div className="slider-container">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`slide ${index === current ? 'active' : ''}`}
        >
          <div className="slide-overlay"></div>
          <img src={slide.image} alt={slide.title} className="slide-bg-img" />
          <div className="slide-content">
            <span className="slide-tag">{slide.tag}</span>
            <h2 className="slide-title">{slide.title}</h2>
            <p className="slide-description">{slide.description}</p>
          </div>
        </div>
      ))}
      <button className="slider-btn prev" onClick={prevSlide} aria-label="Previous Slide">
        &larr;
      </button>
      <button className="slider-btn next" onClick={nextSlide} aria-label="Next Slide">
        &rarr;
      </button>
      <div className="slider-dots">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`slider-dot ${index === current ? 'active' : ''}`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  );
}
