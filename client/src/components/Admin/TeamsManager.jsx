import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaUsers, FaSearch, FaTimes, FaSort, FaSortUp, FaSortDown, FaUserCheck, FaUserPlus, FaForward, FaChevronDown, FaHistory } from 'react-icons/fa';
import './TeamsManager.css';

/* ── Sport Emoji Helper ──────────────────────────────────── */
const getSportEmoji = (sportName) => {
    const name = (sportName || '').toLowerCase();
    if (name.includes('atletism') || name.includes('atletica')) return '🏃';
    if (name.includes('badminton')) return '🏸';
    if (name.includes('basquet') || name.includes('basket')) return '🏀';
    if (name.includes('futvolei') || name.includes('footvolley') || name.includes('futvolley')) return '🏖️';
    if (name.includes('futsal')) return '⚽';
    if (name.includes('hóquei') || name.includes('hockey') || name.includes('patins')) return '🛼';
    if (name.includes('tenis') || name.includes('ténis') || name.includes('mesa')) return '🏓';
    if (name.includes('volei') || name.includes('volley')) return '🏐';
    return '🏆';
};

/* ── Team Card ───────────────────────────────────────────── */
const TeamCard = ({ team, onView, onEdit, onDelete, onAdvance, getGenderBadgeClass, getGenderLabel }) => (
    <div className="team-card">
        <div className="team-card-body">
            <h3 className="team-card-name">{team.name}</h3>
            <div className="team-card-badges">
                {team.category && (
                    <span className="team-card-escalao-badge">{team.category}</span>
                )}
                <span className={`gender-badge ${getGenderBadgeClass(team.gender)}`}>
                    {getGenderLabel(team.gender)}
                </span>
            </div>
        </div>
        <div className="team-card-footer">
            <span className="team-card-athletes">
                <FaUsers />
                <span>{team.athleteCount ?? '—'} atletas</span>
            </span>
            <div className="team-card-actions">
                <button className="teams-action-btn next-season" onClick={() => onAdvance(team)} title="Avançar Época">
                    <FaForward />
                </button>
                <button className="teams-action-btn view" onClick={() => onView(team.id)} title="Ver equipa">
                    <FaUsers />
                </button>
                <button className="teams-action-btn edit" onClick={() => onEdit(team)} title="Editar">
                    <FaEdit />
                </button>
                <button className="teams-action-btn delete" onClick={() => onDelete(team.id)} title="Eliminar">
                    <FaTrash />
                </button>
            </div>
        </div>
    </div>
);

