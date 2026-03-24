import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Filler,
} from 'chart.js';
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import {
    FaMoneyBillWave, FaRegHourglass, FaChartLine,
    FaCalendarAlt, FaTimesCircle, FaExchangeAlt, FaChartBar,
    FaFutbol, FaLayerGroup
} from 'react-icons/fa';
import './FinancialAnalytics.css';

ChartJS.register(
    ArcElement, Tooltip, Legend,
    CategoryScale, LinearScale, BarElement,
    PointElement, LineElement, Title, Filler
);

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const STATUS_COLORS = {
    Completed: '#43e97b',
    Pending: '#feb47b',
    Failed: '#ff7e5f',
};
const STATUS_LABELS = {
    Completed: 'Concluído',
    Pending: 'Pendente',
    Failed: 'Falhado',
};
const METHOD_COLORS = [
    'rgba(30,60,114,0.85)',
    'rgba(37,117,252,0.85)',
    'rgba(106,17,203,0.85)',
    'rgba(0,198,255,0.85)',
];

// ── helpers ──────────────────────────────────────────────────────────────────
const parseMYM = (str) => {
    const [y, m] = str.split('-');
    return { year: y, month: m };
};
const monthLabel = (str, showYear = true) => {
    const { year, month } = parseMYM(str);
    return showYear
        ? `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`
        : MONTH_NAMES[parseInt(month, 10) - 1];
};

// ── common chart option pieces ────────────────────────────────────────────────
const TOOLTIP_BASE = {
    backgroundColor: 'rgba(255,255,255,0.97)',
    titleColor: '#1a202c',
    bodyColor: '#4a5568',
    borderColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    padding: 12,
    boxPadding: 8,
    usePointStyle: true,
};
const AXIS_BASE = {
    grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
    ticks: { font: { size: 11, family: "'Inter', sans-serif" }, color: '#718096' },
};
const LEGEND_BASE = {
    position: 'bottom',
    labels: { padding: 16, usePointStyle: true, font: { size: 12, family: "'Inter', sans-serif" } },
};

