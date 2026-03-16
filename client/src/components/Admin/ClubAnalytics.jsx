import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LabelList
} from 'recharts';
import { FaUsers, FaShieldAlt, FaTrophy, FaUserTie, FaMale, FaFemale } from 'react-icons/fa';
import FinancialAnalytics from './FinancialAnalytics';
import './ClubAnalytics.css';

// ─── Color Palette ───────────────────────────────────────────────────────────
const PALETTE = {
    blue: ['#1e3c72', '#2a5298', '#2575fc', '#4a90e2'],
    coral: ['#ff7e5f', '#feb47b', '#ff6b6b', '#ffa07a'],
    green: ['#11998e', '#38ef7d', '#43e97b', '#56ab2f'],
    purple: ['#6a11cb', '#8b5cf6', '#a855f7', '#c084fc'],
    teal: ['#0072ff', '#00c6ff', '#36d1dc', '#5b86e5'],
    yellow: ['#f7971e', '#ffd200', '#f6d365', '#fda085'],
};

const SPORT_COLORS = [
    '#2575fc', '#ff7e5f', '#11998e', '#6a11cb', '#f7971e',
    '#00c6ff', '#ff6b6b', '#43e97b', '#8b5cf6', '#ffd200'
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, accentColor }) => {
    if (active && payload && payload.length) {
        const item = payload[0];
        const color = accentColor || item.fill || item.color || '#2575fc';
        return (
            <div className="ct-tooltip">
                <div className="ct-tooltip-bar" style={{ background: color }} />
                <div className="ct-tooltip-content">
                    <span className="ct-tooltip-label">{item.name || label || item.payload?.name}</span>
                    <span className="ct-tooltip-value" style={{ color }}>{item.value}</span>
                </div>
            </div>
        );
    }
    return null;
};

// ─── Custom Pie Tooltip ───────────────────────────────────────────────────────
const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const item = payload[0];
        return (
            <div className="ct-tooltip">
                <div className="ct-tooltip-bar" style={{ background: item.payload.fill }} />
                <div className="ct-tooltip-content">
                    <span className="ct-tooltip-label">{item.name}</span>
                    <span className="ct-tooltip-value" style={{ color: item.payload.fill }}>{item.value}</span>
                </div>
            </div>
        );
    }
    return null;
};

// ─── Custom Legend ────────────────────────────────────────────────────────────
const CustomLegend = ({ payload, total }) => (
    <div className="ca-legend">
        {payload.map((entry, i) => {
            const pct = total ? Math.round((entry.payload.value / total) * 100) : null;
            return (
                <div key={i} className="ca-legend-item">
                    <span className="ca-legend-dot" style={{ background: entry.color }} />
                    <span className="ca-legend-label">{entry.value}</span>
                    {pct !== null && <span className="ca-legend-pct" style={{ color: entry.color }}>{pct}%</span>}
                </div>
            );
        })}
    </div>
);

// ─── Donut Center Label (CSS overlay — reliable in Recharts) ─────────────────
const DonutCenterOverlay = ({ total, label }) => (
    <div className="donut-center-overlay">
        <span className="donut-center-value">{total}</span>
        <span className="donut-center-label">{label}</span>
    </div>
);

// ─── SVG Gradient Defs ─────────────────────────────────────────────────────────
const GradientDefs = () => (
    <defs>
        <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2575fc" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#1e3c72" stopOpacity={0.7} />
        </linearGradient>
        <linearGradient id="gradCoral" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff7e5f" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#feb47b" stopOpacity={0.7} />
        </linearGradient>
        <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#43e97b" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#11998e" stopOpacity={0.7} />
        </linearGradient>
        <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#6a11cb" stopOpacity={0.7} />
        </linearGradient>
        <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00c6ff" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#0072ff" stopOpacity={0.7} />
        </linearGradient>
        {/* Horizontal gradients for horizontal bar chart */}
        <linearGradient id="gradBlueH" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e3c72" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#2575fc" stopOpacity={0.9} />
        </linearGradient>
    </defs>
);

