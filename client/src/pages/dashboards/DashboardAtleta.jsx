import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './DashboardAtleta.css';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import TeamDetailsModal from '../../components/TeamDetailsModal/TeamDetailsModal';

const DashboardAtleta = () => {
    const [athleteData, setAthleteData] = useState(null);
    const [teamData, setTeamData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchData = async () => {
            try {
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('token');

                if (!userId || !token) {
                    throw new Error('User not authenticated');
                }

                // Fetch Athlete Data
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

                // Fetch Team Data if assigned
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

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('pt-PT');
    };

    // Helper to calculate age
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

    // Get primary team info
    const primaryTeam = athleteData.athleteProfile?.teams?.[0] || {};

    const handleSaveProfile = (updatedData) => {
        setAthleteData(updatedData);
        // Update local storage in case name changed
        localStorage.setItem('userName', `${updatedData.firstName} ${updatedData.lastName}`);
    };

    return (
        <div className="dashboard-wrapper">
            {/* Profile Header */}
            <section className="profile-header">
                <div className="container">
                    <div className="profile-content">
                        <img src="https://images.unsplash.com/vector-1742875355318-00d715aec3e8?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt={athleteData.fullName} className="profile-avatar" />
                        <div className="profile-info">
                            <h1>{athleteData.fullName}</h1>
                            <div className="profile-meta">
                                <div className="profile-meta-item">
                                    <i className="fas fa-basketball-ball"></i>
                                    <span>Basquetebol</span> {/* Static for now or fetch sport from team/coach */}
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

            {/* Quick Stats */}
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

                        <div className="stat-card">
                            <h3>-</h3>
                            <p>Próximos Eventos</p>
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
                            {/* Próximos Eventos */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="far fa-calendar"></i> Próximos Eventos</h2>
                                    <a href="#" className="view-all-link">Ver Calendário <i className="fas fa-arrow-right"></i></a>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Não existem eventos agendados.
                                </div>
                            </div>

                            {/* Estatísticas Pessoais */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-chart-bar"></i> Estatísticas da Época 2025/26</h2>
                                    <a href="#" className="view-all-link">Ver Todas <i className="fas fa-arrow-right"></i></a>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Não existem estatísticas disponíveis.
                                </div>
                            </div>

                            {/* Dados Pessoais */}
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

                            {/* Equipa */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-users"></i> A Minha Equipa</h2>
                                    <button className="view-all-link" onClick={() => setIsTeamModalOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        Ver Todos <i className="fas fa-arrow-right"></i>
                                    </button>
                                </div>

                                <div className="team-grid">
                                    {/* Coaches (Limit to 2) */}
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



                                    {/* Athletes (Limit to 4) */}
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

                        {/* Right Column */}
                        <div>
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

                            {/* Ações Rápidas */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-bolt"></i> Ações Rápidas</h2>
                                </div>

                                <div className="quick-actions">
                                    <a href="#" className="action-btn">
                                        <i className="fas fa-calendar-alt"></i>
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

                            {/* Documentos */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-folder"></i> Documentos</h2>
                                    <a href="#" className="view-all-link">Ver Todos <i className="fas fa-arrow-right"></i></a>
                                </div>

                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    Não existem documentos.
                                </div>
                            </div>

                            {/* Informações de Pagamento */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><i className="fas fa-credit-card"></i> Estado de Pagamento</h2>
                                </div>

                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <a href="#" className="action-btn" style={{ display: 'inline-flex', background: 'var(--primary-color)', color: 'white', borderColor: 'var(--primary-color)', width: '100%', justifyContent: 'center' }}>
                                        <i className="fas fa-credit-card" style={{ marginRight: '8px' }}></i>
                                        Pagar Quotas
                                    </a>
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
        </div >
    );
};

export default DashboardAtleta;
