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
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://51.178.43.232:5285/api/auth/login', {
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

      // Backend now returns roles array instead of userType
      const roles = data.roles || ['User'];
      console.log(roles);
      const primaryRole = roles.includes('Admin') ? 'Admin' : (roles[0] || 'User');

      localStorage.setItem('token', data.token);
      localStorage.setItem('roles', JSON.stringify(roles));
      console.log(primaryRole);
      localStorage.setItem('userType', primaryRole); // For backwards compatibility
      localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userId', data.id);
      // Store all linked users (siblings sharing same email) for athlete tab switching
      if (data.linkedUsers && data.linkedUsers.length > 0) {
        localStorage.setItem('linkedUsers', JSON.stringify(data.linkedUsers));
      } else {
        localStorage.removeItem('linkedUsers');
      }

      // Redirect based on role
      switch (primaryRole.toLowerCase()) {
        case 'admin':
          navigate('/dashboard-admin');
          break;
        case 'atleta':
          navigate('/dashboard-atleta');
          break;
        case 'treinador':
          navigate('/dashboard-treinador');
          break;
        case 'socio':
        case 'user':
          navigate('/dashboard-socio');
          break;
        default:
          navigate('/');
      }
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

              <div className="auth-links" style={{ marginBottom: '20px', textAlign: 'right' }}>
                <Link to="/recuperar-password" style={{ color: '#003380', fontSize: '0.9rem', textDecoration: 'none' }}>
                  Esqueceu-se da password?
                </Link>
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
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