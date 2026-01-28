import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <div className="logo footer-logo">
            <img src="/CDP_logo.png" alt="Logo CDP" className="logo-img" />
            <div className="logo-text">
              <h1>Clube Desportivo</h1>
              <span>Da Póvoa</span>
            </div>
          </div>
          <p>Promovendo o desporto e a comunidade há mais de 80 anos.</p>
          <div className="social-links">
            <a href="https://facebook.com/cdpovoa" target="_blank" rel="noopener noreferrer">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com/cdpovoa" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
            <a href="https://linkedin.com/company/clube-desportivo-da-póvoa" target="_blank" rel="noopener noreferrer">
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Links Rápidos</h4>
          <ul className="footer-links">
            <li><Link to="/">Início</Link></li>
            <li><Link to="/clube">Clube</Link></li>
            <li><Link to="/modalidades">Modalidades</Link></li>
            <li><Link to="/noticias">Notícias</Link></li>
            <li><Link to="/contactos">Contactos</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Contactos</h4>
          <ul className="footer-contact">
            <li>
              <FaMapMarkerAlt />
              Largo Dr. José Pontes, 4490-556 Póvoa de Varzim
            </li>
            <li>
              <FaPhone />
              +351 252 682 109
            </li>
            <li>
              <FaEnvelope />
              geral@cdpovoa.pt
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Clube Desportivo Da Póvoa. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;