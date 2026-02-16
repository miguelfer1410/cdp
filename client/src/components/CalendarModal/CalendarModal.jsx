import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import ptLocale from '@fullcalendar/core/locales/pt';
import { FaTimes, FaCalendarAlt } from 'react-icons/fa';
import './CalendarModal.css';

const CalendarModal = ({ isOpen, onClose, teamId }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

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
                description: event.description
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
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,listWeek'
                            }}
                            events={formatEventsForCalendar()}
                            locale={ptLocale}
                            height="100%"
                            dayMaxEvents={true}
                            buttonText={{
                                today: 'Hoje',
                                month: 'Mês',
                                list: 'Lista'
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalendarModal;