/* ── Searchable Escalão Combobox ─────────────────────────── */
const EscalaoSearchSelect = ({ escalaos, value, onChange }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const containerRef = useRef(null);

    const selected = escalaos.find(e => String(e.id) === String(value));

    useEffect(() => {
        if (!open) setQuery(selected ? selected.name : '');
    }, [value, open]);

    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
                setQuery(selected ? selected.name : '');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [selected]);

    const filtered = query.trim()
        ? escalaos.filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
        : escalaos;

    const handleSelect = (esc) => {
        onChange(esc ? String(esc.id) : '');
        setQuery(esc ? esc.name : '');
        setOpen(false);
    };

    return (
        <div className="escalao-combobox" ref={containerRef}>
            <div className="escalao-combobox-input-wrap">
                <input
                    type="text"
                    className="teams-form-input"
                    placeholder="Pesquisar escalão..."
                    value={open ? query : (selected ? selected.name : '')}
                    onFocus={() => { setOpen(true); setQuery(''); }}
                    onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                    autoComplete="off"
                />
                {value && (
                    <button type="button" className="escalao-combobox-clear" onClick={() => handleSelect(null)} title="Limpar">×</button>
                )}
            </div>
            {open && (
                <ul className="escalao-combobox-list">
                    <li
                        className={`escalao-combobox-item escalao-combobox-empty-opt${!value ? ' selected' : ''}`}
                        onMouseDown={() => handleSelect(null)}
                    >
                        Sem escalão
                    </li>
                    {filtered.length === 0 && (
                        <li className="escalao-combobox-no-results">Sem resultados</li>
                    )}
                    {filtered.map(esc => (
                        <li
                            key={esc.id}
                            className={`escalao-combobox-item${String(esc.id) === String(value) ? ' selected' : ''}`}
                            onMouseDown={() => handleSelect(esc)}
                        >
                            {esc.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

/* ── Main Component ──────────────────────────────────────── */
const TeamsManager = () => {
    const [teams, setTeams] = useState([]);
    const [sports, setSports] = useState([]);
    const [escalaos, setEscalaos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [viewingTeam, setViewingTeam] = useState(null);
    const [addingAthletes, setAddingAthletes] = useState(false);
    const [availableAthletes, setAvailableAthletes] = useState([]);
    const [selectedAthletes, setSelectedAthletes] = useState([]);
    const [athletesLoading, setAthletesLoading] = useState(false);
    const [athleteSearch, setAthleteSearch] = useState('');
    const [selectedSportFilter, setSelectedSportFilter] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [expandedSportHistory, setExpandedSportHistory] = useState({});
    const [expandedHistorySeasons, setExpandedHistorySeasons] = useState({});

    const initialFormState = {
        sportId: '',
        name: '',
        escalaoId: '',
        gender: 2,
        season: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        isActive: true
    };
    const [formData, setFormData] = useState(initialFormState);

    const getEmailBase = (email) => {
        if (!email) return '';
        const [localPart, domain] = email.split('@');
        if (!localPart || !domain) return email;
        const [base] = localPart.split('+');
        return `${base}@${domain}`;
    };

    useEffect(() => {
        fetchTeams();
        fetchSports();
        fetchEscalaos();
    }, []);

    const fetchTeams = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/teams/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTeams(data);
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSports = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/sports/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSports(data.filter(s => s.isActive));
            }
        } catch (error) {
            console.error('Error fetching sports:', error);
        }
    };

    const fetchEscalaos = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/escalaos/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setEscalaos(data);
            }
        } catch (error) {
            console.error('Error fetching escalaos:', error);
        }
    };

    const fetchTeamDetails = async (teamId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/teams/${teamId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setViewingTeam(data);
                setShowDetailsModal(true);
            }
        } catch (error) {
            console.error('Error fetching team details:', error);
            alert('Erro ao carregar detalhes da equipa');
        }
    };

    const fetchAvailableAthletes = async () => {
        setAthletesLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/users?profileType=athlete&isActive=true&pageSize=1000', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setAvailableAthletes(Array.isArray(data) ? data : (data.items ?? []));
            }
        } catch (error) {
            console.error('Error fetching athletes:', error);
        } finally {
            setAthletesLoading(false);
        }
    };

    const generateTeamName = (data) => {
        const sport = sports.find(s => s.id === parseInt(data.sportId));
        const escalao = escalaos.find(e => e.id === parseInt(data.escalaoId));
        if (!sport) return data.name;
        let name = sport.name;
        if (escalao) name += ` ${escalao.name}`;
        if (parseInt(data.gender) === 0) name += ' (masculino)';
        if (parseInt(data.gender) === 1) name += ' (masculino)';
        if (parseInt(data.gender) === 2) name += ' (feminino)';
        if (parseInt(data.gender) === 3) name += ' (mista)';
        return name;
    };

    const updateFormField = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };
            if (field === 'sportId' || field === 'escalaoId' || field === 'gender') {
                updated.name = generateTeamName(updated);
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('token');
        const dataToSend = {
            sportId: parseInt(formData.sportId),
            name: formData.name,
            escalaoId: formData.escalaoId ? parseInt(formData.escalaoId) : null,
            gender: parseInt(formData.gender),
            season: formData.season || null,
            isActive: formData.isActive
        };
        try {
            const url = editingTeam
                ? `http://localhost:5285/api/teams/${editingTeam.id}`
                : 'http://localhost:5285/api/teams';
            const response = await fetch(url, {
                method: editingTeam ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(dataToSend)
            });
            if (response.ok) {
                await fetchTeams();
                setShowModal(false);
                resetForm();
                alert(editingTeam ? 'Equipa atualizada com sucesso!' : 'Equipa criada com sucesso!');
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao guardar equipa');
            }
        } catch (error) {
            console.error('Error saving team:', error);
            alert('Erro ao guardar equipa');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveAthlete = async (athleteProfileId) => {
        if (!window.confirm('Tem a certeza que deseja remover este atleta da equipa?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/teams/${viewingTeam.id}/athletes/${athleteProfileId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Atleta removido com sucesso!');
                await fetchTeamDetails(viewingTeam.id);
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao remover atleta');
            }
        } catch (error) {
            console.error('Error removing athlete:', error);
            alert('Erro ao remover atleta');
        }
    };

    const handleAdvanceSeason = async (team) => {
        if (!window.confirm(`Deseja avançar a equipa "${team.name}" para a época seguinte? Isso criará uma nova equipa salvando a anterior.`)) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/teams/${team.id}/advance`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Equipa avançada com sucesso para a próxima época!');
                await fetchTeams();
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao avançar época');
            }
        } catch (error) {
            console.error('Error advancing season:', error);
            alert('Erro ao avançar época');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar esta equipa?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/teams/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                await fetchTeams();
                alert('Equipa eliminada com sucesso!');
            } else {
                alert('Erro ao eliminar equipa');
            }
        } catch (error) {
            console.error('Error deleting team:', error);
            alert('Erro ao eliminar equipa');
        }
    };

    const openAddModal = (sportId = null) => {
        setEditingTeam(null);
        setFormData({
            ...initialFormState,
            sportId: sportId ? String(sportId) : ''
        });
        setShowModal(true);
    };

    const openEditModal = (team) => {
        setEditingTeam(team);
        setFormData({
            sportId: team.sportId,
            name: team.name,
            escalaoId: team.escalaoId || '',
            gender: team.gender,
            season: team.season || '',
            isActive: team.isActive
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setEditingTeam(null);
        setShowModal(false);
    };

    const getGenderLabel = (gender) => {
        switch (gender) {
            case 1: return 'Masculino';
            case 2: return 'Feminino';
            case 3: return 'Misto';
            default: return 'Misto';
        }
    };

    const getGenderBadgeClass = (gender) => {
        switch (gender) {
            case 1: return 'gender-male';
            case 2: return 'gender-female';
            case 3: return 'gender-mixed';
            default: return 'gender-mixed';
        }
    };

    const filteredAthletes = useMemo(() => {
        const term = athleteSearch.toLowerCase().trim();
        return availableAthletes.filter(athlete => {
            const isInTeam = viewingTeam?.athletes?.some(a => a.userId === athlete.id);
            if (isInTeam) return false;
            if (!term) return true;
            return (
                athlete.fullName.toLowerCase().includes(term) ||
                (athlete.nif && athlete.nif.toLowerCase().includes(term)) ||
                getEmailBase(athlete.email).toLowerCase().includes(term)
            );
        });
    }, [availableAthletes, athleteSearch, viewingTeam]);

    const athletesAlreadyInTeam = useMemo(() => {
        if (!athleteSearch.trim()) return [];
        const term = athleteSearch.toLowerCase().trim();
        return availableAthletes.filter(athlete => {
            const isInTeam = viewingTeam?.athletes?.some(a => a.userId === athlete.id);
            if (!isInTeam) return false;
            return (
                athlete.fullName.toLowerCase().includes(term) ||
                (athlete.nif && athlete.nif.toLowerCase().includes(term)) ||
                getEmailBase(athlete.email).toLowerCase().includes(term)
            );
        });
    }, [availableAthletes, athleteSearch, viewingTeam]);

    const toggleAthleteSelection = (athleteProfileId) => {
        setSelectedAthletes(prev =>
            prev.includes(athleteProfileId)
                ? prev.filter(id => id !== athleteProfileId)
                : [...prev, athleteProfileId]
        );
    };

    const handleSelectAllFiltered = () => {
        const filteredIds = filteredAthletes.map(a => a.athleteProfileId);
        setSelectedAthletes(prev => [...new Set([...prev, ...filteredIds])]);
    };

    const handleDeselectAllFiltered = () => {
        const filteredIds = filteredAthletes.map(a => a.athleteProfileId);
        setSelectedAthletes(prev => prev.filter(id => !filteredIds.includes(id)));
    };

    const areAllFilteredSelected = filteredAthletes.length > 0 && filteredAthletes.every(a => selectedAthletes.includes(a.athleteProfileId));

    const handleAddAthletes = async () => {
        if (selectedAthletes.length === 0) {
            alert('Por favor, selecione pelo menos um atleta.');
            return;
        }
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/teams/${viewingTeam.id}/athletes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ athleteProfileIds: selectedAthletes })
            });
            if (response.ok) {
                alert('Atletas adicionados com sucesso!');
                setSelectedAthletes([]);
                setAddingAthletes(false);
                await fetchTeamDetails(viewingTeam.id);
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao adicionar atletas');
            }
        } catch (error) {
            console.error('Error adding athletes:', error);
            alert('Erro ao adicionar atletas');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (name) => {
        if (sortConfig.key !== name) return <FaSort className="sort-icon" />;
        if (sortConfig.direction === 'ascending') return <FaSortUp className="sort-icon active" />;
        return <FaSortDown className="sort-icon active" />;
    };

    const toggleSportHistory = (sportId) => {
        setExpandedSportHistory(prev => ({ ...prev, [sportId]: !prev[sportId] }));
    };

    const toggleHistorySeason = (sportId, season) => {
        const key = `${sportId}__${season}`;
        setExpandedHistorySeasons(prev => ({ ...prev, [key]: !prev[key] }));
    };

    /* ── teamsBySport: main data structure ── */
    const teamsBySport = useMemo(() => {
        let filtered = [...teams];
        if (selectedSportFilter) {
            filtered = filtered.filter(t => t.sportId === parseInt(selectedSportFilter));
        }

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aVal = sortConfig.key === 'gender' ? getGenderLabel(a.gender) : a[sortConfig.key];
                let bVal = sortConfig.key === 'gender' ? getGenderLabel(b.gender) : b[sortConfig.key];
                aVal = (aVal || '').toString().toLowerCase();
                bVal = (bVal || '').toString().toLowerCase();
                if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }

        const sportMap = {};
        filtered.forEach(team => {
            if (!sportMap[team.sportId]) {
                sportMap[team.sportId] = {
                    sport: { id: team.sportId, name: team.sportName },
                    seasonMap: {}
                };
            }
            const season = team.season || 'Sem Época';
            if (!sportMap[team.sportId].seasonMap[season]) {
                sportMap[team.sportId].seasonMap[season] = [];
            }
            sportMap[team.sportId].seasonMap[season].push(team);
        });

        return Object.values(sportMap).map(entry => {
            const sortedSeasons = Object.keys(entry.seasonMap).sort((a, b) => b.localeCompare(a));
            const currentSeasonKey = sortedSeasons[0] || null;
            return {
                sport: entry.sport,
                currentSeasonKey,
                currentTeams: currentSeasonKey ? entry.seasonMap[currentSeasonKey] : [],
                historySeasons: sortedSeasons.slice(1).map(s => ({ season: s, teams: entry.seasonMap[s] })),
                totalTeams: Object.values(entry.seasonMap).flat().length
            };
        }).sort((a, b) => a.sport.name.localeCompare(b.sport.name, 'pt'));
    }, [teams, selectedSportFilter, sortConfig]);

    const seasonOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 5; i <= currentYear + 10; i++) {
            years.push(`${i}/${i + 1}`);
        }
        return years;
    }, []);

    const hasActiveFilters = athleteSearch.trim() !== '';

    const sportsWithTeams = useMemo(() =>
        sports.filter(s => teams.some(t => t.sportId === s.id)),
        [sports, teams]
    );

    if (loading) {
        return (
            <div className="teams-manager">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>A carregar equipas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="teams-manager">

            {/* ── Header ── */}
            <div className="teams-manager-header">
                <div className="header-content">
                    <h1>Gestão de Equipas</h1>
                    <p className="header-subtitle">
                        {teams.length} {teams.length === 1 ? 'equipa' : 'equipas'} em {sportsWithTeams.length} {sportsWithTeams.length === 1 ? 'modalidade' : 'modalidades'}
                    </p>
                </div>
                <button className="teams-btn-add" onClick={() => openAddModal()}>
                    <FaPlus /> Nova Equipa
                </button>
            </div>

            {/* ── Sport Pills Navigation ── */}
            {teams.length > 0 && (
                <div className="sport-pills-nav">
                    <button
                        className={`sport-pill ${!selectedSportFilter ? 'active' : ''}`}
                        onClick={() => setSelectedSportFilter('')}
                    >
                        Todas
                        <span className="sport-pill-count">{teams.length}</span>
                    </button>
                    {sportsWithTeams.map(sport => {
                        const count = teams.filter(t => t.sportId === sport.id).length;
                        return (
                            <button
                                key={sport.id}
                                className={`sport-pill ${parseInt(selectedSportFilter) === sport.id ? 'active' : ''}`}
                                onClick={() => setSelectedSportFilter(parseInt(selectedSportFilter) === sport.id ? '' : sport.id)}
                            >
                                <span className="sport-pill-emoji">{getSportEmoji(sport.name)}</span>
                                {sport.name}
                                <span className="sport-pill-count">{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Empty State ── */}
            {teams.length === 0 ? (
                <div className="teams-empty-state">
                    <div className="teams-empty-icon">🏆</div>
                    <h3>Nenhuma equipa registada</h3>
                    <p>Comece por criar a primeira equipa</p>
                    <button className="teams-btn-add" onClick={() => openAddModal()}>
                        <FaPlus /> Criar Primeira Equipa
                    </button>
                </div>
            ) : teamsBySport.length === 0 ? (
                <div className="teams-empty-state">
                    <div className="teams-empty-icon">🔍</div>
                    <h3>Sem equipas para esta modalidade</h3>
                    <p>Experimente selecionar outra modalidade</p>
                </div>
            ) : (
                /* ── Sport Sections ── */
                <div className="sports-sections-wrapper">
                    {teamsBySport.map(({ sport, currentSeasonKey, currentTeams, historySeasons, totalTeams }) => (
                        <div className="sport-section" key={sport.id}>

                            {/* Sport Header */}
                            <div className="sport-section-header">
                                <div className="sport-section-title">
                                    <span className="sport-section-emoji">{getSportEmoji(sport.name)}</span>
                                    <h2>{sport.name}</h2>
                                    <span className="sport-total-badge">
                                        {totalTeams} {totalTeams === 1 ? 'equipa' : 'equipas'}
                                    </span>
                                </div>
                                <button className="sport-add-btn" onClick={() => openAddModal(sport.id)}>
                                    <FaPlus /> Nova Equipa
                                </button>
                            </div>

                            <div className="sport-section-body">

                                {/* Current Season */}
                                {currentTeams.length > 0 && (
                                    <div className="current-season-area">
                                        <div className="season-bar current">
                                            <span className="current-season-pill">Época Atual</span>
                                            <span className="season-bar-name">{currentSeasonKey}</span>
                                            <span className="season-bar-count">{currentTeams.length} {currentTeams.length === 1 ? 'equipa' : 'equipas'}</span>
                                        </div>
                                        <div className="teams-card-grid">
                                            {currentTeams.map(team => (
                                                <TeamCard
                                                    key={team.id}
                                                    team={team}
                                                    onView={fetchTeamDetails}
                                                    onEdit={openEditModal}
                                                    onDelete={handleDelete}
                                                    onAdvance={handleAdvanceSeason}
                                                    getGenderBadgeClass={getGenderBadgeClass}
                                                    getGenderLabel={getGenderLabel}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No current season teams */}
                                {currentTeams.length === 0 && historySeasons.length > 0 && (
                                    <div className="no-current-season">
                                        <span>Sem equipas na época atual</span>
                                    </div>
                                )}

                                {/* History */}
                                {historySeasons.length > 0 && (
                                    <div className="sport-history-container">
                                        <button
                                            className={`sport-history-toggle ${expandedSportHistory[sport.id] ? 'open' : ''}`}
                                            onClick={() => toggleSportHistory(sport.id)}
                                        >
                                            <FaHistory className="history-toggle-icon" />
                                            <span>Histórico</span>
                                            <span className="history-toggle-meta">
                                                {historySeasons.reduce((sum, s) => sum + s.teams.length, 0)} {historySeasons.reduce((sum, s) => sum + s.teams.length, 0) === 1 ? 'equipa' : 'equipas'} · {historySeasons.length} {historySeasons.length === 1 ? 'época' : 'épocas'}
                                            </span>
                                            <FaChevronDown className={`history-toggle-chevron ${expandedSportHistory[sport.id] ? 'rotated' : ''}`} />
                                        </button>

                                        {expandedSportHistory[sport.id] && (
                                            <div className="sport-history-content">
                                                {historySeasons.map(({ season, teams: seasonTeams }) => {
                                                    const key = `${sport.id}__${season}`;
                                                    const isOpen = expandedHistorySeasons[key];
                                                    return (
                                                        <div key={season} className={`history-season-item ${isOpen ? 'open' : ''}`}>
                                                            <div
                                                                className="history-season-header"
                                                                onClick={() => toggleHistorySeason(sport.id, season)}
                                                            >
                                                                <FaChevronDown className={`history-season-chevron ${isOpen ? 'rotated' : ''}`} />
                                                                <span className="history-season-year">{season}</span>
                                                                <span className="history-season-count">
                                                                    {seasonTeams.length} {seasonTeams.length === 1 ? 'equipa' : 'equipas'}
                                                                </span>
                                                            </div>
                                                            {isOpen && (
                                                                <div className="history-season-table-wrapper">
                                                                    <TeamsTable
                                                                        teams={seasonTeams}
                                                                        onAdvance={handleAdvanceSeason}
                                                                        onView={fetchTeamDetails}
                                                                        onEdit={openEditModal}
                                                                        onDelete={handleDelete}
                                                                        getSortIcon={getSortIcon}
                                                                        handleSort={handleSort}
                                                                        getGenderBadgeClass={getGenderBadgeClass}
                                                                        getGenderLabel={getGenderLabel}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Create/Edit Team Modal ── */}
            {showModal && (
                <div className="teams-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm(); } }}>
                    <div className="teams-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="teams-modal-header">
                            <h2>{editingTeam ? 'Editar Equipa' : 'Nova Equipa'}</h2>
                            <button className="teams-modal-close" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="teams-modal-form">
                            <div className="teams-form-row">
                                <div className="teams-form-section">
                                    <label className="teams-form-label">Modalidade *</label>
                                    <select
                                        className="teams-form-select"
                                        value={formData.sportId}
                                        onChange={(e) => updateFormField('sportId', e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione a modalidade</option>
                                        {sports.map(sport => (
                                            <option key={sport.id} value={sport.id}>{sport.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="teams-form-section">
                                    <label className="teams-form-label">Escalão</label>
                                    <EscalaoSearchSelect
                                        escalaos={escalaos}
                                        value={formData.escalaoId}
                                        onChange={(val) => updateFormField('escalaoId', val)}
                                    />
                                </div>

                                <div className="teams-form-section">
                                    <label className="teams-form-label">Género</label>
                                    <select
                                        className="teams-form-select"
                                        value={formData.gender}
                                        onChange={(e) => updateFormField('gender', e.target.value)}
                                    >
                                        <option value="1">Masculino</option>
                                        <option value="2">Feminino</option>
                                        <option value="3">Misto</option>
                                    </select>
                                </div>
                            </div>

                            <div className="teams-form-section">
                                <label className="teams-form-label">Nome da Equipa *</label>
                                <input
                                    type="text"
                                    className="teams-form-input"
                                    placeholder="Nome gerado automaticamente"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                    O nome é gerado automaticamente mas pode ser editado
                                </small>
                            </div>

                            <div className="teams-form-section">
                                <label className="teams-form-label">Época</label>
                                <select
                                    className="teams-form-select scrollable-dropdown"
                                    value={formData.season}
                                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                                >
                                    <option value="">Selecione a época</option>
                                    {seasonOptions.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-section">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                    <span className="toggle-label">Equipa Ativa</span>
                                </label>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn-cancel" onClick={() => { setShowModal(false); resetForm(); }}>
                                    Cancelar
                                </button>
                                <button type="submit" className="teams-btn-submit" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                            A guardar...
                                        </>
                                    ) : (
                                        editingTeam ? 'Atualizar Equipa' : 'Criar Equipa'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Team Details Modal ── */}
            {showDetailsModal && viewingTeam && (
                <div className="teams-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowDetailsModal(false); setViewingTeam(null); setAddingAthletes(false); } }}>
                    <div className="teams-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <div className="modal-header">
                            <div>
                                <h2>{viewingTeam.name}</h2>
                                <p style={{ margin: 0, color: '#666' }}>
                                    {viewingTeam.sportName} • {viewingTeam.category} • {viewingTeam.season}
                                </p>
                            </div>
                            <button
                                className="modal-close"
                                onClick={() => { setShowDetailsModal(false); setViewingTeam(null); setAddingAthletes(false); }}
                            >
                                ×
                            </button>
                        </div>

                        <div className="teams-modal-form">
                            <div key={viewingTeam.id} className="roster-entrance-wrapper">
                                {/* Coaches Section */}
                                <div className="roster-section">
                                    <h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <FaUsers style={{ color: '#003380' }} />
                                            <span>Treinadores</span>
                                        </div>
                                    </h3>
                                    {viewingTeam.coaches && viewingTeam.coaches.length > 0 ? (
                                        <div className="roster-grid">
                                            {viewingTeam.coaches.map(coach => (
                                                <div key={coach.id} className="roster-card">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                        <div className="roster-card-avatar">
                                                            {coach.name.charAt(0)}
                                                        </div>
                                                        <div className="roster-card-info">
                                                            <span className="roster-card-name">{coach.name}</span>
                                                            <span className="roster-card-role">{coach.role}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: '#999', fontStyle: 'italic', padding: '1rem' }}>Sem treinadores atribuídos.</p>
                                    )}
                                </div>

                                {/* Athletes Section */}
                                <div className="roster-section">
                                    <h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <FaUsers style={{ color: '#003380' }} />
                                                <span>Atletas</span>
                                                <span style={{
                                                    background: '#e3f2fd',
                                                    color: '#1976d2',
                                                    borderRadius: '20px',
                                                    padding: '2px 10px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600
                                                }}>
                                                    {viewingTeam.athletes?.length || 0}
                                                </span>
                                            </div>
                                            {!addingAthletes && (
                                                <button
                                                    className="btn-submit"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                    onClick={() => { setAddingAthletes(true); fetchAvailableAthletes(); }}
                                                >
                                                    <FaUserPlus /> Adicionar Atletas
                                                </button>
                                            )}
                                            {addingAthletes && (
                                                <button
                                                    className="btn-cancel"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                    onClick={() => { setAddingAthletes(false); setSelectedAthletes([]); setAthleteSearch(''); }}
                                                >
                                                    <FaTimes /> Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </h3>

                                    {addingAthletes ? (
                                        <div className="add-athlete-layout">
                                            {/* Left: search + athlete list */}
                                            <div className="add-athlete-search-panel">
                                                <div className="athlete-search-bar-wrap">
                                                    <FaSearch className="athlete-search-icon" />
                                                    <input
                                                        type="text"
                                                        className="athlete-search-input"
                                                        placeholder="Pesquisar por nome, NIF ou email..."
                                                        value={athleteSearch}
                                                        onChange={(e) => setAthleteSearch(e.target.value)}
                                                        autoFocus
                                                    />
                                                    {athleteSearch && (
                                                        <button className="athlete-search-clear" onClick={() => setAthleteSearch('')} title="Limpar">
                                                            <FaTimes />
                                                        </button>
                                                    )}
                                                </div>

                                                {filteredAthletes.length > 0 && (
                                                    <div className="athlete-list-controls">
                                                        <button
                                                            className="athlete-list-ctrl-btn"
                                                            onClick={areAllFilteredSelected ? handleDeselectAllFiltered : handleSelectAllFiltered}
                                                        >
                                                            {areAllFilteredSelected ? <><FaUserCheck /> Desselecionar todos</> : <><FaUserPlus /> Selecionar todos</>}
                                                        </button>
                                                        <span className="athlete-list-count">{filteredAthletes.length} disponíveis</span>
                                                    </div>
                                                )}

                                                {athletesLoading ? (
                                                    <div className="athletes-loading">
                                                        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}></div>
                                                        <span>A carregar atletas...</span>
                                                    </div>
                                                ) : (
                                                    <div className="athletes-list">
                                                        {filteredAthletes.length === 0 && athletesAlreadyInTeam.length === 0 && (
                                                            <div className="no-results">
                                                                <span className="no-results-icon">🔍</span>
                                                                <p>{athleteSearch ? 'Sem resultados para a pesquisa' : 'Sem atletas disponíveis'}</p>
                                                            </div>
                                                        )}

                                                        {filteredAthletes.map(athlete => {
                                                            const isSelected = selectedAthletes.includes(athlete.athleteProfileId);
                                                            return (
                                                                <div
                                                                    key={athlete.id}
                                                                    className={`athlete-item ${isSelected ? 'athlete-item--selected' : ''}`}
                                                                    onClick={() => toggleAthleteSelection(athlete.athleteProfileId)}
                                                                >
                                                                    <div className={`athlete-avatar-sm ${isSelected ? 'athlete-avatar-sm--selected' : ''}`}>
                                                                        {athlete.fullName?.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <div className="athlete-info">
                                                                        <div className="athlete-name">{athlete.fullName}</div>
                                                                        <div className="athlete-details">
                                                                            <span>{getEmailBase(athlete.email)}</span>
                                                                            {athlete.nif && <span className="athlete-nif-tag">NIF: {athlete.nif}</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div className={`athlete-select-indicator ${isSelected ? 'athlete-select-indicator--on' : ''}`}>
                                                                        {isSelected ? <FaTimes /> : <FaPlus />}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {athletesAlreadyInTeam.length > 0 && (
                                                            <div className="already-in-team-section">
                                                                <div className="already-in-team-label">
                                                                    <FaUserCheck /> Já na equipa
                                                                </div>
                                                                {athletesAlreadyInTeam.map(athlete => (
                                                                    <div key={athlete.id} className="athlete-item athlete-item--in-team">
                                                                        <div className="athlete-avatar-sm athlete-avatar-sm--in-team">
                                                                            {athlete.fullName?.charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div className="athlete-info">
                                                                            <div className="athlete-name">{athlete.fullName}</div>
                                                                            <div className="athlete-details">
                                                                                <span>{getEmailBase(athlete.email)}</span>
                                                                            </div>
                                                                        </div>
                                                                        <span className="in-team-badge">Na equipa</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: selected panel */}
                                            <div className="add-athlete-selected-panel">
                                                <div className="teams-selected-panel-header">
                                                    <div className="selected-panel-title">
                                                        <FaUsers />
                                                        <span>Selecionados</span>
                                                        <span className="selected-panel-count">{selectedAthletes.length}</span>
                                                    </div>
                                                    {selectedAthletes.length > 0 && (
                                                        <button
                                                            className="btn-submit selected-panel-header-btn"
                                                            onClick={handleAddAthletes}
                                                            disabled={submitting}
                                                        >
                                                            {submitting ? '...' : <FaUserPlus />}
                                                            <span>Adicionar</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="selected-panel-list">
                                                    {selectedAthletes.length === 0 ? (
                                                        <div className="selected-panel-empty">
                                                            <FaUsers className="selected-panel-empty-icon" />
                                                            <p>Clique nos atletas para os selecionar</p>
                                                        </div>
                                                    ) : (
                                                        selectedAthletes.map(id => {
                                                            const athlete = availableAthletes.find(a => a.athleteProfileId === id);
                                                            if (!athlete) return null;
                                                            return (
                                                                <div key={id} className="selected-panel-item">
                                                                    <span className="selected-panel-name">{athlete.fullName}</span>
                                                                    <button className="selected-panel-remove" onClick={(e) => { e.stopPropagation(); toggleAthleteSelection(id); }} title="Remover">
                                                                        <FaTimes />
                                                                    </button>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="roster-grid">
                                            {viewingTeam.athletes && viewingTeam.athletes.length > 0 ? (
                                                viewingTeam.athletes.map(athlete => (
                                                    <div key={athlete.id} className="roster-card">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                                                            <div className="roster-card-avatar" style={{ background: '#e3f2fd', color: '#1976d2' }}>
                                                                {athlete.name.charAt(0)}
                                                            </div>
                                                            <div className="roster-card-info">
                                                                <span className="roster-card-name">
                                                                    {athlete.name}
                                                                    {athlete.isCaptain && <span className="captain-badge">👑</span>}
                                                                </span>
                                                                <span className="roster-card-role">
                                                                    {athlete.position || 'Atleta'} {athlete.jerseyNumber && `• #${athlete.jerseyNumber}`}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn-remove-athlete"
                                                            onClick={() => handleRemoveAthlete(athlete.id)}
                                                            title="Remover da equipa"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <p style={{ color: '#999', fontStyle: 'italic' }}>Sem atletas na equipa.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── TeamsTable (for history) ────────────────────────────── */
const TeamsTable = ({
    teams,
    onAdvance,
    onView,
    onEdit,
    onDelete,
    getSortIcon,
    handleSort,
    getGenderBadgeClass,
    getGenderLabel
}) => (
    <div className="teams-table-container">
        <table className="teams-table">
            <thead>
                <tr>
                    <th onClick={() => handleSort('name')} className="sortable-header">Nome {getSortIcon('name')}</th>
                    <th onClick={() => handleSort('category')} className="sortable-header">Escalão {getSortIcon('category')}</th>
                    <th onClick={() => handleSort('gender')} className="sortable-header">Género {getSortIcon('gender')}</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody>
                {teams.map(team => (
                    <tr key={team.id}>
                        <td className="team-name" data-label="Nome">{team.name}</td>
                        <td data-label="Escalão">{team.category || '—'}</td>
                        <td data-label="Género">
                            <span className={`gender-badge ${getGenderBadgeClass(team.gender)}`}>
                                {getGenderLabel(team.gender)}
                            </span>
                        </td>
                        <td>
                            <div className="actions-cell">
                                <button className="teams-action-btn next-season" onClick={() => onAdvance(team)} title="Avançar Época"><FaForward /></button>
                                <button className="teams-action-btn view" onClick={() => onView(team.id)} title="Ver detalhes"><FaUsers /></button>
                                <button className="teams-action-btn edit" onClick={() => onEdit(team)} title="Editar"><FaEdit /></button>
                                <button className="teams-action-btn delete" onClick={() => onDelete(team.id)} title="Eliminar"><FaTrash /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default TeamsManager;