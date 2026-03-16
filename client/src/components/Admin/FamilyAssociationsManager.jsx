import React, { useState, useEffect } from 'react';
import { FaBell, FaEye, FaCheckCircle, FaClock, FaUserFriends, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import './FamilyAssociationsManager.css';

const API_BASE = 'http://localhost:5285';

const FamilyAssociationsManager = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('Pending');
    const [processingId, setProcessingId] = useState(null);
    const [rejectModal, setRejectModal] = useState(null); // { id, requesterName }
    const [rejectNote, setRejectNote] = useState('');
    const [toast, setToast] = useState(null); // { type: 'success'|'error'|'warning', message }

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/family-associations?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);
            }
        } catch (e) {
            console.error('Error fetching family requests:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const handleAccept = async (id) => {
        setProcessingId(id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/family-associations/${id}/accept`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                showToast('success', data.message);
                setRequests(prev => prev.filter(r => r.id !== id));
            } else if (res.status === 404) {
                // User not found — show prominent warning
                showToast('warning', data.message);
            } else {
                showToast('error', data.message || 'Erro ao aceitar o pedido.');
            }
        } catch (e) {
            showToast('error', 'Erro de ligação ao servidor.');
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectModal = (req) => {
        setRejectModal({ id: req.id, requesterName: req.requesterName });
        setRejectNote('');
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        setProcessingId(rejectModal.id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/family-associations/${rejectModal.id}/reject`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ adminNote: rejectNote.trim() || null })
            });
            const data = await res.json();
            if (res.ok) {
                showToast('success', 'Pedido recusado com sucesso.');
                setRequests(prev => prev.filter(r => r.id !== rejectModal.id));
                setRejectModal(null);
            } else {
                showToast('error', data.message || 'Erro ao recusar o pedido.');
            }
        } catch (e) {
            showToast('error', 'Erro de ligação ao servidor.');
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('pt-PT', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const getDisplayEmail = (email) => {
        if (!email) return 'N/A';
        const atIndex = email.lastIndexOf('@');
        if (atIndex === -1) return email;
        const localPart = email.substring(0, atIndex);
        const domain = email.substring(atIndex);
        const plusIndex = localPart.indexOf('+');
        if (plusIndex !== -1) {
            return localPart.substring(0, plusIndex) + domain;
        }
        return email;
    };

    const tabs = [
        { key: 'Pending', label: 'Pendentes', icon: <FaClock /> },
        { key: 'Seen', label: 'Vistos', icon: <FaEye /> },
        { key: 'Accepted', label: 'Aceites', icon: <FaCheck /> },
        { key: 'Rejected', label: 'Recusados', icon: <FaTimes /> },
    ];

    return (
        <div className="fam-manager">
            {/* Toast Notification */}
            {toast && (
                <div className={`fam-toast fam-toast--${toast.type}`}>
                    {toast.type === 'warning' && <FaExclamationTriangle />}
                    {toast.type === 'success' && <FaCheckCircle />}
                    {toast.type === 'error' && <FaTimes />}
                    <span>{toast.message}</span>
                    <button className="fam-toast-close" onClick={() => setToast(null)}><FaTimes /></button>
                </div>
            )}

            <div className="fam-manager-header">
                <div className="fam-manager-title">
                    <FaBell />
                    <h2>Requisições de Associação Familiar</h2>
                </div>
                <p className="fam-manager-subtitle">
                    Aceite ou recuse os pedidos abaixo. Ao aceitar, a ligação familiar é criada automaticamente se o utilizador for encontrado.
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="fam-manager-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`fam-tab-btn ${filter === tab.key ? 'active' : ''}`}
                        onClick={() => setFilter(tab.key)}
                    >
                        {tab.icon} {tab.label}
                        {tab.key === 'Pending' && filter === 'Pending' && requests.length > 0 && (
                            <span className="fam-tab-badge">{requests.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Table */}
            {loading ? (
                <div className="fam-manager-loading">
                    <i className="fas fa-spinner fa-spin" /> A carregar...
                </div>
            ) : requests.length === 0 ? (
                <div className="fam-manager-empty">
                    <FaUserFriends />
                    <p>Sem pedidos nesta categoria.</p>
                </div>
            ) : (
                <div className="fam-manager-table-wrapper">
                    <table className="fam-manager-table">
                        <thead>
                            <tr>
                                <th>Solicitante</th>
                                <th>Nome do Familiar</th>
                                <th>NIF</th>
                                <th>Data de Nascimento</th>
                                <th>Mensagem</th>
                                <th>Data do Pedido</th>
                                {(filter === 'Accepted' || filter === 'Rejected') && <th>Processado em</th>}
                                {filter === 'Rejected' && <th>Nota do Admin</th>}
                                {filter === 'Seen' && <th>Visto em</th>}
                                {filter === 'Pending' && <th>Ação</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td data-label="Solicitante">
                                        <div className="fam-requester-cell">
                                            <span className="fam-requester-name">{req.requesterName}</span>
                                            <span className="fam-requester-email">{getDisplayEmail(req.requesterEmail)}</span>
                                        </div>
                                    </td>
                                    <td data-label="Nome do Familiar" className="fam-family-name">{req.familyMemberName}</td>
                                    <td data-label="NIF">{req.familyMemberNif || '—'}</td>
                                    <td data-label="Data de Nascimento">{formatDate(req.familyMemberBirthDate)}</td>
                                    <td data-label="Mensagem" className="fam-message">{req.requesterMessage || <span className="fam-no-msg">Sem mensagem</span>}</td>
                                    <td data-label="Data do Pedido">{formatDate(req.requestedAt)}</td>
                                    {(filter === 'Accepted' || filter === 'Rejected') && (
                                        <td data-label="Processado em">{formatDate(req.reviewedAt)}</td>
                                    )}
                                    {filter === 'Rejected' && (
                                        <td data-label="Nota do Admin">{req.adminNote || <span className="fam-no-msg">—</span>}</td>
                                    )}
                                    {filter === 'Seen' && <td data-label="Visto em">{formatDate(req.seenAt)}</td>}
                                    {filter === 'Pending' && (
                                        <td data-label="Ação">
                                            <div className="fam-action-group">
                                                <button
                                                    className="fam-accept-btn"
                                                    onClick={() => handleAccept(req.id)}
                                                    disabled={processingId === req.id}
                                                    title="Aceitar pedido e criar associação"
                                                >
                                                    {processingId === req.id ? (
                                                        <i className="fas fa-spinner fa-spin" />
                                                    ) : (
                                                        <><FaCheck /> Aceitar</>
                                                    )}
                                                </button>
                                                <button
                                                    className="fam-reject-btn"
                                                    onClick={() => openRejectModal(req)}
                                                    disabled={processingId === req.id}
                                                    title="Recusar pedido"
                                                >
                                                    <FaTimes /> Recusar
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fam-reject-overlay" onClick={() => setRejectModal(null)}>
                    <div className="fam-reject-modal" onClick={e => e.stopPropagation()}>
                        <div className="fam-reject-modal-header">
                            <FaTimes className="fam-reject-modal-icon" />
                            <h3>Recusar Pedido</h3>
                        </div>
                        <p className="fam-reject-modal-desc">
                            Vai recusar o pedido de <strong>{rejectModal.requesterName}</strong>. Pode adicionar uma nota opcional.
                        </p>
                        <textarea
                            className="fam-reject-note"
                            placeholder="Nota opcional (ex: informação incorreta, utilizador não encontrado...)"
                            value={rejectNote}
                            onChange={e => setRejectNote(e.target.value)}
                            rows={3}
                        />
                        <div className="fam-reject-modal-actions">
                            <button className="fam-reject-cancel-btn" onClick={() => setRejectModal(null)}>
                                Cancelar
                            </button>
                            <button
                                className="fam-reject-confirm-btn"
                                onClick={handleReject}
                                disabled={processingId === rejectModal.id}
                            >
                                {processingId === rejectModal.id ? (
                                    <i className="fas fa-spinner fa-spin" />
                                ) : (
                                    <><FaTimes /> Confirmar Recusa</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyAssociationsManager;
