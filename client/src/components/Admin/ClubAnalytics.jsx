import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { FaUsers, FaShieldAlt, FaTrophy, FaUserTie } from 'react-icons/fa';
import './ClubAnalytics.css';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

const ClubAnalytics = () => {
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

    // Chart Data Configurations
    const athletesPerSportCharts = {
        labels: data.athletesPerSport.map(s => s.sportName),
        datasets: [{
            data: data.athletesPerSport.map(s => s.count),
            backgroundColor: COLORS,
            borderWidth: 0,
            hoverOffset: 20
        }]
    };

    const ageGroupChart = {
        labels: ['Menores (<18)', 'Adultos (>=18)'],
        datasets: [{
            data: [data.ageGroups.minors, data.ageGroups.adults],
            backgroundColor: ['#ff7e5f', '#1e3c72'],
            borderWidth: 0,
            hoverOffset: 15
        }]
    };

    const genderChart = {
        labels: data.genderDistribution.map(g => g.gender === 'Male' ? 'Masculino' : g.gender === 'Female' ? 'Feminino' : 'Misto'),
        datasets: [{
            data: data.genderDistribution.map(g => g.count),
            backgroundColor: ['#1e3c72', '#ff7e5f', '#43e97b'],
            borderWidth: 0,
            hoverOffset: 15
        }]
    };

    const userTypologyChart = {
        labels: ['Sócios (Não Atletas)', 'Registados (Não Sócios)'],
        datasets: [{
            data: [data.overview.membersNotAthletes, data.overview.registeredNotMembers],
            backgroundColor: ['#6a11cb', '#feb47b'],
            borderWidth: 0,
            hoverOffset: 15
        }]
    };

    const coachesPerSportChart = {
        labels: data.coachesPerSport.map(s => s.sportName),
        datasets: [{
            label: 'Número de Treinadores',
            data: data.coachesPerSport.map(s => s.count),
            backgroundColor: 'rgba(30, 60, 114, 0.8)',
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 40
        }]
    };

    const teamsChartData = {
        labels: filteredTeams.map(t => t.teamName),
        datasets: [{
            label: 'Número de Atletas',
            data: filteredTeams.map(t => t.count),
            backgroundColor: 'rgba(37, 117, 252, 0.8)',
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 30
        }]
    };

    const teamBarOptions = {
        ...barOptions,
        indexAxis: 'y', // Horizontal bars
        scales: {
            ...barOptions.scales,
            y: {
                ...barOptions.scales.y,
                ticks: {
                    ...barOptions.scales.y.ticks,
                    autoSkip: false // Show all labels
                }
            }
        }
    };

    // Dynamic height calculation for teams chart
    const teamChartHeight = Math.max(400, filteredTeams.length * 40) + 'px';

    return (
        <div className="club-analytics-container">
            <header className="analytics-header">
                <h2>Análise do Clube</h2>
                <p>Estatísticas em tempo real sobre atletas, equipas e staff.</p>
            </header>

            <div className="analytics-overview-grid">
                <div className="analytics-stat-card">
                    <div className="analytics-stat-icon athletes"><FaUsers /></div>
                    <div className="analytics-stat-info">
                        <h3>Total Atletas</h3>
                        <p className="analytics-stat-number">{data.overview.totalAthletes}</p>
                    </div>
                </div>
                <div className="analytics-stat-card">
                    <div className="analytics-stat-icon teams"><FaShieldAlt /></div>
                    <div className="analytics-stat-info">
                        <h3>Equipas Ativas</h3>
                        <p className="analytics-stat-number">{data.overview.totalTeams}</p>
                    </div>
                </div>
                <div className="analytics-stat-card">
                    <div className="analytics-stat-icon sports"><FaTrophy /></div>
                    <div className="analytics-stat-info">
                        <h3>Modalidades</h3>
                        <p className="analytics-stat-number">{data.overview.totalSports}</p>
                    </div>
                </div>
                <div className="analytics-stat-card">
                    <div className="analytics-stat-icon coaches"><FaUserTie /></div>
                    <div className="analytics-stat-info">
                        <h3>Treinadores</h3>
                        <p className="analytics-stat-number">{data.overview.totalCoaches}</p>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-item">
                    <h3>Atletas por Modalidade</h3>
                    <div className="chart-wrapper">
                        <Pie data={athletesPerSportCharts} options={chartOptions} />
                    </div>
                </div>
                <div className="chart-item">
                    <h3>Distribuição por Idade</h3>
                    <div className="chart-wrapper">
                        <Pie data={ageGroupChart} options={chartOptions} />
                    </div>
                </div>
                <div className="chart-item">
                    <h3>Divisões (Género)</h3>
                    <div className="chart-wrapper">
                        <Pie data={genderChart} options={chartOptions} />
                    </div>
                </div>
                <div className="chart-item">
                    <h3>Tipologia de Utilizadores</h3>
                    <div className="chart-wrapper">
                        <Pie data={userTypologyChart} options={chartOptions} />
                    </div>
                </div>
                <div className="chart-item full-width">
                    <h3>Treinadores por Modalidade</h3>
                    <div className="chart-wrapper bar">
                        <Bar data={coachesPerSportChart} options={barOptions} />
                    </div>
                </div>
                <div className="chart-item full-width">
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
                    <div className="chart-wrapper bar teams-flexible-chart" style={{ height: teamChartHeight }}>
                        {filteredTeams.length > 0 ? (
                            <Bar data={teamsChartData} options={teamBarOptions} />
                        ) : (
                            <div className="no-data-msg">Nenhuma equipa encontrada com estes filtros.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubAnalytics;
