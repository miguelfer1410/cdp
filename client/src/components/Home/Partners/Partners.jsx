import React, { useState, useEffect } from 'react';
import './Partners.css';

const Partners = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await fetch('http://localhost:5285/api/partners');
      if (response.ok) {
        const data = await response.json();
        setPartners(data);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (logoUrl) => {
    if (!logoUrl) return null;
    if (logoUrl.startsWith('http')) return logoUrl;
    return `http://localhost:5285${logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl}`;
  };

  if (loading) {
    return (
      <section className="partners section-padding bg-light">
        <div className="container">
          <div className="section-title">
            <h2>Parceiros Institucionais</h2>
          </div>
        </div>
      </section>
    );
  }

  if (partners.length === 0) {
    return null; // Não mostra a seção se não houver parceiros
  }

  return (
    <section className="partners section-padding bg-light">
      <div className="container">
        <div className="section-title">
          <h2>Parceiros Institucionais</h2>
        </div>
        <div className="partners-grid">
          {partners.map((partner) => (
            <div key={partner.id} className="partner-item">
              {partner.websiteUrl ? (
                <a
                  href={partner.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={partner.name}
                >
                  <img
                    src={getImageUrl(partner.logoUrl)}
                    alt={partner.name}
                  />
                </a>
              ) : (
                <img
                  src={getImageUrl(partner.logoUrl)}
                  alt={partner.name}
                  title={partner.name}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Partners;