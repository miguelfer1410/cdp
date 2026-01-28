import React, { useState } from 'react';
import { FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import './Noticias.css';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

const Noticias = () => {
  const [activeFilter, setActiveFilter] = useState('Todas');

  const destaques = [
    {
      id: 1,
      category: 'Futebol',
      image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=500&fit=crop',
      date: '15 Jan 2026',
      title: 'Vitória Importante no Campeonato Regional',
      excerpt: 'A equipa sénior de futebol conquistou uma vitória importante frente ao rival da cidade, consolidando a...'
    },
    {
      id: 2,
      category: 'Basquetebol',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=500&fit=crop',
      date: '12 Jan 2026',
      title: 'Jovens Atletas Brilham em Torneio Nacional',
      excerpt: 'A equipa sub-16 de basquetebol alcançou o segundo lugar no torneio nacional, demonstrando excelente...'
    },
    {
      id: 3,
      category: 'Clube',
      image: '/CDP_logo.png',
      date: '08 Jan 2026',
      title: 'Novas Instalações Inauguradas',
      excerpt: 'O clube inaugurou novas instalações de treino com equipamentos de última geração para melhor servir...'
    }
  ];

  const allNews = [
    {
      id: 4,
      category: 'Futebol',
      image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800&h=400&fit=crop',
      date: '15 Jan 2026',
      title: 'Vitória Importante no Campeonato Regional',
      excerpt: 'A equipa sénior de futebol conquistou uma vitória importante frente ao rival da cidade, consolidando a posição na tabela...'
    },
    {
      id: 5,
      category: 'Basquetebol',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=400&fit=crop',
      date: '12 Jan 2026',
      title: 'Jovens Atletas Brilham em Torneio Nacional',
      excerpt: 'A equipa sub-16 de basquetebol conquistou o segundo lugar no prestigiado torneio nacional, demonstrando um excelente nível técnico e...'
    },
    {
      id: 6,
      category: 'Clube',
      image: '/CDP_logo.png',
      date: '08 Jan 2026',
      title: 'Novas Instalações Inauguradas',
      excerpt: 'Com um investimento significativo, o clube inaugurou novas instalações que incluem um ginásio moderno, salas de fisioterapia e...'
    },
    {
      id: 7,
      category: 'Voleibol',
      image: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=400&fit=crop',
      date: '05 Jan 2026',
      title: 'Equipa Feminina Conquista Torneio Regional',
      excerpt: 'Numa demonstração impressionante de técnica e espírito de equipa, a formação feminina de voleibol sagrou-se campeã do torneio...'
    },
    {
      id: 8,
      category: 'Futebol',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=400&fit=crop',
      date: '02 Jan 2026',
      title: 'Contratação de Novo Treinador de Formação',
      excerpt: 'O clube reforçou a sua estrutura técnica com a contratação de um experiente treinador que irá liderar os escalões de formação...'
    },
    {
      id: 9,
      category: 'Basquetebol',
      image: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a26?w=800&h=400&fit=crop',
      date: '28 Dez 2025',
      title: 'Atleta Convocado para Seleção Nacional',
      excerpt: 'Grande orgulho para o clube com a convocatória de um dos nossos jovens talentos para integrar a seleção nacional de basquetebol...'
    },
    {
      id: 10,
      category: 'Clube',
      image: '/CDP_logo.png',
      date: '20 Dez 2025',
      title: 'Festa de Natal Reúne Toda a Família Desportiva',
      excerpt: 'A festa de Natal do clube foi um sucesso, reunindo atletas, familiares, treinadores e dirigentes num ambiente festivo. O evento...'
    },
    {
      id: 11,
      category: 'Voleibol',
      image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&h=400&fit=crop',
      date: '15 Dez 2025',
      title: 'Início da Liga Regional de Voleibol',
      excerpt: 'Começou a liga regional de voleibol com as nossas equipas a entrarem em campo determinadas a alcançar bons resultados. O...'
    },
    {
      id: 12,
      category: 'Clube',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop',
      date: '10 Dez 2025',
      title: 'Corrida Solidária Angaria Fundos para o Clube',
      excerpt: 'A corrida solidária organizada pelo clube foi um grande sucesso, com mais de 300 participantes e uma excelente angariação de...'
    }
  ];

  const filteredNews = activeFilter === 'Todas' 
    ? allNews 
    : allNews.filter(news => news.category === activeFilter);

  return (
    <div className="news-page">
      
      <section className="page-header">
        <div className="container">
          <h1>Notícias e Atualizações</h1>
          <p>Fique a par de todas as novidades do Clube Desportivo Da Póvoa</p>
        </div>
      </section>

      <section className="destaques-section">
        <div className="container">
          <h2 className="destaques-title">Destaques</h2>
          
          <div className="destaques-grid">
            {destaques.map(destaque => (
              <div key={destaque.id} className="destaque-card">
                <div style={{ position: 'relative' }}>
                  <img src={destaque.image} alt={destaque.title} className="destaque-image" />
                  <span className="destaque-badge">{destaque.category}</span>
                </div>
                <div className="destaque-content">
                  <div className="destaque-date">
                    <FaCalendarAlt />
                    {destaque.date}
                  </div>
                  <h3>{destaque.title}</h3>
                  <p>{destaque.excerpt}</p>
                  <a href="#" className="destaque-link">
                    Ler mais <FaArrowRight />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="filter-section">
            {['Todas','Atletismo', 'Badminton','Basquetebol', 'Futvólei', 'Futsal', 'Hóquei em Patins', 'Ténis de Mesa', 'Voleibol', 'Clube'].map(filter => (
              <button
                key={filter}
                className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="news-grid">
            {filteredNews.map(news => (
              <div key={news.id} className="news-card">
                <div className="news-image-wrapper">
                  <img src={news.image} alt={news.title} className="news-image" />
                  <span className="news-badge">{news.category}</span>
                </div>
                <div className="news-content">
                  <div className="news-date">
                    <FaCalendarAlt />
                    {news.date}
                  </div>
                  <h3>{news.title}</h3>
                  <p>{news.excerpt}</p>
                  <a href="#" className="news-link">
                    Ler mais <FaArrowRight />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Noticias;