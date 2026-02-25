// client/src/components/Admin/EscalaoRequestsManager.jsx

import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaCheck, FaTimes, FaSpinner, FaClock, FaExternalLinkAlt } from 'react-icons/fa';
import './EscalaoRequestsManager.css';

const API = 'http://localhost:5285';

const EscalaoRequestsManager = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending');
    const [processingId, setProcessingId] = useState(null);
    const [noteMap, setNoteMap] = useState({});
    const [error, setError] = useState('');

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/escalao-requests?status=${filter}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setRequests(await res.json());
        } catch (e) {
            setError('Erro ao carregar pedidos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, [filter]);

    const handleReview = async (id, accept, chosenEscalao = null) => {
        setProcessingId(id);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/escalao-requests/${id}/review`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    accept,
                    note: noteMap[id] || '',
                    escalao: chosenEscalao
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (e) {
            setError(e.message);
        } finally {
            setProcessingId(null);
        }
    };

    const formatDate = (d) => d
        ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '—';

    const statusLabel = { Pending: 'Pendentes', Accepted: 'Aceites', Rejected: 'Recusados' };

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

    return (
        <div className="escalao-manager">
            <div className="escalao-manager-header">
                <div>
                    <h2><FaFilePdf /> Comprovativos de Escalão</h2>
                    <p>Análise de documentos para enquadramento em escalões de apoio social.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="escalao-manager-tabs">
                {['Pending', 'Accepted', 'Rejected'].map(s => (
                    <button
                        key={s}
                        className={`escalao-tab ${filter === s ? 'active' : ''}`}
                        onClick={() => setFilter(s)}
                    >
                        {s === 'Pending' && <FaClock />}
                        {s === 'Accepted' && <FaCheck />}
                        {s === 'Rejected' && <FaTimes />}
                        {statusLabel[s]}
                    </button>
                ))}
            </div>

            {error && <div className="escalao-manager-error">{error}</div>}

            {loading ? (
                <div className="escalao-manager-loading"><FaSpinner className="icon-spin" /> A carregar...</div>
            ) : requests.length === 0 ? (
                <div className="escalao-manager-empty">
                    <FaFilePdf />
                    <p>Não existem pedidos {statusLabel[filter].toLowerCase()}.</p>
                </div>
            ) : (
                <div className="escalao-manager-list">
                    {requests.map(r => (
                        <div key={r.id} className="escalao-request-card">
                            {/* Athlete info */}
                            <div className="erc-athlete">
                                <div className="erc-avatar">
                                    {r.athlete.firstName?.[0]}{r.athlete.lastName?.[0]}
                                </div>
                                <div>
                                    <div className="erc-name">{r.athlete.firstName} {r.athlete.lastName}</div>
                                    <div className="erc-email">{getDisplayEmail(r.athlete.email)}</div>
                                </div>
                                <div className="erc-escalao-atual">
                                    Escalão atual: <strong>{r.escalaoAtual || 'Normal (Sem Escalão)'}</strong>
                                </div>
                            </div>

                            <div className="erc-meta">
                                <span className="erc-date"><FaClock /> {formatDate(r.createdAt)}</span>
                            </div>

                            {/* Actions */}
                            {filter === 'Pending' ? (
                                <div className="erc-actions">
                                    {/* View PDF */}
                                    <a
                                        href={`${API}${r.documentUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="erc-btn erc-btn--pdf"
                                    >
                                        <FaFilePdf /> Ver Documento
                                    </a>

                                    {/* Note field */}
                                    <input
                                        type="text"
                                        className="erc-note-input"
                                        placeholder="Nota para o atleta (opcional)"
                                        value={noteMap[r.id] || ''}
                                        onChange={e => setNoteMap(prev => ({ ...prev, [r.id]: e.target.value }))}
                                    />

                                    <div className="erc-approval-group">
                                        {/* Accept Escalao 1 */}
                                        <button
                                            className="erc-btn erc-btn--accept"
                                            onClick={() => handleReview(r.id, true, 'Escalão 1')}
                                            disabled={processingId === r.id}
                                        >
                                            {processingId === r.id
                                                ? <FaSpinner className="icon-spin" />
                                                : <FaCheck />}
                                            Aceitar (Escalão 1)
                                        </button>

                                        {/* Accept Escalao 2 */}
                                        <button
                                            className="erc-btn erc-btn--accept-alt"
                                            onClick={() => handleReview(r.id, true, 'Escalão 2')}
                                            disabled={processingId === r.id}
                                        >
                                            {processingId === r.id
                                                ? <FaSpinner className="icon-spin" />
                                                : <FaCheck />}
                                            Aceitar (Escalão 2)
                                        </button>

                                        {/* Reject */}
                                        <button
                                            className="erc-btn erc-btn--reject"
                                            onClick={() => handleReview(r.id, false)}
                                            disabled={processingId === r.id}
                                        >
                                            {processingId === r.id
                                                ? <FaSpinner className="icon-spin" />
                                                : <FaTimes />}
                                            Recusar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="erc-actions">
                                    <a
                                        href={`${API}${r.documentUrl}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="erc-btn erc-btn--pdf"
                                    >
                                        <FaFilePdf /> Ver Documento
                                    </a>
                                    {r.adminNote && (
                                        <span className="erc-resolved-note">Nota: "{r.adminNote}"</span>
                                    )}
                                    <span className="erc-resolved-date">
                                        Processado em {formatDate(r.reviewedAt)}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EscalaoRequestsManager;