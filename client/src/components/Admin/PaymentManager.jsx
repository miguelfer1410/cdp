import React, { useState, useEffect } from 'react';
import './PaymentManager.css';
import { FaEuroSign, FaCheckCircle, FaExclamationCircle, FaSearch, FaFilter } from 'react-icons/fa';

const PaymentManager = () => {
    const [athletes, setAthletes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, Paid, Pending, Unpaid
    const [filterTeam, setFilterTeam] = useState('all');
    const [filterSport, setFilterSport] = useState('all');
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchPaymentStatuses();
    }, [currentMonth, currentYear]);

    const fetchPaymentStatuses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://51.178.43.232:5285/api/payment/admin/athletes-status?month=${currentMonth}&year=${currentYear}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch payment statuses');

            const data = await response.json();
            console.log(data)
            setAthletes(data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            alert('Erro ao carregar pagamentos');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (userId, newStatus, currentPreference) => {
        if (!window.confirm(`Tem a certeza que deseja marcar este pagamento como "${newStatus}"?`)) return;

        try {
            const token = localStorage.getItem('token');

            // Determine periods based on preference (Annual vs Monthly)
            // If user is Annual, manual payment should probably be for the whole year
            // But our endpoint expects a month/year. 
            // For logic simplicity: Annual users usually pay in a specific month or we treat year-based.
            // The backend endpoint handles "PeriodMonth = null" logic if checking existing, 
            // but the DTO accepts nullable PeriodMonth.
            // Let's pass the selected Month/Year from UI. If preference is annual, backend logic *could* be smarter,
            // but for now, we force the payment for the selected view period.

            /* 
               Better logic: If preference is Annual, we should probably set month to null?
               However, the UI allows selecting a month. If I am viewing "February", and I pay "Annual",
               it effectively clears the year. 
               Let's trust the UI selection for now.
            */

            let monthToSend = currentMonth;
            if (currentPreference === 'Annual') {
                // If annual, maybe we want to send null for month to represent the full year payment?
                // Let's assume the backend endpoint handles explicit month/year validly.
                // Ideally for Annual, we might want to pass null, but let's stick to UI context.
            }

            const payload = {
                userId: userId,
                periodMonth: currentMonth,
                periodYear: currentYear,
                status: newStatus // "Completed", "Pending", "Failed"
            };

            const response = await fetch('http://51.178.43.232:5285/api/payment/admin/manual-payment', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to update payment');

            // Refresh list
            fetchPaymentStatuses();
            alert('Estado de pagamento atualizado com sucesso!');

        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Erro ao atualizar estado de pagamento');
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Paid':
            case 'Completed':
                return <span className="status-badge active"><FaCheckCircle /> Pago</span>;
            case 'Pending':
                return <span className="status-badge pending"><FaExclamationCircle /> Pendente</span>;
            case 'Unpaid':
            case 'Failed':
                return <span className="status-badge inactive">Não Pago</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    // Calculate unique teams and sports for filters
    const teams = [...new Set(athletes.map(a => a.team).filter(t => t && t !== 'Sócio' && t !== 'Sem Equipa'))].sort();
    const sports = [...new Set(athletes.map(a => a.sport).filter(s => s && s !== '-'))].sort();

    const filteredAthletes = athletes.filter(athlete => {
        const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            athlete.team.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || athlete.status === filterStatus;
        const matchesTeam = filterTeam === 'all' || athlete.team === filterTeam;
        const matchesSport = filterSport === 'all' || athlete.sport === filterSport;

        return matchesSearch && matchesStatus && matchesTeam && matchesSport;
    });

    return (
        <div className="payment-manager">
            <div className="payment-manager-header">
                <h2><FaEuroSign /> Gestão de Quotas</h2>
                <div className="header-actions">
                    <select
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                        className="admin-select"
                        style={{ width: '120px' }}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('pt-PT', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                    <select
                        value={currentYear}
                        onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                        className="admin-select"
                        style={{ width: '100px' }}
                    >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>
                </div>
            </div>

            <div className="filters-bar">
                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Pesquisar atleta ou equipa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <FaFilter />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ marginRight: '10px' }}>
                        <option value="all">Todos os Estados</option>
                        <option value="Paid">Pago</option>
                        <option value="Pending">Pendente</option>
                        <option value="Unpaid">Não Pago</option>
                    </select>

                    <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)} style={{ marginRight: '10px' }}>
                        <option value="all">Todas as Equipas</option>
                        {teams.map(team => (
                            <option key={team} value={team}>{team}</option>
                        ))}
                    </select>

                    <select value={filterSport} onChange={(e) => setFilterSport(e.target.value)}>
                        <option value="all">Todas as Modalidades</option>
                        {sports.map(sport => (
                            <option key={sport} value={sport}>{sport}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-spinner">A carregar...</div>
            ) : (
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
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAthletes.length > 0 ? (
                                filteredAthletes.map((athlete) => (
                                    <tr key={athlete.userId}>
                                        <td>{athlete.name}</td>
                                        <td>
                                            {athlete.team}
                                            {athlete.sport && athlete.sport !== '-' && (
                                                <span style={{ display: 'block', fontSize: '0.85em', color: '#666' }}>
                                                    {athlete.sport}
                                                </span>
                                            )}
                                        </td>
                                        <td>{athlete.paymentPreference === 'Annual' ? 'Anual' : 'Mensal'}</td>
                                        <td>{athlete.currentPeriod}</td>
                                        <td>{athlete.amount.toFixed(2)} €</td>
                                        <td>{getStatusBadge(athlete.status)}</td>
                                        <td>
                                            {athlete.status !== 'Paid' && athlete.status !== 'Completed' ? (
                                                <button
                                                    className="btn-approve"
                                                    title="Marcar como Pago"
                                                    onClick={() => handleUpdateStatus(athlete.userId, "Completed", athlete.paymentPreference)}
                                                >
                                                    <FaCheckCircle /> Validar
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn-delete"
                                                    title="Marcar como Não Pago (Reverter)"
                                                    onClick={() => handleUpdateStatus(athlete.userId, "Unpaid", athlete.paymentPreference)} // Logic: Unpaid is effectively deleting payment or setting failed
                                                    style={{ background: '#ef4444', color: 'white' }}
                                                >
                                                    Reverter
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                                        Nenhum registo encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PaymentManager;
