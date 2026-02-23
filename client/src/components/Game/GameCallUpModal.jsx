import React, { useState, useEffect } from 'react';
import './../Attendance/EventAttendanceModal.css'; // Reusing styles for now, can extract to common later

const GameCallUpModal = ({ isOpen, onClose, event, teamId }) => {
    const [athletes, setAthletes] = useState([]);
    const [selectedAthletes, setSelectedAthletes] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (isOpen && event && teamId) {
            fetchData();
        }
    }, [isOpen, event, teamId]);

    // Guard: only show for Game events (Type 1)
    if (!isOpen || !event || event.eventType !== 1) return null;

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage('');
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [teamRes, callUpRes] = await Promise.all([
                fetch(`http://localhost:5285/api/teams/${teamId}`, { headers }),
                fetch(`http://localhost:5285/api/game-callups/${event.id}`, { headers }),
            ]);

            if (!teamRes.ok) throw new Error('Falha ao carregar equipa.');
            const teamData = await teamRes.json();

            let calledUpIds = [];
            if (callUpRes.ok) {
                calledUpIds = await callUpRes.json();
            }

            setAthletes(teamData.athletes || []);
            setSelectedAthletes(new Set(calledUpIds));

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleAthlete = (athleteId) => {
        const newSelected = new Set(selectedAthletes);
        if (newSelected.has(athleteId)) {
            newSelected.delete(athleteId);
        } else {
            newSelected.add(athleteId);
        }
        setSelectedAthletes(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedAthletes.size === athletes.length) {
            setSelectedAthletes(new Set());
        } else {
            setSelectedAthletes(new Set(athletes.map(a => a.id)));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccessMessage('');
        try {
            const token = localStorage.getItem('token');
            const payload = {
                eventId: event.id,
                athleteIds: Array.from(selectedAthletes)
            };

            const response = await fetch('http://localhost:5285/api/game-callups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Falha ao guardar convocatória.');

            const result = await response.json();
            setSuccessMessage(`Convocatória guardada! ${result.addedCount} emails enviados.`);

            // Auto close after a brief success message
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                              */
    /* ------------------------------------------------------------------ */
    const formatDate = dt =>
        new Date(dt).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' });

    const formatTime = dt =>
        new Date(dt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

    const getInitials = athlete =>
        athlete.jerseyNumber
            ? `#${athlete.jerseyNumber}`
            : athlete.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="attendance-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="modal-header">
                    <h2>
                        <i className="fas fa-bullhorn" />
                        Convocatória para Jogo
                    </h2>
                    <button className="close-btn" onClick={onClose} aria-label="Fechar">
                        &times;
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">

                    {/* Event Summary */}
                    <div className="event-summary" style={{ borderLeftColor: '#d97706', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
                        <h3 style={{ color: '#b45309' }}>{event.title}</h3>
                        <p className="event-date" style={{ color: '#92400e' }}>
                            <i className="fas fa-calendar-alt" />
                            {formatDate(event.startDateTime)}
                            &nbsp;&bull;&nbsp;
                            <i className="fas fa-clock" />
                            {formatTime(event.startDateTime)}
                        </p>
                        <p style={{ marginTop: 5, fontSize: '0.9rem', color: '#92400e' }}>
                            <i className="fas fa-map-marker-alt" /> {event.location || 'Local a definir'}
                        </p>
                    </div>

                    {successMessage ? (
                        <div className="success-message" style={{
                            padding: '20px',
                            background: '#f0fdf4',
                            border: '1px solid #86efac',
                            color: '#15803d',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontSize: '1.1rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <i className="fas fa-check-circle" style={{ fontSize: '2rem' }} />
                            {successMessage}
                        </div>
                    ) : loading ? (
                        <div className="loading-spinner">A carregar equipa…</div>
                    ) : error ? (
                        <div className="error-message">
                            <i className="fas fa-exclamation-circle" />
                            {error}
                        </div>
                    ) : (
                        <>
                            {/* Stats & Actions */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '12px',
                            }}>
                                <button
                                    onClick={handleSelectAll}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#003380',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    {selectedAthletes.size === athletes.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                </button>

                                <div style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    color: '#64748b',
                                }}>
                                    <span style={{
                                        background: '#fff7ed',
                                        color: '#c2410c',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        border: '1px solid #ffedd5',
                                    }}>
                                        {selectedAthletes.size} convocados
                                    </span>
                                </div>
                            </div>

                            {/* List */}
                            <div className="attendance-list">
                                <div className="attendance-header-row">
                                    <div className="col-name" style={{ flex: 1 }}>Atleta</div>
                                    <div className="col-status" style={{ flex: 0, minWidth: '100px', textAlign: 'center' }}>Selecionar</div>
                                </div>

                                {athletes.map(athlete => {
                                    const isSelected = selectedAthletes.has(athlete.id);
                                    return (
                                        <div
                                            key={athlete.id}
                                            className="attendance-row"
                                            onClick={() => toggleAthlete(athlete.id)}
                                            style={{ cursor: 'pointer', background: isSelected ? '#fff7ed' : 'transparent' }}
                                        >
                                            <div className="col-name" style={{ flex: 1 }}>
                                                <div className="athlete-avatar-small" style={{ background: isSelected ? '#d97706' : '#94a3b8' }}>
                                                    {getInitials(athlete)}
                                                </div>
                                                <span style={{ fontWeight: isSelected ? 700 : 400 }}>{athlete.name}</span>
                                            </div>

                                            <div className="col-status" style={{ flex: 0, minWidth: '100px', display: 'flex', justifyContent: 'center' }}>
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    borderRadius: '6px',
                                                    border: isSelected ? 'none' : '2px solid #cbd5e1',
                                                    background: isSelected ? '#d97706' : 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    transition: 'all 0.2s ease'
                                                }}>
                                                    {isSelected && <i className="fas fa-check" style={{ fontSize: '0.8rem' }} />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose} disabled={saving}>
                        Cancelar
                    </button>
                    {!successMessage && (
                        <button className="btn-primary" onClick={handleSave} disabled={saving || loading} style={{ background: '#d97706', borderColor: '#d97706' }}>
                            {saving ? (
                                <><i className="fas fa-spinner fa-spin" /> A enviar…</>
                            ) : (
                                <><i className="fas fa-paper-plane" /> Guardar e Enviar Emails</>
                            )}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default GameCallUpModal;
