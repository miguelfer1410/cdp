// NOVO FICHEIRO: client/src/components/EscalaoRequest/EscalaoRequestCard.jsx

import React, { useState, useEffect, useRef } from 'react';
import { FaFileUpload, FaSpinner, FaCheckCircle, FaTimesCircle, FaClock, FaFilePdf } from 'react-icons/fa';
import './EscalaoRequestCard.css';

const API = 'http://localhost:5285';

const STATUS_MAP = {
    0: { label: 'Pendente', icon: <FaClock />, cls: 'pending' },
    1: { label: 'Aceite', icon: <FaCheckCircle />, cls: 'accepted' },
    2: { label: 'Recusado', icon: <FaTimesCircle />, cls: 'rejected' },
};

const EscalaoRequestCard = ({ userId, athleteProfileEscalao }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef();

    const fetchMyRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/escalao-requests/my?userId=${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setRequests(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) fetchMyRequests();
    }, [userId]);

    const hasPending = requests.some(r => r.status === 0);
    const isEscalao1 = athleteProfileEscalao === 'Escalão 1';

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.type !== 'application/pdf') { setError('Apenas ficheiros PDF são aceites.'); return; }
        if (f.size > 5 * 1024 * 1024) { setError('O ficheiro não pode exceder 5MB.'); return; }
        setError('');
        setFile(f);
    };

    const handleSubmit = async () => {
        if (!file) { setError('Seleciona um ficheiro PDF.'); return; }
        setSubmitting(true); setError(''); setSuccess('');
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('document', file);
            if (userId) formData.append('userId', userId);

            const res = await fetch(`${API}/api/escalao-requests`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSuccess(data.message);
            setFile(null);
            fileInputRef.current.value = '';
            fetchMyRequests();
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="escalao-card">
            <div className="escalao-card-header">
                <h2><FaFilePdf /> Comprovativo de Escalão</h2>
            </div>

            <div className="escalao-card-body">

                {/* Current escalão badge */}
                <div className="escalao-current">
                    <span className="escalao-label">Escalão atual:</span>
                    <span className={`escalao-badge ${isEscalao1 ? 'escalao-badge--1' : 'escalao-badge--2'}`}>
                        {athleteProfileEscalao || 'Sem escalão'}
                    </span>
                </div>

                {isEscalao1 ? (
                    <div className="escalao-info escalao-info--ok">
                        <FaCheckCircle /> Já beneficias do Escalão 1.
                    </div>
                ) : (
                    <>
                        <p className="escalao-desc">
                            Se beneficiares de apoio da Segurança Social, podes submeter o comprovativo
                            para ser enquadrado no <strong>Escalão 1</strong> e usufruir de mensalidade reduzida.
                        </p>

                        {/* Upload area */}
                        {!hasPending && (
                            <div className="escalao-upload-area">
                                <div
                                    className={`escalao-dropzone ${file ? 'has-file' : ''}`}
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {file
                                        ? <><FaFilePdf className="escalao-pdf-icon" /> {file.name}</>
                                        : <><FaFileUpload /> Clique para selecionar PDF<br /><small>Máx. 5MB</small></>}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                {error && <p className="escalao-error">{error}</p>}
                                {success && <p className="escalao-success">{success}</p>}
                                <button
                                    className="escalao-submit-btn"
                                    onClick={handleSubmit}
                                    disabled={submitting || !file}
                                >
                                    {submitting ? <FaSpinner className="icon-spin" /> : <FaFileUpload />}
                                    Enviar Comprovativo
                                </button>
                            </div>
                        )}

                        {hasPending && (
                            <div className="escalao-info escalao-info--pending">
                                <FaClock /> Pedido em análise. Aguarda a resposta do administrador.
                            </div>
                        )}
                    </>
                )}

                {/* History */}
                {requests.length > 0 && (
                    <div className="escalao-history">
                        <div className="escalao-history-title">Histórico de pedidos</div>
                        {requests.map(r => {
                            const s = STATUS_MAP[r.status];
                            return (
                                <div key={r.id} className={`escalao-history-item escalao-history-item--${s.cls}`}>
                                    <div className="escalao-history-left">
                                        {s.icon}
                                        <div>
                                            <span className="escalao-history-status">{s.label}</span>
                                            <span className="escalao-history-date">{formatDate(r.createdAt)}</span>
                                        </div>
                                    </div>
                                    {r.adminNote && <span className="escalao-history-note">"{r.adminNote}"</span>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EscalaoRequestCard;