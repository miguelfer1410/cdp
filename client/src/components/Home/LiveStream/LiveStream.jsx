import React from 'react';
import { FaYoutube, FaArrowRight, FaPlay } from 'react-icons/fa';
import './LiveStream.css';

const LiveStream = () => {
  return (
    <section className="livestream section-padding">
      <div className="container">
        <div className="livestream-inner">

          {/* Left: icon + decorative element */}
          <div className="livestream-visual">
            <div className="yt-circle">
              <FaYoutube className="yt-main-icon" />
            </div>
            <div className="yt-play-badge">
              <FaPlay className="yt-play-icon" />
              <span>Em Direto</span>
            </div>
          </div>

          {/* Right: text content */}
          <div className="livestream-text">
            <span className="livestream-label">Canal Oficial</span>
            <h2>Acompanha os nossos <span className="highlight-yt">jogos em direto</span></h2>
            <p>
              Segue o canal oficial <strong>@cdpovoatv</strong> no YouTube e não percas
              nenhuma transmissão. Os jogos das nossas equipas transmitidos em direto,
              ao alcance de um clique.
            </p>
            <a
              href="https://youtube.com/@cdpovoatv"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary livestream-btn"
            >
              <FaYoutube />
              Ver o Canal no YouTube
              <FaArrowRight className="btn-arrow" />
            </a>
          </div>

        </div>
      </div>
    </section>
  );
};

export default LiveStream;
