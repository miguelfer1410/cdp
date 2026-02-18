import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './DashboardAtleta.css';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import TeamDetailsModal from '../../components/TeamDetailsModal/TeamDetailsModal';
import CalendarModal from '../../components/CalendarModal/CalendarModal';

const DashboardAtleta = () => {
    const [athleteData, setAthleteData] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
    const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

    // Payment State
    const [paymentReference, setPaymentReference] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState('unpaid'); // 'unpaid', 'pending', 'paid'
    const [generatingReference, setGeneratingReference] = useState(false);
    const [quotaAmount, setQuotaAmount] = useState(null);

    const handleGenerateReference = async () => {
        setGeneratingReference(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/payment/reference', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Erro ao gerar referência');
            }

            const data = await response.json();
            setPaymentReference(data);
            setPaymentStatus('pending');
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

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchData = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('token');

                if (!userId || !token) {
                    throw new Error('User not authenticated');
                }

                // Fetch Quota Amount
                try {
                    const quotaResponse = await fetch('http://localhost:5285/api/payment/quota', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (quotaResponse.ok) {
                        const quotaData = await quotaResponse.json();
                        console.log(quotaData);
                        setQuotaAmount(quotaData.amount);
                        setPaymentStatus(quotaData.status); // 'paid', 'pending', 'unpaid'
                        if (quotaData.existingPayment) {
                            setPaymentReference(quotaData.existingPayment);
                        }
                    }
                } catch (qErr) {
                    console.error("Error fetching quota:", qErr);
                }

                const userResponse = await fetch(`http://localhost:5285/api/users/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!userResponse.ok) {
                    throw new Error('Failed to fetch athlete data');
                }

                const userData = await userResponse.json();
                setAthleteData(userData);

                const primaryTeam = userData.athleteProfile?.teams?.[0];
                if (primaryTeam && primaryTeam.id) {
                    const teamResponse = await fetch(`http://localhost:5285/api/teams/${primaryTeam.id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (teamResponse.ok) {
                        const teamData = await teamResponse.json();
                        setTeamData(teamData);

                        const today = new Date().toISOString();
                        const eventsResponse = await fetch(`http://localhost:5285/api/events?teamId=${primaryTeam.id}&startDate=${today}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });

                        if (eventsResponse.ok) {
                            const eventsData = await eventsResponse.json();
                            const sortedEvents = eventsData
                                .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))
                                .slice(0, 3);
                            setEvents(sortedEvents);
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

        fetchData();
    }, []);

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

    return (
        <div className="dashboard-wrapper">
            <section className="profile-header">
                <div className="container">
                    <div className="profile-content">
                        <img src="https://images.unsplash.com/vector-1742875355318-00d715aec3e8?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt={athleteData.fullName} className="profile-avatar" />
                        <div className="profile-info">
                            <h1>{athleteData.fullName}</h1>
                            <div className="profile-meta">
                                <div className="profile-meta-item">
                                    <i className="fas fa-basketball-ball"></i>
                                    <span>Basquetebol</span>
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
                                        <p style={{ color: 'var(--text-color)', fontWeight: '600', fontSize: '1rem' }}>{athleteData.email}</p>
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
                                    {paymentStatus === 'paid' ? (
                                        <div className="payment-reference-box" style={{ background: '#ecfdf5', padding: '15px', borderRadius: '8px', border: '1px solid #10b981' }}>
                                            <div style={{ color: '#059669', fontSize: '3rem', marginBottom: '10px' }}>
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                            <h4 style={{ color: '#059669', margin: '0 0 5px 0' }}>Quotas em Dia</h4>
                                            <p style={{ fontSize: '0.9rem', color: '#047857' }}>
                                                O pagamento deste mês foi concluído com sucesso.
                                            </p>
                                        </div>
                                    ) : paymentStatus === 'pending' && paymentReference ? (
                                        <div className="payment-reference-box" style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                            <h4 style={{ color: '#003380', margin: '0 0 10px 0' }}>Referência Multibanco</h4>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', textAlign: 'left', maxWidth: '250px', margin: '0 auto' }}>
                                                <span style={{ color: '#666' }}>Entidade:</span>
                                                <span style={{ fontWeight: 'bold' }}>{paymentReference.entity}</span>
                                                <span style={{ color: '#666' }}>Referência:</span>
                                                <span style={{ fontWeight: 'bold' }}>{paymentReference.reference}</span>
                                                <span style={{ color: '#666' }}>Valor:</span>
                                                <span style={{ fontWeight: 'bold', color: '#003380' }}>{quotaAmount} €</span>
                                            </div>
                                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => checkPaymentStatus(athleteData?.memberProfile?.id /* Ideally we need payment ID here, but for now user might just refresh */)}
                                                    className="action-btn"
                                                    style={{ fontSize: '0.8rem', padding: '5px 10px' }}
                                                >
                                                    <i className="fas fa-sync-alt"></i> Atualizar Estado
                                                </button>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '10px' }}>
                                                Pagamento a aguardar confirmação.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <p style={{ marginBottom: '15px', color: '#666' }}>
                                                Quota Mensal: <strong>{quotaAmount !== null ? `${quotaAmount.toFixed(2)} €` : 'A calcular...'}</strong>
                                            </p>
                                            <button
                                                className="action-btn"
                                                onClick={handleGenerateReference}
                                                disabled={generatingReference || quotaAmount === null}
                                                style={{
                                                    display: 'inline-flex',
                                                    background: 'var(--primary-color)',
                                                    color: 'white',
                                                    borderColor: 'var(--primary-color)',
                                                    width: '100%',
                                                    justifyContent: 'center',
                                                    opacity: (generatingReference || quotaAmount === null) ? 0.7 : 1
                                                }}
                                            >
                                                {generatingReference ? (
                                                    <><i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> A gerar...</>
                                                ) : (
                                                    <><i className="fas fa-credit-card" style={{ marginRight: '8px' }}></i> Pagar Quotas</>
                                                )}
                                            </button>
                                        </>
                                    )}
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
                teamData={teamData}
            />

            <CalendarModal
                isOpen={isCalendarModalOpen}
                onClose={() => setIsCalendarModalOpen(false)}
                teamId={primaryTeam?.id}
            />
        </div >
    );
};

export default DashboardAtleta;
