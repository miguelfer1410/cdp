import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaCalendarAlt, FaClock, FaSync } from 'react-icons/fa';
import './CalendarManager.css';

const dayTranslations = {
    'Monday': 'Seg',
    'Tuesday': 'Ter',
    'Wednesday': 'Qua',
    'Thursday': 'Qui',
    'Friday': 'Sex',
    'Saturday': 'Sáb',
    'Sunday': 'Dom'
};

const CalendarManager = ({ restrictedTeamId = null, onBack = null }) => {
    const [activeTab, setActiveTab] = useState('events'); // 'events' or 'schedules'
    const [events, setEvents] = useState([]);
    const [sports, setSports] = useState([]);
    const [teams, setTeams] = useState([]);
    const [trainingSchedules, setTrainingSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedSportFilter, setSelectedSportFilter] = useState('');
    const [selectedTeamFilter, setSelectedTeamFilter] = useState('');
    const [selectedEventTypeFilter, setSelectedEventTypeFilter] = useState('');
    const [editingEvent, setEditingEvent] = useState(null);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        eventType: 1,
        startDateTime: '',
        endDateTime: '',
        teamId: restrictedTeamId || null,
        sportId: '',
        location: '',
        description: '',
        opponentName: '',
        isHomeGame: true,
        ticketPriceSocio: '',
        ticketPriceNonSocio: ''
    });

    const [scheduleFormData, setScheduleFormData] = useState({
        teamId: restrictedTeamId ? restrictedTeamId.toString() : '',
        daysOfWeek: [],
        startTime: '18:00',
        endTime: '20:00',
        location: '',
        validFrom: '',
        validUntil: '',
        isActive: true
    });

    // Derive the restricted sport from the team (when coach mode is active)
    const restrictedTeam = restrictedTeamId ? teams.find(t => t.id === restrictedTeamId) : null;
    const restrictedSportId = restrictedTeam?.sportId || null;

    // Pre-fill sport and team as soon as teams are loaded (coach mode)
    useEffect(() => {
        if (restrictedTeamId && restrictedSportId) {
            setFormData(prev => ({
                ...prev,
                teamId: restrictedTeamId,
                sportId: restrictedSportId
            }));
            setScheduleFormData(prev => ({
                ...prev,
                teamId: restrictedTeamId.toString()
            }));
        }
    }, [restrictedSportId, restrictedTeamId]);

    useEffect(() => {
        fetchEvents();
        fetchSports();
        fetchTeams();
        fetchTrainingSchedules();
    }, []);

    useEffect(() => {
        if (activeTab === 'events') {
            fetchEvents();
        } else if (activeTab === 'schedules') {
            fetchTrainingSchedules();
        }
    }, [activeTab]);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = 'http://localhost:5285/api/events';
            if (restrictedTeamId) {
                url += `?teamId=${restrictedTeamId}`;
            }
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSports = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/sports/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSports(data.filter(s => s.isActive));
            }
        } catch (error) {
            console.error('Error fetching sports:', error);
        }
    };

    const fetchTeams = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/teams/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTeams(data);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const fetchTrainingSchedules = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = 'http://localhost:5285/api/trainingschedules';
            if (restrictedTeamId) {
                url += `?teamId=${restrictedTeamId}`;
            }
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTrainingSchedules(data);
            }
        } catch (error) {
            console.error('Error fetching training schedules:', error);
        }
    };

    const handleScheduleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const parsedTeamId = parseInt(scheduleFormData.teamId);

        if (!parsedTeamId || isNaN(parsedTeamId)) {
            alert('Por favor, selecione uma equipa válida.');
            return;
        }

        const dataToSend = {
            ...scheduleFormData,
            teamId: parsedTeamId
        };

        try {
            const url = editingSchedule
                ? `http://localhost:5285/api/trainingschedules/${editingSchedule.id}`
                : 'http://localhost:5285/api/trainingschedules';

            const response = await fetch(url, {
                method: editingSchedule ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            if (response.ok) {
                const result = await response.json();
                await fetchTrainingSchedules();

                // Auto-generate events from the pattern
                await handleGenerateEvents(result.id);

                setShowScheduleModal(false);
                resetScheduleForm();
            }
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Erro ao guardar padrão');
        }
    };

    const handleScheduleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja eliminar este padrão?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/trainingschedules/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await fetchTrainingSchedules();
                alert('Padrão eliminado!');
            }
        } catch (error) {
            console.error('Error deleting schedule:', error);
            alert('Erro ao eliminar padrão');
        }
    };

    const handleCleanupOrphaned = async () => {
        if (!window.confirm('Isto irá remover todos os treinos que ficaram no calendário de padrões já eliminados. Continuar?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/trainingschedules/cleanup-orphaned', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message);
                await fetchEvents();
            }
        } catch (error) {
            console.error('Error cleaning up orphaned sessions:', error);
            alert('Erro ao limpar treinos');
        }
    };

    const handleGenerateEvents = async (scheduleId) => {
        if (!window.confirm('Isto irá apagar todos os treinos existentes e gerar novos baseados no padrão. Continuar?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/trainingschedules/${scheduleId}/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                await fetchEvents();
                alert(result.message);
            }
        } catch (error) {
            console.error('Error generating events:', error);
            alert('Erro ao gerar eventos');
        }
    };

    const handleEditSchedule = (schedule) => {
        setEditingSchedule(schedule);
        setScheduleFormData({
            teamId: schedule.teamId.toString(),
            daysOfWeek: schedule.daysOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            location: schedule.location || '',
            validFrom: schedule.validFrom.split('T')[0],
            validUntil: schedule.validUntil.split('T')[0],
            isActive: schedule.isActive
        });
        setShowScheduleModal(true);
    };

    const resetScheduleForm = () => {
        setScheduleFormData({
            teamId: restrictedTeamId ? restrictedTeamId.toString() : '',
            daysOfWeek: [],
            startTime: '18:00',
            endTime: '20:00',
            location: '',
            validFrom: '',
            validUntil: '',
            isActive: true
        });
        setEditingSchedule(null);
    };

    const toggleDayOfWeek = (day) => {
        setScheduleFormData(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day]
        }));
    };

    const getEventColor = (eventType) => {
        switch (eventType) {
            case 1: return '#e74c3c'; // Game - Red
            case 2: return '#3498db'; // Training - Blue
            case 3: return '#2ecc71'; // Other - Green
            default: return '#95a5a6';
        }
    };
    const getEventPillClass = (eventType) => {
        switch (eventType) {
            case 1: return 'cm-event-pill--game';
            case 2: return 'cm-event-pill--training';
            case 3: return 'cm-event-pill--other';
            default: return 'cm-event-pill--default';
        }
    };

    const formatEventsForCalendar = () => {
        return events.filter(event => {
            // Apply filters
            if (selectedSportFilter && event.sportId !== parseInt(selectedSportFilter)) return false;
            if (selectedTeamFilter && event.teamId !== parseInt(selectedTeamFilter)) return false;
            if (selectedEventTypeFilter && event.eventType !== parseInt(selectedEventTypeFilter)) return false;
            return true;
        }).map(event => {
            let displayTitle = event.title;
            if (event.eventType === 1) { // Game
                const opponent = event.opponentName || 'Adversário';
                displayTitle = event.isHomeGame ? `${event.title} - CD Póvoa vs ${opponent}` : `${event.title} - ${opponent} vs CD Póvoa`;
            }

            return {
                id: event.id,
                title: displayTitle,
                start: event.startDateTime,
                end: event.endDateTime,
                backgroundColor: getEventColor(event.eventType),
                borderColor: getEventColor(event.eventType),
                extendedProps: {
                    originalTitle: event.title,
                    eventType: event.eventType,
                    teamId: event.teamId,
                    sportId: event.sportId,
                    location: event.location,
                    description: event.description,
                    opponentName: event.opponentName,
                    isHomeGame: event.isHomeGame,
                    ticketPriceSocio: event.ticketPriceSocio,
                    ticketPriceNonSocio: event.ticketPriceNonSocio
                }
            };
        });
    };

    const handleDateClick = (arg) => {
        resetForm();
        setFormData({
            ...formData,
            startDateTime: arg.dateStr + 'T10:00',
            endDateTime: arg.dateStr + 'T12:00'
        });
        setShowEventModal(true);
    };

    const handleEventClick = (clickInfo) => {
        const event = events.find(e => e.id === parseInt(clickInfo.event.id));
        if (event) {
            setEditingEvent(event);
            setFormData({
                title: event.title,
                eventType: event.eventType,
                startDateTime: event.startDateTime.slice(0, 16),
                endDateTime: event.endDateTime.slice(0, 16),
                teamId: event.teamId,
                sportId: event.sportId,
                location: event.location || '',
                description: event.description || '',
                opponentName: event.opponentName || '',
                isHomeGame: event.isHomeGame ?? true,
                ticketPriceSocio: event.ticketPriceSocio ?? '',
                ticketPriceNonSocio: event.ticketPriceNonSocio ?? ''
            });
            setShowEventModal(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const dataToSend = {
            ...formData,
            teamId: formData.teamId || null,
            sportId: parseInt(formData.sportId),
            eventType: parseInt(formData.eventType),
            ticketPriceSocio: formData.ticketPriceSocio === '' ? null : parseFloat(formData.ticketPriceSocio),
            ticketPriceNonSocio: formData.ticketPriceNonSocio === '' ? null : parseFloat(formData.ticketPriceNonSocio)
        };

        try {
            const url = editingEvent
                ? `http://localhost:5285/api/events/${editingEvent.id}`
                : 'http://localhost:5285/api/events';

            const response = await fetch(url, {
                method: editingEvent ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            });

            if (response.ok) {
                await fetchEvents();
                setShowEventModal(false);
                resetForm();
                alert(editingEvent ? 'Evento atualizado!' : 'Evento criado!');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Erro ao guardar evento');
        }
    };

    const handleDelete = async () => {
        if (!editingEvent || !window.confirm('Tem certeza que deseja eliminar este evento?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/events/${editingEvent.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await fetchEvents();
                setShowEventModal(false);
                resetForm();
                alert('Evento eliminado!');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Erro ao eliminar evento');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            eventType: 1,
            startDateTime: '',
            endDateTime: '',
            teamId: restrictedTeamId || null,
            sportId: restrictedSportId || '',
            location: '',
            description: '',
            opponentName: '',
            isHomeGame: true,
            ticketPriceSocio: '',
            ticketPriceNonSocio: ''
        });
        setEditingEvent(null);
    };

    const getEventTypeName = (type) => {
        switch (type) {
            case 1: return 'Jogo';
            case 2: return 'Treino';
            case 3: return 'Outro';
            default: return '';
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            setShowEventModal(false);
            resetForm();
        }
    };

    if (loading) {
        return (
            <div className="calendar-manager">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>A carregar calendário...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="calendar-manager">
            <div className="manager-header">
                <div className="header-content">
                    <h1>Calendário de Eventos</h1>
                    <p className="header-subtitle">Gerir jogos, treinos e eventos</p>
                </div>
                <button
                    className="btn-add"
                    onClick={() => {
                        if (activeTab === 'events') {
                            resetForm();
                            setShowEventModal(true);
                        } else {
                            resetScheduleForm();
                            setShowScheduleModal(true);
                        }
                    }}
                >
                    <FaPlus /> {activeTab === 'events' ? 'Novo Evento' : 'Novo Treino'}
                </button>
            </div>

            {onBack && (
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#666',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '1rem',
                            padding: 0
                        }}
                    >
                        <FaArrowLeft /> Voltar ao Dashboard
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="calendar-tabs">
                <button
                    className={`calendar-tab ${activeTab === 'events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('events')}
                >
                    <FaCalendarAlt /> Calendário
                </button>
                <button
                    className={`calendar-tab ${activeTab === 'schedules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('schedules')}
                >
                    <FaClock /> Treinos
                </button>
            </div>

            {/* Events Tab Content */}
            {activeTab === 'events' && (
                <>
                    {/* Filters — hide sport filter in restricted/coach mode */}
                    <div className="filter-section">
                        {!restrictedTeamId && (
                            <div className="filter-group">
                                <label>Modalidade:</label>
                                <select value={selectedSportFilter} onChange={(e) => setSelectedSportFilter(e.target.value)}>
                                    <option value="">Todas</option>
                                    {sports.map(sport => (
                                        <option key={sport.id} value={sport.id}>{sport.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="filter-group">
                            <label>Equipa:</label>
                            {restrictedTeamId ? (
                                <input
                                    type="text"
                                    value={teams.find(t => t.id === restrictedTeamId)?.name || 'Carregando...'}
                                    disabled
                                    className="filter-input-disabled"
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#f3f4f6' }}
                                />
                            ) : (
                                <select value={selectedTeamFilter} onChange={(e) => setSelectedTeamFilter(e.target.value)}>
                                    <option value="">Todas</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.sportName} - {team.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="filter-group">
                            <label>Tipo:</label>
                            <select value={selectedEventTypeFilter} onChange={(e) => setSelectedEventTypeFilter(e.target.value)}>
                                <option value="">Todos</option>
                                <option value="1">Jogos</option>
                                <option value="2">Treinos</option>
                                <option value="3">Outros</option>
                            </select>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="calendar-container">
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                            }}
                            events={formatEventsForCalendar()}
                            dateClick={handleDateClick}
                            eventClick={handleEventClick}
                            editable={true}
                            selectable={true}
                            selectMirror={true}
                            dayMaxEvents={true}
                            slotEventOverlap={false}
                            locale="pt"
                            buttonText={{
                                today: 'Hoje',
                                month: 'Mês',
                                week: 'Semana',
                                day: 'Dia',
                                list: 'Lista'
                            }}
                            eventDisplay="block"
                            eventTimeFormat={{
                                hour: '2-digit',
                                minute: '2-digit',
                                meridiem: false,
                                hour12: false
                            }}
                        />
                    </div>
                </>
            )}

            {/* Training Schedules Tab Content */}
            {activeTab === 'schedules' && (
                <div className="schedules-section">
                    {trainingSchedules.length === 0 ? (
                        <div className="empty-state">
                            <FaClock className="empty-icon" />
                            <h3>Nenhum padrão de treino definido</h3>
                            <p>Crie padrões de treino recorrentes para gerar eventos automaticamente</p>
                        </div>
                    ) : (
                        <div className="schedules-grid">
                            {trainingSchedules.map(schedule => (
                                <div key={schedule.id} className="schedule-card">
                                    <div className="schedule-header">
                                        <div>
                                            <h3>{schedule.teamName}</h3>
                                            <span className="sport-badge">{schedule.sportName}</span>
                                        </div>
                                        <div className="schedule-actions">
                                            <button
                                                className="btn-icon btn-generate"
                                                onClick={() => handleGenerateEvents(schedule.id)}
                                                title="Gerar Treinos"
                                            >
                                                <FaSync />
                                            </button>
                                            <button
                                                className="btn-icon btn-edit"
                                                onClick={() => handleEditSchedule(schedule)}
                                                title="Editar"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="btn-icon btn-delete"
                                                onClick={() => handleScheduleDelete(schedule.id)}
                                                title="Eliminar"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="schedule-body">
                                        <div className="schedule-time">
                                            <FaClock /> {schedule.startTime} - {schedule.endTime}
                                        </div>
                                        {schedule.location && (
                                            <div className="schedule-location">
                                                📍 {schedule.location}
                                            </div>
                                        )}
                                        <div className="schedule-days">
                                            {schedule.daysOfWeek.map(day => (
                                                <span key={day} className="day-badge">{dayTranslations[day] || day}</span>
                                            ))}
                                        </div>
                                        <div className="schedule-period">
                                            {new Date(schedule.validFrom).toLocaleDateString()} - {new Date(schedule.validUntil).toLocaleDateString()}
                                        </div>
                                    </div>
                                    {!schedule.isActive && (
                                        <div className="schedule-inactive-badge">Inativo</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Event Modal */}
            {showEventModal && (
                <div className="cm-modal-overlay" onMouseDown={handleOverlayClick}>
                    <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className={`cm-modal-header cm-modal-header--${formData.eventType === 1 ? 'game' : formData.eventType === 2 ? 'training' : 'other'}`}>
                            <div className="cm-modal-header-text">
                                <span className="cm-modal-badge">
                                    {formData.eventType === 1 ? '⚽ Jogo' : formData.eventType === 2 ? '🏃 Treino' : '📌 Outro'}
                                </span>
                                <h2>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</h2>
                            </div>
                            <button className="cm-modal-close" onClick={() => { setShowEventModal(false); resetForm(); }}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="cm-modal-form">
                            <div className="cm-form-field">
                                <label className="cm-form-label">Competição *</label>
                                <input
                                    type="text"
                                    className="cm-form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Liga, Taça..."
                                    required
                                />
                            </div>

                            <div className="cm-form-field">
                                <label className="cm-form-label">Tipo de Evento *</label>
                                <div className="cm-event-type-pills">
                                    {[{ v: 1, label: '⚽ Jogo' }, { v: 2, label: '🏃 Treino' }, { v: 3, label: '📌 Outro' }].map(({ v, label }) => (
                                        <button
                                            key={v}
                                            type="button"
                                            className={`cm-type-pill cm-type-pill--${v === 1 ? 'game' : v === 2 ? 'training' : 'other'} ${formData.eventType === v ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, eventType: v })}
                                        >{label}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="cm-form-row">
                                <div className="cm-form-field">
                                    <label className="cm-form-label">Início *</label>
                                    <input
                                        type="datetime-local"
                                        className="cm-form-input"
                                        value={formData.startDateTime}
                                        onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="cm-form-field">
                                    <label className="cm-form-label">Fim *</label>
                                    <input
                                        type="datetime-local"
                                        className="cm-form-input"
                                        value={formData.endDateTime}
                                        onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="cm-form-row">
                                <div className="cm-form-field">
                                    <label className="cm-form-label">Modalidade *</label>
                                    {restrictedTeamId ? (
                                        <input
                                            type="text"
                                            className="cm-form-input cm-form-input--disabled"
                                            value={sports.find(s => s.id === restrictedSportId)?.name || restrictedTeam?.sportName || ''}
                                            disabled
                                        />
                                    ) : (
                                        <select
                                            className="cm-form-input"
                                            value={formData.sportId}
                                            onChange={(e) => setFormData({ ...formData, sportId: e.target.value })}
                                            required
                                        >
                                            <option value="">Selecione</option>
                                            {sports.map(sport => (
                                                <option key={sport.id} value={sport.id}>{sport.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                <div className="cm-form-field">
                                    <label className="cm-form-label">Equipa</label>
                                    {restrictedTeamId ? (
                                        <input
                                            type="text"
                                            className="cm-form-input cm-form-input--disabled"
                                            value={teams.find(t => t.id === restrictedTeamId)?.name || ''}
                                            disabled
                                        />
                                    ) : (
                                        <select
                                            className="cm-form-input"
                                            value={formData.teamId || ''}
                                            onChange={(e) => setFormData({ ...formData, teamId: e.target.value ? parseInt(e.target.value) : null })}
                                        >
                                            <option value="">Evento Geral</option>
                                            {teams.map(team => (
                                                <option key={team.id} value={team.id}>{team.sportName} - {team.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>

                            <div className="cm-form-field">
                                <label className="cm-form-label">Local</label>
                                <input
                                    type="text"
                                    className="cm-form-input"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Ex: Pavilhão Fernando Linhares"
                                />
                            </div>

                            {formData.eventType === 1 && (
                                <>
                                    <div className="cm-form-row">
                                        <div className="cm-form-field">
                                            <label className="cm-form-label">Adversário</label>
                                            <input
                                                type="text"
                                                className="cm-form-input"
                                                value={formData.opponentName}
                                                onChange={(e) => setFormData({ ...formData, opponentName: e.target.value })}
                                                placeholder="Nome do adversário"
                                            />
                                        </div>
                                        <div className="cm-form-field cm-form-field--toggle">
                                            <label className="cm-toggle-label">
                                                <input
                                                    type="checkbox"
                                                    className="cm-toggle-input"
                                                    checked={formData.isHomeGame}
                                                    onChange={(e) => setFormData({ ...formData, isHomeGame: e.target.checked })}
                                                />
                                                <span className="cm-toggle-track"><span className="cm-toggle-thumb" /></span>
                                                <span className="cm-toggle-text">Jogo em Casa</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="cm-form-row">
                                        <div className="cm-form-field">
                                            <label className="cm-form-label">Preço Bilhete (Sócio)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="cm-form-input"
                                                value={formData.ticketPriceSocio}
                                                onChange={(e) => setFormData({ ...formData, ticketPriceSocio: e.target.value })}
                                                placeholder="€ 0.00"
                                            />
                                        </div>
                                        <div className="cm-form-field">
                                            <label className="cm-form-label">Preço Bilhete (Não Sócio)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="cm-form-input"
                                                value={formData.ticketPriceNonSocio}
                                                onChange={(e) => setFormData({ ...formData, ticketPriceNonSocio: e.target.value })}
                                                placeholder="€ 0.00"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="cm-form-field">
                                <label className="cm-form-label">Descrição</label>
                                <textarea
                                    className="cm-form-input cm-form-textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                    placeholder="Notas adicionais..."
                                />
                            </div>

                            <div className="cm-modal-actions">
                                {editingEvent && (
                                    <button type="button" className="cm-btn cm-btn--danger" onClick={handleDelete}>
                                        <FaTrash /> Eliminar
                                    </button>
                                )}
                                <button type="button" className="cm-btn cm-btn--ghost" onClick={() => { setShowEventModal(false); resetForm(); }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="cm-btn cm-btn--primary">
                                    {editingEvent ? 'Atualizar' : 'Criar'} Evento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Training Schedule Modal */}
            {showScheduleModal && (
                <div className="cm-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowScheduleModal(false); resetScheduleForm(); } }}>
                    <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="cm-modal-header cm-modal-header--training">
                            <div className="cm-modal-header-text">
                                <span className="cm-modal-badge">🏃 Treinos</span>
                                <h2>{editingSchedule ? 'Editar Padrão' : 'Novo Padrão de Treino'}</h2>
                            </div>
                            <button className="cm-modal-close" onClick={() => { setShowScheduleModal(false); resetScheduleForm(); }}>×</button>
                        </div>

                        <form onSubmit={handleScheduleSubmit} className="cm-modal-form">
                            <div className="cm-form-field">
                                <label className="cm-form-label">Equipa *</label>
                                {restrictedTeamId ? (
                                    <input
                                        type="text"
                                        className="cm-form-input cm-form-input--disabled"
                                        value={teams.find(t => t.id === restrictedTeamId)?.name || ''}
                                        disabled
                                    />
                                ) : (
                                    <select
                                        className="cm-form-input"
                                        value={scheduleFormData.teamId}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, teamId: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione a equipa</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>{team.sportName} - {team.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="cm-form-field">
                                <label className="cm-form-label">Dias da Semana *</label>
                                <div className="cm-days-grid">
                                    {[
                                        { key: 'Monday', label: 'Seg' },
                                        { key: 'Tuesday', label: 'Ter' },
                                        { key: 'Wednesday', label: 'Qua' },
                                        { key: 'Thursday', label: 'Qui' },
                                        { key: 'Friday', label: 'Sex' },
                                        { key: 'Saturday', label: 'Sáb' },
                                        { key: 'Sunday', label: 'Dom' },
                                    ].map(({ key, label }) => (
                                        <button
                                            key={key}
                                            type="button"
                                            className={`cm-day-pill ${scheduleFormData.daysOfWeek.includes(key) ? 'active' : ''}`}
                                            onClick={() => toggleDayOfWeek(key)}
                                        >{label}</button>
                                    ))}
                                </div>
                            </div>

                            <div className="cm-form-row">
                                <div className="cm-form-field">
                                    <label className="cm-form-label">Hora Início *</label>
                                    <input
                                        type="time"
                                        className="cm-form-input"
                                        value={scheduleFormData.startTime}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, startTime: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="cm-form-field">
                                    <label className="cm-form-label">Hora Fim *</label>
                                    <input
                                        type="time"
                                        className="cm-form-input"
                                        value={scheduleFormData.endTime}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, endTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="cm-form-field">
                                <label className="cm-form-label">Local</label>
                                <input
                                    type="text"
                                    className="cm-form-input"
                                    value={scheduleFormData.location}
                                    onChange={(e) => setScheduleFormData({ ...scheduleFormData, location: e.target.value })}
                                    placeholder="Ex: Pavilhão Fernando Linhares"
                                />
                            </div>

                            <div className="cm-form-row">
                                <div className="cm-form-field">
                                    <label className="cm-form-label">Válido De *</label>
                                    <input
                                        type="date"
                                        className="cm-form-input"
                                        value={scheduleFormData.validFrom}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, validFrom: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="cm-form-field">
                                    <label className="cm-form-label">Válido Até *</label>
                                    <input
                                        type="date"
                                        className="cm-form-input"
                                        value={scheduleFormData.validUntil}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, validUntil: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="cm-form-field cm-form-field--toggle">
                                <label className="cm-toggle-label">
                                    <input
                                        type="checkbox"
                                        className="cm-toggle-input"
                                        checked={scheduleFormData.isActive}
                                        onChange={(e) => setScheduleFormData({ ...scheduleFormData, isActive: e.target.checked })}
                                    />
                                    <span className="cm-toggle-track"><span className="cm-toggle-thumb" /></span>
                                    <span className="cm-toggle-text">Padrão Ativo</span>
                                </label>
                            </div>

                            <div className="cm-modal-actions">
                                <button type="button" className="cm-btn cm-btn--ghost" onClick={() => { setShowScheduleModal(false); resetScheduleForm(); }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="cm-btn cm-btn--primary">
                                    {editingSchedule ? 'Atualizar' : 'Criar'} Padrão
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarManager;
