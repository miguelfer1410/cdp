import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaUserTie, FaDumbbell, FaUserShield, FaIdCard, FaEye, FaEyeSlash } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'socio'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userTypes = [
    { value: 'socio', label: 'Sócio', icon: <FaIdCard /> },
    { value: 'atleta', label: 'Atleta', icon: <FaDumbbell /> },
    { value: 'treinador', label: 'Treinador', icon: <FaUserTie /> },
    { value: 'admin', label: 'Administrador', icon: <FaUserShield /> }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call backend API
      const response = await fetch('http://localhost:5285/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('userType', data.userType);
      localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
      localStorage.setItem('userEmail', data.email);

      // Navigate to home page
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Email ou password incorretos. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-branding">
            <img src="/CDP_logo.png" alt="CDP Logo" className="login-logo" />
            <h1>Clube Desportivo Da Póvoa</h1>
            <p>Aceda à sua área pessoal</p>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrapper">
            <h2>Bem-vindo</h2>
            <p className="login-subtitle">Entre na sua conta para continuar</p>

            <form onSubmit={handleSubmit} className="login-form">

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
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
                <label>Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" disabled={loading} />
                  <span>Lembrar-me</span>
                </label>
                <a href="#" className="forgot-password">Esqueceu a password?</a>
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'A entrar...' : 'Entrar'}
              </button>

              {formData.userType === 'socio' && (
                <div className="register-link">
                  <p>Ainda não é sócio? <Link to="/registo">Registe-se aqui</Link></p>
                </div>
              )}

              {formData.userType !== 'socio' && (
                <div className="admin-notice">
                  <p><FaUserShield /> Conta criada pelo administrador</p>
                </div>
              )}
            </form>

            <div className="login-footer">
              <Link to="/">← Voltar ao site</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;