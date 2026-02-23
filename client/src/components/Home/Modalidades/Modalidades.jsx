import React, { useState, useEffect } from 'react';
import './Modalidades.css';

const Modalidades = () => {
  const [modalidades, setModalidades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModalidades();
  }, []);

  const fetchModalidades = async () => {
    try {
      const response = await fetch('http://51.178.43.232:5285/api/sports');
      if (response.ok) {
        const data = await response.json();
        setModalidades(data);
      }
    } catch (error) {
      console.error('Error fetching sports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://51.178.43.232:5285${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  // Informações estáticas para cada modalidade (escalões)
  const modalidadesInfo = {
    'Atletismo': 'Benjamins a Veteranos',
    'Badminton': 'Formação e Competição',
    'Basquetebol': 'Baby-Basket a Sénior',
    'Futevólei': 'Sub-18 a Masters',
    'Futsal': 'Sub-7 a Sénior',
    'Hóquei em Patins': 'Sub-9 a Sénior',
    'Ténis de Mesa': 'Formação e Competição',
    'Voleibol': 'Mini a Sénior'
  };

  if (loading) {
    return (
      <section id="equipas" className="teams section-padding">
        <div className="container">
          <div className="section-header">
            <h2>As Nossas Modalidades</h2>
            <p>A carregar modalidades...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="equipas" className="teams section-padding">
      <div className="container">
        <div className="section-header">
          <h2>As Nossas Modalidades</h2>
          <p>Modalidades diversificadas com programas de formação e competição para todas as idades.</p>
        </div>

        <div className="grid-3">
          {modalidades.map((modalidade) => (
            <div key={modalidade.id} className="card">
              <img
                src={getImageUrl(modalidade.imageUrl)}
                alt={modalidade.name}
                className="card-img"
              />
              <div className="card-body">
                <h3>{modalidade.name}</h3>
                <p>{modalidade.description}</p>
                <div className="card-details">
                  <span>Escalões: <strong>{modalidadesInfo[modalidade.name] || 'Vários escalões'}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Modalidades;