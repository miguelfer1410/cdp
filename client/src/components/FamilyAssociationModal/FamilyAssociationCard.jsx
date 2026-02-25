import React, { useState, useEffect } from 'react';
import { FaUserFriends, FaCheckCircle, FaClock, FaEye } from 'react-icons/fa';
import './FamilyAssociationCard.css';

const API_BASE = 'http://localhost:5285';

const FamilyAssociationCard = ({ userId }) => {
    const [form, setForm] = useState({
        familyMemberName: '',
        familyMemberNif: '',
        familyMemberBirthDate: '',
        requesterMessage: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [myRequests, setMyRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

    const fetchMyRequests = async () => {
        setLoadingRequests(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/family-associations/my-requests?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMyRequests(data);
            }
        } catch (e) {
            console.error('Error fetching requests:', e);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        if (userId) fetchMyRequests();
    }, [userId]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.familyMemberName.trim()) {
            setError('O nome do familiar é obrigatório.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/family-associations/request`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    familyMemberName: form.familyMemberName,
                    familyMemberNif: form.familyMemberNif || null,
                    familyMemberBirthDate: form.familyMemberBirthDate || null,
                    requesterMessage: form.requesterMessage || null,
                    userId: userId
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Erro ao enviar requisição');
            }

            setSubmitted(true);
            fetchMyRequests();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('pt-PT');
    };

    const getStatusInfo = (status) => {
        if (status === 'Seen') return { label: 'Visto', icon: <FaEye />, className: 'status-seen' };
        return { label: 'Pendente', icon: <FaClock />, className: 'status-pending' };
    };

    return (
        <div className="fam-card">
            <div className="fam-card-header">
                <h2><FaUserFriends /> Associação Familiar</h2>
            </div>
            <div className="fam-card-body">
                {!submitted ? (
                    <form onSubmit={handleSubmit} className="fam-form">
                        <p className="fam-form-description">
                            Preenche os dados do familiar inscrito no clube que pretendes associar à tua conta.
                        </p>

                        <div className="fam-form-group">
                            <label htmlFor="familyMemberName">Nome Completo *</label>
                            <input
                                id="familyMemberName"
                                name="familyMemberName"
                                type="text"
                                placeholder="Nome do familiar"
                                value={form.familyMemberName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="fam-form-row">
                            <div className="fam-form-group">
                                <label htmlFor="familyMemberNif">NIF</label>
                                <input
                                    id="familyMemberNif"
                                    name="familyMemberNif"
                                    type="text"
                                    placeholder="123456789"
                                    maxLength={9}
                                    value={form.familyMemberNif}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="fam-form-group">
                                <label htmlFor="familyMemberBirthDate">Data de Nascimento</label>
                                <input
                                    id="familyMemberBirthDate"
                                    name="familyMemberBirthDate"
                                    type="date"
                                    value={form.familyMemberBirthDate}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="fam-form-group">
                            <label htmlFor="requesterMessage">Mensagem (opcional)</label>
                            <textarea
                                id="requesterMessage"
                                name="requesterMessage"
                                placeholder="Informação adicional..."
                                rows={3}
                                value={form.requesterMessage}
                                onChange={handleChange}
                            />
                        </div>

                        {error && <div className="fam-error">{error}</div>}

                        <button type="submit" className="fam-submit-btn" disabled={submitting}>
                            {submitting ? (
                                <><i className="fas fa-spinner fa-spin" /> A enviar...</>
                            ) : (
                                <><FaUserFriends /> Enviar Pedido</>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="fam-success">
                        <FaCheckCircle className="fam-success-icon" />
                        <h3>Pedido Enviado!</h3>
                        <p>O administrador irá processar o teu pedido.</p>
                        <button className="fam-submit-btn" onClick={() => setSubmitted(false)}>
                            Enviar outro pedido
                        </button>
                    </div>
                )}

                {myRequests.length > 0 && (
                    <div className="fam-history">
                        <h4>Os meus pedidos</h4>
                        {loadingRequests ? (
                            <div className="fam-loading">A carregar...</div>
                        ) : (
                            myRequests.map(req => {
                                const statusInfo = getStatusInfo(req.status);
                                return (
                                    <div key={req.id} className="fam-history-item">
                                        <div className="fam-history-info">
                                            <span className="fam-history-name">{req.familyMemberName}</span>
                                            <span className="fam-history-date">{formatDate(req.requestedAt)}</span>
                                        </div>
                                        <span className={`fam-status-badge ${statusInfo.className}`}>
                                            {statusInfo.icon} {statusInfo.label}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FamilyAssociationCard;
