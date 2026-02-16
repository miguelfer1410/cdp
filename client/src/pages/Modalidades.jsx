import React, { useState, useEffect } from 'react';
import { FaLayerGroup, FaCalendarAlt, FaTrophy, FaMapMarkerAlt, FaClipboardList, FaUserTie, FaClock, FaMedal } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import './Modalidades.css';

const Modalidades = () => {
  const [modalidades, setModalidades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModalidades();
  }, []);

  const fetchModalidades = async () => {
    try {
      const response = await fetch('http://localhost:5285/api/sports');
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
    return `http://localhost:5285${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  // Informações detalhadas estáticas para cada modalidade
  const modalidadesDetalhes = {
    'Atletismo': {
      detalhes: [
        { icon: <FaLayerGroup />, label: 'Escalões', value: 'Benjamins a Veteranos (9 escalões)' },
        { icon: <FaTrophy />, label: 'Nível Competitivo', value: 'Apuramento Divisão Nacional' },
        { icon: <FaMapMarkerAlt />, label: 'Instalações', value: 'Estádio Municipal (uma das melhores pistas do país)' }
      ],
      conquistas: [
        'Bicampeão Nacional II Divisão Feminina (1999/00, 2000/01)',
        'Fátima Silva: 7× Campeã Nacional de Maratona (1999-2006)'
      ]
    },
    'Badminton': {
      detalhes: [
        { icon: <FaClipboardList />, label: 'Programa', value: 'Formação e Competição' },
        { icon: <FaTrophy />, label: 'Nível Competitivo', value: 'Competição Distrital' },
        { icon: <FaMapMarkerAlt />, label: 'Local de Treino', value: 'Pavilhão Gimnodesportivo Fernando Linhares' }
      ]
    },
    'Basquetebol': {
      detalhes: [
        { icon: <FaLayerGroup />, label: 'Escalões', value: 'Baby-Basket a Seniores' },
        { icon: <FaClock />, label: 'Horários', value: 'Treinos: Segunda, Quarta e Sexta' },
        { icon: <FaUserTie />, label: 'Treinador Principal', value: 'Maria Santos' }
      ],
      conquistas: [
        'Campeão Nacional I Divisão Feminina (1999/2000)',
        'Clube do Ano ABP (2004, 2007)'
      ]
    },
    'Futevólei': {
      detalhes: [
        { icon: <FaLayerGroup />, label: 'Escalões', value: 'Sub-18, Seniores, Masters' },
        { icon: <FaTrophy />, label: 'Nível Competitivo', value: 'Campeonato Nacional' },
        { icon: <FaMedal />, label: 'Estatuto', value: 'Maior clube nacional em número de duplas' }
      ],
      palmares: [
        'Tricampeão Nacional (2013, 2014, 2015)',
        'Vice-Campeão Europeu'
      ]
    },
    'Futsal': {
      detalhes: [
        { icon: <FaLayerGroup />, label: 'Escalões', value: 'Sub-7 a Sub-19, Seniores' },
        { icon: <FaClock />, label: 'Horários', value: 'Treinos: Terça, Quinta e Sábado' },
        { icon: <FaUserTie />, label: 'Treinador Principal', value: 'Manuel Costa' }
      ]
    },
    'Hóquei em Patins': {
      detalhes: [
        { icon: <FaLayerGroup />, label: 'Escalões', value: 'Sub-9 a Sub-23, Seniores A e B' },
        { icon: <FaTrophy />, label: 'Nível Competitivo', value: '1ª Divisão Nacional' },
        { icon: <FaUserTie />, label: 'Coordenador', value: 'Nuno Carrão (Campeão Mundial Sub-20)' }
      ],
      conquistaRecente: [
        'Campeão 2ª Divisão Zona Norte (2024/25)',
        'Promoção à 1ª Divisão Nacional'
      ]
    },
    'Ténis de Mesa': {
      detalhes: [
        { icon: <FaClipboardList />, label: 'Programa', value: 'Formação e Competição' },
        { icon: <FaTrophy />, label: 'Nível Competitivo', value: 'Competição Distrital' },
        { icon: <FaMapMarkerAlt />, label: 'Local de Treino', value: 'Pavilhão Gimnodesportivo Fernando Linhares' }
      ]
    },
    'Voleibol': {
      detalhes: [
        { icon: <FaLayerGroup />, label: 'Escalões', value: 'Mini a Seniores' },
        { icon: <FaClock />, label: 'Horários', value: 'Treinos: Terça, Quinta e Domingo' },
        { icon: <FaUserTie />, label: 'Treinador Principal', value: 'Pedro Costa' }
      ],
      conquistasRecentes: [
        'Bicampeão Nacional Masters Femininos (2024, 2025)',
        'Campeão Nacional Masters Masculinos (2025)'
      ]
    }
  };

  if (loading) {
    return (
      <div className="modalidades-page">
        <section className="modalidades-hero">
          <div className="container">
            <div className="modalidades-hero-content">
              <h1>As Nossas Modalidades</h1>
              <p>A carregar modalidades...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="modalidades-page">
      {/* Hero Section */}
      <section className="modalidades-hero">
        <div className="container">
          <div className="modalidades-hero-content">
            <h1>As Nossas Modalidades</h1>
            <p>Modalidades diversificadas com programas de formação e competição para todas as idades</p>
          </div>
        </div>
      </section>

      {/* Quick Links Navigation */}
      <section className="quick-links-section">
        <div className="container">
          <div className="quick-links-grid">
            {modalidades.map((modalidade) => (
              <a
                key={modalidade.id}
                href={`#${modalidade.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="quick-link"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(modalidade.name.toLowerCase().replace(/\s+/g, '-'));
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                {modalidade.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Modalidades List */}
      <section className="modalidades-list">
        <div className="container">
          {modalidades.map((modalidade, index) => {
            const detalhesInfo = modalidadesDetalhes[modalidade.name] || { detalhes: [] };
            const sectionId = modalidade.name.toLowerCase().replace(/\s+/g, '-');

            return (
              <div
                key={modalidade.id}
                id={sectionId}
                className={`modalidade-item ${index % 2 === 0 ? 'reverse' : ''}`}
              >
                <div className="modalidade-image">
                  <img src={getImageUrl(modalidade.imageUrl)} alt={modalidade.name} />
                </div>
                <div className="modalidade-content">
                  <h2>{modalidade.name}</h2>
                  <p className="modalidade-descricao">{modalidade.description}</p>

                  {detalhesInfo.detalhes && detalhesInfo.detalhes.length > 0 && (
                    <div className="modalidade-detalhes">
                      {detalhesInfo.detalhes.map((detalhe, idx) => (
                        <div key={idx} className="detalhe-item">
                          <span className="detalhe-icon">{detalhe.icon}</span>
                          <div className="detalhe-text">
                            <strong>{detalhe.label}</strong>
                            <span>{detalhe.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {detalhesInfo.conquistas && (
                    <div className="conquistas-section">
                      <h4>Conquistas Principais</h4>
                      <ul>
                        {detalhesInfo.conquistas.map((conquista, idx) => (
                          <li key={idx}>{conquista}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detalhesInfo.conquistasRecentes && (
                    <div className="conquistas-section">
                      <h4>Conquistas Recentes</h4>
                      <ul>
                        {detalhesInfo.conquistasRecentes.map((conquista, idx) => (
                          <li key={idx}>{conquista}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detalhesInfo.palmares && (
                    <div className="conquistas-section">
                      <h4>Palmarés</h4>
                      <ul>
                        {detalhesInfo.palmares.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detalhesInfo.conquistaRecente && (
                    <div className="conquistas-section">
                      <h4>Conquista Recente</h4>
                      <ul>
                        {detalhesInfo.conquistaRecente.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button className="btn-inscrever">
                    <MdEmail /> Inscrever-se
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Pronto para Fazer Parte da Nossa Família?</h2>
          <p>Junte-se a nós e descubra o seu potencial desportivo</p>
          <div className="cta-buttons">
            <button className="btn-primary">Inscrever-se Agora</button>
            <button className="btn-secondary">Conhecer o Clube</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Modalidades;