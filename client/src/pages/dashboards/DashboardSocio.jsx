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
    FaUserFriends,
    FaExclamationCircle
} from 'react-icons/fa';
import EditProfileModal from '../../components/EditProfileModal/EditProfileModal';
import BecomeMember from '../../components/BecomeMember/BecomeMember';
import FamilyAssociationModal from '../../components/FamilyAssociationModal/FamilyAssociationModal';
import DocumentsModal from '../../components/DocumentsModal/DocumentsModal';
import MembershipCard from '../../components/MembershipCard/MembershipCard';
import './DashboardSocio.css';
import PaymentHistorySocio from '../../components/PaymentHistorySocio/PaymentHistorySocio';


const DashboardSocio = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [memberQuota, setMemberQuota] = useState(null);
    const [overdueMonths, setOverdueMonths] = useState([]);
    const [totalDue, setTotalDue] = useState(null);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);


    // Linked profiles — refreshed from the API on every mount so newly-accepted
    // family association requests become visible without forcing a re-login.
    const [linkedUsers, setLinkedUsers] = useState(() => {
        try {
            const stored = localStorage.getItem('linkedUsers');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [currentUserId, setCurrentUserId] = useState(() => parseInt(localStorage.getItem('userId')) || null);

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

    const handleLinkedTabClick = (lu) => {
        const dashboardRoutes = {
            atleta: '/dashboard-atleta',
            treinador: '/dashboard-treinador',
            socio: '/dashboard-socio',
            admin: '/dashboard-admin',
            user: '/dashboard-socio'
        };
        const type = lu.dashboardType?.toLowerCase() || 'socio';
        const route = dashboardRoutes[type] || '/dashboard-socio';
        localStorage.setItem('userId', lu.id);
        if (route !== '/dashboard-socio') {
            navigate(route);
        } else {
            setCurrentUserId(lu.id); // ← fica na mesma página mas recarrega dados
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    navigate('/login');
                    return;
                }

                setLoading(true);
                setUserData(null);

                const userResponse = await fetch(`http://localhost:5285/api/users/${currentUserId}`, {
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

                const data = await userResponse.json();

                // ← normalizar: UserDetailResponse tem memberProfile aninhado
                const statusMap = { 0: 'Pending', 1: 'Active', 2: 'Suspended', 3: 'Cancelled' };
                const userData = {
                    ...data,
                    membershipStatus: statusMap[data.memberProfile?.membershipStatus] ?? 'Pending',
                    memberSince: data.memberProfile?.memberSince ?? null,
                };
                setUserData(userData);

                console.log(userData);

                if (userData.membershipStatus === 'Active') {
                    // Fetch quota (includes overdue detection)
                    const quotaResponse = await fetch(`http://localhost:5285/api/payment/quota?userId=${currentUserId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (quotaResponse.ok) {
                        const quotaData = await quotaResponse.json();
                        setMemberQuota(quotaData.amount);
                        setOverdueMonths(quotaData.overdueMonths || []);
                        setTotalDue(quotaData.totalDue ?? null);
                    } else {
                        // Fallback: fetch fees to determine correct quota (minor vs adult)
                        const feesResponse = await fetch('http://localhost:5285/api/fees', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (feesResponse.ok) {
                            const feesData = await feesResponse.json();
                            let isMinor = false;
                            if (data.birthDate) {
                                const today = new Date();
                                const birth = new Date(data.birthDate);
                                let age = today.getFullYear() - birth.getFullYear();
                                const m = today.getMonth() - birth.getMonth();
                                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                                isMinor = age < 18;
                            }
                            const quota = isMinor
                                ? (feesData.minorMemberFee || feesData.memberFee || 0)
                                : (feesData.memberFee || 0);
                            setMemberQuota(quota);
                        }
                    }

                    // Fetch payment history
                    const historyResponse = await fetch('http://localhost:5285/api/payment/history', {
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
    }, [navigate, currentUserId]);

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

    const getDisplayEmail = (email) => {
        if (!email) return 'N/A';
        const atIndex = email.lastIndexOf('@');
        if (atIndex === -1) return email;
        const localPart = email.substring(0, atIndex);
        const domain = email.substring(atIndex);
        const plusIndex = localPart.indexOf('+');
        if (plusIndex !== -1) {
            return localPart.substring(0, plusIndex) + domain;
        }
        return email;
    };

    const memberData = {
        name: `${userData.firstName} ${userData.lastName}`,
        memberNumber: userData.memberProfile?.membershipNumber || userData.id.toString().padStart(4, '0'),
        memberSince: memberSinceYear.toString(),
        registrationDate: formattedDate,
        yearsAsMember: yearsAsMember,
        currentDiscount: 15,
        eventsParticipated: 0,
        email: getDisplayEmail(userData.email),
        phone: userData.phone || 'Não definido',
        address: userData.address || 'Não definido',
        postalCode: userData.postalCode && userData.city ? `${userData.postalCode} ${userData.city}` : 'Não definido',
        nif: userData.nif || 'Não definido',
        monthlyFee: paymentData?.monthlyFee || 0,
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
                                    <span>Sócio #{memberData.memberNumber}</span>
                                </div>
                                <div className="profile-meta-item">
                                    <FaCalendarAlt />
                                    <span>Sócio desde {memberData.memberSince}</span>
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
                            <MembershipCard
                                memberNumber={memberData.memberNumber}
                                name={memberData.name}
                                memberSince={memberData.memberSince}
                                validity={memberData.validity}
                                status={memberData.status}
                                cardType="socio"
                                userId={currentUserId}
                            />

                            {/* Payment Status */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><FaCreditCard /> Estado de Pagamento</h2>
                                    <button className="view-all-link" onClick={() => setIsHistoryModalOpen(true)}>
                                        Ver Histórico <FaArrowRight />
                                    </button>
                                </div>

                                <div className="payment-summary">
                                    <div className="payment-summary-item">
                                        <p>Quota Mensal</p>
                                        <h3>{memberQuota !== null ? `€${Number(memberQuota).toFixed(2)}` : '—'}</h3>
                                    </div>
                                    <div className="payment-summary-item">
                                        <p>Próximo Pagamento</p>
                                        <h3>{memberData.nextPayment}</h3>
                                    </div>
                                </div>

                                {/* Overdue banner */}
                                {overdueMonths && overdueMonths.length > 0 && (
                                    <div style={{
                                        margin: '12px 16px',
                                        padding: '14px 16px',
                                        background: '#fff5f5',
                                        border: '1px solid #fca5a5',
                                        borderRadius: '10px',
                                        color: '#c0392b'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '8px', fontSize: '0.95rem' }}>
                                            <FaExclamationCircle /> Quotas em Atraso
                                        </div>
                                        <ul style={{ margin: 0, padding: '0 0 0 20px', fontSize: '0.875rem', lineHeight: '1.8' }}>
                                            {overdueMonths.map((m, i) => {
                                                const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                                                return (
                                                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '260px' }}>
                                                        <span>{MONTHS[m.periodMonth - 1]} {m.periodYear}</span>
                                                        <strong>{m.amount.toFixed(2)} €</strong>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                        <div style={{ marginTop: '10px', fontSize: '0.875rem', fontWeight: '700', borderTop: '1px solid #fca5a5', paddingTop: '8px' }}>
                                            Total a pagar: <span>{(totalDue ?? overdueMonths.reduce((s, m2) => s + m2.amount, 0) + (memberQuota || 0)).toFixed(2)} €</span>
                                            <span style={{ fontWeight: '400', fontSize: '0.8rem', color: '#888', marginLeft: '6px' }}>(meses em atraso + mês atual)</span>
                                        </div>
                                    </div>
                                )}

                                {paymentHistory.length > 0 ? (
                                    paymentHistory.map((payment) => (
                                        <div key={payment.id} className="payment-item">
                                            <div className="payment-details">
                                                <div className="payment-icon">
                                                    {payment.status === 'Completed' ? <FaCheck /> : <FaClock />}
                                                </div>
                                                <div className="payment-info">
                                                    <h4>Quota {payment.periodMonth
                                                        ? (() => { const M = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']; return `${M[payment.periodMonth - 1]} ${payment.periodYear}`; })()
                                                        : (payment.month || '')}
                                                    </h4>
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
                                ) : overdueMonths.length > 0 ? null : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                        <p>Nenhum pagamento registado ainda.</p>
                                    </div>
                                )}

                                {/* Overdue entries in history */}
                                {overdueMonths && overdueMonths.length > 0 && (
                                    <>
                                        {overdueMonths.map((m, i) => {
                                            const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                                            return (
                                                <div key={`overdue-${i}`} className="payment-item" style={{ background: '#fff5f5', borderLeft: '3px solid #f87171' }}>
                                                    <div className="payment-details">
                                                        <div className="payment-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                                                            <FaExclamationCircle />
                                                        </div>
                                                        <div className="payment-info">
                                                            <h4>Quota {MONTHS[m.periodMonth - 1]} {m.periodYear}</h4>
                                                            <p style={{ color: '#dc2626', fontSize: '0.8rem' }}>Em atraso</p>
                                                        </div>
                                                    </div>
                                                    <div className="payment-amount">
                                                        <h4 style={{ color: '#c0392b' }}>€{m.amount.toFixed(2)}</h4>
                                                        <span className="payment-status" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '12px', padding: '2px 10px', fontSize: '0.78rem', fontWeight: '600' }}>
                                                            Em Atraso
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </>
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
                                    <button
                                        className="view-all-link"
                                        onClick={() => setIsDocumentsModalOpen(true)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
                                    >
                                        Ver Todos <FaArrowRight />
                                    </button>
                                </div>

                                {documents.map((doc, index) => {
                                    const isMembershipCard = doc.name === 'Cartão de Sócio';
                                    const isRegulation = doc.name === 'Regulamento Interno';
                                    const downloadUrl = isMembershipCard
                                        ? `http://localhost:5285/api/membershipcard/download?userId=${currentUserId}`
                                        : isRegulation
                                            ? 'http://localhost:5285/docs/regulamento_cdpovoa.pdf'
                                            : '#';

                                    const handleDownload = async (e) => {
                                        if (downloadUrl === '#') return;
                                        if (!isMembershipCard) return; // Static links work without fetch

                                        e.preventDefault();
                                        const token = localStorage.getItem('token');
                                        try {
                                            const response = await fetch(downloadUrl, {
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (response.ok) {
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `Cartao_Socio_${currentUserId}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                a.remove();
                                            }
                                        } catch (err) {
                                            console.error('Download failed', err);
                                        }
                                    };

                                    return (
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
                                            <a
                                                href={downloadUrl}
                                                target={!isMembershipCard ? "_blank" : undefined}
                                                rel={!isMembershipCard ? "noopener noreferrer" : undefined}
                                                className="document-download"
                                                onClick={handleDownload}
                                            >
                                                <FaDownload />
                                            </a>
                                        </div>
                                    );
                                })}
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

            <DocumentsModal
                isOpen={isDocumentsModalOpen}
                onClose={() => setIsDocumentsModalOpen(false)}
                userId={currentUserId}
            />
            <PaymentHistorySocio
                isOpen={isHistoryModalOpen}
                onClose={() => setIsHistoryModalOpen(false)}
                userId={currentUserId}
                overdueMonths={overdueMonths}
            />
        </div>
    );
};

export default DashboardSocio;
