import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './DashboardAtleta.css';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import TeamDetailsModal from '../../components/TeamDetailsModal/TeamDetailsModal';
import CalendarModal from '../../components/CalendarModal/CalendarModal';
import FamilyAssociationModal from '../../components/FamilyAssociationModal/FamilyAssociationModal';

const DashboardAtleta = () => {
    const navigate = useNavigate();
    const [athleteData, setAthleteData] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingTab, setLoadingTab] = useState(false);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

    // Linked users (siblings sharing the same parent email)
    const [linkedUsers] = useState(() => {
        try {
            const stored = localStorage.getItem('linkedUsers');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [selectedUserId, setSelectedUserId] = useState(() => {
        return parseInt(localStorage.getItem('userId')) || null;
    });

    // Payment State
    const [paymentReference, setPaymentReference] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('unpaid');
    const [generatingReference, setGeneratingReference] = useState(false);
    const [quotaAmount, setQuotaAmount] = useState(null);
    const [paymentPreference, setPaymentPreference] = useState('Monthly');
    const [nextPeriod, setNextPeriod] = useState(null); // { month, year }
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [historyYear, setHistoryYear] = useState(new Date().getFullYear());

    const handleGenerateReference = async (periodMonth = null, periodYear = null) => {
        setGeneratingReference(true);
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:5285/api/payment/reference?userId=${selectedUserId}`;
            if (periodYear) url += `&year=${periodYear}`;
            if (periodMonth) url += `&month=${periodMonth}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Erro ao gerar referência');
            }
            const data = await response.json();
            setPaymentReference(data);
            setPaymentStatus('Pendente');
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setGeneratingReference(false);
        }
    };

    const checkPaymentStatus = async () => {
        window.location.reload();
    };

    // Fetch all data (User + Team + Events + Quota) whenever the selected tab (userId) changes
    useEffect(() => {
        if (!selectedUserId) return;

        const fetchData = async () => {
            if (!athleteData) setLoading(true);
            else setLoadingTab(true);

            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('User not authenticated');

                // 1. Fetch User Profile
                const userResponse = await fetch(`http://localhost:5285/api/users/${selectedUserId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!userResponse.ok) throw new Error('Failed to fetch athlete data');
                const userData = await userResponse.json();
                setAthleteData(userData);

                // 2. Fetch Quota for this user
                try {
                    const quotaResponse = await fetch(`http://localhost:5285/api/payment/quota?userId=${selectedUserId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (quotaResponse.ok) {
                        const quotaData = await quotaResponse.json();
                        setQuotaAmount(quotaData.amount);
                        setPaymentStatus(quotaData.status);
                        setPaymentReference(quotaData.existingPayment || null);
                        setPaymentPreference(quotaData.paymentPreference || 'Monthly');
                        if (quotaData.nextPeriodYear) {
                            setNextPeriod({ month: quotaData.nextPeriodMonth, year: quotaData.nextPeriodYear });
                        }
                    } else {
                        setQuotaAmount(0);
                        setPaymentStatus('-');
                        setPaymentReference(null);
                    }
                } catch (qErr) {
                    console.error('Error fetching quota:', qErr);
                }

                // 3b. Fetch Payment History
                try {
                    const historyResponse = await fetch(`http://localhost:5285/api/payment/history?userId=${selectedUserId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (historyResponse.ok) {
                        const historyData = await historyResponse.json();
                        setPaymentHistory(historyData);
                    } else {
                        setPaymentHistory([]);
                    }
                } catch (hErr) {
                    console.error('Error fetching payment history:', hErr);
                    setPaymentHistory([]);
                }

                // 3. Fetch Team + Events
                console.log(userData);
                const teamId = userData.athleteProfile?.teams?.[0]?.id;
                if (teamId) {
                    const [teamResponse, eventsResponse] = await Promise.all([
                        fetch(`http://localhost:5285/api/teams/${teamId}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        }),
                        fetch(`http://localhost:5285/api/events?teamId=${teamId}&startDate=${new Date().toISOString()}`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                    ]);
                    setTeamData(teamResponse.ok ? await teamResponse.json() : null);
                    if (eventsResponse.ok) {
                        const eventsData = await eventsResponse.json();
                        setEvents(eventsData
                            .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
                            .slice(0, 3)
                        );
                    } else {
                        setEvents([]);
                    }
                } else {
                    setTeamData(null);
                    setEvents([]);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
                setLoadingTab(false);
            }
        };

        fetchData();
    }, [selectedUserId]);

    if (loading) return <div className="dashboard-loading">A carregar...</div>;
    if (error) return <div className="dashboard-error">Erro: {error}</div>;
    if (!athleteData) return <div className="dashboard-error">Não foi possível carregar os dados.</div>;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-PT');
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return 'N/A';
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const primaryTeam = athleteData.athleteProfile?.teams?.[0] || {};

    const handleSaveProfile = (updatedData) => {
        setAthleteData(updatedData);
        localStorage.setItem('userName', `${updatedData.firstName} ${updatedData.lastName}`);
    };

    const getDisplayEmail = (email) => {
        if (!email) return 'N/A';
        // Check for alias pattern: local+alias@domain
        const atIndex = email.lastIndexOf('@');
        if (atIndex === -1) return email;

        const localPart = email.substring(0, atIndex);
        const domain = email.substring(atIndex);

        // If local part has '+', strip everything after it
        const plusIndex = localPart.indexOf('+');
        if (plusIndex !== -1) {
            return localPart.substring(0, plusIndex) + domain;
        }
        return email;
    };

    const getSportIcon = (sport) => {
        const s = sport?.toLowerCase() || '';
        if (s.includes('basquetebol')) return 'fas fa-basketball-ball';
        if (s.includes('futebol')) return 'fas fa-futbol';
        if (s.includes('voleibol')) return 'fas fa-volleyball-ball';
        if (s.includes('natação') || s.includes('natacao')) return 'fas fa-swimmer';
        if (s.includes('andebol')) return 'fas fa-running';
        if (s.includes('ténis') || s.includes('tenis')) return 'fas fa-table-tennis';
        return 'fas fa-running';
    };

    return (
        <div className="dashboard-wrapper">
            {/* Athlete Tabs - shown when there are multiple linked users (siblings) */}
            {linkedUsers.length > 1 && (
                <div className="athlete-tabs">
                    <div className="container athlete-tabs-container">
                        {linkedUsers.map((lu) => {
                            const dashboardRoutes = {
                                atleta: null, // stay on this page, just switch userId
                                treinador: '/dashboard-treinador',
                                socio: '/dashboard-socio',
                                user: '/dashboard-socio'
                            };
                            const handleClick = () => {
                                const route = dashboardRoutes[lu.dashboardType];
                                if (route) {
                                    localStorage.setItem('userId', lu.id);
                                    navigate(route);
                                } else {
                                    setSelectedUserId(lu.id);
                                }
                            };
                            return (
                                <button
                                    key={lu.id}
                                    onClick={handleClick}
                                    className={`athlete-tab ${selectedUserId === lu.id ? 'active' : ''}`}
                                >
                                    <i className={
                                        lu.dashboardType === 'atleta' ? 'fas fa-running' :
                                            lu.dashboardType === 'treinador' ? 'fas fa-user-tie' :
                                                'fas fa-id-card'
                                    }></i>
                                    {`${lu.firstName} ${lu.lastName}`.trim() || `Atleta ${lu.id}`}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <section className="profile-header">
                <div className="container">
                    <div className="profile-content">
                        <img src="https://images.unsplash.com/vector-1742875355318-00d715aec3e8?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt={athleteData.fullName} className="profile-avatar" />
                        <div className="profile-info">
                            <h1>
                                {athleteData.athleteProfile
                                    ? `${athleteData.athleteProfile.firstName || ''} ${athleteData.athleteProfile.lastName || ''}`.trim() || athleteData.fullName
                                    : athleteData.fullName
                                }
                            </h1>
                            <div className="profile-meta">
                                <div className="profile-meta-item">
                                    <i className={getSportIcon(athleteData.sport)}></i>
                                    <span>{athleteData.sport || 'Sem Modalidade'}</span>
                                </div>
                                <div className="profile-meta-item">
                                    <i className="fas fa-users"></i>
                                    <span>{primaryTeam.name || 'Sem Equipa'}</span>
                                </div>
                                <div className="profile-meta-item">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{primaryTeam.position || 'Atleta'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="quick-stats">
                <div className="container">

                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>-</h3>
                            <p>Jogos Realizados</p>
                        </div>

                        <div className="stat-card">
                            <h3>-</h3>
                            <p>Presença em Treinos</p>
                        </div>

                        <div className="stat-card">
                            <h3>-</h3>
                            <p>Pontos por Jogo</p>
                        </div>

                    </div>
                </div>
            </section>

            <section>
                <div className="container">
                    <div className="dashboard-content">
                        <div>
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="far fa-calendar"></i> Próximos Eventos</h2>
                                    <button className="view-all-link" onClick={() => setIsCalendarModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        Ver Calendário <i className="fas fa-arrow-right"></i>
                                    </button>
                                </div>
                                {/* 
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
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                            Não existem eventos agendados.
                                        </div>
                                    )}
                                </div>
                                */}
                            </div>

                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-chart-bar"></i> Estatísticas da Época 2025/26</h2>
                                    <a href="#" className="view-all-link">Ver Todas <i className="fas fa-arrow-right"></i></a>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Não existem estatísticas disponíveis.
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-user"></i> Dados Pessoais</h2>
                                    <button className="view-all-link" onClick={() => setIsEditModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        Editar <i className="fas fa-edit"></i>
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ padding: '15px', background: 'var(--bg-light)', borderRadius: '8px' }}>
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '5px' }}>Data de Nascimento</p>
                                        <p style={{ color: 'var(--text-color)', fontWeight: '600', fontSize: '1rem' }}>{formatDate(athleteData.birthDate)}</p>
                                    </div>

                                    <div style={{ padding: '15px', background: 'var(--bg-light)', borderRadius: '8px' }}>
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '5px' }}>Idade</p>
                                        <p style={{ color: 'var(--text-color)', fontWeight: '600', fontSize: '1rem' }}>{calculateAge(athleteData.birthDate)} anos</p>
                                    </div>

                                    <div style={{ padding: '15px', background: 'var(--bg-light)', borderRadius: '8px' }}>
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '5px' }}>Número de Sócio</p>
                                        <p style={{ color: 'var(--text-color)', fontWeight: '600', fontSize: '1rem' }}>{athleteData.memberProfile?.membershipNumber || 'N/A'}</p>
                                    </div>

                                    <div style={{ padding: '15px', background: 'var(--bg-light)', borderRadius: '8px' }}>
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '5px' }}>Data de Inscrição</p>
                                        <p style={{ color: 'var(--text-color)', fontWeight: '600', fontSize: '1rem' }}>{formatDate(athleteData.memberProfile?.memberSince)}</p>
                                    </div>

                                    <div style={{ padding: '15px', background: 'var(--bg-light)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '5px' }}>Email</p>
                                        <p style={{ color: 'var(--text-color)', fontWeight: '600', fontSize: '1rem' }}>{getDisplayEmail(athleteData.email)}</p>
                                    </div>

                                    <div style={{ padding: '15px', background: 'var(--bg-light)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '5px' }}>Telemóvel</p>
                                        <p style={{ color: 'var(--text-color)', fontWeight: '600', fontSize: '1rem' }}>{athleteData.phone || 'N/A'}</p>
                                    </div>

                                    <div style={{ padding: '15px', background: 'var(--bg-light)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                                        <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '5px' }}>Morada</p>
                                        <p style={{ color: 'var(--text-color)', fontWeight: '600', fontSize: '1rem' }}>
                                            {athleteData.address ? `${athleteData.address}, ${athleteData.postalCode} ${athleteData.city}` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-users"></i> A Minha Equipa</h2>
                                    <button className="view-all-link" onClick={() => setIsTeamModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        Ver Todos <i className="fas fa-arrow-right"></i>
                                    </button>
                                </div>

                                <div className="team-grid">
                                    {teamData?.coaches?.slice(0, 2).map((coach) => (
                                        <div className="team-member" key={`coach-${coach.id}`}>
                                            <div className="team-member-avatar" style={{ backgroundColor: '#003380', color: 'white' }}>
                                                {coach.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                            </div>
                                            <div className="team-member-info">
                                                <h4>{coach.name}</h4>
                                                <p>Treinador</p>
                                            </div>
                                        </div>
                                    ))}

                                    {teamData?.athletes?.slice(0, 4).map((athlete) => (
                                        <div className="team-member" key={`athlete-${athlete.id}`}>
                                            <div className="team-member-avatar">
                                                {athlete.jerseyNumber || athlete.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                            </div>
                                            <div className="team-member-info">
                                                <h4>{athlete.name}</h4>
                                                <p>{athlete.position || 'Atleta'} {athlete.isCaptain && '• Capitão'}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {!teamData && (
                                        <div style={{ padding: '20px', textAlign: 'center', gridColumn: '1/-1', color: '#666' }}>
                                            Ainda não tens equipa atribuída.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-bell"></i> Notificações</h2>
                                    <a href="#" className="view-all-link">Ver Todas <i className="fas fa-arrow-right"></i></a>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Não existem notificações.
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-bolt"></i> Ações Rápidas</h2>
                                </div>

                                <div className="quick-actions">
                                    <a href="#" className="action-btn" onClick={() => setIsCalendarModalOpen(true)}>
                                        <i className="fas fa-calendar-alt" ></i>
                                        Ver Calendário
                                    </a>
                                    <button className="action-btn" onClick={() => setIsEditModalOpen(true)} style={{ width: '100%', textAlign: 'left' }}>
                                        <i className="fas fa-user-edit"></i>
                                        Editar Perfil
                                    </button>
                                    <a href="#" className="action-btn">
                                        <i className="fas fa-file-medical"></i>
                                        Ficha Médica
                                    </a>
                                    <a href="#" className="action-btn">
                                        <i className="fas fa-envelope"></i>
                                        Mensagens
                                    </a>
                                    <button
                                        className="action-btn"
                                        onClick={() => setIsFamilyModalOpen(true)}
                                        style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                                    >
                                        <i className="fas fa-user-friends"></i>
                                        Associar Familiar
                                    </button>
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-folder"></i> Documentos</h2>
                                    <a href="#" className="view-all-link">Ver Todos <i className="fas fa-arrow-right"></i></a>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Não existem documentos.
                                </div>
                            </div>

                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-credit-card"></i> Estado de Pagamento</h2>
                                </div>

                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    {paymentStatus === 'Regularizada' ? (
                                        /* ── PAID ── */
                                        <div>
                                            <div className="payment-reference-box" style={{ background: '#ecfdf5', padding: '18px', borderRadius: '10px', border: '1px solid #6ee7b7', marginBottom: '14px' }}>
                                                <div style={{ color: '#059669', fontSize: '2.8rem', marginBottom: '8px' }}>
                                                    <i className="fas fa-check-circle"></i>
                                                </div>
                                                <h4 style={{ color: '#059669', margin: '0 0 4px 0' }}>Quotas em Dia</h4>
                                                <p style={{ fontSize: '0.88rem', color: '#047857', margin: 0 }}>
                                                    {paymentPreference === 'Annual'
                                                        ? `A quota anual de ${quotaAmount?.toFixed(2)} € foi paga com sucesso.`
                                                        : `O pagamento deste mês (${quotaAmount?.toFixed(2)} €) foi concluído com sucesso.`}
                                                </p>
                                            </div>

                                            {nextPeriod && (
                                                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '14px' }}>
                                                    <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: '10px' }}>
                                                        <i className="fas fa-info-circle" style={{ marginRight: '5px', color: '#003380' }}></i>
                                                        Quer adiantar o pagamento do próximo período?
                                                    </p>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => handleGenerateReference(nextPeriod.month, nextPeriod.year)}
                                                        disabled={generatingReference}
                                                        style={{
                                                            display: 'inline-flex',
                                                            background: 'var(--primary-color)',
                                                            color: 'white',
                                                            borderColor: 'var(--primary-color)',
                                                            width: '100%',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                            opacity: generatingReference ? 0.7 : 1
                                                        }}
                                                    >
                                                        {generatingReference ? (
                                                            <><i className="fas fa-spinner fa-spin"></i> A gerar...</>
                                                        ) : (
                                                            <><i className="fas fa-credit-card"></i>
                                                                {paymentPreference === 'Annual'
                                                                    ? `Pagar ${nextPeriod.year}`
                                                                    : `Pagar ${new Date(nextPeriod.year, (nextPeriod.month || 1) - 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}`
                                                                }</>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : paymentStatus === 'Pendente' && paymentReference ? (
                                        /* ── PENDING ── */
                                        <div className="payment-reference-box" style={{ background: '#f0f9ff', padding: '18px', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                                            <div style={{ color: '#d97706', fontSize: '1.6rem', marginBottom: '6px' }}>
                                                <i className="fas fa-clock"></i>
                                            </div>
                                            <h4 style={{ color: '#003380', margin: '0 0 4px 0' }}>Pagamento Pendente</h4>
                                            {paymentReference.description && (
                                                <p style={{ fontSize: '0.82rem', color: '#555', margin: '0 0 12px 0' }}>
                                                    {paymentReference.description}
                                                </p>
                                            )}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'auto 1fr',
                                                gap: '8px 12px',
                                                textAlign: 'left',
                                                maxWidth: '260px',
                                                margin: '0 auto 14px auto',
                                                background: '#fff',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                border: '1px solid #e0eeff'
                                            }}>
                                                <span style={{ color: '#888', fontSize: '0.85rem' }}>Entidade:</span>
                                                <span style={{ fontWeight: '700', fontSize: '0.95rem', letterSpacing: '1px' }}>{paymentReference.entity}</span>
                                                <span style={{ color: '#888', fontSize: '0.85rem' }}>Referência:</span>
                                                <span style={{ fontWeight: '700', fontSize: '0.95rem', letterSpacing: '1px' }}>{paymentReference.reference}</span>
                                                <span style={{ color: '#888', fontSize: '0.85rem' }}>Valor:</span>
                                                <span style={{ fontWeight: '700', fontSize: '1rem', color: '#003380' }}>
                                                    {(paymentReference.amount ?? quotaAmount)?.toFixed(2)} €
                                                </span>
                                            </div>
                                            <button
                                                onClick={checkPaymentStatus}
                                                className="action-btn"
                                                style={{ fontSize: '0.82rem', padding: '6px 14px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                                            >
                                                <i className="fas fa-sync-alt"></i> Verificar Pagamento
                                            </button>
                                            <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '10px', marginBottom: 0 }}>
                                                A referência mantém-se ativa até ao pagamento ser confirmado.
                                            </p>
                                        </div>
                                    ) : (
                                        /* ── UNPAID ── */
                                        <>
                                            <p style={{ marginBottom: '15px', color: '#666' }}>
                                                Quota {paymentPreference === 'Annual' ? 'Anual' : 'Mensal'}:{' '}
                                                <strong style={{ color: '#003380' }}>
                                                    {quotaAmount !== null ? `${quotaAmount.toFixed(2)} €` : 'A calcular...'}
                                                </strong>
                                            </p>
                                            <button
                                                className="action-btn"
                                                onClick={() => handleGenerateReference()}
                                                disabled={generatingReference || quotaAmount === null}
                                                style={{
                                                    display: 'inline-flex',
                                                    background: 'var(--primary-color)',
                                                    color: 'white',
                                                    borderColor: 'var(--primary-color)',
                                                    width: '100%',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    opacity: (generatingReference || quotaAmount === null) ? 0.7 : 1
                                                }}
                                            >
                                                {generatingReference ? (
                                                    <><i className="fas fa-spinner fa-spin"></i> A gerar...</>
                                                ) : (
                                                    <><i className="fas fa-credit-card"></i> Gerar Referência de Pagamento</>
                                                )}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>


                            {/* Payment History Card */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-history"></i> Histórico de Pagamentos</h2>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        <button
                                            onClick={() => setHistoryYear(y => y - 1)}
                                            style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '3px 9px', cursor: 'pointer', color: '#666', fontSize: '0.8rem' }}
                                        ><i className="fas fa-chevron-left"></i></button>
                                        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#003380', minWidth: '38px', textAlign: 'center' }}>{historyYear}</span>
                                        <button
                                            onClick={() => setHistoryYear(y => Math.min(y + 1, new Date().getFullYear()))}
                                            disabled={historyYear >= new Date().getFullYear()}
                                            style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '3px 9px', cursor: 'pointer', color: '#666', fontSize: '0.8rem', opacity: historyYear >= new Date().getFullYear() ? 0.4 : 1 }}
                                        ><i className="fas fa-chevron-right"></i></button>
                                    </div>
                                </div>

                                {(() => {
                                    const yearPayments = paymentHistory.filter(p => p.periodYear === historyYear);
                                    if (paymentHistory.length === 0) {
                                        return (
                                            <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                                                <i className="fas fa-receipt" style={{ fontSize: '2rem', marginBottom: '10px', display: 'block', opacity: 0.3 }}></i>
                                                Sem histórico de pagamentos.
                                            </div>
                                        );
                                    }
                                    if (yearPayments.length === 0) {
                                        return (
                                            <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                                                Sem pagamentos registados para {historyYear}.
                                            </div>
                                        );
                                    }
                                    return (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f4f7ff', borderBottom: '2px solid #e2e8f4' }}>
                                                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#444', fontWeight: '600', whiteSpace: 'nowrap' }}>Período</th>
                                                        <th style={{ padding: '10px 14px', textAlign: 'right', color: '#444', fontWeight: '600' }}>Valor</th>
                                                        <th style={{ padding: '10px 14px', textAlign: 'center', color: '#444', fontWeight: '600' }}>Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {yearPayments.map((payment, idx) => {
                                                        const isPaid = payment.status === 'Completed';
                                                        const isPending = payment.status === 'Pending';
                                                        const badgeCss = isPaid
                                                            ? { background: '#ecfdf5', color: '#059669', border: '1px solid #6ee7b7' }
                                                            : isPending
                                                                ? { background: '#fffbeb', color: '#d97706', border: '1px solid #fcd34d' }
                                                                : { background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' };
                                                        const badgeLabel = isPaid ? 'Pago' : isPending ? 'Pendente' : 'Não Pago';
                                                        const badgeIcon = isPaid ? 'fa-check-circle' : isPending ? 'fa-clock' : 'fa-times-circle';
                                                        return (
                                                            <tr key={payment.id}
                                                                style={{ borderBottom: '1px solid #f0f4ff', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafcff', transition: 'background 0.15s' }}
                                                            >
                                                                <td style={{ padding: '10px 14px', color: '#333', fontWeight: '500' }}>
                                                                    {payment.month}
                                                                </td>
                                                                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: '700', color: '#003380' }}>
                                                                    {payment.amount?.toFixed(2)} €
                                                                </td>
                                                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                                                    <span style={{
                                                                        ...badgeCss,
                                                                        borderRadius: '20px',
                                                                        padding: '3px 10px',
                                                                        fontSize: '0.78rem',
                                                                        fontWeight: '600',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px',
                                                                        whiteSpace: 'nowrap'
                                                                    }}>
                                                                        <i className={`fas ${badgeIcon}`}></i>
                                                                        {badgeLabel}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                userData={athleteData}
                onSave={handleSaveProfile}
            />

            <TeamDetailsModal
                isOpen={isTeamModalOpen}
                onClose={() => setIsTeamModalOpen(false)}
                teamData={teamData}
            />

            <CalendarModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                teamId={primaryTeam?.id}
            />

            <FamilyAssociationModal
                isOpen={isFamilyModalOpen}
                onClose={() => setIsFamilyModalOpen(false)}
            />
        </div >
    );
};

export default DashboardAtleta;
