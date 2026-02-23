import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FaIdCard,
    FaCalendarAlt,
    FaCreditCard,
    FaGift,
    FaPercentage,
    FaSwimmingPool,
    FaTicketAlt,
    FaBolt,
    FaReceipt,
    FaBell,
    FaUser,
    FaEdit,
    FaFolder,
    FaFilePdf,
    FaDownload,
    FaCheck,
    FaClock,
    FaMapMarkerAlt,
    FaTrophy,
    FaCalendarCheck,
    FaArrowRight,
    FaUserFriends
} from 'react-icons/fa';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import BecomeMember from '../../components/BecomeMember/BecomeMember';
import FamilyAssociationModal from '../../components/FamilyAssociationModal/FamilyAssociationModal';
import './DashboardSocio.css';

const DashboardSocio = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);

    // Linked profiles (accounts sharing the same base email)
    const [linkedUsers] = useState(() => {
        try {
            const stored = localStorage.getItem('linkedUsers');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const currentUserId = parseInt(localStorage.getItem('userId')) || null;

    const handleLinkedTabClick = (lu) => {
        const dashboardRoutes = {
            atleta: '/dashboard-atleta',
            treinador: '/dashboard-treinador',
            socio: '/dashboard-socio',
            user: '/dashboard-socio'
        };
        localStorage.setItem('userId', lu.id);
        navigate(dashboardRoutes[lu.dashboardType] || '/dashboard-socio');
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    navigate('/login');
                    return;
                }

                // Fetch user profile
                const userResponse = await fetch('http://51.178.43.232:5285/api/user/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!userResponse.ok) {
                    if (userResponse.status === 401) {
                        localStorage.removeItem('token');
                        navigate('/login');
                        return;
                    }
                    throw new Error('Failed to fetch user data');
                }

                const userData = await userResponse.json();
                setUserData(userData);

                console.log(userData);

                if (userData.membershipStatus === 'Active') {
                    // Fetch payment summary
                    const paymentResponse = await fetch('http://51.178.43.232:5285/api/payment/summary', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (paymentResponse.ok) {
                        const paymentData = await paymentResponse.json();
                        setPaymentData(paymentData);
                        console.log(paymentData);
                    }

                    // Fetch payment history
                    const historyResponse = await fetch('http://51.178.43.232:5285/api/payment/history', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (historyResponse.ok) {
                        const historyData = await historyResponse.json();
                        setPaymentHistory(historyData);
                        console.log('Payment History:', historyData);
                        console.log('User ID:', userData.id);
                    } else {
                        console.error('Failed to fetch payment history:', historyResponse.status);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleEditProfile = () => {
        setIsEditModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
    };

    const handleSaveProfile = (updatedData) => {
        setUserData(updatedData);
    };

    if (loading) {
        return (
            <div className="dashboard-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <h2>A carregar...</h2>
            </div>
        );
    }

    if (error || !userData) {
        return (
            <div className="dashboard-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <h2>Erro ao carregar dados do utilizador</h2>
            </div>
        );
    }

    // Check if user is pending membership (hasn't paid first quota)
    if (userData.membershipStatus === 'Pending') {
        return (
            <div className="dashboard-wrapper">
                {/* Linked Profile Tabs */}
                {linkedUsers.length > 1 && (
                    <div className="athlete-tabs">
                        <div className="container athlete-tabs-container">
                            {linkedUsers.map((lu) => (
                                <button
                                    key={lu.id}
                                    onClick={() => handleLinkedTabClick(lu)}
                                    className={`athlete-tab ${currentUserId === lu.id ? 'active' : ''}`}
                                >
                                    <i className={
                                        lu.dashboardType === 'atleta' ? 'fas fa-running' :
                                            lu.dashboardType === 'treinador' ? 'fas fa-user-tie' :
                                                'fas fa-id-card'
                                    }></i>
                                    {`${lu.firstName} ${lu.lastName}`.trim() || `Conta ${lu.id}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <BecomeMember userData={userData} />
            </div>
        );
    }

    // Calculate member data for active members
    const memberSinceDate = userData.memberSince ? new Date(userData.memberSince) : new Date(userData.createdAt);
    const memberSinceYear = memberSinceDate.getFullYear();
    const currentYear = new Date().getFullYear();
    const yearsAsMember = currentYear - memberSinceYear;

    const registrationDate = new Date(userData.createdAt);
    const formattedDate = `${registrationDate.getDate().toString().padStart(2, '0')}/${(registrationDate.getMonth() + 1).toString().padStart(2, '0')}/${registrationDate.getFullYear()}`;

    // Format payment dates
    const formatDate = (dateString) => {
        if (!dateString) return 'Não disponível';
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')} ${getMonthAbbreviation(date.getMonth())} ${date.getFullYear()}`;
    };

    const getMonthAbbreviation = (monthIndex) => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return months[monthIndex];
    };

    const memberData = {
        name: `${userData.firstName} ${userData.lastName}`,
        memberNumber: userData.id.toString().padStart(4, '0'),
        memberSince: memberSinceYear.toString(),
        registrationDate: formattedDate,
        yearsAsMember: yearsAsMember,
        currentDiscount: 15,
        eventsParticipated: 0,
        email: userData.email,
        phone: userData.phone || 'Não definido',
        address: userData.address || 'Não definido',
        postalCode: userData.postalCode && userData.city ? `${userData.postalCode} ${userData.city}` : 'Não definido',
        nif: userData.nif || 'Não definido',
        monthlyFee: paymentData?.monthlyFee || 3.00,
        nextPayment: paymentData?.nextPaymentDue ? formatDate(paymentData.nextPaymentDue) : 'Não disponível',
        validity: '31/12/2026',
        status: paymentData?.paymentStatus || (userData.isActive ? 'Ativo' : 'Inativo')
    };

    const benefits = [
        {
            icon: <FaPercentage />,
            title: 'Desconto em Inscrições',
            description: '15% de desconto em todas as inscrições de modalidades para dependentes'
        },
        {
            icon: <FaSwimmingPool />,
            title: 'Acesso Gratuito às Piscinas',
            description: 'Entrada gratuita nas piscinas do clube durante todo o ano'
        },
        {
            icon: <FaTicketAlt />,
            title: 'Prioridade em Eventos',
            description: 'Acesso prioritário e descontos em bilhetes para jogos e eventos do clube'
        }
    ];

    const events = [
        {
            day: '02',
            month: 'FEV',
            title: 'Jantar Anual de Sócios',
            time: '20:00',
            location: 'Salão Nobre do Clube',
            badge: 'exclusive'
        },
        {
            day: '15',
            month: 'FEV',
            title: 'Dia da Família no Pavilhão',
            time: '10:00 - 18:00',
            location: 'Pavilhão Fernando Linhares',
            badge: 'family'
        },
        {
            day: '20',
            month: 'FEV',
            title: 'Assembleia Geral de Sócios',
            time: '19:00',
            location: 'Auditório do Clube',
            badge: 'exclusive'
        }
    ];

    const notifications = [
        {
            icon: <FaCalendarCheck />,
            title: 'Inscrições Abertas',
            message: 'Já estão abertas as inscrições para o Jantar Anual de Sócios.',
            time: 'Há 2 dias'
        },
        {
            icon: <FaTrophy />,
            title: 'Jogo Importante',
            message: 'Não perca o jogo da equipa sénior no próximo sábado.',
            time: 'Há 3 dias'
        }
    ];

    const documents = [
        { name: 'Regulamento Interno', size: '2.4 MB', type: 'PDF' },
        { name: 'Cartão de Sócio', size: '156 KB', type: 'PDF' },
        { name: 'Benefícios 2026', size: '1.1 MB', type: 'PDF' }
    ];

    return (
        <div className="dashboard-wrapper">
            {/* Linked Profile Tabs - shown when there are multiple linked accounts */}
            {linkedUsers.length > 1 && (
                <div className="athlete-tabs">
                    <div className="container athlete-tabs-container">
                        {linkedUsers.map((lu) => (
                            <button
                                key={lu.id}
                                onClick={() => handleLinkedTabClick(lu)}
                                className={`athlete-tab ${currentUserId === lu.id ? 'active' : ''}`}
                            >
                                <i className={
                                    lu.dashboardType === 'atleta' ? 'fas fa-running' :
                                        lu.dashboardType === 'treinador' ? 'fas fa-user-tie' :
                                            'fas fa-id-card'
                                }></i>
                                {`${lu.firstName} ${lu.lastName}`.trim() || `Conta ${lu.id}`}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Profile Header */}
            <section className="profile-header">
                <div className="container">
                    <div className="profile-content">
                        <img
                            src="https://images.unsplash.com/vector-1742875355318-00d715aec3e8?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                            alt={memberData.name}
                            className="profile-avatar"
                        />
                        <div className="profile-info">
                            <h1>{memberData.name}</h1>
                            <div className="profile-meta">
                                <div className="profile-meta-item">
                                    <FaIdCard />
                                    <span>Sócia #{memberData.memberNumber}</span>
                                </div>
                                <div className="profile-meta-item">
                                    <FaCalendarAlt />
                                    <span>Sócia desde {memberData.memberSince}</span>
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
                            <h3>{memberData.yearsAsMember}</h3>
                            <p>Anos de Sócio</p>
                        </div>
                        <div className="stat-card">
                            <h3>{memberData.currentDiscount}%</h3>
                            <p>Desconto Atual</p>
                        </div>
                        <div className="stat-card">
                            <h3>{memberData.eventsParticipated}</h3>
                            <p>Eventos Participados</p>
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
                            {/* Membership Card */}
                            <div className="membership-card">
                                <div className="membership-header">
                                    <div className="membership-logo">
                                        <img src="/CDP_logo.png" alt="CDP" />
                                    </div>
                                </div>
                                <div className="membership-details">
                                    <div className="membership-number">#{memberData.memberNumber}</div>
                                    <div className="membership-info">
                                        <div className="membership-info-item">
                                            <h4>Nome</h4>
                                            <p>{memberData.name}</p>
                                        </div>
                                        <div className="membership-info-item">
                                            <h4>Validade</h4>
                                            <p>{memberData.validity}</p>
                                        </div>
                                        <div className="membership-info-item">
                                            <h4>Desde</h4>
                                            <p>{memberData.registrationDate}</p>
                                        </div>
                                        <div className="membership-info-item">
                                            <h4>Estado</h4>
                                            <p>✓ {memberData.status}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><FaCreditCard /> Estado de Pagamento</h2>
                                    <Link to="#" className="view-all-link">
                                        Ver Histórico <FaArrowRight />
                                    </Link>
                                </div>

                                <div className="payment-summary">
                                    <div className="payment-summary-item">
                                        <p>Quota Mensal</p>
                                        <h3>€{memberData.monthlyFee.toFixed(2)}</h3>
                                    </div>
                                    <div className="payment-summary-item">
                                        <p>Próximo Pagamento</p>
                                        <h3>{memberData.nextPayment}</h3>
                                    </div>
                                </div>

                                {paymentHistory.length > 0 ? (
                                    paymentHistory.map((payment) => (
                                        <div key={payment.id} className="payment-item">
                                            <div className="payment-details">
                                                <div className="payment-icon">
                                                    {payment.status === 'Completed' ? <FaCheck /> : <FaClock />}
                                                </div>
                                                <div className="payment-info">
                                                    <h4>Quota {payment.month}</h4>
                                                    <p>Pago em {formatDate(payment.paymentDate)}</p>
                                                </div>
                                            </div>
                                            <div className="payment-amount">
                                                <h4>€{payment.amount.toFixed(2)}</h4>
                                                <span className={`payment-status status-${payment.status.toLowerCase()}`}>
                                                    {payment.status === 'Completed' ? 'Pago' : payment.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                        <p>Nenhum pagamento registado ainda.</p>
                                    </div>
                                )}
                            </div>

                            {/* Benefits */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><FaGift /> Benefícios Ativos</h2>
                                </div>

                                {benefits.map((benefit, index) => (
                                    <div key={index} className="benefit-item">
                                        <div className="benefit-icon">
                                            {benefit.icon}
                                        </div>
                                        <div className="benefit-content">
                                            <h4>{benefit.title}</h4>
                                            <p>{benefit.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Events */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><FaCalendarAlt /> Eventos para Sócios</h2>
                                    <Link to="#" className="view-all-link">
                                        Ver Todos <FaArrowRight />
                                    </Link>
                                </div>

                                {events.map((event, index) => (
                                    <div key={index} className="event-item">
                                        <div className="event-date">
                                            <span className="day">{event.day}</span>
                                            <span className="month">{event.month}</span>
                                        </div>
                                        <div className="event-details">
                                            <h3>{event.title}</h3>
                                            <p><FaClock /> {event.time}</p>
                                            <p><FaMapMarkerAlt /> {event.location}</p>
                                            <span className={`event-badge badge-${event.badge}`}>
                                                {event.badge === 'exclusive' ? 'Exclusivo Sócios' : 'Atividade Familiar'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div>
                            {/* Quick Actions */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><FaBolt /> Ações Rápidas</h2>
                                </div>

                                <div className="action-buttons">
                                    <Link to="#" className="action-btn action-btn-primary">
                                        <FaCreditCard />
                                        Pagar Quota
                                    </Link>
                                    <Link to="#" className="action-btn">
                                        <FaReceipt />
                                        Ver Recibos
                                    </Link>
                                    <button
                                        className="action-btn"
                                        onClick={() => setIsFamilyModalOpen(true)}
                                        style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                                    >
                                        <FaUserFriends />
                                        Associar Familiar
                                    </button>
                                </div>
                            </div>

                            {/* Notifications */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><FaBell /> Notificações</h2>
                                    <Link to="#" className="view-all-link">
                                        Ver Todas <FaArrowRight />
                                    </Link>
                                </div>

                                {notifications.map((notification, index) => (
                                    <div key={index} className="notification-item">
                                        <div className="notification-icon">
                                            {notification.icon}
                                        </div>
                                        <div className="notification-content">
                                            <h4>{notification.title}</h4>
                                            <p>{notification.message}</p>
                                            <div className="notification-time">{notification.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Personal Information */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><FaUser /> Informações Pessoais</h2>
                                    <button onClick={handleEditProfile} className="view-all-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Editar <FaEdit />
                                    </button>
                                </div>

                                <div className="info-grid">
                                    <div className="info-item">
                                        <p className="info-label">Email</p>
                                        <p className="info-value">{memberData.email}</p>
                                    </div>
                                    <div className="info-item">
                                        <p className="info-label">Telemóvel</p>
                                        <p className="info-value">{memberData.phone}</p>
                                    </div>
                                    <div className="info-item">
                                        <p className="info-label">Morada</p>
                                        <p className="info-value">
                                            {memberData.address}<br />
                                            {memberData.postalCode}
                                        </p>
                                    </div>
                                    <div className="info-item">
                                        <p className="info-label">NIF</p>
                                        <p className="info-value">{memberData.nif}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><FaFolder /> Documentos</h2>
                                </div>

                                {documents.map((doc, index) => (
                                    <div key={index} className="document-item">
                                        <div className="document-info">
                                            <div className="document-icon">
                                                <FaFilePdf />
                                            </div>
                                            <div>
                                                <h4>{doc.name}</h4>
                                                <p>{doc.type} • {doc.size}</p>
                                            </div>
                                        </div>
                                        <Link to="#" className="document-download">
                                            <FaDownload />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={handleCloseModal}
                userData={userData}
                onSave={handleSaveProfile}
            />

            <FamilyAssociationModal
                isOpen={isFamilyModalOpen}
                onClose={() => setIsFamilyModalOpen(false)}
            />
        </div>
    );
};

export default DashboardSocio;
