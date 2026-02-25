import React, { useState, useEffect, useCallback } from 'react';
import './PaymentManager.css';
import {
    FaEuroSign, FaCheckCircle, FaExclamationCircle, FaSearch,
    FaChevronLeft, FaChevronRight, FaTimes, FaUndo, FaEllipsisH
} from 'react-icons/fa';

const PaymentManager = () => {
    // Data State
    const [athletes, setAthletes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [sports, setSports] = useState([]);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterTeam, setFilterTeam] = useState('all');
    const [filterSport, setFilterSport] = useState('all');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPaymentStatuses = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5285/api';

            let url = `${apiUrl}/payment/admin/athletes-status?month=${currentMonth}&year=${currentYear}&page=${page}&pageSize=${pageSize}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (filterStatus !== 'all') url += `&status=${filterStatus}`;
            if (filterTeam !== 'all') url += `&teamId=${filterTeam}`;
            if (filterSport !== 'all') url += `&sportId=${filterSport}`;

            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch payment statuses');

            const data = await response.json();
            setAthletes(data.items || []);
            setTotalCount(data.totalCount || 0);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching payments:', error);
            setAthletes([]);
        } finally {
            setLoading(false);
        }
    }, [currentMonth, currentYear, page, pageSize, searchTerm, filterStatus, filterTeam, filterSport]);

    useEffect(() => { fetchPaymentStatuses(); }, [fetchPaymentStatuses]);

    useEffect(() => {
        const fetchFilters = async () => {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5285/api';
            try {
                const [teamsRes, sportsRes] = await Promise.all([
                    fetch(`${apiUrl}/teams`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${apiUrl}/sports`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                if (teamsRes.ok) { const d = await teamsRes.json(); setTeams(Array.isArray(d) ? d : []); }
                if (sportsRes.ok) { const d = await sportsRes.json(); setSports(Array.isArray(d) ? d : []); }
            } catch (error) {
                console.error('Error fetching filters:', error);
            }
        };
        fetchFilters();
    }, []);

    // Reset page when filters or pageSize change
    useEffect(() => { setPage(1); }, [searchTerm, filterStatus, filterTeam, filterSport, currentMonth, currentYear, pageSize]);

    const handleUpdateStatus = async (userId, newStatus) => {
        const actionText = newStatus === 'Completed' ? 'validar' : 'reverter';
        if (!window.confirm(`Tem a certeza que deseja ${actionText} este pagamento?`)) return;
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5285/api';
            const response = await fetch(`${apiUrl}/payment/admin/manual-payment`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, periodMonth: currentMonth, periodYear: currentYear, status: newStatus })
            });
            if (!response.ok) throw new Error('Failed to update payment');
            fetchPaymentStatuses();
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Erro ao atualizar estado de pagamento');
        }
    };

    const getStatusBadge = (status) => {
        const s = status || '';
        switch (s) {
            case 'Paid': case 'Regularizada': case 'Completed':
                return <span className="status-badge paid"><FaCheckCircle /> Pago</span>;
            case 'Pendente': case 'Pending':
                return <span className="status-badge pending"><FaExclamationCircle /> Pendente</span>;
            case 'Unpaid': case 'Failed':
                return <span className="status-badge unpaid"><FaTimes /> Não Pago</span>;
            default:
                return <span className="status-badge">{s}</span>;
        }
    };

    // Smart page numbers with ellipses
    const getPageNumbers = () => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const set = new Set([1, totalPages, page, page - 1, page + 1].filter(p => p >= 1 && p <= totalPages));
        const sorted = [...set].sort((a, b) => a - b);
        const result = [];
        sorted.forEach((p, idx) => {
            if (idx > 0 && p - sorted[idx - 1] > 1) result.push('...');
            result.push(p);
        });
        return result;
    };

    const firstRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const lastRecord = Math.min(page * pageSize, totalCount);

    return (
        <div className="payment-manager">
            <div className="payment-manager-header">
                <div className="header-title">
                    <div className="title-icon"><FaEuroSign /></div>
                    <div>
                        <h2>Gestão de Quotas</h2>
                        <p className="subtitle">Monitorize e gira os pagamentos dos atletas</p>
                    </div>
                </div>
                <div className="header-period">
                    <div className="period-selector">
                        <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} className="admin-select month-select">
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('pt-PT', { month: 'long' })}</option>
                            ))}
                        </select>
                        <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} className="admin-select year-select">
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="filters-container">
                <div className="search-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}><FaTimes /></button>
                    )}
                </div>
                <div className="filters-grid">
                    <div className="filter-item">
                        <label>Estado</label>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">Todos os Estados</option>
                            <option value="Paid">Pago</option>
                            <option value="Pending">Pendente</option>
                            <option value="Unpaid">Não Pago</option>
                        </select>
                    </div>
                    <div className="filter-item">
                        <label>Equipa</label>
                        <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}>
                            <option value="all">Todas as Equipas</option>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                    </div>
                    <div className="filter-item">
                        <label>Modalidade</label>
                        <select value={filterSport} onChange={(e) => setFilterSport(e.target.value)}>
                            <option value="all">Todas as Modalidades</option>
                            {sports.map(sport => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-stats">
                <span className="records-info">
                    {totalCount === 0
                        ? 'Nenhum registo encontrado'
                        : <>A mostrar <strong>{firstRecord}–{lastRecord}</strong> de <strong>{totalCount}</strong> registos</>
                    }
                </span>
                <div className="page-size-selector">
                    <label>Por página:</label>
                    <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value))} className="page-size-select">
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Equipa / Modalidade</th>
                            <th>Tipo de Quota</th>
                            <th>Período</th>
                            <th>Valor</th>
                            <th>Estado</th>
                            <th className="actions-cell">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="skeleton-row">
                                    <td colSpan="7"><div className="skeleton-bar"></div></td>
                                </tr>
                            ))
                        ) : (athletes?.length || 0) > 0 ? (
                            athletes.map((athlete) => (
                                <tr key={athlete.userId} className={`row-status-${(athlete.status || '').toLowerCase()}`}>
                                    <td data-label="Nome">
                                        <span className="athlete-name">{athlete.name}</span>
                                    </td>
                                    <td data-label="Equipa / Modalidade">
                                        <div className="team-sport-cell">
                                            <span className="team-name">{athlete.team}</span>
                                            <span className="sport-name">{athlete.sport}</span>
                                        </div>
                                    </td>
                                    <td data-label="Tipo Quota">{athlete.paymentPreference === 'Annual' ? 'Anual' : 'Mensal'}</td>
                                    <td data-label="Período">{athlete.currentPeriod}</td>
                                    <td data-label="Valor" className="amount-cell">{(athlete.amount || 0).toFixed(2)}€</td>
                                    <td data-label="Estado">{getStatusBadge(athlete.status)}</td>
                                    <td className="actions-cell">
                                        <div className="action-buttons">
                                            {athlete.status !== 'Paid' && athlete.status !== 'Regularizada' && athlete.status !== 'Completed' ? (
                                                <button className="btn-action btn-validate" title="Validar Pagamento" onClick={() => handleUpdateStatus(athlete.userId, "Completed")}>
                                                    <FaCheckCircle /> <span>Validar</span>
                                                </button>
                                            ) : (
                                                <button className="btn-action btn-revert" title="Reverter Pagamento" onClick={() => handleUpdateStatus(athlete.userId, "Unpaid")}>
                                                    <FaUndo /> <span>Reverter</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="empty-message">
                                    <div className="empty-state">
                                        <FaTimes className="empty-icon" />
                                        <p>Nenhum registo encontrado para os filtros selecionados.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn pagination-btn--icon"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        title="Primeira página"
                    >
                        <FaChevronLeft /><FaChevronLeft />
                    </button>
                    <button
                        className="pagination-btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <FaChevronLeft /> Anterior
                    </button>

                    <div className="page-numbers">
                        {getPageNumbers().map((p, idx) =>
                            p === '...'
                                ? <span key={`el-${idx}`} className="page-ellipsis"><FaEllipsisH /></span>
                                : <button key={p} className={`page-number ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                        )}
                    </div>

                    <button
                        className="pagination-btn"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Próximo <FaChevronRight />
                    </button>
                    <button
                        className="pagination-btn pagination-btn--icon"
                        onClick={() => setPage(totalPages)}
                        disabled={page === totalPages}
                        title="Última página"
                    >
                        <FaChevronRight /><FaChevronRight />
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentManager;