// ── FinancialAnalytics ────────────────────────────────────────────────────────
const FinancialAnalytics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [selectedYear, setSelectedYear] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [chartView, setChartView] = useState('bar'); // 'bar' | 'line'

    useEffect(() => { fetchFinancialData(); }, []);

    const fetchFinancialData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5285/api/ClubAnalytics/financial', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setData(res.data);
        } catch (e) {
            console.error(e);
            setError('Erro ao carregar estatísticas financeiras.');
        } finally {
            setLoading(false);
        }
    };

    // ── derived lists ─────────────────────────────────────────────────────────
    const availableYears = useMemo(() => {
        if (!data) return [];
        return [...new Set(data.paymentStatsByMonth.map(m => parseMYM(m.month).year))].sort();
    }, [data]);

    const availableMonths = useMemo(() => {
        if (!data || selectedYear === 'all') return [];
        return data.paymentStatsByMonth
            .filter(m => parseMYM(m.month).year === selectedYear)
            .map(m => parseMYM(m.month).month);
    }, [data, selectedYear]);

    // Reset month when year changes
    const handleYearChange = (y) => {
        setSelectedYear(y);
        setSelectedMonth('all');
    };

    // Filtered paymentStatsByMonth rows
    const filteredStats = useMemo(() => {
        if (!data) return [];
        return data.paymentStatsByMonth.filter(m => {
            const { year, month } = parseMYM(m.month);
            if (selectedYear !== 'all' && year !== selectedYear) return false;
            if (selectedMonth !== 'all' && month !== selectedMonth) return false;
            return true;
        });
    }, [data, selectedYear, selectedMonth]);

    // Summary KPIs over filtered window
    const kpi = useMemo(() => {
        const revenue = filteredStats.reduce((s, m) => s + m.completedAmount, 0);
        const pending = filteredStats.reduce((s, m) => s + m.pendingAmount, 0);
        const failed = filteredStats.reduce((s, m) => s + m.failedAmount, 0);
        const count = filteredStats.reduce((s, m) => s + m.totalCount, 0);
        const months = filteredStats.length;
        const avg = months > 0 ? revenue / months : 0;
        const best = filteredStats.length > 0
            ? filteredStats.reduce((a, b) => b.completedAmount > a.completedAmount ? b : a)
            : null;
        return { revenue, pending, failed, count, avg, best };
    }, [filteredStats]);

    // Cumulative revenue (running total) for filtered window
    const cumulativeAmounts = useMemo(() => {
        let acc = 0;
        return filteredStats.map(m => { acc += m.completedAmount; return acc; });
    }, [filteredStats]);

    if (loading) return <div className="analytics-loading">Carregando análise financeira...</div>;
    if (error) return <div className="analytics-error">{error}</div>;
    if (!data) return null;

    const showYear = selectedYear === 'all';
    const labels = filteredStats.map(m => monthLabel(m.month, showYear));

    // ── chart data ─────────────────────────────────────────────────────────────

    // 1. Pie – payment status (count)
    const statusPieData = {
        labels: data.paymentsByStatus.map(s => STATUS_LABELS[s.status] || s.status),
        datasets: [{
            data: data.paymentsByStatus.map(s => s.count),
            backgroundColor: data.paymentsByStatus.map(s => STATUS_COLORS[s.status] || '#1e3c72'),
            borderWidth: 0, hoverOffset: 15,
        }],
    };

    // 2. Doughnut – revenue by method
    const methodDonutData = {
        labels: data.revenueByMethod.map(m => m.method),
        datasets: [{
            data: data.revenueByMethod.map(m => m.totalAmount),
            backgroundColor: METHOD_COLORS.slice(0, data.revenueByMethod.length),
            borderWidth: 0, hoverOffset: 15,
        }],
    };

    // 3. Bar/Line – monthly revenue (filtered)
    const monthlyRevenueData = {
        labels,
        datasets: [{
            label: 'Receita (€)',
            data: filteredStats.map(m => m.completedAmount),
            backgroundColor: 'rgba(67,233,123,0.75)',
            borderColor: 'rgba(67,233,123,1)',
            borderRadius: 8,
            borderSkipped: false,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(67,233,123,1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
        }],
    };

    // 4. Stacked bar – completed / pending / failed amounts per month
    const stackedStatusData = {
        labels,
        datasets: [
            {
                label: 'Concluído',
                data: filteredStats.map(m => m.completedAmount),
                backgroundColor: 'rgba(67,233,123,0.8)',
                borderRadius: 6,
                borderSkipped: false,
                stack: 'status',
            },
            {
                label: 'Pendente',
                data: filteredStats.map(m => m.pendingAmount),
                backgroundColor: 'rgba(254,180,123,0.85)',
                borderRadius: 6,
                borderSkipped: false,
                stack: 'status',
            },
            {
                label: 'Falhado',
                data: filteredStats.map(m => m.failedAmount),
                backgroundColor: 'rgba(255,126,95,0.85)',
                borderRadius: 6,
                borderSkipped: false,
                stack: 'status',
            },
        ],
    };

    // 5. Bar – payment count per month
    const countBarData = {
        labels,
        datasets: [
            {
                label: 'Concluídos',
                data: filteredStats.map(m => m.completedCount),
                backgroundColor: 'rgba(37,117,252,0.8)',
                borderRadius: 6,
                borderSkipped: false,
                stack: 'count',
            },
            {
                label: 'Pendentes',
                data: filteredStats.map(m => m.pendingCount),
                backgroundColor: 'rgba(254,180,123,0.85)',
                borderRadius: 6,
                borderSkipped: false,
                stack: 'count',
            },
            {
                label: 'Falhados',
                data: filteredStats.map(m => m.failedCount),
                backgroundColor: 'rgba(255,126,95,0.85)',
                borderRadius: 6,
                borderSkipped: false,
                stack: 'count',
            },
        ],
    };

    // 6. Line – cumulative revenue
    const cumulativeData = {
        labels,
        datasets: [{
            label: 'Receita Acumulada (€)',
            data: cumulativeAmounts,
            borderColor: 'rgba(106,17,203,1)',
            backgroundColor: 'rgba(106,17,203,0.08)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgba(106,17,203,1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
        }],
    };

    const SPORT_PALETTE = [
        'rgba(37,117,252,0.82)',
        'rgba(255,126,95,0.82)',
        'rgba(17,153,142,0.82)',
        'rgba(106,17,203,0.82)',
        'rgba(247,151,30,0.82)',
        'rgba(0,198,255,0.82)',
        'rgba(67,233,123,0.82)',
        'rgba(248,87,166,0.82)',
        'rgba(255,210,0,0.82)',
        'rgba(0,114,255,0.82)',
        'rgba(255,74,74,0.82)',
        'rgba(0,212,170,0.82)',
    ];

    // 7. Horizontal Bar – receita por modalidade
    const sportRows = data.revenueBySport ?? [];
    const sportBarData = {
        labels: sportRows.map(s => s.sport),
        datasets: [{
            label: 'Receita (€)',
            data: sportRows.map(s => s.totalAmount),
            backgroundColor: sportRows.map((_, i) => SPORT_PALETTE[i % SPORT_PALETTE.length]),
            borderRadius: 6,
            borderSkipped: false,
        }],
    };

    // 8. Horizontal Bar – receita por escalão (TODOS, sem agrupar)
    const escalaoRows = data.revenueByEscalao ?? [];
    const escalaoBarData = {
        labels: escalaoRows.map(r => r.escalao),
        datasets: [{
            label: 'Receita (€)',
            data: escalaoRows.map(r => r.totalAmount),
            backgroundColor: escalaoRows.map((_, i) => SPORT_PALETTE[i % SPORT_PALETTE.length]),
            borderRadius: 6,
            borderSkipped: false,
        }],
    };
    // ── chart options ──────────────────────────────────────────────────────────
    const pieOpts = (fmtCb) => ({
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: LEGEND_BASE,
            tooltip: { ...TOOLTIP_BASE, displayColors: true, callbacks: { label: fmtCb } },
        },
        animation: { duration: 1500, easing: 'easeOutQuart' },
    });

    const barOpts = (stacked = false, tickFmt = v => '€' + v.toLocaleString('pt-PT'), ttFmt = ctx => ` €${ctx.raw.toFixed(2)}`) => ({
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: stacked ? LEGEND_BASE : { display: false },
            tooltip: { ...TOOLTIP_BASE, callbacks: { label: ttFmt } },
        },
        scales: {
            y: {
                ...AXIS_BASE, beginAtZero: true, stacked,
                ticks: { ...AXIS_BASE.ticks, callback: tickFmt },
            },
            x: { ...AXIS_BASE, grid: { display: false }, stacked },
        },
        animation: { duration: 900, easing: 'easeOutQuart' },
    });

    const lineOpts = (ttFmt) => ({
        responsive: true, maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { ...TOOLTIP_BASE, callbacks: { label: ttFmt } },
        },
        scales: {
            y: {
                ...AXIS_BASE, beginAtZero: true,
                ticks: { ...AXIS_BASE.ticks, callback: v => '€' + v.toLocaleString('pt-PT') },
            },
            x: { ...AXIS_BASE, grid: { display: false } },
        },
        animation: { duration: 900, easing: 'easeOutQuart' },
    });

    const bestLabel = kpi.best ? monthLabel(kpi.best.month) : '—';

    const hBarOpts = (rows = []) => ({
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                ...TOOLTIP_BASE,
                callbacks: {
                    label: ctx => ` €${ctx.raw.toFixed(2)}`,
                    afterLabel: ctx => {
                        const row = rows[ctx.dataIndex];
                        return row ? ` ${row.count} pagamento${row.count !== 1 ? 's' : ''}` : '';
                    },
                },
            },
        },
        scales: {
            x: {
                ...AXIS_BASE,
                ticks: {
                    ...AXIS_BASE.ticks,
                    callback: v => '€' + v.toLocaleString('pt-PT'),
                },
                grid: { color: 'rgba(0,0,0,0.04)' },
            },
            y: {
                ...AXIS_BASE,
                grid: { display: false },
                ticks: {
                    ...AXIS_BASE.ticks,
                    font: { size: 12, family: "'Inter', sans-serif", weight: '500' },
                },
            },
        },
        animation: { duration: 1200, easing: 'easeOutQuart' },
    });

    // Altura dinâmica: 44px por barra + margem
    const BAR_HEIGHT = 44;
    const BAR_MIN = 180;
    const escalaoChartHeight = Math.max(BAR_MIN, escalaoRows.length * BAR_HEIGHT);
    const sportChartHeight = Math.max(BAR_MIN, sportRows.length * BAR_HEIGHT);

    return (
        <div className="financial-analytics-container">

            {/* ── Global overview cards ── */}
            <div className="analytics-overview-grid">
                <div className="analytics-stat-card financial-card">
                    <div className="analytics-stat-icon revenue"><FaMoneyBillWave /></div>
                    <div className="analytics-stat-info">
                        <h3>Receita Total</h3>
                        <p className="analytics-stat-number">€{data.totalRevenue.toFixed(2)}</p>
                    </div>
                </div>
                <div className="analytics-stat-card financial-card">
                    <div className="analytics-stat-icon pending"><FaRegHourglass /></div>
                    <div className="analytics-stat-info">
                        <h3>Valor Pendente</h3>
                        <p className="analytics-stat-number pending-amount">€{data.pendingRevenue.toFixed(2)}</p>
                    </div>
                </div>
                <div className="analytics-stat-card financial-card">
                    <div className="analytics-stat-icon failed"><FaTimesCircle /></div>
                    <div className="analytics-stat-info">
                        <h3>Valor Falhado</h3>
                        <p className="analytics-stat-number failed-amount">€{data.failedRevenue.toFixed(2)}</p>
                    </div>
                </div>
                <div className="analytics-stat-card financial-card">
                    <div className="analytics-stat-icon transactions"><FaExchangeAlt /></div>
                    <div className="analytics-stat-info">
                        <h3>Total de Transações</h3>
                        <p className="analytics-stat-number">{data.totalTransactions}</p>
                    </div>
                </div>
            </div>

            {/* ── Pie / Doughnut row ── */}
            <div className="charts-grid">
                <div className="chart-item">
                    <h3>Estado dos Pagamentos (Qtd)</h3>
                    <div className="chart-wrapper">
                        <Pie
                            data={statusPieData}
                            options={pieOpts(ctx => ` ${ctx.label}: ${ctx.raw} pag.`)}
                        />
                    </div>
                </div>
                <div className="chart-item">
                    <h3>Receita por Método de Pagamento</h3>
                    <div className="chart-wrapper">
                        <Doughnut
                            data={methodDonutData}
                            options={pieOpts(ctx => ` ${ctx.label}: €${ctx.raw.toFixed(2)}`)}
                        />
                    </div>
                </div>
            </div>

            {/* ── Period filter bar ── */}
            <div className="period-filter-bar">
                <div className="period-filter-group">
                    <FaCalendarAlt className="filter-icon" />
                    <label>Ano</label>
                    <select value={selectedYear} onChange={e => handleYearChange(e.target.value)} className="period-select">
                        <option value="all">Todos</option>
                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="period-filter-group">
                    <label>Mês</label>
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="period-select"
                        disabled={selectedYear === 'all'}
                    >
                        <option value="all">Todos</option>
                        {availableMonths.map(m => (
                            <option key={m} value={m}>{MONTH_NAMES[parseInt(m, 10) - 1]}</option>
                        ))}
                    </select>
                </div>

                <div className="chart-type-toggle">
                    <button
                        className={`toggle-btn ${chartView === 'bar' ? 'active' : ''}`}
                        onClick={() => setChartView('bar')}
                        title="Barras"
                    ><FaChartBar /></button>
                    <button
                        className={`toggle-btn ${chartView === 'line' ? 'active' : ''}`}
                        onClick={() => setChartView('line')}
                        title="Linha"
                    ><FaChartLine /></button>
                </div>

                {/* Mini KPIs */}
                <div className="period-kpis">
                    <div className="period-kpi">
                        <span className="period-kpi-label">Receita período</span>
                        <span className="period-kpi-value green">€{kpi.revenue.toFixed(2)}</span>
                    </div>
                    <div className="period-kpi">
                        <span className="period-kpi-label">Média mensal</span>
                        <span className="period-kpi-value">€{kpi.avg.toFixed(2)}</span>
                    </div>
                    <div className="period-kpi">
                        <span className="period-kpi-label">Melhor mês</span>
                        <span className="period-kpi-value blue">{bestLabel}</span>
                    </div>
                    <div className="period-kpi">
                        <span className="period-kpi-label">Transações</span>
                        <span className="period-kpi-value">{kpi.count}</span>
                    </div>
                </div>
            </div>

            {/* ── Chart 1: Monthly revenue bar/line ── */}
            <div className="chart-item full-width">
                <h3>
                    <FaChartLine className="chart-h-icon green" />
                    Evolução de Receita Mensal
                </h3>
                <div className="chart-wrapper bar">
                    {filteredStats.length > 0 ? (
                        chartView === 'bar'
                            ? <Bar data={monthlyRevenueData} options={barOpts(false, v => '€' + v.toLocaleString('pt-PT'), ctx => ` Receita: €${ctx.raw.toFixed(2)}`)} />
                            : <Line data={monthlyRevenueData} options={lineOpts(ctx => ` Receita: €${ctx.raw.toFixed(2)}`)} />
                    ) : <div className="no-data-msg">Sem dados para o período selecionado.</div>}
                </div>
            </div>

            {/* ── Chart 2: Stacked amounts by status ── */}
            <div className="chart-item full-width">
                <h3>
                    <FaChartBar className="chart-h-icon blue" />
                    Valores por Estado (Mensal)
                </h3>
                <div className="chart-wrapper bar">
                    {filteredStats.length > 0
                        ? <Bar data={stackedStatusData} options={barOpts(true, v => '€' + v.toLocaleString('pt-PT'), ctx => ` ${ctx.dataset.label}: €${ctx.raw.toFixed(2)}`)} />
                        : <div className="no-data-msg">Sem dados para o período selecionado.</div>
                    }
                </div>
            </div>

            {/* ── Charts 3 & 4 side by side ── */}
            <div className="charts-grid">
                {/* Count per month */}
                <div className="chart-item">
                    <h3>
                        <FaExchangeAlt className="chart-h-icon orange" />
                        Nº de Pagamentos por Mês
                    </h3>
                    <div className="chart-wrapper bar">
                        {filteredStats.length > 0
                            ? <Bar data={countBarData} options={barOpts(true, v => v, ctx => ` ${ctx.dataset.label}: ${ctx.raw}`)} />
                            : <div className="no-data-msg">Sem dados.</div>
                        }
                    </div>
                </div>

                {/* Cumulative revenue */}
                <div className="chart-item">
                    <h3>
                        <FaChartLine className="chart-h-icon purple" />
                        Receita Acumulada
                    </h3>
                    <div className="chart-wrapper bar">
                        {filteredStats.length > 0
                            ? <Line data={cumulativeData} options={lineOpts(ctx => ` Acumulado: €${ctx.raw.toFixed(2)}`)} />
                            : <div className="no-data-msg">Sem dados.</div>
                        }
                    </div>
                </div>
            </div>

            {(sportRows.length > 0 || escalaoRows.length > 0) && (
                <div className="charts-grid charts-grid--breakdown">

                    {/* Receita por Modalidade */}
                    <div className="chart-item">
                        <h3>
                            <FaFutbol className="chart-h-icon blue" />
                            Receita por Modalidade
                        </h3>
                        <div className="hbar-scroll-container">
                            <div style={{ height: sportChartHeight }}>
                                {sportRows.length > 0
                                    ? <Bar data={sportBarData} options={hBarOpts(sportRows)} />
                                    : <div className="no-data-msg">Sem dados de modalidades.</div>
                                }
                            </div>
                        </div>
                    </div>

                    {/* Receita por Escalão — todos, com scroll se necessário */}
                    <div className="chart-item">
                        <h3>
                            <FaLayerGroup className="chart-h-icon teal" />
                            Receita por Escalão
                            <span className="chart-badge">{escalaoRows.length} escal{escalaoRows.length !== 1 ? 'ões' : 'ão'}</span>
                        </h3>
                        <div className="hbar-scroll-container">
                            <div style={{ height: escalaoChartHeight }}>
                                {escalaoRows.length > 0
                                    ? <Bar data={escalaoBarData} options={hBarOpts(escalaoRows)} />
                                    : <div className="no-data-msg">Sem dados de escalões.</div>
                                }
                            </div>
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
};

export default FinancialAnalytics;