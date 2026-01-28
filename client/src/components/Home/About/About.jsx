import React from 'react';
import { FaTrophy, FaUsers, FaBullseye, FaHeart } from 'react-icons/fa';
import './About.css';

const About = () => {
  return (
    <section id="clube" className="about section-padding">
      <div className="container">
        <div className="section-header">
          <h2>Sobre o Clube</h2>
          <p>
            O Clube Desportivo Da Póvoa é uma instituição desportiva com raízes profundas na comunidade local, 
            dedicada à promoção do desporto e formação de atletas.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="icon-box">
              <FaTrophy />
            </div>
            <h3>Excelência</h3>
            <p>Comprometidos com a formação de atletas de alto nível e resultados desportivos de qualidade.</p>
          </div>

          <div className="feature-card">
            <div className="icon-box">
              <FaUsers />
            </div>
            <h3>Comunidade</h3>
            <p>Unidos pela paixão pelo desporto, construímos uma família forte e acolhedora.</p>
          </div>

          <div className="feature-card">
            <div className="icon-box">
              <FaBullseye />
            </div>
            <h3>Formação</h3>
            <p>Dedicados ao desenvolvimento de jovens atletas com valores e disciplina.</p>
          </div>

          <div className="feature-card">
            <div className="icon-box">
              <FaHeart />
            </div>
            <h3>Paixão</h3>
            <p>Movidos pelo amor ao desporto e pelo orgulho de representar a Póvoa.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;