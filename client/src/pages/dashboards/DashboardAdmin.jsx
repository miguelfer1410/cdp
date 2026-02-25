import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaImages, FaBars, FaTimes, FaNewspaper, FaFutbol, FaHandshake, FaSignOutAlt, FaUsers, FaUserFriends, FaCalendarAlt, FaSort, FaEuroSign, FaBell, FaChartLine } from 'react-icons/fa';
import HeroBannerManager from '../../components/Admin/HeroBannerManager';
import NewsManager from '../../components/Admin/NewsManager';
import SportsManager from '../../components/Admin/SportsManager';
import PartnersManager from '../../components/Admin/PartnersManager';
import TeamsManager from '../../components/Admin/TeamsManager';
import CalendarManager from '../../components/Admin/CalendarManager';
import NavReorderModal from '../../components/Admin/NavReorderModal/NavReorderModal';
import './DashboardAdmin.css';
import PeopleManager from '../../components/Admin/PeopleManager';
import FeeManager from '../../components/Admin/FeeManager';
import PaymentManager from '../../components/Admin/PaymentManager';
import FamilyAssociationsManager from '../../components/Admin/FamilyAssociationsManager';
import EscalaoRequestsManager from '../../components/Admin/EscalaoRequestsManager';
import ClubAnalytics from '../../components/Admin/ClubAnalytics';

const NAV_ITEMS_CONFIG = {
    hero: { id: 'hero', label: 'Banner', icon: <FaImages /> },
    news: { id: 'news', label: 'Notícias', icon: <FaNewspaper /> },
    sports: { id: 'sports', label: 'Modalidades', icon: <FaFutbol /> },
    partners: { id: 'partners', label: 'Parceiros', icon: <FaHandshake /> },
    teams: { id: 'teams', label: 'Equipas', icon: <FaUsers /> },
    people: { id: 'people', label: 'Pessoas', icon: <FaUserFriends /> },
    //calendar: { id: 'calendar', label: 'Calendário', icon: <FaCalendarAlt /> },
    fees: { id: 'fees', label: 'Config. Quotas', icon: <FaEuroSign /> },
    payments: { id: 'payments', label: 'Pagamentos', icon: <FaEuroSign /> },
    requests: { id: 'requests', label: 'Requisições', icon: <FaBell /> },
    analytics: { id: 'analytics', label: 'Análise', icon: <FaChartLine /> }
};

