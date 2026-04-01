import React, { useState, useEffect, useCallback } from 'react';
import './PaymentManager.css';
import {
    FaEuroSign, FaCheckCircle, FaExclamationCircle, FaSearch,
    FaChevronLeft, FaChevronRight, FaTimes, FaUndo, FaEllipsisH, FaUser,
    FaEdit, FaCheck, FaExclamationTriangle, FaUserTimes, FaFileExcel,
    FaCalendarAlt, FaListUl, FaBolt
} from 'react-icons/fa';
import PaymentHistorySocio from '../PaymentHistorySocio/PaymentHistorySocio';

const PaymentManager = () => {
    // Data State
    const [athletes, setAthletes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [teams, setTeams] = useState([]);
    const [sports, setSports] = useState([]);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
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

    // Detailed Profile Modal
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    // Month Selection Modal State
    const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
    const [selectedAthlete, setSelectedAthlete] = useState(null);
    const [modalYear, setModalYear] = useState(new Date().getFullYear());
    const [selectedPeriods, setSelectedPeriods] = useState([]);
    const [selectedInscriptions, setSelectedInscriptions] = useState([]);
    const [monthlyQuotas, setMonthlyQuotas] = useState({});

    // Membership number inline editing
    const [editingMembershipId, setEditingMembershipId] = useState(null);
    const [editingMembershipValue, setEditingMembershipValue] = useState('');
    const [membershipDuplicates, setMembershipDuplicates] = useState({});

    // Quota inline editing
    const [editingQuotaUserId, setEditingQuotaUserId] = useState(null);
    const [editingQuotaValue, setEditingQuotaValue] = useState('');

    const fetchPaymentStatuses = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5285/api';

            let url = `${apiUrl}/payment/admin/athletes-status?month=${currentMonth}&year=${currentYear}&page=${page}&pageSize=${pageSize}`;
            if (debouncedSearchTerm) url += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
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
    }, [currentMonth, currentYear, page, pageSize, debouncedSearchTerm, filterStatus, filterTeam, filterSport]);

    useEffect(() => { fetchPaymentStatuses(); }, [fetchPaymentStatuses]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

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

    // Pre-fill modal with payment history when opened or when modal year changes
    useEffect(() => {
        if (!isMonthModalOpen || !selectedAthlete) return;

        const fetchHistoryForModal = async () => {
            try {
                const token = localStorage.getItem('token');
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5285/api';

                const [resHistory, resQuotas] = await Promise.all([
                    fetch(`${apiUrl}/payment/history?userId=${selectedAthlete.userId}&year=${modalYear}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${apiUrl}/payment/admin/user-year-quotas?userId=${selectedAthlete.userId}&year=${modalYear}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const data = await resHistory.json();
                const quotasData = await resQuotas.json();

                if (quotasData && quotasData.quotas) {
                    setMonthlyQuotas(quotasData.quotas);
                } else {
                    setMonthlyQuotas({});
                }

                const historyPayments = data.payments || [];
                const isAnnual = selectedAthlete.paymentPreference === 'Annual';

                if (isAnnual) {
                    const annualPay = historyPayments.find(p => p.periodYear === modalYear && (p.periodMonth === null || p.periodMonth === 0));
                    const annualAmount = annualPay ? annualPay.amount : (selectedAthlete.amount || 0) * 12;
                    const monthlyBase = annualAmount / 12;

                    setSelectedPeriods(Array.from({ length: 12 }, (_, i) => ({
                        month: i + 1,
                        year: modalYear,
                        amount: monthlyBase
                    })));
                } else {
                    const preFilled = historyPayments
                        .filter(p => p.periodYear === modalYear && p.periodMonth > 0)
                        .map(p => ({
                            month: p.periodMonth,
                            year: p.periodYear,
                            amount: p.amount
                        }));

                    if (preFilled.length === 0 && modalYear === currentYear) {
                        const currentMonthQuota = (quotasData.quotas && quotasData.quotas[currentMonth - 1]) || selectedAthlete.amount || 0;
                        preFilled.push({
                            month: currentMonth,
                            year: currentYear,
                            amount: currentMonthQuota
                        });
                    }
                    setSelectedPeriods(preFilled);
                }

                const pendingIds = selectedAthlete.pendingInscriptions?.map(i => i.athleteTeamId) || [];
                setSelectedInscriptions(pendingIds);
            } catch (error) {
                console.error('Error fetching history for modal:', error);
            }
        };

        fetchHistoryForModal();
    }, [isMonthModalOpen, selectedAthlete?.userId, modalYear, currentMonth, currentYear]);

    // Reset to page 1 whenever any filter changes (including debounced search)
    useEffect(() => {
        setPage(1);
    }, [debouncedSearchTerm, filterStatus, filterTeam, filterSport, currentMonth, currentYear]);

    const startEditMembership = (athlete) => {
        setEditingMembershipId(athlete.userId);
        setEditingMembershipValue(athlete.membershipNumber || '');
    };

    const cancelEditMembership = () => {
        setEditingMembershipId(null);
        setEditingMembershipValue('');
    };

    const confirmEditMembership = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5285/api';
            const response = await fetch(`${apiUrl}/payment/admin/membership-number`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, membershipNumber: editingMembershipValue })
            });
            if (!response.ok) throw new Error('Failed to update membership number');
            const data = await response.json();

            setAthletes(prev => prev.map(a =>
                a.userId === userId ? { ...a, membershipNumber: editingMembershipValue } : a
            ));

            setMembershipDuplicates(prev => ({
                ...prev,
                [userId]: data.duplicate || null
            }));
        } catch (error) {
            console.error('Error updating membership number:', error);
            alert('Erro ao atualizar número de sócio.');
        } finally {
            setEditingMembershipId(null);
            setEditingMembershipValue(0);
        }
    };

    const startEditQuota = (athlete) => {
        setEditingQuotaUserId(athlete.userId);
        setEditingQuotaValue(athlete.customQuotaPrice !== null && athlete.customQuotaPrice !== undefined
            ? athlete.customQuotaPrice.toString()
            : athlete.amount?.toString() || '');
    };

    const cancelEditQuota = () => {
        setEditingQuotaUserId(null);
        setEditingQuotaValue('');
    };

    const confirmEditQuota = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5285/api';
            const response = await fetch(`${apiUrl}/payment/admin/custom-quota-price`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, customQuotaPrice: editingQuotaValue === '' ? null : parseFloat(editingQuotaValue) })
            });
            if (!response.ok) throw new Error('Failed to update custom quota price');

            fetchPaymentStatuses();
        } catch (error) {
            console.error('Error updating custom quota price:', error);
            alert('Erro ao atualizar preço de quota.');
        } finally {
            setEditingQuotaUserId(null);
            setEditingQuotaValue('');
        }
    };

    const handleMarkWithdrawn = async (athlete) => {
        if (!window.confirm(`Tem a certeza que deseja marcar "${athlete.name}" como desistente?\n\nEsta ação irá desativar a conta e encerrar todas as equipas ativas.`)) return;
        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5285/api';
            const response = await fetch(`${apiUrl}/payment/admin/mark-withdrawn`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: athlete.userId })
            });
            if (!response.ok) throw new Error('Failed to mark athlete as withdrawn');
            fetchPaymentStatuses();
        } catch (error) {
            console.error('Error marking athlete as withdrawn:', error);
            alert('Erro ao marcar atleta como desistente.');
        }
    };

    const handleUpdateStatus = async (userId, newStatus, periods = null) => {
        const athlete = athletes.find(a => a.userId === userId);
        const isAnnual = athlete?.paymentPreference === 'Annual';
        const isMonthly = athlete?.paymentPreference === 'Monthly';

        if (newStatus === 'Completed' && (isMonthly || isAnnual) && !periods) {
            setSelectedAthlete(athlete);
            setModalYear(currentYear);
            setIsMonthModalOpen(true);
            return;
        }

        const actionText = newStatus === 'Completed' ? 'validar' : 'reverter';
        let confirmMsg = `Tem a certeza que deseja ${actionText} este pagamento?`;

        if (newStatus === 'Completed') {
            const numPeriods = periods ? periods.length : 0;
            const numInscriptions = selectedInscriptions.length;
            if (numPeriods > 0 && numInscriptions > 0) {
                confirmMsg = `Tem a certeza que deseja validar ${numPeriods} ${numPeriods === 1 ? 'mês' : 'meses'} e ${numInscriptions} ${numInscriptions === 1 ? 'inscrição' : 'inscrições'} para "${athlete?.name}"?`;
            } else if (numPeriods > 0) {
                confirmMsg = `Tem a certeza que deseja validar ${numPeriods} ${numPeriods === 1 ? 'mês' : 'meses'} para "${athlete?.name}"?`;
            } else if (numInscriptions > 0) {
                confirmMsg = `Tem a certeza que deseja validar ${numInscriptions} ${numInscriptions === 1 ? 'inscrição' : 'inscrições'} para "${athlete?.name}"?`;
            }
        }

        if (!window.confirm(confirmMsg)) return;

        try {
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5285/api';
            const body = {
                userId,
                periodYear: currentYear,
                status: newStatus,
                markInscriptionsPaid: selectedInscriptions.length > 0 ? selectedInscriptions : null
            };

            if (periods) {
                body.selectedPeriods = periods;
            } else {
                body.periodMonth = currentMonth;
            }

            const response = await fetch(`${apiUrl}/payment/admin/manual-payment`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (!response.ok) throw new Error('Failed to update payment');
            setIsMonthModalOpen(false);
            fetchPaymentStatuses();
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Erro ao atualizar estado de pagamento');
        }
    };

    const togglePeriod = (m, y) => {
        setSelectedPeriods(prev => {
            const exists = prev.find(p => p.month === m && p.year === y);
            if (exists) return prev.filter(p => !(p.month === m && p.year === y));
            const estimatedAmount = (monthlyQuotas && monthlyQuotas[m - 1]) || selectedAthlete?.amount || 0;
            return [...prev, { month: m, year: y, amount: estimatedAmount }];
        });
    };

    const updatePeriodAmount = (m, y, amt) => {
        setSelectedPeriods(prev => prev.map(p =>
            (p.month === m && p.year === y) ? { ...p, amount: parseFloat(amt) || 0 } : p
        ));
    };

    const toggleInscription = (id) => {
        setSelectedInscriptions(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectCurrentMonth = () => {
        const estimatedAmount = (monthlyQuotas && monthlyQuotas[currentMonth - 1]) || selectedAthlete?.amount || 0;
        setSelectedPeriods([{ month: currentMonth, year: currentYear, amount: estimatedAmount }]);
        setModalYear(currentYear);
    };

    const selectAllMonths = () => {
        setSelectedPeriods(
            Array.from({ length: 12 }, (_, i) => ({
                month: i + 1,
                year: modalYear,
                amount: (monthlyQuotas && monthlyQuotas[i]) || selectedAthlete?.amount || 0
            }))
        );
    };

    const clearSelection = () => {
        setSelectedPeriods([]);
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5285/api';

            let url = `${apiUrl}/payment/admin/export-all-status?year=${currentYear}`;

            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch export data');

            const blob = await response.blob();
            const urlBlob = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', urlBlob);
            link.setAttribute('download', `gestao_pagamentos_${currentYear}_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(urlBlob);
        } catch (error) {
            console.error('Error exporting payments:', error);
            alert('Erro ao exportar dados.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status, athlete = {}) => {
        const s = status || '';
        const isSenior = athlete.team?.toLowerCase().includes('senior') ||
            athlete.sport?.toLowerCase().includes('senior') ||
            athlete.team?.toLowerCase().includes('seniores') ||
            athlete.sport?.toLowerCase().includes('seniores');

        switch (s) {
            case 'Paid': case 'Regularizada': case 'Completed':
                return <span className="status-badge paid"><FaCheckCircle /> Pago</span>;
            case 'Pendente': case 'Pending':
                return <span className="status-badge pending"><FaExclamationCircle /> Pendente</span>;
            case 'Unpaid': case 'Failed':
                if (isSenior) return <span className="status-badge senior"><FaUser /> (senior)</span>;
                return <span className="status-badge unpaid"><FaTimes /> Não Pago</span>;
            default:
                return <span className="status-badge">{s}</span>;
        }
    };

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

    const MONTHS_PT = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const monthsTotal = selectedPeriods.reduce((acc, p) => acc + (p.amount || 0), 0);
    const inscriptionsTotal = selectedAthlete?.pendingInscriptions
        ?.filter(i => selectedInscriptions.includes(i.athleteTeamId))
        .reduce((acc, i) => acc + i.amount, 0) || 0;
    const grandTotal = monthsTotal + inscriptionsTotal;
    const hasInscriptions = (selectedAthlete?.pendingInscriptions?.length || 0) > 0;
    const isAthleteAnnual = selectedAthlete?.paymentPreference === 'Annual';

    const confirmButtonLabel = () => {
        if (selectedAthlete?.status === 'Paid' || selectedAthlete?.status === 'Regularizada' || selectedAthlete?.status === 'Completed') return 'Guardar Alterações';
        if (isAthleteAnnual && selectedPeriods.length === 12) {
            const parts = ['Ano'];
            if (selectedInscriptions.length > 0)
                parts.push(`${selectedInscriptions.length} ${selectedInscriptions.length === 1 ? 'Inscrição' : 'Inscrições'}`);
            return `Validar ${parts.join(' + ')}`;
        }
        const parts = [];
        if (selectedPeriods.length > 0)
            parts.push(`${selectedPeriods.length} ${selectedPeriods.length === 1 ? 'Mês' : 'Meses'}`);
        if (selectedInscriptions.length > 0)
            parts.push(`${selectedInscriptions.length} ${selectedInscriptions.length === 1 ? 'Inscrição' : 'Inscrições'}`);
        return parts.length > 0 ? `Validar ${parts.join(' + ')}` : 'Validar';
    };

    return (
        <div className="payment-manager">
            {/* ── Header ── */}
            <div className="payment-manager-header">
                <div className="header-title">
                    <div className="title-icon"><FaEuroSign /></div>
                    <div>
                        <h2>Gestão de Quotas</h2>
                        <p className="subtitle">Monitorize e gira os pagamentos dos atletas</p>
                    </div>
                </div>
                <div className="header-period">
                    <button className="export-btn" onClick={handleExport} disabled={loading} title="Exportar para Excel">
                        <FaFileExcel /> <span>Exportar Excel</span>
                    </button>
                    <div className="period-selector">
                        <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} className="admin-select month-select">
                            {MONTHS_PT.map((m, i) => (
                                <option key={i + 1} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} className="admin-select year-select">
                            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="filters-container">
                <div className="filter-item search-group">
                    <label>Pesquisa</label>
                    <div className="search-wrapper">
                        <input
                            type="text"
                            placeholder="Pesquisar por nome, email, NIF ou Nº Sócio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button className="clear-search" onClick={() => setSearchTerm('')}><FaTimes /></button>
                        )}
                    </div>
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
                            <option value="-1">Sócio</option>
                            <option value="-2">Com Equipa</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>{team.name} ({team.sportName})</option>
                            ))}
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

            {/* ── Table Stats ── */}
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

            {/* ── Table ── */}
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Nº Sócio</th>
                            <th>Nome</th>
                            <th>Equipa / Modalidade</th>
                            <th>Tipo de Quota</th>
                            <th>Período</th>
                            <th>Valor</th>
                            <th>Estado</th>
                            <th className="payment-actions-cell">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="skeleton-row">
                                    <td colSpan="8"><div className="skeleton-bar"></div></td>
                                </tr>
                            ))
                        ) : (athletes?.length || 0) > 0 ? (
                            athletes.map((athlete) => (
                                <tr key={athlete.userId} className={`row-status-${(athlete.status || '').toLowerCase()}`}>
                                    <td data-label="Nº Sócio">
                                        {editingMembershipId === athlete.userId ? (
                                            <div className="membership-edit-container">
                                                <input
                                                    className="membership-input"
                                                    value={editingMembershipValue}
                                                    onChange={e => setEditingMembershipValue(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') confirmEditMembership(athlete.userId);
                                                        if (e.key === 'Escape') cancelEditMembership();
                                                    }}
                                                    autoFocus
                                                    maxLength={20}
                                                />
                                                <div className="membership-edit-actions">
                                                    <button className="membership-btn-confirm" title="Confirmar" onClick={() => confirmEditMembership(athlete.userId)}><FaCheck /></button>
                                                    <button className="membership-btn-cancel" title="Cancelar" onClick={cancelEditMembership}><FaTimes /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="membership-view-container">
                                                <div className="membership-number-wrapper">
                                                    <span className="membership-number">{athlete.membershipNumber}</span>
                                                    <button className="membership-edit-btn" title="Editar Nº Sócio" onClick={() => startEditMembership(athlete)}><FaEdit /></button>
                                                </div>
                                                {membershipDuplicates[athlete.userId] && (
                                                    <div className="membership-duplicate-warning" title={`Nº duplicado: ${membershipDuplicates[athlete.userId].name}`}>
                                                        <FaExclamationTriangle />
                                                        <span>Duplicado: <strong>{membershipDuplicates[athlete.userId].name}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td data-label="Nome">
                                        <span className="athlete-name">{athlete.name}</span>
                                    </td>
                                    <td data-label="Equipa / Modalidade">
                                        <div className="team-sport-cell">
                                            {athlete.team?.split(', ').map((t, idx) => (
                                                <span key={idx} className="team-name">{t}</span>
                                            ))}
                                            <span className="sport-name">{athlete.sport}</span>
                                        </div>
                                    </td>
                                    <td data-label="Tipo Quota">{athlete.paymentPreference === 'Annual' ? 'Anual' : 'Mensal'}</td>
                                    <td data-label="Período">{athlete.paymentPreference === 'Annual' ? currentYear : athlete.currentPeriod}</td>
                                    <td data-label="Valor" className="amount-cell" onClick={() => startEditQuota(athlete)}>
                                        <div className="amount-wrapper">
                                            {editingQuotaUserId === athlete.userId ? (
                                                <div className="quota-edit-container">
                                                    <input
                                                        className="quota-input"
                                                        type="number"
                                                        step="0.01"
                                                        value={editingQuotaValue}
                                                        onChange={e => setEditingQuotaValue(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') confirmEditQuota(athlete.userId);
                                                            if (e.key === 'Escape') cancelEditQuota();
                                                        }}
                                                        onBlur={cancelEditQuota}
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <span className={`monthly-fee ${athlete.customQuotaPrice !== null ? 'custom-price' : ''}`}>
                                                    {((athlete.status === 'Paid' || athlete.status === 'Regularizada' || athlete.status === 'Completed') && athlete.amountPaid !== null && athlete.amountPaid !== undefined)
                                                        ? `${athlete.amountPaid.toFixed(2)}€`
                                                        : (athlete.paymentPreference === 'Annual'
                                                            ? `${((athlete.amount || 0) * 12).toFixed(2)}€`
                                                            : `${(athlete.amount || 0).toFixed(2)}€`)}
                                                </span>
                                            )}
                                            {athlete.pendingInscriptions?.length > 0 && (
                                                <div className="pending-inscription-tag" title={`Inscrições pendentes: ${athlete.pendingInscriptions.map(i => i.sportName).join(', ')}`}>
                                                    +{athlete.pendingInscriptions.reduce((acc, i) => acc + i.amount, 0).toFixed(2)}€ Inscr.
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td data-label="Estado">{getStatusBadge(athlete.status, athlete)}</td>
                                    <td className="payment-actions-cell">
                                        <div className="payment-action-buttons">
                                            <button
                                                className="payment-btn-action payment-btn-profile"
                                                title="Ver Ficha / Histórico"
                                                onClick={() => { setSelectedUserId(athlete.userId); setIsHistoryModalOpen(true); }}
                                            >
                                                <FaUser /> <span>Ficha</span>
                                            </button>
                                            {athlete.status !== 'Paid' && athlete.status !== 'Regularizada' && athlete.status !== 'Completed' ? (
                                                <button className="payment-btn-action payment-btn-validate" title="Validar Pagamento" onClick={() => handleUpdateStatus(athlete.userId, "Completed")}>
                                                    <FaCheckCircle /> <span>Validar</span>
                                                </button>
                                            ) : (
                                                <button className="payment-btn-action payment-btn-validate" title="Editar Pagamento" onClick={() => handleUpdateStatus(athlete.userId, "Completed")}>
                                                    <FaEdit /> <span>Editar</span>
                                                </button>
                                            )}
                                            <button
                                                className="payment-btn-action payment-btn-withdraw"
                                                title="Marcar como Desistente"
                                                onClick={() => handleMarkWithdrawn(athlete)}
                                            >
                                                <FaUserTimes /> <span>Desistiu</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="empty-message">
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

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button className="pagination-btn pagination-btn--icon" onClick={() => setPage(1)} disabled={page === 1} title="Primeira página">
                        <FaChevronLeft /><FaChevronLeft />
                    </button>
                    <button className="pagination-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <FaChevronLeft /> Anterior
                    </button>
                    <div className="page-numbers">
                        {getPageNumbers().map((p, idx) =>
                            p === '...'
                                ? <span key={`el-${idx}`} className="page-ellipsis"><FaEllipsisH /></span>
                                : <button key={p} className={`page-number ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                        )}
                    </div>
                    <button className="pagination-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        Próximo <FaChevronRight />
                    </button>
                    <button className="pagination-btn pagination-btn--icon" onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Última página">
                        <FaChevronRight /><FaChevronRight />
                    </button>
                </div>
            )}

            {/* ── Month Selection Modal for Validation ── */}
            {isMonthModalOpen && (
                <div className="admin-modal-overlay" onClick={() => setIsMonthModalOpen(false)}>
                    <div className="admin-modal months-modal refined" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="modal-header">
                            <div className="modal-header-left">
                                <div className="modal-header-icon">
                                    <FaCalendarAlt />
                                </div>
                                <div className="modal-header-left-text">
                                    <h3>Validar Quotas</h3>
                                    <p className="modal-subtitle">
                                        {selectedAthlete?.name}
                                        {isAthleteAnnual && <span className="annual-indicator"> (Quota Anual)</span>}
                                    </p>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setIsMonthModalOpen(false)}><FaTimes /></button>
                        </div>

                        <div className="modal-body">
                            {/* Controls Row: Year + Quick Actions */}
                            <div className="modal-controls-row">
                                <div className="modal-year-pill">
                                    <FaCalendarAlt />
                                    <button className="year-nav-btn" onClick={() => setModalYear(y => y - 1)}><FaChevronLeft /></button>
                                    <span className="year-display">{modalYear}</span>
                                    <button className="year-nav-btn" onClick={() => setModalYear(y => y + 1)}><FaChevronRight /></button>
                                    {modalYear !== currentYear && (
                                        <button className="year-reset-mini" onClick={() => setModalYear(currentYear)} title={`Voltar a ${currentYear}`}><FaUndo /></button>
                                    )}
                                </div>

                                <div className="modal-quick-actions">
                                    <button className="quick-action-btn" onClick={selectCurrentMonth}>
                                        <FaBolt /> Mês Corrente
                                    </button>
                                    <button className="quick-action-btn" onClick={selectAllMonths}><FaListUl /> Todos</button>
                                    <button className="quick-action-btn quick-action-btn--clear" onClick={clearSelection} disabled={selectedPeriods.length === 0}><FaTimes /> Limpar</button>
                                </div>
                            </div>

                            {/* Month Grid */}
                            <div className="months-grid-v2">
                                {Array.from({ length: 12 }, (_, i) => {
                                    const m = i + 1;
                                    const period = selectedPeriods.find(p => p.month === m && p.year === modalYear);
                                    const isSelected = !!period;
                                    const monthLabel = MONTHS_PT[i].substring(0, 3);

                                    return (
                                        <div
                                            key={m}
                                            className={`month-tile ${isSelected ? 'month-tile--selected' : ''}`}
                                        >
                                            <button
                                                className="month-tile-toggle"
                                                onClick={() => togglePeriod(m, modalYear)}
                                                type="button"
                                            >
                                                <div className={`month-checkbox ${isSelected ? 'month-checkbox--checked' : ''}`}>
                                                    {isSelected && <FaCheck />}
                                                </div>
                                                <span className="month-tile-label">{monthLabel}</span>
                                            </button>

                                            {isSelected ? (
                                                <div className="month-tile-amount">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={period.amount}
                                                        onChange={(e) => updatePeriodAmount(m, modalYear, e.target.value)}
                                                        className="month-amount-input"
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                    <span className="month-amount-currency">€</span>
                                                </div>
                                            ) : (
                                                <div className="month-tile-amount month-tile-amount--estimated">
                                                    <span className="month-amount-value">
                                                        {((monthlyQuotas && monthlyQuotas[m - 1]) || selectedAthlete?.amount || 0).toFixed(2)}
                                                    </span>
                                                    <span className="month-amount-currency">€</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pending Inscriptions */}
                            {hasInscriptions && (
                                <div className="modal-inscriptions-section">
                                    <div className="inscriptions-section-header">
                                        <span className="inscriptions-section-title">Inscrições Pendentes</span>
                                        <span className="inscriptions-count-badge">
                                            {selectedAthlete.pendingInscriptions.length}
                                        </span>
                                    </div>
                                    <div className="inscriptions-list-v2">
                                        {selectedAthlete.pendingInscriptions.map(ins => {
                                            const isSelected = selectedInscriptions.includes(ins.athleteTeamId);
                                            return (
                                                <button
                                                    key={ins.athleteTeamId}
                                                    className={`inscription-tile ${isSelected ? 'inscription-tile--selected' : ''}`}
                                                    onClick={() => toggleInscription(ins.athleteTeamId)}
                                                    type="button"
                                                >
                                                    <div className={`month-checkbox ${isSelected ? 'month-checkbox--checked' : ''}`}>
                                                        {isSelected && <FaCheck />}
                                                    </div>
                                                    <span className="inscription-sport">{ins.sportName}</span>
                                                    <span className="inscription-amount">{ins.amount.toFixed(2)}€</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer-v2">
                            <div className="modal-totals">
                                {selectedPeriods.length > 0 && (
                                    <div className="total-row">
                                        <span className="total-label">Subtotal Quotas</span>
                                        <span className="total-value">{monthsTotal.toFixed(2)}€</span>
                                    </div>
                                )}
                                {inscriptionsTotal > 0 && (
                                    <div className="total-row">
                                        <span className="total-label">Subtotal Inscrições</span>
                                        <span className="total-value">{inscriptionsTotal.toFixed(2)}€</span>
                                    </div>
                                )}
                                <div className="total-row total-row--grand">
                                    <span className="total-label">Total a Validar</span>
                                    <span className="total-value">{grandTotal.toFixed(2)}€</span>
                                </div>
                            </div>
                            <div className="modal-footer-actions">
                                <button className="btn-cancel" onClick={() => setIsMonthModalOpen(false)}>Cancelar</button>
                                <button
                                    className="btn-confirm"
                                    onClick={() => handleUpdateStatus(selectedAthlete.userId, "Completed", selectedPeriods)}
                                    disabled={selectedPeriods.length === 0 && selectedInscriptions.length === 0}
                                >
                                    <FaCheckCircle /> {confirmButtonLabel()}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── History Modal ── */}
            {isHistoryModalOpen && (
                <PaymentHistorySocio
                    isOpen={isHistoryModalOpen}
                    onClose={() => {
                        setIsHistoryModalOpen(false);
                        setSelectedUserId(null);
                        fetchPaymentStatuses();
                    }}
                    userId={selectedUserId}
                    isAdmin={true}
                    onPaymentSuccess={fetchPaymentStatuses}
                    overdueMonths={athletes.find(a => a.userId === selectedUserId)?.overdueMonths || []}
                    quotaAmount={athletes.find(a => a.userId === selectedUserId)?.amount}
                    paymentStatus={athletes.find(a => a.userId === selectedUserId)?.status}
                />
            )}

            {/* ── Custom Quota Styles ── */}
            <style>{`
                .quota-edit-container { display: flex; align-items: center; justify-content: center; }
                .quota-input { 
                    width: 90px !important; 
                    padding: 0.4rem 0.6rem !important; 
                    border: 2px solid #3b82f6 !important; 
                    border-radius: 8px !important; 
                    font-size: 0.95rem !important; 
                    font-weight: 700 !important; 
                    color: #1e293b !important; 
                    outline: none !important; 
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important; 
                    text-align: center !important; 
                    background: white !important;
                }
                .monthly-fee { cursor: pointer; transition: color 0.2s; }
                .monthly-fee:hover { color: #3b82f6 !important; }
                .custom-price { color: #1e293b !important; font-weight: 700 !important; text-decoration: underline dotted #cbd5e1; }
            `}</style>
        </div>
    );
};

export default PaymentManager;