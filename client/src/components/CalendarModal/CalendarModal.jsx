import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptLocale from '@fullcalendar/core/locales/pt';
import { FaTimes, FaCalendarAlt } from 'react-icons/fa';
import './CalendarModal.css';

const CalendarModal = ({ isOpen, onClose, teamId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        if (isOpen && teamId) {
            fetchEvents();
        }
    }, [isOpen, teamId]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/events?teamId=${teamId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            }
        } catch (error) {
            console.error('Error fetching calendar events:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatEventsForCalendar = () => {
        return events.map(event => ({
            id: event.id,
            title: event.title,
            start: event.startDateTime,
            end: event.endDateTime,
            backgroundColor: getEventColor(event.eventType),
            borderColor: getEventColor(event.eventType),
            extendedProps: {
                location: event.location,
                description: event.description,
                eventType: event.eventType
            }
        }));
    };

    const getEventColor = (eventType) => {
        switch (eventType) {
            case 1: return '#3b82f6'; // Game - Blue
            case 2: return '#10b981'; // Training - Green
            case 3: return '#f59e0b'; // Other - Orange
            default: return '#6b7280';
        }
    };

    const getEventTypeName = (eventType) => {
        switch (eventType) {
            case 1: return 'Jogo';
            case 2: return 'Treino';
            case 3: return 'Outro';
            default: return 'Evento';
        }
    };

    const handleDateClick = (info) => {
        setSelectedDate(info.date);
    };

    const handleBackToCalendar = () => {
        setSelectedDate(null);
    };

    const getEventsForSelectedDate = () => {
        if (!selectedDate) return [];
        return events.filter(event => {
            const eventDate = new Date(event.startDateTime);
            return eventDate.toDateString() === selectedDate.toDateString();
        });
    };

    if (!isOpen) return null;

    return (
        <div className="calendar-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="calendar-modal-content">
                <div className="calendar-modal-header">
                    <h2><FaCalendarAlt /> Calendário da Equipa</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="calendar-modal-body">
                    {loading ? (
                        <div className="calendar-loading">A carregar eventos...</div>
                    ) : selectedDate ? (
                        <div className="day-view-container">
                            <div className="day-view-header">
                                <button className="back-btn" onClick={handleBackToCalendar}>
                                    <i className="fas fa-arrow-left"></i> Voltar
                                </button>
                                <h3 className="day-view-title">
                                    {selectedDate.toLocaleDateString('pt-PT', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </h3>
                            </div>

                            <div className="events-list">
                                {getEventsForSelectedDate().length > 0 ? (
                                    getEventsForSelectedDate().map(event => (
                                        <div key={event.id} className="event-card">
                                            <div className="event-card-header">
                                                <div>
                                                    <h4 className="event-card-title">{event.title}</h4>
                                                    <span
                                                        className="event-badge"
                                                        style={{ backgroundColor: getEventColor(event.eventType) }}
                                                    >
                                                        {getEventTypeName(event.eventType)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="event-card-body">
                                                <div className="card-row">
                                                    <div className="card-icon"><i className="far fa-clock"></i></div>
                                                    <div className="card-text">
                                                        {new Date(event.startDateTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                                        {' - '}
                                                        {new Date(event.endDateTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                {event.location && (
                                                    <div className="card-row">
                                                        <div className="card-icon"><i className="fas fa-map-marker-alt"></i></div>
                                                        <div className="card-text">{event.location}</div>
                                                    </div>
                                                )}
                                                {event.description && (
                                                    <div className="card-row">
                                                        <div className="card-icon"><i className="fas fa-align-left"></i></div>
                                                        <div className="card-text">{event.description}</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-events-message">
                                        Não existem eventos agendados para este dia.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth'
                            }}
                            events={formatEventsForCalendar()}
                            locale={ptLocale}
                            height="100%"
                            dayMaxEvents={true}
                            dateClick={handleDateClick}
                            buttonText={{
                                today: 'Hoje',
                            }}
                            eventClick={(info) => {
                                handleDateClick({ date: info.event.start });
                            }}
                            eventContent={(eventInfo) => (
                                <div className="fc-event-main-frame">
                                    <div className="fc-event-title-container">
                                        <div className="fc-event-title fc-sticky">{eventInfo.event.title}</div>
                                    </div>
                                </div>
                            )}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarModal;
