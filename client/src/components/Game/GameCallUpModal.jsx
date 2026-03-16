import React, { useState, useEffect } from 'react';
import './GameCallUpModal.css';

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
            <div className="game-callup-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="gcm-header">
                    <h2>
                        <i className="fas fa-bullhorn" />
                        Convocatória para Jogo
                    </h2>
                    <button className="gcm-close-btn" onClick={onClose} aria-label="Fechar">
                        &times;
                    </button>
                </div>

                {/* Body */}
                <div className="gcm-body">

                    {/* Event Summary */}
                    <div className="gcm-event-card">
                        <div className="gcm-event-side-accent" />
                        <div className="gcm-event-info">
                            <h3>{event.title}</h3>
                            <div className="gcm-event-meta">
                                <span>
                                    <i className="fas fa-calendar-alt" />
                                    {formatDate(event.startDateTime)}
                                </span>
                                <span>
                                    <i className="fas fa-clock" />
                                    {formatTime(event.startDateTime)}
                                </span>
                                <span>
                                    <i className="fas fa-map-marker-alt" />
                                    {event.location || 'Local a definir'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {successMessage ? (
                        <div className="gcm-success-pane">
                            <i className="fas fa-check-circle gcm-success-icon" />
                            <p style={{ fontWeight: 600, color: '#15803d', margin: 0 }}>{successMessage}</p>
                        </div>
                    ) : loading ? (
                        <div className="loading-spinner">A carregar atletas…</div>
                    ) : error ? (
                        <div className="error-message">
                            <i className="fas fa-exclamation-circle" />
                            {error}
                        </div>
                    ) : (
                        <>
                            {/* Stats & Actions */}
                            <div className="gcm-selection-bar">
                                <button className="gcm-select-all" onClick={handleSelectAll}>
                                    {selectedAthletes.size === athletes.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                </button>

                                <div className="gcm-count-badge">
                                    {selectedAthletes.size} convocados
                                </div>
                            </div>

                            {/* List */}
                            <div className="gcm-list">
                                {athletes.map(athlete => {
                                    const isSelected = selectedAthletes.has(athlete.id);
                                    return (
                                        <div
                                            key={athlete.id}
                                            className={`gcm-row ${isSelected ? 'selected' : ''}`}
                                            onClick={() => toggleAthlete(athlete.id)}
                                        >
                                            <div className="gcm-avatar">
                                                {getInitials(athlete)}
                                            </div>

                                            <div className="gcm-athlete-name">
                                                {athlete.name}
                                            </div>

                                            <div className="gcm-checkbox">
                                                {isSelected && <i className="fas fa-check" style={{ fontSize: '0.8rem' }} />}
                                            </div>
                                        </div>
                                    );
                                })}
                                {athletes.length === 0 && (
                                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                                        Nenhum atleta encontrado na equipa.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="gcm-footer">
                    <button className="gcm-btn gcm-btn-cancel" onClick={onClose} disabled={saving}>
                        Cancelar
                    </button>
                    {!successMessage && (
                        <button
                            className="gcm-btn gcm-btn-primary"
                            onClick={handleSave}
                            disabled={saving || loading || selectedAthletes.size === 0}
                        >
                            {saving ? (
                                <><i className="fas fa-spinner fa-spin" /> A enviar…</>
                            ) : (
                                <><i className="fas fa-paper-plane" /> Guardar e Enviar</>
                            )}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default GameCallUpModal;
