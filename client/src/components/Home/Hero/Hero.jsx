import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="container hero-content">
        <div className="hero-text">
          <h1>Clube Desportivo <br /> Da Póvoa</h1>
          <p className="subtitle">Tradição, Paixão e Excelência no Desporto</p>
          <p className="description">
            Unidos pelo amor ao desporto e dedicados à formação de atletas e à construção de uma comunidade forte.
          </p>
          <div className="hero-buttons">
            <a href="/clube" className="btn btn-white">Conhecer o Clube</a>
            <a href="/contactos" className="btn btn-outline">Contactar</a>
          </div>
        </div>
        <div className="hero-image">
          <img src="/CDP_logo.png" alt="Emblema CDP" className="hero-emblem" />
        </div>
      </div>
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
