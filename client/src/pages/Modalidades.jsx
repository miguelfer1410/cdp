import React from 'react';
import { FaLayerGroup, FaCalendarAlt, FaTrophy, FaMapMarkerAlt, FaClipboardList, FaUserTie, FaClock, FaMedal } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import './Modalidades.css';

const Modalidades = () => {
  const modalidades = [
    {
      id: 'atletismo',
      nome: 'Atletismo',
      descricao: 'Formação completa em pista e estrada. Programa de alta competição em divisões nacionais.',
      imagem: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop',
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
    {
      id: 'badminton',
      nome: 'Badminton',
      descricao: 'Modalidade em crescimento com programa de formação técnica e competição distrital.',
      imagem: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=600&fit=crop',
      detalhes: [
        { icon: <FaClipboardList />, label: 'Programa', value: 'Formação e Competição' },
        { icon: <FaTrophy />, label: 'Nível Competitivo', value: 'Competição Distrital' },
        { icon: <FaMapMarkerAlt />, label: 'Local de Treino', value: 'Pavilhão Gimnodesportivo Fernando Linhares' }
      ]
    },
    {
      id: 'basquetebol',
      nome: 'Basquetebol',
      descricao: 'Programa de formação completo e equipas competitivas em várias categorias.',
      imagem: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
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
    {
      id: 'futevolei',
      nome: 'Futevólei',
      descricao: 'Tricampeões Nacionais e maior clube do país em número de atletas da modalidade.',
      imagem: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=600&fit=crop',
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
    {
      id: 'futsal',
      nome: 'Futsal',
      descricao: 'Equipa sénior masculina e formação juvenil com tradição competitiva.',
      imagem: 'https://images.unsplash.com/photo-1587384474964-3a06ce1ce699?w=800&h=600&fit=crop',
      detalhes: [
        { icon: <FaLayerGroup />, label: 'Escalões', value: 'Sub-7 a Sub-19, Seniores' },
        { icon: <FaClock />, label: 'Horários', value: 'Treinos: Terça, Quinta e Sábado' },
        { icon: <FaUserTie />, label: 'Treinador Principal', value: 'Manuel Costa' }
      ]
    },
    {
      id: 'hoquei',
      nome: 'Hóquei em Patins',
      descricao: 'Competem na 1ª Divisão Nacional. Recentemente promovidos após 10 anos fora da elite.',
      imagem: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=600&fit=crop',
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
    {
      id: 'tenis-mesa',
      nome: 'Ténis de Mesa',
      descricao: 'Programa de formação técnica e desenvolvimento de jovens atletas a nível distrital.',
      imagem: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800&h=600&fit=crop',
      detalhes: [
        { icon: <FaClipboardList />, label: 'Programa', value: 'Formação e Competição' },
        { icon: <FaTrophy />, label: 'Nível Competitivo', value: 'Competição Distrital' },
        { icon: <FaMapMarkerAlt />, label: 'Local de Treino', value: 'Pavilhão Gimnodesportivo Fernando Linhares' }
      ]
    },
    {
      id: 'voleibol',
      nome: 'Voleibol',
      descricao: 'Modalidades femininas e masculinas com grande participação da comunidade.',
      imagem: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=600&fit=crop',
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
  ];

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

      {/* Modalidades List */}
      <section className="modalidades-list">
        <div className="container">
          {modalidades.map((modalidade, index) => (
            <div key={modalidade.id} className={`modalidade-item ${index % 2 === 0 ? 'reverse' : ''}`}>
              <div className="modalidade-image">
                <img src={modalidade.imagem} alt={modalidade.nome} />
              </div>
              <div className="modalidade-content">
                <h2>{modalidade.nome}</h2>
                <p className="modalidade-descricao">{modalidade.descricao}</p>
                
                <div className="modalidade-detalhes">
                  {modalidade.detalhes.map((detalhe, idx) => (
                    <div key={idx} className="detalhe-item">
                      <span className="detalhe-icon">{detalhe.icon}</span>
                      <div className="detalhe-text">
                        <strong>{detalhe.label}</strong>
                        <span>{detalhe.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {modalidade.conquistas && (
                  <div className="conquistas-section">
                    <h4>Conquistas Principais</h4>
                    <ul>
                      {modalidade.conquistas.map((conquista, idx) => (
                        <li key={idx}>{conquista}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {modalidade.conquistasRecentes && (
                  <div className="conquistas-section">
                    <h4>Conquistas Recentes</h4>
                    <ul>
                      {modalidade.conquistasRecentes.map((conquista, idx) => (
                        <li key={idx}>{conquista}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {modalidade.palmares && (
                  <div className="conquistas-section">
                    <h4>Palmarés</h4>
                    <ul>
                      {modalidade.palmares.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {modalidade.conquistaRecente && (
                  <div className="conquistas-section">
                    <h4>Conquista Recente</h4>
                    <ul>
                      {modalidade.conquistaRecente.map((item, idx) => (
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
          ))}
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