const DEFAULT_NAV_ORDER = ['hero', 'news', 'sports', 'partners', 'teams', 'people'/*, 'calendar'*/, 'fees', 'payments', 'requests', 'analytics'];

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(() => {
        // Try to get active tab from sessionStorage first
        const savedTab = sessionStorage.getItem('adminActiveTab');
        if (savedTab && DEFAULT_NAV_ORDER.includes(savedTab)) {
            return savedTab;
        }
        return DEFAULT_NAV_ORDER[0];
    });
    const [loading, setLoading] = useState(true);
    const [navOrder, setNavOrder] = useState(DEFAULT_NAV_ORDER);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [requestSubTab, setRequestSubTab] = useState('family'); // 'family' or 'escalao'

    useEffect(() => {
        // Load nav order from localStorage
        const savedOrder = localStorage.getItem('adminNavOrder');
        if (savedOrder) {
            try {
                const parsedOrder = JSON.parse(savedOrder);
                // Validate that all default keys exist in saved order (handle new items)
                const missingItems = DEFAULT_NAV_ORDER.filter(item => !parsedOrder.includes(item));
                let finalOrder = parsedOrder;

                if (missingItems.length > 0) {
                    finalOrder = [...parsedOrder, ...missingItems];
                }

                setNavOrder(finalOrder);

                // Only set default active tab from order if NO session storage exists
                // This ensures we respect the user's dashboard entry point preference
                // BUT if they are just refreshing, we keep them where they were
                if (!sessionStorage.getItem('adminActiveTab') && finalOrder.length > 0) {
                    setActiveTab(finalOrder[0]);
                }
            } catch (e) {
                console.error('Error parsing nav order:', e);
            }
        }
    }, []);

    useEffect(() => {
        // Verify admin access
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Decode token to check role
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log(payload)
            if (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] !== "Admin") {
                alert('Acesso negado. Apenas administradores podem aceder a esta página.');
                navigate('/');
                return;
            }
            setLoading(false);
        } catch (error) {
            console.error('Error decoding token:', error);
            navigate('/login');
        }
    }, [navigate]);

    const [notifications, setNotifications] = useState({ totalPendingRequests: 0 });

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/admin/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('adminActiveTab'); // Clear session tab on logout
        navigate('/login');
    };

    const handleNavClick = (tabId) => {
        setActiveTab(tabId);
        sessionStorage.setItem('adminActiveTab', tabId); // Save active tab to session
        setIsSidebarOpen(false);
        if (tabId === 'requests') {
            // Refetch notifications when clicking requests to update badge if they processed something
            setTimeout(fetchNotifications, 1000);
        }
    };

    const handleSaveNavOrder = (newOrder) => {
        const orderIds = newOrder.map(item => item.id);
        setNavOrder(orderIds);
        localStorage.setItem('adminNavOrder', JSON.stringify(orderIds));
    };

    const getNavItems = () => {
        return navOrder.map(key => NAV_ITEMS_CONFIG[key]).filter(Boolean); // filter Boolean guards against removed keys
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="spinner"></div>
                <p>A carregar...</p>
            </div>
        );
    }

    return (
        <div className={`admin-dashboard ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            {/* NOVO: Header Mobile */}
            <div className="mobile-header">
                <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                    {isSidebarOpen ? <FaTimes /> : <FaBars />}
                </button>
                <h2>Admin</h2>
            </div>

            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            <div className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
                <div className="admin-sidebar-header">
                    <h2>Admin Dashboard</h2>
                    <p>Gestão do Clube</p>
                </div>

                <nav className="admin-nav">
                    {navOrder.map(key => {
                        const item = NAV_ITEMS_CONFIG[key];
                        if (!item) return null;
                        return (
                            <button
                                key={item.id}
                                className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => handleNavClick(item.id)}
                            >
                                <div className="nav-item-icon-wrapper">
                                    {item.icon}
                                    {item.id === 'requests' && notifications.totalPendingRequests > 0 && (
                                        <span className="sidebar-badge"></span>
                                    )}
                                </div>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="admin-sidebar-footer">
                    <button
                        className="admin-reorder-btn"
                        onClick={() => setIsReorderModalOpen(true)}
                        title="Organizar Menu"
                    >
                        <FaSort /> Organizar
                    </button>
                    <button className="admin-logout" onClick={handleLogout}>
                        <FaSignOutAlt /> Sair
                    </button>
                </div>
            </div>

            <div className="admin-content">
                {activeTab === 'hero' && <HeroBannerManager />}
                {activeTab === 'news' && <NewsManager />}
                {activeTab === 'sports' && <SportsManager />}
                {activeTab === 'partners' && <PartnersManager />}
                {activeTab === 'teams' && <TeamsManager />}
                {activeTab === 'people' && <PeopleManager />}
                {activeTab === 'calendar' && <CalendarManager />}
                {activeTab === 'fees' && <FeeManager />}
                {activeTab === 'payments' && <PaymentManager />}
                {activeTab === 'analytics' && <ClubAnalytics />}
                {activeTab === 'requests' && (
                    <div className="requests-section">
                        <div className="admin-sub-tabs">
                            <button
                                className={`sub-tab-btn ${requestSubTab === 'family' ? 'active' : ''}`}
                                onClick={() => setRequestSubTab('family')}
                            >
                                <FaUserFriends /> Associação Familiar
                            </button>
                            <button
                                className={`sub-tab-btn ${requestSubTab === 'escalao' ? 'active' : ''}`}
                                onClick={() => setRequestSubTab('escalao')}
                            >
                                <FaSort /> Pedidos de Escalão
                            </button>
                        </div>
                        <div className="sub-tab-content">
                            {requestSubTab === 'family' ? <FamilyAssociationsManager /> : <EscalaoRequestsManager />}
                        </div>
                    </div>
                )}
            </div>

            <NavReorderModal
                isOpen={isReorderModalOpen}
                onClose={() => setIsReorderModalOpen(false)}
                items={getNavItems()}
                onSave={handleSaveNavOrder}
            />
        </div>
    );
};

export default DashboardAdmin;
