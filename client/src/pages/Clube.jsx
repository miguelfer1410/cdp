import React from 'react';
import { FaCalendarAlt, FaUsers, FaTrophy, FaMedal, FaTrophy as FaTrophyAlt, FaUsers as FaUsersAlt, FaBullseye, FaHeart, FaMapMarkerAlt } from 'react-icons/fa';
import './Clube.css';

const Clube = () => {
  return (
    <div className="clube-page">
      {/* Page Header */}
      <section className="page-header-clube">
        <div className="container">
          <h1>Sobre o Clube</h1>
          <p>Mais de 50 anos de tradição desportiva na Póvoa, formando atletas e construindo comunidade</p>
        </div>
      </section>

      {/* História Section */}
      <section className="historia-section">
        <div className="container">
          <div className="historia-grid">
            <div className="historia-text">
              <h2>A Nossa História</h2>
              <p>
                O Clube Desportivo Da Póvoa foi fundado em 1943 com o objetivo de promover o desporto e os valores de fair play na comunidade local. 
                Desde então, temos sido um pilar fundamental no desenvolvimento desportivo da região.
              </p>
              <p>
                Ao longo de mais de cinco décadas, formámos milhares de atletas, conquistámos títulos importantes e, acima de tudo, 
                criámos uma família unida pela paixão ao desporto.
              </p>
              <p>
                Hoje, o clube conta com instalações modernas, equipas competitivas em várias modalidades e programas de formação reconhecidos a nível nacional.
              </p>
            </div>

            <div className="historia-stats-grid">
              <div className="stat-box">
                <FaCalendarAlt className="stat-icon" />
                <h3>50+</h3>
                <p>Anos de História</p>
              </div>
              <div className="stat-box">
                <FaUsers className="stat-icon" />
                <h3>600+</h3>
                <p>Atletas Ativos</p>
              </div>
              <div className="stat-box">
                <FaTrophy className="stat-icon" />
                <h3>8</h3>
                <p>Modalidades</p>
              </div>
              <div className="stat-box">
                <FaMedal className="stat-icon" />
                <h3>25+</h3>
                <p>Títulos Conquistados</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valores Section */}
      <section className="valores-section">
        <div className="container">
          <div className="section-title-center">
            <h2>Os Nossos Valores</h2>
            <p>Princípios que guiam cada decisão e ação no nosso clube</p>
          </div>

          <div className="valores-grid">
            <div className="valor-card">
              <div className="valor-icon-box">
                <FaTrophyAlt />
              </div>
              <h3>Excelência</h3>
              <p>Comprometidos com a formação de atletas de alto nível e resultados desportivos de qualidade.</p>
            </div>

            <div className="valor-card">
              <div className="valor-icon-box">
                <FaUsersAlt />
              </div>
              <h3>Comunidade</h3>
              <p>Unidos pela paixão pelo desporto, construímos uma família forte e acolhedora.</p>
            </div>

            <div className="valor-card">
              <div className="valor-icon-box">
                <FaBullseye />
              </div>
              <h3>Formação</h3>
              <p>Dedicados ao desenvolvimento de jovens atletas com valores e disciplina.</p>
            </div>

            <div className="valor-card">
              <div className="valor-icon-box">
                <FaHeart />
              </div>
              <h3>Paixão</h3>
              <p>Movidos pelo amor ao desporto e pelo orgulho de representar a Póvoa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section">
        <div className="container">
          <div className="section-title-center">
            <h2>Marcos Históricos</h2>
            <p>Os momentos que definiram a nossa jornada</p>
          </div>

          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-content-left">
                <h3>Fundação do Clube</h3>
                <p>Nascimento do Clube Desportivo Da Póvoa a 26 de dezembro, quando jovens decidiram revitalizar o desporto no concelho.</p>
              </div>
              <div className="timeline-date">1943</div>
              <div className="timeline-content-right"></div>
            </div>

            <div className="timeline-item">
              <div className="timeline-content-left"></div>
              <div className="timeline-date">1944</div>
              <div className="timeline-content-right">
                <h3>Primeira Conquista</h3>
                <p>Conquista da Taça Eça de Queirós, o primeiro troféu na história do clube.</p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-content-left">
                <h3>Inauguração do Pavilhão</h3>
                <p>Construção do pavilhão gimnodesportivo, marco fundamental para o desenvolvimento das modalidades indoor.</p>
              </div>
              <div className="timeline-date">1968</div>
              <div className="timeline-content-right"></div>
            </div>

            <div className="timeline-item">
              <div className="timeline-content-left"></div>
              <div className="timeline-date">1999</div>
              <div className="timeline-content-right">
                <h3>Novas Instalações, Reconhecimento e Título Nacional</h3>
                <p>Pavilhão Fernando Linhares de Castro reconstruído de raiz, oferecendo instalações modernas aos atletas. Medalha de Ouro de Reconhecimento Poveiro e título de Campeão Nacional I Divisão Feminina de Basquetebol (1999/2000).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instalações Section */}
      <section className="instalacoes-section">
        <div className="container">
          <div className="instalacoes-icon">
            <FaMapMarkerAlt />
          </div>
          <div className="section-title-center white-text">
            <h2>As Nossas Instalações</h2>
            <p>Complexo desportivo moderno com infraestruturas de excelência</p>
          </div>

          <div className="instalacoes-grid">
            <div className="instalacao-card">
              <h3>Pavilhão Fernando Linhares de Castro</h3>
              <p>Reconstruído de raiz em 1998/99 com capacidade para 600 lugares. Espaço polivalente para Basquetebol, Voleibol, Hóquei em Patins, Futsal e Badminton.</p>
            </div>

            <div className="instalacao-card">
              <h3>Complexo de Piscinas</h3>
              <p>Piscina interior coberta de 25m, piscina exterior de 35m×15m e piscina infantil circular. Característica única: água salgada extraída diretamente do mar.</p>
            </div>

            <div className="instalacao-card">
              <h3>Sede Social</h3>
              <p>Instalações completas com secretariado, auditório, sala de troféus, bar e estacionamento exterior para conveniência de todos os sócios.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Clube;