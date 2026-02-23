import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaArrowRight } from 'react-icons/fa';
import './News.css';

const News = () => {
  const [noticias, setNoticias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('http://51.178.43.232:5285/api/news');
      if (response.ok) {
        const data = await response.json();
        // Pega apenas as 3 primeiras notícias
        setNoticias(data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://51.178.43.232:5285${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
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

  if (loading) {
    return (
      <section id="noticias" className="news section-padding bg-light">
        <div className="container">
          <div className="section-header">
            <h2>Últimas Notícias</h2>
            <p>A carregar notícias...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="noticias" className="news section-padding bg-light">
      <div className="container">
        <div className="section-header">
          <h2>Últimas Notícias</h2>
          <p>Acompanhe as últimas novidades e resultados das nossas equipas.</p>
        </div>

        {noticias.length > 0 ? (
          <>
            <div className="grid-3">
              {noticias.map((noticia) => (
                <div key={noticia.id} className="card news-card">
                  <div className="img-wrapper">
                    <span className="badge">{noticia.category}</span>
                    <img src={getImageUrl(noticia.imageUrl)} alt={noticia.title} />
                  </div>
                  <div className="card-body">
                    <span className="date">
                      <FaCalendarAlt /> {formatDate(noticia.publishedAt)}
                    </span>
                    <h3>{noticia.title}</h3>
                    <p>{noticia.excerpt}</p>
                    <a href={`/noticias/${noticia.slug}`} className="read-more">
                      Ler mais <FaArrowRight />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center" style={{ marginTop: '40px' }}>
              <a href="/noticias" className="btn btn-outline-dark">Ver Todas as Notícias</a>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>Nenhuma notícia publicada ainda.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default News;