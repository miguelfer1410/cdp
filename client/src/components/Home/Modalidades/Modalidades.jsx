import React from 'react';
import './Modalidades.css';

const Modalidades = () => {
  const modalidades = [
    {
      nome: 'Atletismo',
      descricao: 'Formação completa em pista e estrada. Bicampeões Nacionais II Divisão Feminina.',
      escaloes: 'Benjamins a Veteranos',
      imagem: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop'
    },
    {
      nome: 'Badminton',
      descricao: 'Modalidade em crescimento com programa de formação e competição distrital.',
      escaloes: 'Formação e Competição',
      imagem: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&h=600&fit=crop'
    },
    {
      nome: 'Basquetebol',
      descricao: 'Maior modalidade do clube com 244 atletas. Modalidades competem na Pro Liga masculina e CN1 feminina.',
      escaloes: 'Baby-Basket a Sénior',
      imagem: 'https://images.unsplash.com/photo-1521830101529-057b1dfd9784?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080'
    },
    {
      nome: 'Futevólei',
      descricao: 'Tricampeões Nacionais (2013-2015). Maior clube nacional em número de atletas.',
      escaloes: 'Sub-18 a Masters',
      imagem: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=600&fit=crop'
    },
    {
      nome: 'Futsal',
      descricao: 'Equipa sénior masculina e formação juvenil com tradição competitiva.',
      escaloes: 'Sub-7 a Sénior',
      imagem: 'https://images.unsplash.com/photo-1587384474964-3a06ce1ce699?q=80&w=1170&auto=format&fit=crop'
    },
    {
      nome: 'Hóquei em Patins',
      descricao: 'Competem na 1ª Divisão Nacional. Recentemente promovidos após 10 anos.',
      escaloes: 'Sub-9 a Sénior',
      imagem: 'https://plus.unsplash.com/premium_photo-1719318342777-808082b05b24?q=80&w=687&auto=format&fit=crop'
    },
    {
      nome: 'Ténis de Mesa',
      descricao: 'Programa de formação técnica e competição a nível distrital.',
      escaloes: 'Formação e Competição',
      imagem: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=800&h=600&fit=crop'
    },
    {
      nome: 'Voleibol',
      descricao: 'Modalidades femininas e masculinas. Bicampeões Nacionais Masters Femininos (2024/2025).',
      escaloes: 'Mini a Sénior',
      imagem: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&h=600&fit=crop'
    }
  ];


  return (
    <section id="equipas" className="teams section-padding">
      <div className="container">
        <div className="section-header">
          <h2>As Nossas Modalidades</h2>
          <p>Modalidades diversificadas com programas de formação e competição para todas as idades.</p>
        </div>

        <div className="grid-3">
          {modalidades.map((modalidade, index) => (
            <div key={index} className="card">
              <img src={modalidade.imagem} alt={modalidade.nome} className="card-img" />
              <div className="card-body">
                <h3>{modalidade.nome}</h3>
                <p>{modalidade.descricao}</p>
                <div className="card-details">
                  <span>Escalões: <strong>{modalidade.escaloes}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center" style={{ marginTop: '40px' }}>
          <a href="#contactos" className="btn btn-primary">Inscrever-se Agora</a>
        </div>
      </div>
    </section>
  );
};

export default Modalidades;
