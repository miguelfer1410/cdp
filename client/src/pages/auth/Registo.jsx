import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaMapMarkerAlt, FaIdCard, FaCheckCircle } from 'react-icons/fa';
import './Registo.css';

const Registo = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    telefone: '',
    dataNascimento: '',
    nif: '',
    morada: '',
    codigoPostal: '',
    localidade: '',
    password: '',
    confirmPassword: '',
    aceitaTermos: false,
    aceitaPrivacidade: false,
    aceitaComunicacoes: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (error) setError('');
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As passwords não coincidem!');
      return;
    }

    if (!formData.aceitaTermos || !formData.aceitaPrivacidade) {
      setError('Deve aceitar os termos e condições e a política de privacidade.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('A password não cumpre todos os requisitos de segurança.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5285/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.telefone,
          birthDate: formData.dataNascimento || null,
          nif: formData.nif,
          address: formData.morada,
          postalCode: formData.codigoPostal,
          city: formData.localidade
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      navigate('/registo-sucesso');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Erro ao criar conta. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registo-page">
      <div className="registo-container">

        <div className="registo-content">
          <div className="progress-steps">
            <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Dados Pessoais</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Morada</div>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Credenciais</div>
            </div>
          </div>

          <div className="registo-form-wrapper">
            <form onSubmit={step === 3 ? handleSubmit : handleNextStep}>
              {step === 1 && (
                <div className="form-step">
                  <h2>Dados Pessoais</h2>
                  <p className="step-description">Preencha os seus dados pessoais para criar a conta de sócio</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Primeiro Nome *</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          placeholder="Primeiro nome"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Último Nome *</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          placeholder="Último nome"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email *</label>
                      <div className="input-wrapper">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="seu.email@exemplo.com"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Telefone *</label>
                      <div className="input-wrapper">
                        <input
                          type="tel"
                          name="telefone"
                          value={formData.telefone}
                          onChange={handleChange}
                          placeholder="+351 912 345 678"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Data de Nascimento *</label>
                      <input
                        type="date"
                        name="dataNascimento"
                        value={formData.dataNascimento}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="form-group">
                      <label>NIF *</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="nif"
                          value={formData.nif}
                          onChange={handleChange}
                          placeholder="123456789"
                          maxLength="9"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Morada */}
              {step === 2 && (
                <div className="form-step">
                  <h2>Morada</h2>
                  <p className="step-description">Indique a sua morada de residência</p>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Morada *</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          name="morada"
                          value={formData.morada}
                          onChange={handleChange}
                          placeholder="Rua, número, andar"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Código Postal *</label>
                      <input
                        type="text"
                        name="codigoPostal"
                        value={formData.codigoPostal}
                        onChange={handleChange}
                        placeholder="4490-XXX"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Localidade *</label>
                      <input
                        type="text"
                        name="localidade"
                        value={formData.localidade}
                        onChange={handleChange}
                        placeholder="Póvoa de Varzim"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Credenciais e Termos */}
              {step === 3 && (
                <div className="form-step">
                  <h2>Credenciais de Acesso</h2>
                  <p className="step-description">Crie uma password segura para aceder à sua conta</p>

                  {error && (
                    <div className="error-message">
                      {error}
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Password *</label>
                      <div className="input-wrapper">
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Mínimo 8 caracteres"
                          required
                          disabled={loading}
                        />
                      </div>

                      <div className="password-requirements">
                        <div className={`requirement-item ${formData.password.length >= 8 ? 'met' : ''}`}>
                          {formData.password.length >= 8 ? <FaCheckCircle /> : <div className="circle-placeholder" />}
                          <span>Mínimo 8 caracteres</span>
                        </div>
                        <div className={`requirement-item ${/[A-Z]/.test(formData.password) ? 'met' : ''}`}>
                          {/[A-Z]/.test(formData.password) ? <FaCheckCircle /> : <div className="circle-placeholder" />}
                          <span>Uma letra maiúscula</span>
                        </div>
                        <div className={`requirement-item ${/[a-z]/.test(formData.password) ? 'met' : ''}`}>
                          {/[a-z]/.test(formData.password) ? <FaCheckCircle /> : <div className="circle-placeholder" />}
                          <span>Uma letra minúscula</span>
                        </div>
                        <div className={`requirement-item ${/[0-9]/.test(formData.password) ? 'met' : ''}`}>
                          {/[0-9]/.test(formData.password) ? <FaCheckCircle /> : <div className="circle-placeholder" />}
                          <span>Um número</span>
                        </div>
                        <div className={`requirement-item ${/[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/]/.test(formData.password) ? 'met' : ''}`}>
                          {/[!@#$%^&*()_+\-=[\]{}|;:'",.<>?/]/.test(formData.password) ? <FaCheckCircle /> : <div className="circle-placeholder" />}
                          <span>Um carácter especial</span>
                        </div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Confirmar Password *</label>
                      <div className="input-wrapper">
                        <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          placeholder="Repita a password"
                          minLength="8"
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="terms-section">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="aceitaTermos"
                        checked={formData.aceitaTermos}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                      <span>Aceito os <a href="#" target="_blank">Termos e Condições</a> *</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="aceitaPrivacidade"
                        checked={formData.aceitaPrivacidade}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                      <span>Aceito o <a href="http://localhost:5285/docs/regulamento_cdpovoa.pdf" target="_blank" rel="noopener noreferrer">Regulamento Geral sobre a Proteção de Dados</a> *</span>
                    </label>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="aceitaComunicacoes"
                        checked={formData.aceitaComunicacoes}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <span>Aceito receber comunicações do clube (opcional)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="form-navigation">
                {step > 1 && (
                  <button type="button" onClick={handlePrevStep} className="btn-prev" disabled={loading}>
                    ← Anterior
                  </button>
                )}

                {step < 3 ? (
                  <button type="submit" className="btn-next" disabled={loading}>
                    Próximo →
                  </button>
                ) : (
                  <button type="submit" className="registo-btn-submit" disabled={loading}>
                    Registar
                  </button>
                )}
              </div>
            </form>

            <div className="login-link">
              <p>Já tem conta? <Link to="/login">Faça login aqui</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registo;