// ─── Sport Badge ───────────────────────────────────────────────────────────────
const ChartBadge = ({ text, color }) => (
    <span className="ca-chart-badge" style={{ background: color + '20', color }}>{text}</span>
);

// ─────────────────────────────────────────────────────────────────────────────
const ClubAnalytics = () => {
    const [activeTab, setActiveTab] = useState('club');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sportFilter, setSportFilter] = useState('all');
    const [teamSearch, setTeamSearch] = useState('');

    useEffect(() => { fetchAnalytics(); }, []);

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

    if (loading) return (
        <div className="analytics-loading">
            <div className="ca-spinner" />
            <p>A carregar análise do clube…</p>
        </div>
    );
    if (error) return <div className="analytics-error">{error}</div>;
    if (!data) return null;

    // ── Data prep ──────────────────────────────────────────────────────────────
    const filteredTeams = data.athletesPerTeam.filter(team => {
        const matchesSport = sportFilter === 'all' || team.teamName.toLowerCase().startsWith(sportFilter.toLowerCase());
        const matchesSearch = team.teamName.toLowerCase().includes(teamSearch.toLowerCase());
        return matchesSport && matchesSearch;
    });

    const uniqueSports = [...new Set(data.athletesPerSport.map(s => s.sportName))];

    const athletesPerSportData = data.athletesPerSport.map((s, i) => ({
        name: s.sportName,
        value: s.count,
        fill: SPORT_COLORS[i % SPORT_COLORS.length]
    }));

    const totalAthletesBySport = athletesPerSportData.reduce((acc, cur) => acc + cur.value, 0);

    const ageGroupData = [
        { subject: 'Menores\n(<18)', value: data.ageGroups.minors, fullMark: Math.max(data.ageGroups.minors, data.ageGroups.adults) + 5 },
        { subject: 'Adultos\n(≥18)', value: data.ageGroups.adults, fullMark: Math.max(data.ageGroups.minors, data.ageGroups.adults) + 5 },
    ];

    const genderData = data.genderDistribution.map((g, i) => ({
        name: g.gender === 'Male' ? 'Masculino' : g.gender === 'Female' ? 'Feminino' : 'Misto',
        value: g.count,
        fill: [PALETTE.blue[0], PALETTE.coral[0], PALETTE.green[0]][i % 3]
    }));
    const totalGender = genderData.reduce((a, c) => a + c.value, 0);

    const userTypologyData = [
        { name: 'Sócios', value: data.overview.totalMembers, fill: PALETTE.purple[0] },
        { name: 'Não Sócios', value: data.overview.registeredNotMembers, fill: PALETTE.yellow[0] }
    ];
    const totalTypology = userTypologyData.reduce((a, c) => a + c.value, 0);

    const coachesPerSportData = data.coachesPerSport.map(s => ({
        name: s.sportName,
        count: s.count
    }));

    const teamsChartData = filteredTeams.map(t => ({
        name: t.teamName,
        count: t.count
    }));

    const teamChartHeight = Math.max(400, filteredTeams.length * 44);

    // ─────────────────────────────────────────────────────────────────────────
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
                    {/* ── KPI Cards ─────────────────────────────────────────── */}
                    <div className="analytics-overview-grid">
                        {[
                            { icon: <FaUsers />, label: 'Total Atletas', value: data.overview.totalAthletes, cls: 'athletes', accent: PALETTE.blue[2] },
                            { icon: <FaShieldAlt />, label: 'Equipas Ativas', value: data.overview.totalTeams, cls: 'teams', accent: PALETTE.teal[1] },
                            { icon: <FaTrophy />, label: 'Modalidades', value: data.overview.totalSports, cls: 'sports', accent: PALETTE.coral[0] },
                            { icon: <FaUserTie />, label: 'Treinadores', value: data.overview.totalCoaches, cls: 'coaches', accent: PALETTE.teal[0] },
                        ].map((card, i) => (
                            <div
                                key={i}
                                className="analytics-stat-card"
                                style={{ animationDelay: `${(i + 1) * 100}ms` }}
                            >
                                <div className="analytics-stat-icon" style={{ background: card.accent + '20', color: card.accent }}>
                                    {card.icon}
                                </div>
                                <div className="analytics-stat-info">
                                    <h3>{card.label}</h3>
                                    <p className="analytics-stat-number" style={{ color: card.accent }}>{card.value}</p>
                                </div>
                                <div className="ca-card-accent" style={{ background: card.accent }} />
                            </div>
                        ))}
                    </div>

                    {/* ── Charts Grid ───────────────────────────────────────── */}
                    <div className="charts-grid">

                        {/* 1. Atletas por Modalidade — Donut */}
                        <div className="chart-item" style={{ animationDelay: '500ms' }}>
                            <ChartBadge text="Modalidade" color="#2575fc" />
                            <h3>Atletas por Modalidade</h3>
                            <div className="chart-wrapper donut-wrapper">
                                <div className="donut-chart-container">
                                    <DonutCenterOverlay total={totalAthletesBySport} label="ATLETAS" />
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                            <Pie
                                                data={athletesPerSportData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="value"
                                                animationBegin={400}
                                                animationDuration={1200}
                                            >
                                                {athletesPerSportData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomPieTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <CustomLegend payload={athletesPerSportData.map(d => ({ value: d.name, color: d.fill, payload: d }))} total={totalAthletesBySport} />
                            </div>
                        </div>

                        {/* 2. Distribuição por Idade — Horizontal BarChart */}
                        <div className="chart-item" style={{ animationDelay: '600ms' }}>
                            <ChartBadge text="Idade" color="#11998e" />
                            <h3>Distribuição por Idade</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={290}>
                                    <BarChart
                                        data={[
                                            { name: 'Menores (<18)', count: data.ageGroups.minors },
                                            { name: 'Adultos (≥18)', count: data.ageGroups.adults },
                                        ]}
                                        layout="vertical"
                                        margin={{ top: 10, right: 60, left: 10, bottom: 10 }}
                                    >
                                        <GradientDefs />
                                        <defs>
                                            <linearGradient id="gradGreenH" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#11998e" stopOpacity={0.85} />
                                                <stop offset="100%" stopColor="#43e97b" stopOpacity={0.9} />
                                            </linearGradient>
                                            <linearGradient id="gradTealH" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#0072ff" stopOpacity={0.85} />
                                                <stop offset="100%" stopColor="#00c6ff" stopOpacity={0.9} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                        <XAxis
                                            type="number"
                                            tick={{ fill: '#a0aec0', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={110}
                                            tick={{ fill: '#4a5568', fontSize: 13, fontWeight: 600 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip accentColor="#11998e" />} cursor={{ fill: 'rgba(67,233,123,0.06)', radius: 8 }} />
                                        <Bar
                                            dataKey="count"
                                            name="Atletas"
                                            radius={[0, 10, 10, 0]}
                                            barSize={40}
                                            animationBegin={600}
                                            animationDuration={1200}
                                        >
                                            <Cell fill="url(#gradGreenH)" />
                                            <Cell fill="url(#gradTealH)" />
                                            <LabelList
                                                dataKey="count"
                                                position="right"
                                                style={{ fill: '#11998e', fontSize: 14, fontWeight: 700 }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 3. Género — Donut */}
                        <div className="chart-item" style={{ animationDelay: '700ms' }}>
                            <ChartBadge text="Género" color="#ff7e5f" />
                            <h3>Divisões por Género</h3>
                            <div className="chart-wrapper donut-wrapper">
                                <div className="donut-chart-container">
                                    <DonutCenterOverlay total={totalGender} label="TOTAL" />
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                            <Pie
                                                data={genderData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={4}
                                                dataKey="value"
                                                animationBegin={600}
                                                animationDuration={1200}
                                            >
                                                {genderData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.fill} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomPieTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <CustomLegend payload={genderData.map(d => ({ value: d.name, color: d.fill, payload: d }))} total={totalGender} />
                            </div>
                        </div>

                        {/* 4. Tipologia — Donut */}
                        <div className="chart-item" style={{ animationDelay: '800ms' }}>
                            <ChartBadge text="Utilizadores" color="#6a11cb" />
                            <h3>Tipologia de Utilizadores</h3>
                            <div className="chart-wrapper donut-wrapper">
                                <div className="donut-chart-container">
                                    <DonutCenterOverlay total={totalTypology} label="USERS" />
                                    <ResponsiveContainer width="100%" height={260}>
                                        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                            <Pie
                                                data={userTypologyData}
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={100}
                                                innerRadius={70}
                                                paddingAngle={4}
                                                dataKey="value"
                                                animationBegin={800}
                                                animationDuration={1200}
                                            >
                                                {userTypologyData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.fill} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomPieTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <CustomLegend payload={userTypologyData.map(d => ({ value: d.name, color: d.fill, payload: d }))} total={totalTypology} />
                            </div>
                        </div>

                        {/* 5. Treinadores por Modalidade — Bar (vertical) */}
                        <div className="chart-item full-width" style={{ animationDelay: '900ms' }}>
                            <ChartBadge text="Treinadores" color="#0072ff" />
                            <h3>Treinadores por Modalidade</h3>
                            <div className="chart-wrapper bar">
                                <ResponsiveContainer width="100%" height={380}>
                                    <BarChart
                                        data={coachesPerSportData}
                                        margin={{ top: 24, right: 30, left: 10, bottom: 8 }}
                                    >
                                        <GradientDefs />
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: '#4a5568', fontSize: 13, fontWeight: 500 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fill: '#a0aec0', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip content={<CustomTooltip accentColor="#2575fc" />} cursor={{ fill: 'rgba(37,117,252,0.06)', radius: 8 }} />
                                        <Bar
                                            dataKey="count"
                                            name="Treinadores"
                                            fill="url(#gradBlue)"
                                            radius={[10, 10, 0, 0]}
                                            barSize={44}
                                            animationBegin={900}
                                            animationDuration={1200}
                                        >
                                            <LabelList
                                                dataKey="count"
                                                position="top"
                                                style={{ fill: '#2575fc', fontSize: 13, fontWeight: 700 }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 6. Equipas por Atletas — Horizontal Bar */}
                        <div className="chart-item full-width" style={{ animationDelay: '1000ms' }}>
                            <div className="chart-header-with-filters">
                                <div>
                                    <ChartBadge text="Equipas" color="#ff7e5f" />
                                    <h3>Equipas por N.º de Atletas</h3>
                                </div>
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
                                        placeholder="Pesquisar equipa…"
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                        className="analytics-filter-input"
                                    />
                                </div>
                            </div>
                            <div className="chart-wrapper bar teams-flexible-chart" style={{ height: teamChartHeight, minHeight: '400px' }}>
                                {filteredTeams.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={teamsChartData}
                                            layout="vertical"
                                            margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                                        >
                                            <GradientDefs />
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                            <XAxis
                                                type="number"
                                                tick={{ fill: '#a0aec0', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                allowDecimals={false}
                                            />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={160}
                                                tick={{ fill: '#4a5568', fontSize: 12, fontWeight: 500 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <Tooltip
                                                content={<CustomTooltip accentColor="#ff7e5f" />}
                                                cursor={{ fill: 'rgba(255,126,95,0.06)', radius: 8 }}
                                            />
                                            <Bar
                                                dataKey="count"
                                                name="Atletas"
                                                fill="url(#gradBlueH)"
                                                radius={[0, 10, 10, 0]}
                                                barSize={28}
                                                animationBegin={1000}
                                                animationDuration={1200}
                                            >
                                                <LabelList
                                                    dataKey="count"
                                                    position="right"
                                                    style={{ fill: '#2575fc', fontSize: 12, fontWeight: 700 }}
                                                />
                                            </Bar>
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
