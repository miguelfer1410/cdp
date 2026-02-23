import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './Hero.css';

const Hero = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('http://localhost:5285/api/herobanner');
        if (response.ok) {
          const data = await response.json();
          console.log('Banners carregados:', data);
          setBanners(data || []);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
      }
    };

    fetchBanners();
  }, []);

  // Auto-play com controle de transição
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % (banners.length + 1));
        setIsTransitioning(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const nextSlide = () => {
    goToSlide((currentIndex + 1) % (banners.length + 1));
  };

  const prevSlide = () => {
    goToSlide((currentIndex - 1 + banners.length + 1) % (banners.length + 1));
  };

  const totalSlides = banners.length + 1; // Hero + banners
  const isHeroSlide = currentIndex === 0;

  return (
    <section className="hero">
      {/* Slide 0: Hero Original */}
      {isHeroSlide && (
        <div className="hero-slide hero-default">
          <div className="container hero-content">
            <div className="hero-text">
              <h1>Clube Desportivo <br /> Da Póvoa</h1>
              <p className="subtitle">Tradição, Paixão e Excelência no Desporto</p>
              <p className="description">
                Unidos pelo amor ao desporto e dedicados à formação de atletas e à construção de uma comunidade forte.
              </p>
              <div className="hero-buttons">
                <a href="/registo" className="btn btn-white">Tornar-se Sócio</a>
                <a href="/clube" className="btn btn-outline">Conhecer o Clube</a>
              </div>
            </div>
            <div className="hero-image">
              <img src="/CDP_logo.png" alt="Emblema CDP" className="hero-emblem" />
            </div>
          </div>
        </div>
      )}

      {/* Slides 1+: Imagens dos Banners */}
      {!isHeroSlide && banners[currentIndex - 1] && (
        <div className="hero-slide hero-banner">
          <img
            src={`http://localhost:5285${banners[currentIndex - 1].imageUrl}`}
            alt={`Banner ${currentIndex}`}
            className="hero-banner-image"
          />
        </div>
      )}

      {/* Setas - aparecem APENAS quando há banners */}
      {banners.length > 0 && (
        <>
          <button className="hero-nav prev" onClick={prevSlide} aria-label="Anterior">
            <FaChevronLeft />
          </button>
          <button className="hero-nav next" onClick={nextSlide} aria-label="Próximo">
            <FaChevronRight />
          </button>

          {/* Dots */}
          <div className="hero-dots">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Wave */}
      <div className="wave-bottom">
        <svg viewBox="0 0 1440 320">
          <path
            fill="#ffffff"
            fillOpacity="1"
            d="M0,224L80,213.3C160,203,320,181,480,181.3C640,181,800,203,960,213.3C1120,224,1280,224,1360,224L1440,224L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          ></path>
        </svg>
      </div>
    </section>
  );
};

export default Hero;