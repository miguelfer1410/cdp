import React from 'react';
import './Stats.css';

const Stats = () => {
  return (
    <section className="home-stats-bar">
      <div className="container home-stats-grid">
        <div className="home-stat-item">
          <h3>50+</h3>
          <p>Anos de História</p>
        </div>
        <div className="home-stat-item">
          <h3>600+</h3>
          <p>Atletas Ativos</p>
        </div>
        <div className="home-stat-item">
          <h3>8</h3>
          <p>Modalidades</p>
        </div>
      </div>
    </section>
  );
};

export default Stats;
