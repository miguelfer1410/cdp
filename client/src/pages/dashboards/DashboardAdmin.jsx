import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaImages, FaNewspaper, FaFutbol, FaHandshake, FaSignOutAlt, FaUsers, FaUserFriends } from 'react-icons/fa';
import HeroBannerManager from '../../components/Admin/HeroBannerManager';
import NewsManager from '../../components/Admin/NewsManager';
import SportsManager from '../../components/Admin/SportsManager';
import PartnersManager from '../../components/Admin/PartnersManager';
import TeamsManager from '../../components/Admin/TeamsManager';
import './DashboardAdmin.css';
import PeopleManager from '../../components/Admin/PeopleManager';

const DashboardAdmin = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('hero');
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="spinner"></div>
                <p>A carregar...</p>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <h2>Admin Dashboard</h2>
                    <p>Gestão do Clube</p>
                </div>

                <nav className="admin-nav">
                    <button
                        className={`admin-nav-item ${activeTab === 'hero' ? 'active' : ''}`}
                        onClick={() => setActiveTab('hero')}
                    >
                        <FaImages /> Banner
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'news' ? 'active' : ''}`}
                        onClick={() => setActiveTab('news')}
                    >
                        <FaNewspaper /> Notícias
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'sports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('sports')}
                    >
                        <FaFutbol /> Modalidades
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'partners' ? 'active' : ''}`}
                        onClick={() => setActiveTab('partners')}
                    >
                        <FaHandshake /> Parceiros
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'teams' ? 'active' : ''}`}
                        onClick={() => setActiveTab('teams')}
                    >
                        <FaUsers /> Equipas
                    </button>
                    <button
                        className={`admin-nav-item ${activeTab === 'people' ? 'active' : ''}`}
                        onClick={() => setActiveTab('people')}
                    >
                        <FaUserFriends /> Pessoas
                    </button>
                </nav>

                <button className="admin-logout" onClick={handleLogout}>
                    <FaSignOutAlt /> Sair
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'hero' && <HeroBannerManager />}
                {activeTab === 'news' && <NewsManager />}
                {activeTab === 'sports' && <SportsManager />}
                {activeTab === 'partners' && <PartnersManager />}
                {activeTab === 'teams' && <TeamsManager />}
                {activeTab === 'people' && <PeopleManager />}
            </div>
        </div>
    );
};

export default DashboardAdmin;
