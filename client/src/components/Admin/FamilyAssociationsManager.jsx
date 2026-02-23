import React, { useState, useEffect } from 'react';
import { FaBell, FaEye, FaCheckCircle, FaClock, FaUserFriends } from 'react-icons/fa';
import './FamilyAssociationsManager.css';

const API_BASE = 'http://51.178.43.232:5285';

const FamilyAssociationsManager = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('Pending'); // 'Pending' | 'Seen'
    const [markingId, setMarkingId] = useState(null);

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

    const handleMarkSeen = async (id) => {
        setMarkingId(id);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/family-associations/${id}/seen`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                // Remove from current list (moves to Seen tab)
                setRequests(prev => prev.filter(r => r.id !== id));
            }
        } catch (e) {
            console.error('Error marking as seen:', e);
        } finally {
            setMarkingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('pt-PT', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    return (
        <div className="fam-manager">
            <div className="fam-manager-header">
                <div className="fam-manager-title">
                    <FaBell />
                    <h2>Requisições de Associação Familiar</h2>
                </div>
                <p className="fam-manager-subtitle">
                    Os utilizadores solicitam a associação de familiares. Após ver o pedido, utilize a aba
                    <strong> Pessoas</strong> para realizar a ligação das contas.
                </p>
            </div>

            {/* Filter Tabs */}
            <div className="fam-manager-tabs">
                <button
                    className={`fam-tab-btn ${filter === 'Pending' ? 'active' : ''}`}
                    onClick={() => setFilter('Pending')}
                >
                    <FaClock /> Pendentes
                    {filter === 'Pending' && requests.length > 0 && (
                        <span className="fam-tab-badge">{requests.length}</span>
                    )}
                </button>
                <button
                    className={`fam-tab-btn ${filter === 'Seen' ? 'active' : ''}`}
                    onClick={() => setFilter('Seen')}
                >
                    <FaEye /> Vistos
                </button>
            </div>

            {/* Table */}
            {loading ? (
                <div className="fam-manager-loading">
                    <i className="fas fa-spinner fa-spin" /> A carregar...
                </div>
            ) : requests.length === 0 ? (
                <div className="fam-manager-empty">
                    <FaUserFriends />
                    <p>{filter === 'Pending' ? 'Não existem pedidos pendentes.' : 'Não existem pedidos vistos.'}</p>
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
                                {filter === 'Seen' && <th>Visto em</th>}
                                {filter === 'Pending' && <th>Ação</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td>
                                        <div className="fam-requester-cell">
                                            <span className="fam-requester-name">{req.requesterName}</span>
                                            <span className="fam-requester-email">{req.requesterEmail}</span>
                                        </div>
                                    </td>
                                    <td className="fam-family-name">{req.familyMemberName}</td>
                                    <td>{req.familyMemberNif || '—'}</td>
                                    <td>{formatDate(req.familyMemberBirthDate)}</td>
                                    <td className="fam-message">{req.requesterMessage || <span className="fam-no-msg">Sem mensagem</span>}</td>
                                    <td>{formatDate(req.requestedAt)}</td>
                                    {filter === 'Seen' && <td>{formatDate(req.seenAt)}</td>}
                                    {filter === 'Pending' && (
                                        <td>
                                            <button
                                                className="fam-seen-btn"
                                                onClick={() => handleMarkSeen(req.id)}
                                                disabled={markingId === req.id}
                                                title="Marcar como Visto"
                                            >
                                                {markingId === req.id ? (
                                                    <i className="fas fa-spinner fa-spin" />
                                                ) : (
                                                    <><FaCheckCircle /> Marcar como Visto</>
                                                )}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default FamilyAssociationsManager;
