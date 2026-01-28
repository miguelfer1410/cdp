import React from 'react';
import './Partners.css';

const Partners = () => {
  return (
    <section className="partners section-padding bg-light">
      <div className="container">
        <div className="section-title">
          <h2>Parceiros Institucionais</h2>
        </div>
        <div className="partners-grid">
          <div className="partner-item">
            <img src="/image.png" alt="Câmara Municipal da Póvoa de Varzim" />
          </div>
          <div className="partner-item">
            <img src="/image copy.png" alt="IPDJ" />
          </div>
          <div className="partner-item">
            <img src="/image copy 2.png" alt="Federação Portuguesa de Basquetebol" />
          </div>
          <div className="partner-item">
            <img src="/image copy 3.png" alt="Federação Portuguesa de Voleibol" />
          </div>
          <div className="partner-item">
            <img src="/image copy 4.png" alt="Federação Portuguesa de Hóquei" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Partners;
