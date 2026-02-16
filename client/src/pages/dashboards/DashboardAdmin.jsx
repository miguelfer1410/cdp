import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaImages, FaBars, FaTimes, FaNewspaper, FaFutbol, FaHandshake, FaSignOutAlt, FaUsers, FaUserFriends, FaCalendarAlt, FaSort } from 'react-icons/fa';
import HeroBannerManager from '../../components/Admin/HeroBannerManager';
import NewsManager from '../../components/Admin/NewsManager';
import SportsManager from '../../components/Admin/SportsManager';
import PartnersManager from '../../components/Admin/PartnersManager';
import TeamsManager from '../../components/Admin/TeamsManager';
import CalendarManager from '../../components/Admin/CalendarManager';
import NavReorderModal from '../../components/Admin/NavReorderModal/NavReorderModal';
import './DashboardAdmin.css';
import PeopleManager from '../../components/Admin/PeopleManager';

const NAV_ITEMS_CONFIG = {
    hero: { id: 'hero', label: 'Banner', icon: <FaImages /> },
    news: { id: 'news', label: 'Notícias', icon: <FaNewspaper /> },
    sports: { id: 'sports', label: 'Modalidades', icon: <FaFutbol /> },
    partners: { id: 'partners', label: 'Parceiros', icon: <FaHandshake /> },
    teams: { id: 'teams', label: 'Equipas', icon: <FaUsers /> },
    people: { id: 'people', label: 'Pessoas', icon: <FaUserFriends /> },
    calendar: { id: 'calendar', label: 'Calendário', icon: <FaCalendarAlt /> }
};

const DEFAULT_NAV_ORDER = ['hero', 'news', 'sports', 'partners', 'teams', 'people', 'calendar'];

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('hero');
    const [loading, setLoading] = useState(true);
    const [navOrder, setNavOrder] = useState(DEFAULT_NAV_ORDER);
    const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        // Load nav order from localStorage
        const savedOrder = localStorage.getItem('adminNavOrder');
        if (savedOrder) {
            try {
                const parsedOrder = JSON.parse(savedOrder);
                // Validate that all default keys exist in saved order (handle new items)
                const missingItems = DEFAULT_NAV_ORDER.filter(item => !parsedOrder.includes(item));
                if (missingItems.length > 0) {
                    setNavOrder([...parsedOrder, ...missingItems]);
                } else {
                    setNavOrder(parsedOrder);
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleNavClick = (tabId) => {
        setActiveTab(tabId);
        setIsSidebarOpen(false);
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
                                onClick={() => setActiveTab(item.id)}
                            >
                                {item.icon} {item.label}
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
