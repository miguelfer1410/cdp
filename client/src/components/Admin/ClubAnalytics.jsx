import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FaUsers, FaShieldAlt, FaTrophy, FaUserTie } from 'react-icons/fa';
import FinancialAnalytics from './FinancialAnalytics';
import './ClubAnalytics.css';

const ClubAnalytics = () => {
    const [activeTab, setActiveTab] = useState('club');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [sportFilter, setSportFilter] = useState('all');
    const [teamSearch, setTeamSearch] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5285/api/ClubAnalytics', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError('Erro ao carregar estatísticas do clube.');
            setLoading(false);
        }
    };

    if (loading) return <div className="analytics-loading">Carregando análise do clube...</div>;
    if (error) return <div className="analytics-error">{error}</div>;
    if (!data) return null;

    // Filter logic for teams
    const filteredTeams = data.athletesPerTeam.filter(team => {
        const matchesSport = sportFilter === 'all' || team.teamName.toLowerCase().startsWith(sportFilter.toLowerCase());
        const matchesSearch = team.teamName.toLowerCase().includes(teamSearch.toLowerCase());
        return matchesSport && matchesSearch;
    });

    // Extract unique sports for the filter dropdown
    const uniqueSports = [...new Set(data.athletesPerSport.map(s => s.sportName))];

    // Professional Color Palette
    const COLORS = [
        'rgba(30, 60, 114, 0.85)',   // Deep Blue
        'rgba(37, 117, 252, 0.85)',  // Bright Blue
        'rgba(255, 126, 95, 0.85)',  // Coral
        'rgba(0, 114, 255, 0.85)',   // Azure
        'rgba(106, 17, 203, 0.85)',  // Purple
        'rgba(251, 194, 235, 0.85)', // Pink
        'rgba(67, 233, 123, 0.85)',  // Green
        'rgba(255, 236, 179, 0.85)', // Pale Yellow
        'rgba(0, 198, 255, 0.85)',   // Cyan
        'rgba(56, 249, 215, 0.85)'   // Mint
    ];

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif",
                        weight: '500'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1a202c',
                bodyColor: '#4a5568',
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: true,
                boxPadding: 8,
                usePointStyle: true,
                callbacks: {
                    label: function (context) {
                        return ` ${context.label}: ${context.raw}`;
                    }
                }
            }
        },
        animation: {
            duration: 2000,
            easing: 'easeOutQuart'
        }
    };

    const barOptions = {
        ...chartOptions,
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: true,
                    drawBorder: false,
                    color: 'rgba(0, 0, 0, 0.05)'
                },
                ticks: {
                    font: { size: 11 }
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: { size: 11 }
                }
            }
        }
    };

    // Chart Data Configurations for Recharts
    const athletesPerSportCharts = data.athletesPerSport.map(s => ({
        name: s.sportName,
        value: s.count
    }));

    const ageGroupChart = [
        { name: 'Menores (<18)', value: data.ageGroups.minors },
        { name: 'Adultos (>=18)', value: data.ageGroups.adults }
    ];

    const genderChart = data.genderDistribution.map(g => ({
        name: g.gender === 'Male' ? 'Masculino' : g.gender === 'Female' ? 'Feminino' : 'Misto',
        value: g.count
    }));

    const userTypologyChart = [
        { name: 'Sócios', value: data.overview.totalMembers },
        { name: 'Registados (Não Sócios)', value: data.overview.registeredNotMembers }
    ];

    const coachesPerSportChart = data.coachesPerSport.map(s => ({
        name: s.sportName,
        count: s.count
    }));

    const teamsChartData = filteredTeams.map(t => ({
        name: t.teamName,
        count: t.count
    }));

    // Custom Tooltip for Recharts PieCharts
    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                    <p style={{ margin: 0 }}>{`${payload[0].name} : ${payload[0].value}`}</p>
                </div>
            );
        }
        return null;
    };

    // Dynamic height calculation for teams chart
    const teamChartHeight = Math.max(400, filteredTeams.length * 40) + 'px';

    return (
        <div className="club-analytics-container">
            <header className="analytics-header">
                <h2>Análise do Clube</h2>
                <p>Estatísticas em tempo real sobre atletas, equipas, e finanças.</p>

                <div className="analytics-tabs-container">
                    <button
                        className={`analytics-tab-btn ${activeTab === 'club' ? 'active' : ''}`}
                        onClick={() => setActiveTab('club')}
                    >
                        Gestão de Clube
                    </button>
                    <button
                        className={`analytics-tab-btn ${activeTab === 'financial' ? 'active' : ''}`}
                        onClick={() => setActiveTab('financial')}
                    >
                        Gestão Financeira
                    </button>
                </div>
            </header>

            {activeTab === 'club' ? (
                <>
                    <div className="analytics-overview-grid">
                        <div className="analytics-stat-card" style={{ animationDelay: '100ms' }}>
                            <div className="analytics-stat-icon athletes"><FaUsers /></div>
                            <div className="analytics-stat-info">
                                <h3>Total Atletas</h3>
                                <p className="analytics-stat-number">{data.overview.totalAthletes}</p>
                            </div>
                        </div>
                        <div className="analytics-stat-card" style={{ animationDelay: '200ms' }}>
                            <div className="analytics-stat-icon teams"><FaShieldAlt /></div>
                            <div className="analytics-stat-info">
                                <h3>Equipas Ativas</h3>
                                <p className="analytics-stat-number">{data.overview.totalTeams}</p>
                            </div>
                        </div>
                        <div className="analytics-stat-card" style={{ animationDelay: '300ms' }}>
                            <div className="analytics-stat-icon sports"><FaTrophy /></div>
                            <div className="analytics-stat-info">
                                <h3>Modalidades</h3>
                                <p className="analytics-stat-number">{data.overview.totalSports}</p>
                            </div>
                        </div>
                        <div className="analytics-stat-card" style={{ animationDelay: '400ms' }}>
                            <div className="analytics-stat-icon coaches"><FaUserTie /></div>
                            <div className="analytics-stat-info">
                                <h3>Treinadores</h3>
                                <p className="analytics-stat-number">{data.overview.totalCoaches}</p>
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        <div className="chart-item" style={{ animationDelay: '500ms' }}>
                            <h3>Atletas por Modalidade</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={athletesPerSportCharts}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={5}
                                            dataKey="value"
                                            isAnimationActive={true}
                                            animationBegin={500}
                                            animationDuration={1500}
                                        >
                                            {athletesPerSportCharts.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="chart-item" style={{ animationDelay: '600ms' }}>
                            <h3>Distribuição por Idade</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={ageGroupChart}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            dataKey="value"
                                            isAnimationActive={true}
                                            animationBegin={600}
                                            animationDuration={1500}
                                        >
                                            <Cell fill="#ff7e5f" />
                                            <Cell fill="#1e3c72" />
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="chart-item" style={{ animationDelay: '700ms' }}>
                            <h3>Divisões (Género)</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={genderChart}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={90}
                                            dataKey="value"
                                            isAnimationActive={true}
                                            animationBegin={700}
                                            animationDuration={1500}
                                        >
                                            <Cell fill="#1e3c72" />
                                            <Cell fill="#ff7e5f" />
                                            <Cell fill="#43e97b" />
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="chart-item" style={{ animationDelay: '800ms' }}>
                            <h3>Tipologia de Utilizadores</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={userTypologyChart}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            dataKey="value"
                                            isAnimationActive={true}
                                            animationBegin={800}
                                            animationDuration={1500}
                                        >
                                            <Cell fill="#6a11cb" />
                                            <Cell fill="#feb47b" />
                                        </Pie>
                                        <Tooltip content={<CustomPieTooltip />} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="chart-item full-width" style={{ animationDelay: '900ms' }}>
                            <h3>Treinadores por Modalidade</h3>
                            <div className="chart-wrapper bar">
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={coachesPerSportChart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                        <Legend />
                                        <Bar dataKey="count" name="Número de Treinadores" fill="rgba(30, 60, 114, 0.8)" radius={[8, 8, 0, 0]} barSize={40} isAnimationActive={true} animationBegin={900} animationDuration={1500} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="chart-item full-width" style={{ animationDelay: '1000ms' }}>
                            <div className="chart-header-with-filters">
                                <h3>Equipas por N.º de Atletas</h3>
                                <div className="chart-filters">
                                    <select
                                        value={sportFilter}
                                        onChange={(e) => setSportFilter(e.target.value)}
                                        className="analytics-filter-select"
                                    >
                                        <option value="all">Todas as Modalidades</option>
                                        {uniqueSports.map(sport => (
                                            <option key={sport} value={sport}>{sport}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Pesquisar equipa..."
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                        className="analytics-filter-input"
                                    />
                                </div>
                            </div>
                            <div className="chart-wrapper bar teams-flexible-chart" style={{ height: teamChartHeight, minHeight: '400px' }}>
                                {filteredTeams.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={teamsChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                                            <Legend />
                                            <Bar dataKey="count" name="Número de Atletas" fill="rgba(37, 117, 252, 0.8)" radius={[0, 8, 8, 0]} barSize={30} isAnimationActive={true} animationBegin={1000} animationDuration={1500} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="no-data-msg">Nenhuma equipa encontrada com estes filtros.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <FinancialAnalytics />
            )}
        </div>
    );
};

export default ClubAnalytics;
