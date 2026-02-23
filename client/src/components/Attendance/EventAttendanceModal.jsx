import React, { useState, useEffect } from 'react';
import './EventAttendanceModal.css';

const STATUS_OPTIONS = [
    { value: 1, label: 'Presente' },
    { value: 2, label: 'Faltou' },
    { value: 3, label: 'Atrasado' },
    { value: 4, label: 'Lesionado' },
    { value: 5, label: 'Justificado' },
];

const EventAttendanceModal = ({ isOpen, onClose, event, teamId }) => {
    const [athletes, setAthletes] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && event && teamId) {
            fetchData();
        }
    }, [isOpen, event, teamId]);

    // Guard: only show for Training events (Type 2)
    if (!isOpen || !event || event.eventType !== 2) return null;

    /* ------------------------------------------------------------------ */
    /*  Data fetching                                                        */
    /* ------------------------------------------------------------------ */
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };

            const [teamRes, attendanceRes] = await Promise.all([
                fetch(`http://51.178.43.232:5285/api/teams/${teamId}`, { headers }),
                fetch(`http://51.178.43.232:5285/api/attendance/event/${event.id}`, { headers }),
            ]);

            if (!teamRes.ok) throw new Error('Falha ao carregar equipa.');
            const teamData = await teamRes.json();

            let existingAttendance = [];
            if (attendanceRes.ok) existingAttendance = await attendanceRes.json();

            // Build lookup map
            const attendanceMap = {};
            existingAttendance.forEach(r => {
                attendanceMap[r.athleteId] = { status: r.status, reason: r.reason || '' };
            });

            // Default missing athletes to "Presente"
            const initialAttendance = {};
            (teamData.athletes || []).forEach(a => {
                initialAttendance[a.id] = attendanceMap[a.id] ?? { status: 1, reason: '' };
            });

            setAthletes(teamData.athletes || []);
            setAttendance(initialAttendance);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    /* ------------------------------------------------------------------ */
    /*  Handlers                                                             */
    /* ------------------------------------------------------------------ */
    const handleStatusChange = (athleteId, newStatus) => {
        setAttendance(prev => ({
            ...prev,
            [athleteId]: { ...prev[athleteId], status: parseInt(newStatus, 10) },
        }));
    };

    const handleReasonChange = (athleteId, newReason) => {
        setAttendance(prev => ({
            ...prev,
            [athleteId]: { ...prev[athleteId], reason: newReason },
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                eventId: event.id,
                attendances: Object.keys(attendance).map(athleteId => ({
                    athleteId: parseInt(athleteId, 10),
                    status: attendance[athleteId].status,
                    reason: attendance[athleteId].reason,
                })),
            };

            const response = await fetch('http://51.178.43.232:5285/api/attendance/batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Falha ao guardar assiduidade.');
            onClose();
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

    const presentCount = Object.values(attendance).filter(r => r.status === 1).length;

    /* ------------------------------------------------------------------ */
    /*  Render                                                               */
    /* ------------------------------------------------------------------ */
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="attendance-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="modal-header">
                    <h2>
                        <i className="fas fa-clipboard-check" />
                        Registar Assiduidade
                    </h2>
                    <button className="close-btn" onClick={onClose} aria-label="Fechar">
                        &times;
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body">

                    {/* Event Summary */}
                    <div className="event-summary">
                        <h3>{event.title}</h3>
                        <p className="event-date">
                            <i className="fas fa-calendar-alt" />
                            {formatDate(event.startDateTime)}
                            &nbsp;&bull;&nbsp;
                            <i className="fas fa-clock" />
                            {formatTime(event.startDateTime)}
                        </p>
                    </div>

                    {/* States */}
                    {loading ? (
                        <div className="loading-spinner">A carregar atletas…</div>
                    ) : error ? (
                        <div className="error-message">
                            <i className="fas fa-exclamation-circle" />
                            {error}
                        </div>
                    ) : (
                        <>
                            {/* Stats pill */}
                            {athletes.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    marginBottom: '12px',
                                    gap: '8px',
                                    fontSize: '0.82rem',
                                    fontWeight: 600,
                                    color: '#64748b',
                                }}>
                                    <span style={{
                                        background: '#f0fdf4',
                                        color: '#15803d',
                                        padding: '3px 10px',
                                        borderRadius: '20px',
                                        border: '1px solid #bbf7d0',
                                    }}>
                                        {presentCount} presente{presentCount !== 1 ? 's' : ''}
                                    </span>
                                    <span style={{
                                        background: '#f1f5f9',
                                        padding: '3px 10px',
                                        borderRadius: '20px',
                                        border: '1px solid #e2e8f0',
                                    }}>
                                        {athletes.length} atletas
                                    </span>
                                </div>
                            )}

                            {/* List */}
                            <div className="attendance-list">
                                <div className="attendance-header-row">
                                    <div className="col-name">Atleta</div>
                                    <div className="col-status">Estado</div>
                                    <div className="col-reason">Justificação</div>
                                </div>

                                {athletes.map(athlete => {
                                    const record = attendance[athlete.id] || { status: 1, reason: '' };
                                    return (
                                        <div key={athlete.id} className="attendance-row">
                                            <div className="col-name">
                                                <div className="athlete-avatar-small">
                                                    {getInitials(athlete)}
                                                </div>
                                                <span>{athlete.name}</span>
                                            </div>

                                            <div className="col-status">
                                                <select
                                                    value={record.status}
                                                    onChange={e => handleStatusChange(athlete.id, e.target.value)}
                                                    className={`status-select status-${record.status}`}
                                                >
                                                    {STATUS_OPTIONS.map(o => (
                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="col-reason">
                                                {record.status !== 1 && (
                                                    <input
                                                        type="text"
                                                        placeholder="Motivo (opcional)…"
                                                        value={record.reason}
                                                        onChange={e => handleReasonChange(athlete.id, e.target.value)}
                                                    />
                                                )}
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
                    {error && !loading && (
                        <span style={{ color: '#be123c', fontSize: '0.85rem', marginRight: 'auto' }}>
                            <i className="fas fa-exclamation-triangle" style={{ marginRight: 4 }} />
                            {error}
                        </span>
                    )}
                    <button className="btn-secondary" onClick={onClose} disabled={saving}>
                        Cancelar
                    </button>
                    <button className="btn-primary" onClick={handleSave} disabled={saving || loading}>
                        {saving ? (
                            <><i className="fas fa-spinner fa-spin" /> A guardar…</>
                        ) : (
                            <><i className="fas fa-save" /> Guardar Assiduidade</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EventAttendanceModal;