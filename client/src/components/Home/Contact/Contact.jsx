import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaPaperPlane } from 'react-icons/fa';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    assunto: '',
    mensagem: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Aqui adicionar lógica de envio
  };

  return (
    <section id="contactos" className="contact section-padding">
      <div className="container">
        <div className="section-header">
          <h2>Entre em Contacto</h2>
          <p>Tem alguma questão ou gostaria de saber mais sobre o clube? Estamos aqui para ajudar!</p>
        </div>

        <div className="contact-grid">
          <div className="contact-info-wrapper">
            <h3>Informações de Contacto</h3>
            
            <div className="contact-item">
              <div className="icon-circle">
                <FaMapMarkerAlt />
              </div>
              <div>
                <h4>Morada</h4>
                <p>Largo Dr. José Pontes<br/>4490-556 Póvoa de Varzim<br/>Portugal</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="icon-circle">
                <FaPhone />
              </div>
              <div>
                <h4>Telefone</h4>
                <p>+351 252 682 109</p>
              </div>
            </div>

            <div className="contact-item">
              <div className="icon-circle">
                <FaEnvelope />
              </div>
              <div>
                <h4>Email</h4>
                <p>geral@cdpovoa.pt</p>
              </div>
            </div>

            <div className="hours-box">
              <h4>Horário de Atendimento</h4>
              <div className="hour-row">
                <span>Segunda a Sexta:</span>
                <span>14h30 - 19h30</span>
              </div>
              <div className="hour-row">
                <span>Sábados:</span>
                <span>9h30 - 12h30</span>
              </div>
              <div className="hour-row">
                <span>Domingos:</span>
                <span>Encerrado</span>
              </div>
            </div>
          </div>

          <div className="contact-form-wrapper">
            <h3>Envie-nos uma Mensagem</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome Completo *</label>
                <input 
                  type="text" 
                  name="nome"
                  placeholder="O seu nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  name="email"
                  placeholder="seu.email@exemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Assunto *</label>
                <select 
                  name="assunto"
                  value={formData.assunto}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione um assunto</option>
                  <option value="inscricoes">Inscrições</option>
                  <option value="socio">Sócio</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div className="form-group">
                <label>Mensagem *</label>
                <textarea 
                  name="mensagem"
                  rows="4" 
                  placeholder="A sua mensagem..."
                  value={formData.mensagem}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Enviar Mensagem <FaPaperPlane />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;