import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaUserCheck } from 'react-icons/fa';
import './RegistoSucesso.css';

const RegistoSucesso = () => {
  return (
    <div className="registo-sucesso-page">
      <div className="sucesso-container">
        <div className="sucesso-icon">
          <FaCheckCircle />
        </div>

        <h1>Registo Concluído com Sucesso!</h1>

        <p className="sucesso-message">
          Bem-vindo à família do Clube Desportivo Da Póvoa! A sua conta de sócio foi criada e está ativa.
        </p>

        <div className="info-box">
          <div className="info-icon">
            <FaUserCheck />
          </div>
          <div className="info-content">
            <h3>Conta Ativada</h3>
            <p>
              A sua conta está pronta a usar! Pode fazer login imediatamente e começar a explorar
              todas as funcionalidades disponíveis para sócios do clube.
            </p>
          </div>
        </div>

        <div className="actions">
          <Link to="/login" className="btn-primary">
            Fazer Login
          </Link>
          <Link to="/" className="btn-secondary">
            Voltar ao Site
          </Link>
        </div>

        <div className="help-section">
          <p>Tem alguma questão?</p>
          <a href="/contactos">Entre em contacto connosco</a>
        </div>
      </div>
    </div>
  );
};

export default RegistoSucesso;