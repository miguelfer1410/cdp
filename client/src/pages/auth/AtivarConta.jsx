import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash, FaCheckCircle, FaShieldAlt } from 'react-icons/fa';
import './AuthDetail.css';

const AtivarConta = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activated, setActivated] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Link de ativação inválido ou em falta.');
        }
    }, [token]);

    const getPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        return strength;
    };

    const strengthLevel = getPasswordStrength(newPassword);
    const strengthLabels = ['', 'Muito fraca', 'Fraca', 'Razoável', 'Forte', 'Muito forte'];
    const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#059669'];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('As passwords não coincidem.');
            return;
        }

        if (newPassword.length < 6) {
            setError('A password deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('http://localhost:5285/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    newPassword,
                    confirmPassword
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setActivated(true);
                setMessage('Conta ativada com sucesso! A redirecionar para o login...');
                setTimeout(() => {
                    navigate('/login');
                }, 4000);
            } else {
                setError(data.message || 'Link de ativação inválido ou expirado. Contacte o administrador do clube.');
            }
        } catch (err) {
            setError('Falha na conexão com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2>Link Inválido</h2>
                        <p>O link de ativação é inválido ou está em falta. Contacte o administrador do clube para obter um novo link.</p>
                    </div>
                    <div className="auth-links">
                        <Link to="/login" className="back-link">← Voltar ao Login</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (activated) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div style={{ fontSize: '3rem', color: '#059669', marginBottom: '16px' }}>
                            <FaCheckCircle />
                        </div>
                        <h2>Conta Ativada!</h2>
                        <p>A sua conta foi ativada com sucesso. Será redirecionado para a página de login em instantes.</p>
                    </div>
                    <div className="success-message">{message}</div>
                    <div className="auth-links">
                        <Link to="/login" className="back-link">Ir para o Login →</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div style={{ fontSize: '2.5rem', color: '#003380', marginBottom: '12px' }}>
                        <FaShieldAlt />
                    </div>
                    <h2>Ativar Conta</h2>
                    <p>Bem-vindo ao Clube Desportivo da Póvoa! Defina a sua password para ativar a conta.</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-with-icon">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Escolha uma password segura"
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                        {newPassword && (
                            <div style={{ marginTop: '8px' }}>
                                <div style={{
                                    display: 'flex',
                                    gap: '4px',
                                    marginBottom: '4px'
                                }}>
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} style={{
                                            flex: 1,
                                            height: '4px',
                                            borderRadius: '2px',
                                            background: i <= strengthLevel ? strengthColors[strengthLevel] : '#e5e7eb',
                                            transition: 'background 0.3s'
                                        }} />
                                    ))}
                                </div>
                                <span style={{
                                    fontSize: '0.8rem',
                                    color: strengthColors[strengthLevel],
                                    fontWeight: 500
                                }}>
                                    {strengthLabels[strengthLevel]}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Confirmar Password</label>
                        <div className="input-with-icon">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repita a password"
                                required
                            />
                        </div>
                        {confirmPassword && newPassword !== confirmPassword && (
                            <span style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                                As passwords não coincidem
                            </span>
                        )}
                        {confirmPassword && newPassword === confirmPassword && (
                            <span style={{ fontSize: '0.8rem', color: '#059669', marginTop: '4px', display: 'block' }}>
                                ✓ As passwords coincidem
                            </span>
                        )}
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'A ativar...' : 'Ativar Conta'}
                    </button>
                </form>

                <div className="auth-links" style={{ marginTop: '20px' }}>
                    <Link to="/login" className="back-link">← Voltar ao Login</Link>
                </div>
            </div>
        </div>
    );
};

export default AtivarConta;