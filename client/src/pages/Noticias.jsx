import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import './Noticias.css';

const Noticias = () => {
  const [allNews, setAllNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Todas');

  const categories = [
    'Todas',
    'Clube',
    'Atletismo',
    'Badminton',
    'Basquetebol',
    'Futevólei',
    'Futsal',
    'Hóquei em Patins',
    'Ténis de Mesa',
    'Voleibol'
  ];

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('http://localhost:5285/api/news');
      if (response.ok) {
        const data = await response.json();
        setAllNews(data);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '/CDP_logo.png';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost:5285${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filtrar notícias
  const filteredNews = activeFilter === 'Todas'
    ? allNews
    : allNews.filter(news => news.category === activeFilter);

  // Destaques (primeiras 3 notícias)
  const destaques = allNews.slice(0, 3);

  if (loading) {
    return (
      <div className="news-page">
        <section className="page-header">
          <div className="container">
            <h1>Notícias e Atualizações</h1>
            <p>A carregar notícias...</p>
          </div>
        </section>
      </div>
    );
  }

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
          {destaques.length > 0 && (
            <>
              <h2 className="destaques-title">Destaques</h2>

              <div className="destaques-grid">
                {destaques.map(destaque => (
                  <div key={destaque.id} className="destaque-card">
                    <div style={{ position: 'relative' }}>
                      <img
                        src={getImageUrl(destaque.imageUrl)}
                        alt={destaque.title}
                        className="destaque-image"
                      />
                      <span className="destaque-badge">{destaque.category}</span>
                    </div>
                    <div className="destaque-content">
                      <div className="destaque-date">
                        <FaCalendarAlt />
                        {formatDate(destaque.publishedAt)}
                      </div>
                      <h3>{destaque.title}</h3>
                      <p>{destaque.excerpt}</p>
                      <a href={`/noticias/${destaque.slug}`} className="destaque-link">
                        Ler mais <FaArrowRight />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="filter-section">
            {categories.map(filter => (
              <button
                key={filter}
                className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {filteredNews.length > 0 ? (
            <div className="news-grid">
              {filteredNews.map(news => (
                <div key={news.id} className="news-card">
                  <div className="news-image-wrapper">
                    <img
                      src={getImageUrl(news.imageUrl)}
                      alt={news.title}
                      className="news-image"
                    />
                    <span className="news-badge">{news.category}</span>
                  </div>
                  <div className="news-content">
                    <div className="news-date">
                      <FaCalendarAlt />
                      {formatDate(news.publishedAt)}
                    </div>
                    <h3>{news.title}</h3>
                    <p>{news.excerpt}</p>
                    <a href={`/noticias/${news.slug}`} className="news-link">
                      Ler mais <FaArrowRight />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              background: '#f9fafb',
              borderRadius: '12px',
              color: '#6b7280'
            }}>
              <p style={{ fontSize: '1.1rem' }}>
                {activeFilter === 'Todas'
                  ? 'Nenhuma notícia publicada ainda.'
                  : `Nenhuma notícia na categoria "${activeFilter}".`}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Noticias;