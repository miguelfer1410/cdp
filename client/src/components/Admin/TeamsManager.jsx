import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaUsers, FaSearch, FaTimes, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import './TeamsManager.css';

const TeamsManager = () => {
    const [teams, setTeams] = useState([]);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState(null);
    const [viewingTeam, setViewingTeam] = useState(null);
    const [addingAthletes, setAddingAthletes] = useState(false);
    const [availableAthletes, setAvailableAthletes] = useState([]);
    const [selectedAthletes, setSelectedAthletes] = useState([]);
    const [searchFilters, setSearchFilters] = useState({
        name: '',
        nif: '',
        email: ''
    });
    const [selectedSportFilter, setSelectedSportFilter] = useState('');
    const [formData, setFormData] = useState({
        sportId: '',
        name: '',
        category: '',
        gender: 3, // Mixed by default
        season: '',
        isActive: true
    });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

    useEffect(() => {
        fetchTeams();
        fetchSports();
    }, []);

    const fetchTeams = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/teams/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSports(data.filter(s => s.isActive));
            }
        } catch (error) {
            console.error('Error fetching sports:', error);
        }
    };

    const fetchTeamDetails = async (teamId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/teams/${teamId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/users?profileType=athlete&isActive=true&pageSize=1000', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAvailableAthletes(Array.isArray(data) ? data : (data.items ?? []));
            }
        } catch (error) {
            console.error('Error fetching athletes:', error);
        }
    };

    // Generate team name automatically
    const generateTeamName = (sportId, category, gender) => {
        const sport = sports.find(s => s.id === parseInt(sportId));
        if (!sport) return '';

        const parts = [sport.name];

        if (category && category.trim()) {
            parts.push(category.trim());
        }

        const genderLabel = getGenderLabel(parseInt(gender));
        if (genderLabel !== 'Misto') {
            parts.push(genderLabel);
        }

        return parts.join(' ');
    };

    // Update form data and regenerate name when relevant fields change
    const updateFormField = (field, value) => {
        const newFormData = { ...formData, [field]: value };

        // Auto-generate name when sport, category, or gender changes
        if (field === 'sportId' || field === 'category' || field === 'gender') {
            newFormData.name = generateTeamName(
                field === 'sportId' ? value : newFormData.sportId,
                field === 'category' ? value : newFormData.category,
                field === 'gender' ? value : newFormData.gender
            );
        }

        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const token = localStorage.getItem('token');
        const dataToSend = {
            sportId: parseInt(formData.sportId),
            name: formData.name,
            category: formData.category || null,
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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
        if (!window.confirm('Tem a certeza que deseja remover este atleta da equipa?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/teams/${viewingTeam.id}/athletes/${athleteProfileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Atleta removido com sucesso!');
                // Refresh team details
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

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar esta equipa?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/teams/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (team) => {
        setEditingTeam(team);
        setFormData({
            sportId: team.sportId,
            name: team.name,
            category: team.category || '',
            gender: team.gender,
            season: team.season || '',
            isActive: team.isActive
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            sportId: '',
            name: '',
            category: '',
            gender: 3,
            season: '',
            isActive: true
        });
        setEditingTeam(null);
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

    // Filter athletes based on search criteria
    const filteredAthletes = availableAthletes.filter(athlete => {
        // Exclude athletes already in the team
        const isInTeam = viewingTeam?.athletes?.some(a => a.userId === athlete.id);
        if (isInTeam) return false;

        // Apply search filters
        const matchesName = !searchFilters.name ||
            athlete.fullName.toLowerCase().includes(searchFilters.name.toLowerCase());

        const matchesNIF = !searchFilters.nif ||
            (athlete.nif && athlete.nif.toLowerCase().includes(searchFilters.nif.toLowerCase()));

        const matchesEmail = !searchFilters.email ||
            athlete.email.toLowerCase().includes(searchFilters.email.toLowerCase());

        return matchesName && matchesNIF && matchesEmail;
    });

    const toggleAthleteSelection = (athleteProfileId) => {
        setSelectedAthletes(prev =>
            prev.includes(athleteProfileId)
                ? prev.filter(id => id !== athleteProfileId)
                : [...prev, athleteProfileId]
        );
    };

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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ athleteProfileIds: selectedAthletes })
            });

            if (response.ok) {
                alert('Atletas adicionados com sucesso!');
                setSelectedAthletes([]);
                setAddingAthletes(false);
                // Reload team details
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

    const clearSearchFilters = () => {
        setSearchFilters({
            name: '',
            nif: '',
            email: ''
        });
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedTeams = useMemo(() => {
        let sortableTeams = [...teams];

        // Apply sport filter
        if (selectedSportFilter) {
            sortableTeams = sortableTeams.filter(team => team.sportId === parseInt(selectedSportFilter));
        }

        if (sortConfig.key !== null) {
            sortableTeams.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Special handling for gender to sort by text label
                if (sortConfig.key === 'gender') {
                    aValue = getGenderLabel(a.gender);
                    bValue = getGenderLabel(b.gender);
                }

                // Convert null/undefined to empty string for comparison
                aValue = aValue ? aValue.toString().toLowerCase() : '';
                bValue = bValue ? bValue.toString().toLowerCase() : '';

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableTeams;
    }, [teams, sortConfig, selectedSportFilter]);

    const getSortIcon = (name) => {
        if (sortConfig.key !== name) return <FaSort className="sort-icon" />;
        if (sortConfig.direction === 'ascending') return <FaSortUp className="sort-icon active" />;
        return <FaSortDown className="sort-icon active" />;
    };

    const hasActiveFilters = searchFilters.name || searchFilters.nif || searchFilters.email;

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
            <div className="manager-header">
                <div className="header-content">
                    <h1>Gestão de Equipas</h1>
                    <p className="header-subtitle">
                        {sortedTeams.length} {sortedTeams.length === 1 ? 'equipa' : 'equipas'} {selectedSportFilter ? 'encontrada' : 'registada'}{sortedTeams.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="btn-add" onClick={openAddModal}>
                    <FaPlus /> Nova Equipa
                </button>
            </div>

            {/* Sport Filter */}
            {teams.length > 0 && (
                <div className="filter-section">
                    <div className="filter-group">
                        <label className="filter-label">Filtrar por Modalidade:</label>
                        <select
                            className="filter-select"
                            value={selectedSportFilter}
                            onChange={(e) => setSelectedSportFilter(e.target.value)}
                        >
                            <option value="">Todas as Modalidades</option>
                            {sports.map(sport => (
                                <option key={sport.id} value={sport.id}>
                                    {sport.name}
                                </option>
                            ))}
                        </select>
                        {selectedSportFilter && (
                            <button
                                className="clear-filter-btn"
                                onClick={() => setSelectedSportFilter('')}
                                title="Limpar filtro"
                            >
                                <FaTimes /> Limpar
                            </button>
                        )}
                    </div>
                </div>
            )}

            {teams.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🏆</div>
                    <h3>Nenhuma equipa registada</h3>
                    <p>Comece por criar a primeira equipa</p>
                    <button className="btn-add" onClick={openAddModal}>
                        <FaPlus /> Criar Primeira Equipa
                    </button>
                </div>
            ) : (
                <div className="teams-table-container">
                    <table className="teams-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('name')} className="sortable-header">
                                    Nome {getSortIcon('name')}
                                </th>
                                <th onClick={() => handleSort('sportName')} className="sortable-header">
                                    Modalidade {getSortIcon('sportName')}
                                </th>
                                <th onClick={() => handleSort('category')} className="sortable-header">
                                    Escalão {getSortIcon('category')}
                                </th>
                                <th onClick={() => handleSort('gender')} className="sortable-header">
                                    Género {getSortIcon('gender')}
                                </th>
                                <th onClick={() => handleSort('season')} className="sortable-header">
                                    Época {getSortIcon('season')}
                                </th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTeams.map(team => (
                                <tr key={team.id}>
                                    <td className="team-name">{team.name}</td>
                                    <td>{team.sportName}</td>
                                    <td>{team.category || '-'}</td>
                                    <td>
                                        <span className={`gender-badge ${getGenderBadgeClass(team.gender)}`}>
                                            {getGenderLabel(team.gender)}
                                        </span>
                                    </td>
                                    <td>{team.season || '-'}</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                className="action-btn view"
                                                onClick={() => fetchTeamDetails(team.id)}
                                                title="Ver detalhes"
                                            >
                                                <FaUsers />
                                            </button>
                                            <button
                                                className="action-btn edit"
                                                onClick={() => openEditModal(team)}
                                                title="Editar"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDelete(team.id)}
                                                title="Eliminar"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Team Modal */}
            {showModal && (
                <div className="teams-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm(); } }}>
                    <div className="teams-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="teams-modal-header">
                            <h2>{editingTeam ? 'Editar Equipa' : 'Nova Equipa'}</h2>
                            <button className="teams-modal-close" onClick={() => { setShowModal(false); resetForm(); }}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="teams-modal-form">
                            <div className="form-section">
                                <label className="form-label">Modalidade *</label>
                                <select
                                    className="form-select"
                                    value={formData.sportId}
                                    onChange={(e) => updateFormField('sportId', e.target.value)}
                                    required
                                >
                                    <option value="">Selecione uma modalidade</option>
                                    {sports.map(sport => (
                                        <option key={sport.id} value={sport.id}>
                                            {sport.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-section">
                                    <label className="form-label">Escalão</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Ex: Sub-12, Sénior"
                                        value={formData.category}
                                        onChange={(e) => updateFormField('category', e.target.value)}
                                    />
                                </div>

                                <div className="form-section">
                                    <label className="form-label">Género</label>
                                    <select
                                        className="form-select"
                                        value={formData.gender}
                                        onChange={(e) => updateFormField('gender', e.target.value)}
                                    >
                                        <option value="1">Masculino</option>
                                        <option value="2">Feminino</option>
                                        <option value="3">Misto</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-section">
                                <label className="form-label">Nome da Equipa *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Nome gerado automaticamente"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                    O nome é gerado automaticamente mas pode ser editado
                                </small>
                            </div>

                            <div className="form-section">
                                <label className="form-label">Época</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Ex: 2024/2025"
                                    value={formData.season}
                                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                                />
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
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                >
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

            {/* Team Details Modal */}
            {showDetailsModal && viewingTeam && (
                <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowDetailsModal(false); setViewingTeam(null); setAddingAthletes(false); } }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
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

                        <div className="modal-form" style={{ paddingBottom: '2rem' }}>
                            {/* Coaches Section */}
                            <div className="roster-section">
                                <h3>Treinadores</h3>
                                {viewingTeam.coaches && viewingTeam.coaches.length > 0 ? (
                                    <div className="roster-grid">
                                        {viewingTeam.coaches.map(coach => (
                                            <div key={coach.id} className="roster-card">
                                                <div className="roster-card-avatar">
                                                    {coach.name.charAt(0)}
                                                </div>
                                                <div className="roster-card-info">
                                                    <span className="roster-card-name">{coach.name}</span>
                                                    <span className="roster-card-role">{coach.role}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ color: '#999', fontStyle: 'italic' }}>Sem treinadores atribuídos.</p>
                                )}
                            </div>

                            {/* Athletes Section */}
                            <div className="roster-section">
                                <h3>
                                    Atletas ({viewingTeam.athletes ? viewingTeam.athletes.length : 0})
                                    {!addingAthletes && (
                                        <button
                                            className="btn-add"
                                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                            onClick={() => {
                                                setAddingAthletes(true);
                                                fetchAvailableAthletes();
                                                clearSearchFilters();
                                            }}
                                        >
                                            <FaPlus /> Adicionar
                                        </button>
                                    )}
                                </h3>

                                {addingAthletes ? (
                                    <div className="add-athlete-container">
                                        <button className="modal-back-btn" onClick={() => {
                                            setAddingAthletes(false);
                                            clearSearchFilters();
                                        }}>
                                            ← Voltar à lista
                                        </button>

                                        {/* Advanced Search Section */}
                                        <div className="advanced-search">
                                            <div className="search-header">
                                                <h4>
                                                    <FaSearch /> Pesquisar Atletas
                                                </h4>
                                                {hasActiveFilters && (
                                                    <button
                                                        className="clear-filters-btn"
                                                        onClick={clearSearchFilters}
                                                    >
                                                        <FaTimes /> Limpar Filtros
                                                    </button>
                                                )}
                                            </div>

                                            <div className="search-grid">
                                                <div className="search-field">
                                                    <label className="search-label">Nome</label>
                                                    <div className="search-input-wrapper">
                                                        <FaSearch className="search-input-icon" />
                                                        <input
                                                            type="text"
                                                            className="search-input-field"
                                                            placeholder="Procurar por nome..."
                                                            value={searchFilters.name}
                                                            onChange={(e) => setSearchFilters({
                                                                ...searchFilters,
                                                                name: e.target.value
                                                            })}
                                                        />
                                                        {searchFilters.name && (
                                                            <button
                                                                className="clear-input-btn"
                                                                onClick={() => setSearchFilters({
                                                                    ...searchFilters,
                                                                    name: ''
                                                                })}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="search-field">
                                                    <label className="search-label">NIF</label>
                                                    <div className="search-input-wrapper">
                                                        <FaSearch className="search-input-icon" />
                                                        <input
                                                            type="text"
                                                            className="search-input-field"
                                                            placeholder="Procurar por NIF..."
                                                            value={searchFilters.nif}
                                                            onChange={(e) => setSearchFilters({
                                                                ...searchFilters,
                                                                nif: e.target.value
                                                            })}
                                                        />
                                                        {searchFilters.nif && (
                                                            <button
                                                                className="clear-input-btn"
                                                                onClick={() => setSearchFilters({
                                                                    ...searchFilters,
                                                                    nif: ''
                                                                })}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="search-field">
                                                    <label className="search-label">Email</label>
                                                    <div className="search-input-wrapper">
                                                        <FaSearch className="search-input-icon" />
                                                        <input
                                                            type="text"
                                                            className="search-input-field"
                                                            placeholder="Procurar por email..."
                                                            value={searchFilters.email}
                                                            onChange={(e) => setSearchFilters({
                                                                ...searchFilters,
                                                                email: e.target.value
                                                            })}
                                                        />
                                                        {searchFilters.email && (
                                                            <button
                                                                className="clear-input-btn"
                                                                onClick={() => setSearchFilters({
                                                                    ...searchFilters,
                                                                    email: ''
                                                                })}
                                                            >
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="search-results-info">
                                                <span className="results-count">
                                                    {filteredAthletes.length} {filteredAthletes.length === 1 ? 'atleta encontrado' : 'atletas encontrados'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Athletes List */}
                                        <div className="athletes-list">
                                            {filteredAthletes.map(athlete => (
                                                <div
                                                    key={athlete.id}
                                                    className="athlete-item"
                                                    onClick={() => toggleAthleteSelection(athlete.athleteProfileId)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="athlete-checkbox"
                                                        checked={selectedAthletes.includes(athlete.athleteProfileId)}
                                                        onChange={() => { }}
                                                    />
                                                    <div className="athlete-info">
                                                        <div className="athlete-name">{athlete.fullName}</div>
                                                        <div className="athlete-details">
                                                            {athlete.email}
                                                            {athlete.nif && ` • NIF: ${athlete.nif}`}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredAthletes.length === 0 && (
                                                <div className="no-results">
                                                    <div className="no-results-icon">🔍</div>
                                                    <p>Nenhum atleta encontrado com os critérios de pesquisa.</p>
                                                    {hasActiveFilters && (
                                                        <button
                                                            className="btn-add"
                                                            onClick={clearSearchFilters}
                                                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', marginTop: '0.5rem' }}
                                                        >
                                                            Limpar Filtros
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {selectedAthletes.length > 0 && (
                                            <div className="selected-count">
                                                <span>{selectedAthletes.length} {selectedAthletes.length === 1 ? 'atleta selecionado' : 'atletas selecionados'}</span>
                                                <button
                                                    className="btn-submit"
                                                    onClick={handleAddAthletes}
                                                    disabled={submitting}
                                                >
                                                    {submitting ? 'A guardar...' : 'Adicionar à Equipa'}
                                                </button>
                                            </div>
                                        )}
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
            )}
        </div>
    );
};

export default TeamsManager;