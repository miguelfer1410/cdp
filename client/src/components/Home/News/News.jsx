import React from 'react';
import './News.css';

const News = () => {
  const noticias = [
    {
      categoria: 'Hóquei em Patins',
      data: '15 Jan 2026',
      titulo: 'Hóquei Regressa à Elite Nacional',
      descricao: 'A equipa de hóquei em patins conquistou a subida à 1ª Divisão Nacional pela primeira vez desde 2014/15...',
      imagem: 'https://plus.unsplash.com/premium_photo-1719318342777-808082b05b24?q=80&w=687&auto=format&fit=crop'
    },
    {
      categoria: 'Basquetebol',
      data: '12 Jan 2026',
      titulo: 'Jovens Atletas Brilham em Torneio Nacional',
      descricao: 'A equipa sub-16 de basquetebol alcançou o segundo lugar no torneio nacional...',
      imagem: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400'
    },
    {
      categoria: 'Clube',
      data: '08 Jan 2026',
      titulo: 'Novas Instalações Inauguradas',
      descricao: 'O clube inaugurou novas instalações de treino com equipamentos de última geração...',
      imagem: 'https://images.unsplash.com/photo-1577223625816-7546f83f7e91?w=400'
    }
  ];

  return (
    <section id="noticias" className="news section-padding bg-light">
      <div className="container">
        <div className="section-header">
          <h2>Últimas Notícias</h2>
          <p>Acompanhe as últimas novidades e resultados das nossas equipas.</p>
        </div>

        <div className="grid-3">
          {noticias.map((noticia, index) => (
            <div key={index} className="card news-card">
              <div className="img-wrapper">
                <span className="badge">{noticia.categoria}</span>
                <img src={noticia.imagem} alt={noticia.titulo} />
              </div>
              <div className="card-body">
                <span className="date">
                  <i className="far fa-calendar-alt"></i> {noticia.data}
                </span>
                <h3>{noticia.titulo}</h3>
                <p>{noticia.descricao}</p>
                <a href="#" className="read-more">
                  Ler mais <i className="fas fa-arrow-right"></i>
                </a>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center" style={{ marginTop: '40px' }}>
          <a href="/noticias" className="btn btn-outline-dark">Ver Todas as Notícias</a>
        </div>
      </div>
    </section>
  );
};

export default News;
