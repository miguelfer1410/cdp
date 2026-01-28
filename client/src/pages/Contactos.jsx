import React, { useState } from 'react';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaClock, 
  FaPaperPlane,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn
} from 'react-icons/fa';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import './Contactos.css';

const Contactos = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Adicionar lógica de envio aqui
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="contact-page">
      {/* Hero */}
      <section className="page-header">
        <div className="container">
          <h1>Contacte-nos</h1>
          <p>Estamos aqui para responder às suas questões e ajudá-lo a fazer parte da nossa família desportiva</p>
        </div>
      </section>

      {/* Info Cards */}
      <section className="info-cards-section">
        <div className="container">
          <div className="info-cards-grid">
            <div className="info-card">
              <div className="info-icon-circle">
                <FaMapMarkerAlt />
              </div>
              <h3>Morada</h3>
              <p>Largo Dr. José Pontes<br/>4490-556 Póvoa de Varzim<br/>Portugal</p>
            </div>

            <div className="info-card">
              <div className="info-icon-circle">
                <FaPhone />
              </div>
              <h3>Telefone</h3>
              <p>+351 252 682 109<br/>+351 252 684 400</p>
            </div>

            <div className="info-card">
              <div className="info-icon-circle">
                <FaEnvelope />
              </div>
              <h3>Email</h3>
              <p>geral@cdpovoa.pt<br/>atendimento@cdpovoa.pt</p>
            </div>

            <div className="info-card">
              <div className="info-icon-circle">
                <FaClock />
              </div>
              <h3>Horário</h3>
              <p>Segunda a Sexta: 14h30 - 19h30<br/>Sábados: 9h30 - 12h30<br/>Domingos: Encerrado</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="contact-section">
        <div className="container">
          <div className="section-title-center">
            <h2>Entre em Contacto</h2>
            <p>Tem alguma questão ou gostaria de saber mais sobre o clube? Estamos aqui para ajudar!</p>
          </div>

          <div className="contact-content">
            <div className="contact-info-side">
              <h3>Informações de Contacto</h3>

              <div className="contact-detail">
                <div className="contact-icon-box">
                  <FaMapMarkerAlt />
                </div>
                <div className="contact-detail-text">
                  <h4>Morada</h4>
                  <p>Largo Dr. José Pontes<br/>4490-556 Póvoa de Varzim<br/>Portugal</p>
                </div>
              </div>

              <div className="contact-detail">
                <div className="contact-icon-box">
                  <FaPhone />
                </div>
                <div className="contact-detail-text">
                  <h4>Telefone</h4>
                  <p>+351 252 682 109</p>
                </div>
              </div>

              <div className="contact-detail">
                <div className="contact-icon-box">
                  <FaEnvelope />
                </div>
                <div className="contact-detail-text">
                  <h4>Email</h4>
                  <p>geral@cdpovoa.pt</p>
                </div>
              </div>

              <div className="horario-box">
                <h4>Horário de Atendimento</h4>
                <div className="horario-row">
                  <span>Segunda a Sexta:</span>
                  <span>14h30 - 19h30</span>
                </div>
                <div className="horario-row">
                  <span>Sábados:</span>
                  <span>9h30 - 12h30</span>
                </div>
                <div className="horario-row">
                  <span>Domingos:</span>
                  <span>Encerrado</span>
                </div>
              </div>
            </div>

            <div className="contact-form-side">
              <h3>Envie-nos uma Mensagem</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome Completo *</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="O seu nome" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu.email@exemplo.com" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label>Assunto *</label>
                  <select 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="inscricoes">Inscrições</option>
                    <option value="informacoes">Informações Gerais</option>
                    <option value="socio">Sócio</option>
                    <option value="instalacoes">Instalações</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Mensagem *</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="A sua mensagem..." 
                    required
                  ></textarea>
                </div>

                <button type="submit" className="btn-submit">
                  Enviar Mensagem <FaPaperPlane />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="map-section">
        <div className="container">
          <h2>Como Chegar</h2>
          <div className="map-container">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3001.2947916089544!2d-8.764427323863657!3d41.2394285711952!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd24fd3eb4c5c5e5%3A0x8b5e5e5e5e5e5e5e!2sLargo%20Dr.%20Jos%C3%A9%20Pontes%2C%204490-556%20P%C3%B3voa%20de%20Varzim!5e0!3m2!1spt-PT!2spt!4v1234567890123!5m2!1spt-PT!2spt"
              width="100%" 
              height="450" 
              style={{ border: 0, borderRadius: '12px' }}
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização do Clube Desportivo Da Póvoa"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="departments-section">
        <div className="container">
          <h2>Departamentos</h2>
          <div className="departments-grid">
            <div className="department-card">
              <h3>Secretaria</h3>
              <div className="department-item">
                <FaPhone />
                <span>+351 252 682 109</span>
              </div>
              <div className="department-item">
                <FaEnvelope />
                <span>geral@cdpovoa.pt</span>
              </div>
              <div className="department-item">
                <FaClock />
                <span>Seg-Sex: 14h30-19h30</span>
              </div>
            </div>

            <div className="department-card">
              <h3>Inscrições</h3>
              <div className="department-item">
                <FaPhone />
                <span>+351 252 684 400</span>
              </div>
              <div className="department-item">
                <FaEnvelope />
                <span>atendimento@cdpovoa.pt</span>
              </div>
              <div className="department-item">
                <FaClock />
                <span>Seg-Sex: 14h30-19h30 / Sáb: 9h30-12h30</span>
              </div>
            </div>

            <div className="department-card">
              <h3>Direção Técnica</h3>
              <div className="department-item">
                <FaPhone />
                <span>+351 252 682 109</span>
              </div>
              <div className="department-item">
                <FaEnvelope />
                <span>desporto@cdpovoa.pt</span>
              </div>
              <div className="department-item">
                <FaClock />
                <span>Mediante marcação prévia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social CTA */}
      <section className="social-cta-section">
        <div className="container">
          <h2>Siga-nos nas Redes Sociais</h2>
          <p>Mantenha-se atualizado com todas as nossas novidades</p>
          <div className="social-icons-large">
            <a href="https://facebook.com/cdpovoa" target="_blank" rel="noopener noreferrer" className="social-icon-large">
              <FaFacebookF />
            </a>
            <a href="https://instagram.com/cdpovoa" target="_blank" rel="noopener noreferrer" className="social-icon-large">
              <FaInstagram />
            </a>
            <a href="https://twitter.com/cdpovoa" target="_blank" rel="noopener noreferrer" className="social-icon-large">
              <FaTwitter />
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="container">
          <h2>Perguntas Frequentes</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3>Como posso inscrever o meu filho?</h3>
              <p>As inscrições podem ser feitas presencialmente na nossa secretaria ou através do formulário de contacto. Entre em contacto connosco para conhecer os documentos necessários.</p>
            </div>

            <div className="faq-item">
              <h3>Quais são os custos de inscrição?</h3>
              <p>Os valores variam conforme a modalidade e escalão. Contacte-nos para informações detalhadas sobre mensalidades e taxas de inscrição.</p>
            </div>

            <div className="faq-item">
              <h3>Oferecem treinos experimentais?</h3>
              <p>Sim! Oferecemos treinos experimentais gratuitos para que possa conhecer as nossas instalações, treinadores e metodologia de trabalho antes de se inscrever.</p>
            </div>

            <div className="faq-item">
              <h3>Têm programa para adultos?</h3>
              <p>Sim, temos equipas sénior em várias modalidades e também oferecemos programas de atividade física recreativa para adultos.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contactos;