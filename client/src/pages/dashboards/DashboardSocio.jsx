import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    FaIdCard,
    FaCalendarAlt,
    FaCreditCard,
    FaGift,
    FaPercentage,
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
    FaArrowRight,
    FaUserFriends,
    FaExclamationCircle,
    FaChevronDown,
    FaChevronUp
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
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const [paymentHistory, setPaymentHistory] = useState([]);
    const [memberQuota, setMemberQuota] = useState(null);
    const [quotaBreakdown, setQuotaBreakdown] = useState([]);
    const [appliedDiscounts, setAppliedDiscounts] = useState([]);
    const [overdueMonths, setOverdueMonths] = useState([]);
    const [totalDue, setTotalDue] = useState(null);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isOverdueDropdownOpen, setIsOverdueDropdownOpen] = useState(false);
    const [startingPayment, setStartingPayment] = useState(false);
    const [paymentToast, setPaymentToast] = useState(null); // 'success' | 'cancelled' | null

    // Linked profiles — refreshed from the API on every mount so newly-accepted
    // family association requests become visible without forcing a re-login.
    const [linkedUsers, setLinkedUsers] = useState(() => {
        try {
            const stored = localStorage.getItem('linkedUsers');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [currentUserId, setCurrentUserId] = useState(() => parseInt(localStorage.getItem('userId')) || null);

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

    const handleLinkedTabClick = async (lu) => {
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

                const dashboardRoutes = {
                    atleta: '/dashboard-atleta',
                    treinador: '/dashboard-treinador',
                    socio: '/dashboard-socio',
                    admin: '/dashboard-admin',
                    user: '/dashboard-socio'
                };
                const type = lu.dashboardType?.toLowerCase() || 'socio';
                const route = dashboardRoutes[type] || '/dashboard-socio';

                if (route !== '/dashboard-socio') {
                    navigate(route);
                    window.location.reload();
                } else {
                    setCurrentUserId(data.id);
                    window.location.reload();
                }
            } else {
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
                    setCurrentUserId(lu.id);
                }
            }
        } catch (err) {
            console.error('Error switching user:', err);
            localStorage.setItem('userId', lu.id);
            setCurrentUserId(lu.id);
        }
    };

    // Start Stripe Checkout for quota payment
    const handleStartPayment = async () => {
        setStartingPayment(true);
        try {
            const token = localStorage.getItem('token');
            const url = `http://localhost:5285/api/payment/reference?userId=${currentUserId}`;
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
                        setQuotaBreakdown(quotaData.breakdown || []);
                        setAppliedDiscounts(quotaData.discountsApplied || []);
                        setOverdueMonths(quotaData.overdueMonths || []);
                        setTotalDue(quotaData.totalDue ?? null);
                        setPaymentData(quotaData);
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
        eventsParticipated: 0,
        email: getDisplayEmail(userData.email),
        phone: userData.phone || 'Não definido',
        address: userData.address || 'Não definido',
        postalCode: userData.postalCode && userData.city ? `${userData.postalCode} ${userData.city}` : 'Não definido',
        nif: userData.nif || 'Não definido',
        monthlyFee: paymentData?.monthlyFee || 0,
        nextPayment: paymentData?.nextPeriodMonth
            ? (() => { const M = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']; return `${M[paymentData.nextPeriodMonth - 1]} ${paymentData.nextPeriodYear}`; })()
            : (paymentData?.nextPeriodYear ? `${paymentData.nextPeriodYear}` : 'Não disponível'),
        validity: '31/12/2026',
        status: paymentData?.paymentStatus || (userData.isActive ? 'Ativo' : 'Inativo')
    };

    const documents = [
        { name: 'Regulamento Interno', size: '2.4 MB', type: 'PDF' },
        { name: 'Cartão de Sócio', size: '156 KB', type: 'PDF' },
    ];

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
                                    <button className="view-all-link-socio" onClick={() => setIsHistoryModalOpen(true)}>
                                        Ver Histórico <FaArrowRight />
                                    </button>
                                </div>

                                <div className="payment-summary-new">
                                    <div className="payment-summary-main">
                                        <div className="payment-summary-item-new large">
                                            <p>Total a Pagar</p>
                                            <h3 className={totalDue > 0 || overdueMonths.length > 0 ? 'text-danger' : 'text-success'}>
                                                {totalDue !== null ? `€${Number(totalDue).toFixed(2)}` : (overdueMonths.length > 0 ? `€${(overdueMonths.reduce((s, m) => s + m.amount, 0) + (memberQuota || 0)).toFixed(2)}` : '€0.00')}
                                            </h3>
                                            <span className="total-due-explanation">
                                                {overdueMonths.length > 0
                                                    ? `Quota atual + ${overdueMonths.length} ${overdueMonths.length === 1 ? 'mês em atraso' : 'meses em atraso'}`
                                                    : 'Quota do mês atual'}
                                            </span>
                                        </div>
                                        <div className="payment-summary-details">
                                            <div className="payment-summary-item-new">
                                                <p>Quota Mensal</p>
                                                <span>{memberQuota !== null ? `€${Number(memberQuota).toFixed(2)}` : '—'}</span>
                                            </div>
                                            <div className="payment-summary-item-new">
                                                <p>Próximo Pagamento</p>
                                                <span>{memberData.nextPayment}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {overdueMonths && overdueMonths.length > 0 && (
                                        <div className="overdue-dropdown-container">
                                            <button
                                                className={`overdue-dropdown-header ${isOverdueDropdownOpen ? 'active' : ''}`}
                                                onClick={() => setIsOverdueDropdownOpen(!isOverdueDropdownOpen)}
                                            >
                                                <div className="header-info">
                                                    <FaExclamationCircle className="icon-error" />
                                                    <span>{overdueMonths.length} {overdueMonths.length === 1 ? 'Quota em Atraso' : 'Quotas em Atraso'}</span>
                                                </div>
                                                <div className="header-amount">
                                                    <strong>€{overdueMonths.reduce((s, m) => s + m.amount, 0).toFixed(2)}</strong>
                                                    {isOverdueDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                                                </div>
                                            </button>

                                            {isOverdueDropdownOpen && (
                                                <div className="overdue-dropdown-content">
                                                    <div className="overdue-list-scrollable">
                                                        {overdueMonths.map((m, i) => {
                                                            const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                                                            return (
                                                                <div key={i} className="overdue-month-item">
                                                                    <span>{MONTHS[m.periodMonth - 1]} {m.periodYear}</span>
                                                                    <strong>€{m.amount.toFixed(2)}</strong>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {quotaBreakdown.some(item => item.isDiscount || item.amount < 0) && (
                                        <div className="discounts-applied-container">
                                            <div className="discounts-divider"></div>
                                            <h4 className="discounts-title">Benefícios e Descontos Aplicados</h4>
                                            <div className="discounts-list">
                                                {quotaBreakdown.filter(item => item.isDiscount || item.amount < 0).map((discount, idx) => (
                                                    <div key={idx} className="discount-tag">
                                                        <div className="discount-label-area">
                                                            <FaPercentage className="discount-icon-small" />
                                                            <span>{discount.label}</span>
                                                        </div>
                                                        <strong className="discount-value">{discount.amount.toFixed(2)} €</strong>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Benefits */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><FaGift /> Benefícios Ativos</h2>
                                </div>

                            </div>

                            {/* Events */}
                            <div className="dashboard-card">
                                <div className="dashboard-card-header">
                                    <h2><FaCalendarAlt /> Eventos para Sócios</h2>
                                    <Link to="#" className="view-all-link">
                                        Ver Todos <FaArrowRight />
                                    </Link>
                                </div>

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
                                    {(paymentData?.status !== 'Regularizada' && totalDue > 0) && (
                                        <>
                                            <div className="stripe-payment-methods" style={{ marginBottom: '4px' }}>
                                                <span className="stripe-methods-label">Métodos aceites:</span>
                                                <div className="stripe-methods-icons">
                                                    <span className="stripe-method-badge">💳 Cartão</span>
                                                    <span className="stripe-method-badge">🏦 Multibanco</span>
                                                    <span className="stripe-method-badge">📱 MBWay</span>
                                                </div>
                                            </div>
                                            {/*
                                            <button
                                                onClick={handleStartPayment}
                                                disabled={startingPayment}
                                                className="action-btn action-btn-primary stripe-pay-btn"
                                                style={{ width: '100%', justifyContent: 'center' }}
                                            >
                                                {startingPayment ? 'A processar...' : `🔒 Pagar Quota (${Number(totalDue || 0).toFixed(2)} €)`}
                                            </button>
                                             */}
                                        </>
                                    )}
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
