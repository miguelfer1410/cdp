import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './DashboardAtleta.css';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import TeamDetailsModal from '../../components/TeamDetailsModal/TeamDetailsModal';
import CalendarModal from '../../components/CalendarModal/CalendarModal';
import PaymentCard from '../../components/Payment/PaymentCard';
import RequestsModal from '../../components/RequestsModal/RequestsModal';
import DocumentsModal from '../../components/DocumentsModal/DocumentsModal';
import MembershipCard from '../../components/MembershipCard/MembershipCard';

const DashboardAtleta = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [athleteData, setAthleteData] = useState(null);
    const [teamsData, setTeamsData] = useState([]);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingTab, setLoadingTab] = useState(false);
    const [error, setError] = useState(null);
    const [paymentToast, setPaymentToast] = useState(null); // 'success' | 'cancelled' | null
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
    const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
    const [quotaBreakdown, setQuotaBreakdown] = useState([]);
    const [discountsApplied, setDiscountsApplied] = useState([]);
    const [inscriptionInfo, setInscriptionInfo] = useState([]);
    const [parentsPaymentWarning, setParentsPaymentWarning] = useState(false);

    // Linked users — refreshed from the API on every mount so newly-accepted
    // family association requests become visible without forcing a re-login.
    const [linkedUsers, setLinkedUsers] = useState(() => {
        try {
            const stored = localStorage.getItem('linkedUsers');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [selectedUserId, setSelectedUserId] = useState(() => {
        return parseInt(localStorage.getItem('userId')) || null;
    });

    // Refresh linked users from server on mount
    useEffect(() => {
        const refreshLinkedUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch('http://localhost:5285/api/auth/linked-users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setLinkedUsers(data);
                    if (data.length > 0) {
                        localStorage.setItem('linkedUsers', JSON.stringify(data));
                    } else {
                        localStorage.removeItem('linkedUsers');
                    }
                }
            } catch (err) {
                console.warn('Could not refresh linked users:', err);
            }
        };
        refreshLinkedUsers();
    }, []);

    // Detect ?payment=success / ?payment=cancelled after Stripe redirect
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const paymentParam = params.get('payment');
        if (paymentParam === 'success' || paymentParam === 'cancelled') {
            setPaymentToast(paymentParam);
            // Clean the query param from the URL without reloading
            window.history.replaceState({}, '', location.pathname);
            // Auto-dismiss after 6 seconds
            const timer = setTimeout(() => setPaymentToast(null), 6000);
            return () => clearTimeout(timer);
        }
    }, [location.search]);

    const [paymentReference, setPaymentReference] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('unpaid');
    const [generatingReference, setGeneratingReference] = useState(false);
    const [startingPayment, setStartingPayment] = useState(false);
    const [quotaAmount, setQuotaAmount] = useState(null);
    const [totalDue, setTotalDue] = useState(null);
    const [overdueMonths, setOverdueMonths] = useState([]);
    const [paymentPreference, setPaymentPreference] = useState('Monthly');
    const [nextPeriod, setNextPeriod] = useState(null); // { month, year }
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [historyInscriptions, setHistoryInscriptions] = useState([]);
    const [historyYear, setHistoryYear] = useState(new Date().getFullYear());
    const [isExemptFromGlobalFee, setIsExemptFromGlobalFee] = useState(false);

    // Start Stripe Checkout for quota payment
    const handleStartPayment = async (periodMonth = null, periodYear = null) => {
        setStartingPayment(true);
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
                throw new Error(err.message || 'Erro ao iniciar pagamento');
            }
            const data = await response.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('URL de pagamento não recebida.');
            }
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setStartingPayment(false);
        }
    };

    const handleBuyTicket = async (event) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/tickets/checkout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eventId: event.id,
                    buyerUserId: selectedUserId,
                    buyerEmail: athleteData.email || athleteData.athleteProfile?.email,
                    buyerName: athleteData.athleteProfile
                        ? `${athleteData.athleteProfile.firstName || ''} ${athleteData.athleteProfile.lastName || ''}`.trim() || athleteData.fullName
                        : athleteData.fullName,
                    successUrl: window.location.origin + '/payment-success',
                    cancelUrl: window.location.origin + '/payment-cancel'
                })
            });

            if (!response.ok) throw new Error('Erro ao criar sessão de pagamento');

            const { url } = await response.json();

            if (url) {
                window.location.href = url;
            } else {
                throw new Error('URL de pagamento não recebida.');
            }
        } catch (err) {
            console.error(err);
            alert(err.message);
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
                console.log(userData);
                setAthleteData(userData);

                // 2. Fetch Quota for this user
                try {
                    const quotaResponse = await fetch(`http://localhost:5285/api/payment/quota?userId=${selectedUserId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    console.log(quotaResponse);
                    if (quotaResponse.ok) {
                        const quotaData = await quotaResponse.json();
                        console.log(quotaData);
                        setQuotaAmount(quotaData.amount);
                        setPaymentStatus(quotaData.status);
                        setPaymentReference(quotaData.existingPayment || null);
                        setPaymentPreference(quotaData.paymentPreference || 'Monthly');
                        // NEW: breakdown and discounts
                        setQuotaBreakdown(quotaData.breakdown || []);
                        setDiscountsApplied(quotaData.discountsApplied || []);
                        setInscriptionInfo(quotaData.inscriptionInfo || []);
                        setOverdueMonths(quotaData.overdueMonths || []);
                        setTotalDue(quotaData.totalDue ?? null);
                        setParentsPaymentWarning(quotaData.parentsPaymentWarning || false);
                        if (quotaData.nextPeriodYear) {
                            setNextPeriod({ month: quotaData.nextPeriodMonth, year: quotaData.nextPeriodYear });
                        }
                    } else {
                        setQuotaAmount(0);
                        setPaymentStatus('-');
                        setPaymentReference(null);
                        setQuotaBreakdown([]);
                        setDiscountsApplied([]);
                        setInscriptionInfo([]);
                        setParentsPaymentWarning(false);
                    }
                } catch (qErr) {
                    console.error('Error fetching quota:', qErr);
                }

                // 3b. Fetch Payment History
                try {
                    const historyResponse = await fetch(`http://localhost:5285/api/payment/history?userId=${selectedUserId}&year=${historyYear}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (historyResponse.ok) {
                        const historyData = await historyResponse.json();
                        setPaymentHistory(Array.isArray(historyData) ? historyData : (historyData.payments || []));
                        setHistoryInscriptions(Array.isArray(historyData) ? [] : (historyData.inscriptions || []));
                    } else {
                        setPaymentHistory([]);
                        setHistoryInscriptions([]);
                    }
                } catch (hErr) {
                    console.error('Error fetching payment history:', hErr);
                    setPaymentHistory([]);
                    setHistoryInscriptions([]);
                }

                // 3. Fetch All Teams + Events
                const teams = userData.athleteProfile?.teams || [];
                if (teams.length > 0) {
                    const teamPromises = teams.map(t =>
                        fetch(`http://localhost:5285/api/teams/${t.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                    );
                    const eventPromises = teams.map(t =>
                        fetch(`http://localhost:5285/api/events?teamId=${t.id}&startDate=${new Date().toISOString()}`, { headers: { 'Authorization': `Bearer ${token}` } })
                    );

                    const teamResponses = await Promise.all(teamPromises);
                    const eventResponses = await Promise.all(eventPromises);

                    const fetchedTeamsData = await Promise.all(teamResponses.map(r => r.ok ? r.json() : null));
                    const allEventsResults = await Promise.all(eventResponses.map(r => r.ok ? r.json() : []));

                    const validTeams = fetchedTeamsData.filter(t => t !== null);
                    setTeamsData(validTeams);

                    if (validTeams.length > 0 && !selectedTeamId) {
                        setSelectedTeamId(validTeams[0].id);
                    }

                    const combinedEvents = allEventsResults.flat();
                    setEvents(combinedEvents
                        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
                        .slice(0, 6)
                    );
                } else {
                    setTeamsData([]);
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
    }, [selectedUserId, historyYear]);

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

    const primaryTeamData = teamsData.find(t => t.id === selectedTeamId) || teamsData[0] || {};

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
            {paymentToast && (
                <div className={`payment-toast ${paymentToast}`}>
                    <div className="toast-content">
                        {paymentToast === 'success' ? (
                            <>
                                <div className="toast-icon success">✓</div>
                                <div className="toast-text">
                                    <strong>Pagamento Iniciado com Sucesso!</strong>
                                    <p>O seu pagamento está a ser processado. Se usou Multibanco, a atualização pode demorar alguns minutos.</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="toast-icon cancelled">✕</div>
                                <div className="toast-text">
                                    <strong>Pagamento Cancelado</strong>
                                    <p>O processo de pagamento foi interrompido. Pode tentar novamente quando desejar.</p>
                                </div>
                            </>
                        )}
                        <button className="toast-close" onClick={() => setPaymentToast(null)}>✕</button>
                    </div>
                </div>
            )}
            {/* Athlete Tabs - shown when there are multiple linked users (siblings) */}
            {linkedUsers.length > 1 && (
                <div className="athlete-tabs">
                    <div className="container athlete-tabs-container">
                        {linkedUsers.map((lu) => {
                            const dashboardRoutes = {
                                atleta: null, // stay on this page, just switch userId
                                treinador: '/dashboard-treinador',
                                socio: '/dashboard-socio',
                                admin: '/dashboard-admin',
                                user: '/dashboard-socio'
                            };
                            const handleClick = async () => {
                                const type = lu.dashboardType?.toLowerCase() || 'socio';
                                if (type === 'atleta') {
                                    setSelectedUserId(lu.id);
                                } else {
                                    try {
                                        const token = localStorage.getItem('token');
                                        const res = await fetch('http://localhost:5285/api/auth/switch-user', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({ targetUserId: lu.id })
                                        });

                                        if (res.ok) {
                                            const data = await res.json();
                                            localStorage.setItem('token', data.token);
                                            localStorage.setItem('userId', data.id.toString());
                                            localStorage.setItem('roles', JSON.stringify(data.roles));
                                            localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);

                                            const route = dashboardRoutes[type] || '/dashboard-socio';
                                            navigate(route);
                                            window.location.reload();
                                        } else {
                                            const route = dashboardRoutes[type] || '/dashboard-socio';
                                            localStorage.setItem('userId', lu.id);
                                            navigate(route);
                                        }
                                    } catch (err) {
                                        console.error('Error switching user:', err);
                                        const route = dashboardRoutes[type] || '/dashboard-socio';
                                        localStorage.setItem('userId', lu.id);
                                        navigate(route);
                                    }
                                }
                            };
                            return (
                                <button
                                    key={lu.id}
                                    onClick={handleClick}
                                    className={`athlete-tab ${selectedUserId === lu.id ? 'active' : ''}`}
                                >
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
                                    <i className={getSportIcon(athleteData.athleteProfile?.teams?.map(t => t.sportName).join(', '))}></i>
                                    <span>{athleteData.athleteProfile?.teams?.map(t => t.sportName).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'Sem Modalidade'}</span>
                                </div>
                                <div className="profile-meta-item">
                                    <i className="fas fa-users"></i>
                                    <span>{athleteData.athleteProfile?.teams?.map(t => t.name).join(' / ') || 'Sem Equipa'}</span>
                                </div>
                                <div className="profile-meta-item">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{athleteData.athleteProfile?.teams?.[0]?.position || 'Atleta'}</span>
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
                                                {event.eventType === 1 && (
                                                    <button
                                                        className="buy-ticket-btn"
                                                        onClick={() => handleBuyTicket(event)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#003380',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <i className="fas fa-ticket-alt"></i> Comprar Bilhete
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                            Não existem eventos agendados.
                                        </div>
                                    )}
                                </div>
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

                                <div className="personal-data-grid">
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
                                    <div className="team-selector-header">
                                        {teamsData.length > 1 && (
                                            <select
                                                value={selectedTeamId}
                                                onChange={(e) => setSelectedTeamId(parseInt(e.target.value))}
                                                className="team-mini-selector"
                                            >
                                                {teamsData.map(t => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                ))}
                                            </select>
                                        )}
                                        <button className="view-all-link" onClick={() => setIsTeamModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                                            Ver Tudo <i className="fas fa-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="team-grid">
                                    {(() => {
                                        const currentTeam = teamsData.find(t => t.id === selectedTeamId) || teamsData[0];
                                        if (!currentTeam) return (
                                            <div style={{ padding: '20px', textAlign: 'center', gridColumn: '1/-1', color: '#666' }}>
                                                Ainda não tens equipa atribuída.
                                            </div>
                                        );

                                        return (
                                            <>
                                                {currentTeam.coaches?.slice(0, 2).map((coach) => (
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

                                                {currentTeam.athletes?.slice(0, 4).map((athlete) => (
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
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>

                        <div>
                            <PaymentCard
                                paymentStatus={paymentStatus}
                                quotaAmount={quotaAmount}
                                totalDue={totalDue}
                                overdueMonths={overdueMonths}
                                paymentPreference={paymentPreference}
                                paymentReference={paymentReference}
                                breakdown={quotaBreakdown}
                                discountsApplied={discountsApplied}
                                inscriptionInfo={inscriptionInfo}
                                nextPeriod={nextPeriod}
                                paymentHistory={paymentHistory}
                                historyInscriptions={historyInscriptions}
                                historyYear={historyYear}
                                onHistoryYearChange={setHistoryYear}
                                onGenerateReference={handleStartPayment}
                                generatingReference={startingPayment}
                                onStartPayment={handleStartPayment}
                                startingPayment={startingPayment}
                                parentsPaymentWarning={parentsPaymentWarning}
                            />

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
                                        Calendário
                                    </a>
                                    <button className="action-btn" onClick={() => setIsEditModalOpen(true)}>
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
                                        onClick={() => setIsRequestsModalOpen(true)}
                                    >
                                        <i className="fas fa-clipboard-list"></i>
                                        Requisições
                                    </button>
                                </div>
                            </div>

                            {/* Membership Card */}
                            <MembershipCard
                                memberNumber={athleteData.memberProfile?.membershipNumber || athleteData.id?.toString()}
                                name={
                                    athleteData.athleteProfile
                                        ? `${athleteData.athleteProfile.firstName || ''} ${athleteData.athleteProfile.lastName || ''}`.trim() || athleteData.fullName
                                        : athleteData.fullName
                                }
                                memberSince={athleteData.memberProfile?.memberSince ? new Date(athleteData.memberProfile.memberSince).getFullYear().toString() : '—'}
                                validity="31/12/2026"
                                status={athleteData.memberProfile?.membershipStatus !== undefined
                                    ? ['Pending', 'Active', 'Suspended', 'Cancelled'][athleteData.memberProfile.membershipStatus] || 'Ativo'
                                    : 'Ativo'}
                                sport={athleteData.sport}
                                cardType="atleta"
                                userId={selectedUserId}
                                compact={true}
                            />

                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-folder"></i> Documentos</h2>
                                    <button
                                        className="view-all-link"
                                        onClick={() => setIsDocumentsModalOpen(true)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                    >
                                        Ver Todos <i className="fas fa-arrow-right"></i>
                                    </button>
                                </div>

                                <div className="documents-list">
                                    <div className="document-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <i className="fas fa-file-pdf" style={{ color: '#dc3545', fontSize: '1.2rem' }}></i>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Cartão de Sócio</h4>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>PDF • 156 KB</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                const token = localStorage.getItem('token');
                                                try {
                                                    const response = await fetch(`http://localhost:5285/api/membershipcard/download?userId=${selectedUserId}`, {
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });
                                                    if (response.ok) {
                                                        const blob = await response.blob();
                                                        const url = window.URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `Cartao_Socio_${selectedUserId}.pdf`;
                                                        document.body.appendChild(a);
                                                        a.click();
                                                        a.remove();
                                                    }
                                                } catch (err) {
                                                    console.error('Download failed', err);
                                                }
                                            }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#003380' }}
                                        >
                                            <i className="fas fa-download"></i>
                                        </button>
                                    </div>
                                    <div className="document-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <i className="fas fa-file-pdf" style={{ color: '#dc3545', fontSize: '1.2rem' }}></i>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Regulamento Interno</h4>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>PDF • 304 KB</p>
                                            </div>
                                        </div>
                                        <a
                                            href="http://localhost:5285/docs/regulamento_cdpovoa.pdf"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: '#003380' }}
                                        >
                                            <i className="fas fa-download"></i>
                                        </a>
                                    </div>
                                </div>
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
                teamData={teamsData.find(t => t.id === selectedTeamId) || teamsData[0]}
            />

            <CalendarModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                teamId={selectedTeamId}
            />

            <RequestsModal
                isOpen={isRequestsModalOpen}
                onClose={() => setIsRequestsModalOpen(false)}
                userId={selectedUserId}
                athleteProfileEscalao={athleteData?.athleteProfile?.escalao}
            />

            <DocumentsModal
                isOpen={isDocumentsModalOpen}
                onClose={() => setIsDocumentsModalOpen(false)}
                userId={selectedUserId}
            />
        </div >
    );
};

export default DashboardAtleta;
