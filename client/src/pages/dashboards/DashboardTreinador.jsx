import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './DashboardTreinador.css';
import TeamDetailsModal from '../../components/TeamDetailsModal/TeamDetailsModal';
import CalendarModal from '../../components/CalendarModal/CalendarModal';
import CalendarManager from '../../components/Admin/CalendarManager';
import EventAttendanceModal from '../../components/Attendance/EventAttendanceModal';
import GameCallUpModal from '../../components/Game/GameCallUpModal';

const DashboardTreinador = () => {
    const [coachData, setCoachData] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [showCalendarManager, setShowCalendarManager] = useState(false);

    // Attendance Modal State
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
    const [selectedEventForAttendance, setSelectedEventForAttendance] = useState(null);
    const [lastTrainingStats, setLastTrainingStats] = useState(null);

    // Game Call-up Modal State
    const [isCallUpModalOpen, setIsCallUpModalOpen] = useState(false);
    const [selectedEventForCallUp, setSelectedEventForCallUp] = useState(null);

    const fetchData = async () => {
        try {
            const userId = localStorage.getItem('userId');
            const token = localStorage.getItem('token');

            if (!userId || !token) {
                throw new Error('User not authenticated');
            }

            // Fetch Coach Data
            const userResponse = await fetch(`http://localhost:5285/api/users/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!userResponse.ok) {
                throw new Error('Failed to fetch coach data');
            }

            const userData = await userResponse.json();
            setCoachData(userData);

            // Fetch Team Data if coach has a team assigned
            if (userData.coachProfile?.teamId) {
                const teamResponse = await fetch(`http://localhost:5285/api/teams/${userData.coachProfile.teamId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (teamResponse.ok) {
                    const teamData = await teamResponse.json();
                    setTeamData(teamData);

                    const today = new Date().toISOString();

                    // Fetch Upcoming Events for the team
                    const eventsResponse = await fetch(`http://localhost:5285/api/events?teamId=${userData.coachProfile.teamId}&startDate=${today}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (eventsResponse.ok) {
                        const eventsData = await eventsResponse.json();
                        // Sort by date (ascending) and take next 3
                        const sortedEvents = eventsData
                            .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
                            .slice(0, 3);
                        setEvents(sortedEvents);
                    }

                    // Fetch Last Training Statistics
                    const pastTrainingsResponse = await fetch(`http://localhost:5285/api/events?teamId=${userData.coachProfile.teamId}&eventType=2&endDate=${today}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (pastTrainingsResponse.ok) {
                        const pastTrainings = await pastTrainingsResponse.json();
                        if (pastTrainings.length > 0) {
                            // Get the most recent one (last in the list because API sorts ascending)
                            const lastTraining = pastTrainings[pastTrainings.length - 1];

                            // Fetch attendance for this training
                            const attResponse = await fetch(`http://localhost:5285/api/attendance/event/${lastTraining.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            if (attResponse.ok) {
                                const attendanceData = await attResponse.json();
                                const totalAthletes = teamData.athletes.length;
                                const presentCount = attendanceData.filter(a => a.status === 1 || a.status === 3).length; // Present or Late
                                const attendanceRate = totalAthletes > 0 ? Math.round((presentCount / totalAthletes) * 100) : 0;

                                setLastTrainingStats({
                                    date: lastTraining.startDateTime,
                                    rate: attendanceRate,
                                    present: presentCount,
                                    total: totalAthletes,
                                    details: attendanceData
                                });
                            }
                        }
                    }
                }
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, []);

    const handleBackFromCalendar = () => {
        setShowCalendarManager(false);
        fetchData(); // Refresh data to show any new/edited events
    };

    if (loading) return <div className="dashboard-loading">A carregar...</div>;
    if (error) return <div className="dashboard-error">Erro: {error}</div>;
    if (!coachData) return <div className="dashboard-error">Não foi possível carregar os dados.</div>;

    if (showCalendarManager && coachData?.coachProfile?.teamId) {
        return (
            <div className="dashboard-wrapper">
                <div className="container" style={{ padding: '20px 0' }}>
                    <CalendarManager
                        restrictedTeamId={coachData.coachProfile.teamId}
                        onBack={handleBackFromCalendar}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-wrapper">
            {/* Profile Header */}
            <section className="profile-header">
                <div className="container">
                    <div className="profile-content">
                        <img src="https://images.unsplash.com/vector-1742875355318-00d715aec3e8?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt={coachData.fullName} className="profile-avatar" />
                        <div className="profile-info">
                            <h1>{coachData.fullName}</h1>
                            <div className="profile-meta">
                                <div className="profile-meta-item">
                                    <i className="fas fa-basketball-ball"></i>
                                    <span>{coachData.coachProfile?.sportName || 'Modalidade Não Definida'}</span>
                                </div>
                                <div className="profile-meta-item">
                                    <i className="fas fa-users"></i>
                                    <span>{coachData.coachProfile?.teamName || 'Sem Equipa Atribuída'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="quick-stats">
                <div className="container">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>{teamData?.athletes?.length || '-'}</h3>
                            <p>Atletas na Equipa</p>
                        </div>

                        <div className="stat-card">
                            <h3>{lastTrainingStats ? `${lastTrainingStats.rate}%` : '-'}</h3>
                            <p>Taxa de Presença (Último Treino)</p>
                        </div>

                        <div className="stat-card">
                            <h3>-</h3>
                            <p>Vitórias-Derrotas</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Dashboard Content */}
            <section>
                <div className="container">
                    <div className="dashboard-content">
                        {/* Left Column */}
                        <div>
                            {/* Próximos Treinos/Jogos */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="far fa-calendar"></i> Calendário</h2>
                                    <button className="view-all-link" onClick={() => setIsCalendarModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        Ver Calendário <i className="fas fa-arrow-right"></i>
                                    </button>
                                </div>

                                <div className="events-list">
                                    {events.length > 0 ? (
                                        events.map(event => (
                                            <div key={event.id} className="event-item" style={{ padding: '12px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div className="event-date" style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    minWidth: '50px',
                                                    padding: '5px',
                                                    background: '#f0f7ff',
                                                    borderRadius: '6px',
                                                    color: '#003380',
                                                    fontWeight: 'bold'
                                                }}>
                                                    <span style={{ fontSize: '0.8rem' }}>{new Date(event.startDateTime).toLocaleDateString('pt-PT', { day: '2-digit' })}</span>
                                                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}>{new Date(event.startDateTime).toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '')}</span>
                                                </div>
                                                <div className="event-details" style={{ flex: 1 }}>
                                                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#333' }}>
                                                        {event.eventType === 1 ? 'Jogo: ' : event.eventType === 2 ? 'Treino: ' : 'Evento: '}
                                                        {event.title}
                                                    </h4>
                                                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', color: '#666' }}>
                                                        <span><i className="far fa-clock"></i> {new Date(event.startDateTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {event.location && <span><i className="fas fa-map-marker-alt"></i> {event.location}</span>}
                                                    </div>
                                                </div>

                                                {/* Attendance Button for Trainings */}
                                                {event.eventType === 2 && (
                                                    <button
                                                        className="action-btn-small"
                                                        onClick={() => {
                                                            setSelectedEventForAttendance(event);
                                                            setIsAttendanceModalOpen(true);
                                                        }}
                                                        style={{
                                                            padding: '5px 10px',
                                                            background: '#e9ecef',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            color: '#003380',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600'
                                                        }}
                                                        title="Registar Presenças"
                                                    >
                                                        <i className="fas fa-clipboard-check"></i>
                                                    </button>
                                                )}

                                                {/* Call-up Button for Games */}
                                                {event.eventType === 1 && (
                                                    <button
                                                        className="action-btn-small"
                                                        onClick={() => {
                                                            setSelectedEventForCallUp(event);
                                                            setIsCallUpModalOpen(true);
                                                        }}
                                                        style={{
                                                            padding: '5px 10px',
                                                            background: '#fff7ed',
                                                            border: '1px solid #ffedd5',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            color: '#c2410c',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600'
                                                        }}
                                                        title="Convocar Atletas"
                                                    >
                                                        <i className="fas fa-bullhorn"></i>
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                            Não existem treinos ou jogos agendados.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Atletas da Equipa */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-users"></i> Atletas - {coachData.coachProfile?.teamName || 'Equipa'}</h2>
                                    <button className="view-all-link" onClick={() => setIsTeamModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        Ver Todos <i className="fas fa-arrow-right"></i>
                                    </button>
                                </div>

                                {teamData && teamData.athletes && teamData.athletes.length > 0 ? (
                                    <div className="athletes-grid">
                                        {teamData.athletes.slice(0, 6).map((athlete) => (
                                            <div className="athlete-item" key={athlete.id}>
                                                <div className="athlete-avatar">{athlete.jerseyNumber || athlete.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                                                <div className="athlete-info">
                                                    <h4>{athlete.name}</h4>
                                                    <p>{athlete.position || 'Atleta'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                        Não existem atletas na equipa.
                                    </div>
                                )}
                            </div>

                            {/* Estatísticas da Equipa */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-chart-bar"></i> Estatísticas - Época 2025/26</h2>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Não existem estatísticas disponíveis.
                                </div>
                            </div>

                            {/* Últimos Resultados */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-clipboard-list"></i> Últimos Resultados</h2>
                                    <a href="#" className="view-all-link">Ver Todos <i className="fas fa-arrow-right"></i></a>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Não existem resultados disponíveis.
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div>
                            {/* Vencimento */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-money-bill-wave"></i> Vencimento</h2>
                                    <a href="#" className="view-all-link">Ver Histórico <i className="fas fa-arrow-right"></i></a>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Informações de vencimento não disponíveis.
                                </div>
                            </div>

                            {/* Ações Rápidas */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-bolt"></i> Ações Rápidas</h2>
                                </div>

                                <div className="action-buttons">
                                    <button onClick={() => setShowCalendarManager(true)} className="action-btn action-btn-primary">
                                        <i className="fas fa-calendar-plus"></i>
                                        Editar Calendário
                                    </button>
                                    <a href="#" className="action-btn action-btn-primary">
                                        <i className="fas fa-clipboard-list"></i>
                                        Convocar Atletas
                                    </a>
                                    <a href="#" className="action-btn">
                                        <i className="fas fa-chart-line"></i>
                                        Ver Estatísticas
                                    </a>
                                    <a href="#" className="action-btn">
                                        <i className="fas fa-envelope"></i>
                                        Mensagens
                                    </a>
                                </div>
                            </div>

                            {/* Notificações */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-bell"></i> Notificações</h2>
                                    <a href="#" className="view-all-link">Ver Todas <i className="fas fa-arrow-right"></i></a>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Não existem notificações.
                                </div>
                            </div>

                            {/* Presenças nos Treinos */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-check-circle"></i> Presenças - Último Treino</h2>
                                </div>

                                {lastTrainingStats ? (
                                    <div style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                                {new Date(lastTrainingStats.date).toLocaleDateString()}
                                            </span>
                                            <span style={{ fontWeight: 'bold', color: '#003380' }}>
                                                {lastTrainingStats.present}/{lastTrainingStats.total} Presentes
                                            </span>
                                        </div>
                                        <div style={{ background: '#eee', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${lastTrainingStats.rate}%`,
                                                background: lastTrainingStats.rate > 75 ? '#28a745' : lastTrainingStats.rate > 50 ? '#ffc107' : '#dc3545',
                                                height: '100%'
                                            }}></div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                        Sem dados de treinos recentes.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <TeamDetailsModal
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
                teamData={teamData}
            />

            <CalendarModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                teamId={coachData?.coachProfile?.teamId}
            />

            <EventAttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => {
                    setIsAttendanceModalOpen(false);
                    setSelectedEventForAttendance(null);
                    // Optionally refresh data here if needed
                }}
                event={selectedEventForAttendance}
                teamId={coachData?.coachProfile?.teamId}
            />

            <GameCallUpModal
                isOpen={isCallUpModalOpen}
                onClose={() => {
                    setIsCallUpModalOpen(false);
                    setSelectedEventForCallUp(null);
                }}
                event={selectedEventForCallUp}
                teamId={coachData?.coachProfile?.teamId}
            />
        </div>
    );
};

export default DashboardTreinador;
