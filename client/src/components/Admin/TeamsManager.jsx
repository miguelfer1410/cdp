import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaUsers, FaSearch, FaTimes, FaSort, FaSortUp, FaSortDown, FaUserCheck, FaUserPlus } from 'react-icons/fa';
import './TeamsManager.css';

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
    const initialFormState = {
        sportId: '',
        name: '',
        escalaoId: '',
        gender: 2, // Mixed/Misto
        season: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        isActive: true
    };
    const [formData, setFormData] = useState(initialFormState);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

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
        setAthletesLoading(true);
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
        } finally {
            setAthletesLoading(false);
        }
    };

    const generateTeamName = (data) => {
        const sport = sports.find(s => s.id === parseInt(data.sportId));
        const escalao = escalaos.find(e => e.id === parseInt(data.escalaoId));

        if (!sport) return data.name;

        let name = sport.name;
        if (escalao) {
            name += ` ${escalao.name}`;
        }

        if (parseInt(data.gender) === 0) name += ' (masculino)';
        if (parseInt(data.gender) === 1) name += ' (feminino)';
        if (parseInt(data.gender) === 2) name += ' (mista)';

        return name;
    };

    const updateFormField = (field, value) => {
        setFormData(prev => {
            const updated = { ...prev, [field]: value };

            // If sport or category changes, regenerate the suggested name
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

    // Filter athletes based on unified search
    const filteredAthletes = useMemo(() => {
        const term = athleteSearch.toLowerCase().trim();
        return availableAthletes.filter(athlete => {
            // Exclude athletes already in the team
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

    // Athletes already in team (for info display)
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
        setSelectedAthletes(prev => {
            const newSelection = [...new Set([...prev, ...filteredIds])];
            return newSelection;
        });
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
        setAthleteSearch('');
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

    const hasActiveFilters = athleteSearch.trim() !== '';

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
            <div className="teams-manager-header">
                <div className="header-content">
                    <h1>Gestão de Equipas</h1>
                    <p className="header-subtitle">
                        {sortedTeams.length} {sortedTeams.length === 1 ? 'equipa' : 'equipas'} {selectedSportFilter ? 'encontrada' : 'registada'}{sortedTeams.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="teams-btn-add" onClick={openAddModal}>
                    <FaPlus /> Nova Equipa
                </button>
            </div>

            {/* Sport Filter */}
            {teams.length > 0 && (
                <div className="teams-filter-section">
                    <div className="teams-filter-group">
                        <label className="teams-filter-label">Filtrar por Modalidade:</label>
                        <select
                            className="teams-filter-select"
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
                                className="teams-clear-filter-btn"
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
                <div className="teams-empty-state">
                    <div className="teams-empty-icon">🏆</div>
                    <h3>Nenhuma equipa registada</h3>
                    <p>Comece por criar a primeira equipa</p>
                    <button className="teams-btn-add" onClick={openAddModal}>
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
                                    <td className="team-name" data-label="Nome">{team.name}</td>
                                    <td data-label="Modalidade">{team.sportName}</td>
                                    <td data-label="Escalão">{team.category || '-'}</td>
                                    <td data-label="Género">
                                        <span className={`gender-badge ${getGenderBadgeClass(team.gender)}`}>
                                            {getGenderLabel(team.gender)}
                                        </span>
                                    </td>
                                    <td data-label="Época">{team.season || '-'}</td>
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
                            <div className="teams-form-section">
                                <label className="teams-form-label">Modalidade *</label>
                                <select
                                    className="teams-form-select"
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

                            <div className="teams-form-row">
                                <div className="teams-form-section">
                                    <label className="teams-form-label">Escalão</label>
                                    <select
                                        className="teams-form-select"
                                        value={formData.escalaoId}
                                        onChange={(e) => updateFormField('escalaoId', e.target.value)}
                                    >
                                        <option value="">Sem escalão</option>
                                        {escalaos.map(esc => (
                                            <option key={esc.id} value={esc.id}>
                                                {esc.name}
                                            </option>
                                        ))}
                                    </select>
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <FaPlus style={{ color: '#003380' }} />
                                            <span>Atletas ({viewingTeam.athletes ? viewingTeam.athletes.length : 0})</span>
                                        </div>
                                        {!addingAthletes && (
                                            <button
                                                className="btn-add"
                                                style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
                                                onClick={() => {
                                                    setAddingAthletes(true);
                                                    fetchAvailableAthletes();
                                                    setAthleteSearch('');
                                                    setSelectedAthletes([]);
                                                }}
                                            >
                                                <FaPlus /> Adicionar Atletas
                                            </button>
                                        )}
                                    </h3>

                                    {addingAthletes ? (
                                        <div className="add-athlete-container">
                                            <div className="add-athlete-header">
                                                <button className="modal-back-btn" onClick={() => {
                                                    setAddingAthletes(false);
                                                    setAthleteSearch('');
                                                    setSelectedAthletes([]);
                                                }}>
                                                    ← Voltar à lista da equipa
                                                </button>
                                                <span className="add-athlete-title">
                                                    <FaUserPlus /> Adicionar Atletas à Equipa
                                                </span>
                                            </div>

                                            <div className="add-athlete-layout">
                                                {/* Left: Search + Results */}
                                                <div className="add-athlete-search-panel">
                                                    {/* Unified Search Bar */}
                                                    <div className="unified-search-bar">
                                                        <FaSearch className="unified-search-icon" />
                                                        <input
                                                            type="text"
                                                            className="unified-search-input"
                                                            placeholder="Pesquisar por nome, NIF ou email..."
                                                            value={athleteSearch}
                                                            onChange={(e) => setAthleteSearch(e.target.value)}
                                                            autoFocus
                                                        />
                                                        {athleteSearch && (
                                                            <button className="unified-search-clear" onClick={() => setAthleteSearch('')}>
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="search-results-bar">
                                                        <span className="results-count">
                                                            {athletesLoading ? 'A carregar...' : `${filteredAthletes.length} ${filteredAthletes.length === 1 ? 'atleta disponível' : 'atletas disponíveis'}`}
                                                        </span>
                                                        {filteredAthletes.length > 0 && !athletesLoading && (
                                                            <button
                                                                className="btn-select-all"
                                                                onClick={areAllFilteredSelected ? handleDeselectAllFiltered : handleSelectAllFiltered}
                                                            >
                                                                {areAllFilteredSelected ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Athletes List */}
                                                    <div className="athletes-list">
                                                        {athletesLoading ? (
                                                            <div className="athletes-loading">
                                                                <div className="spinner"></div>
                                                                <p>A carregar atletas...</p>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {filteredAthletes.map(athlete => {
                                                                    const isSelected = selectedAthletes.includes(athlete.athleteProfileId);
                                                                    const initials = athlete.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                                                                    return (
                                                                        <div
                                                                            key={athlete.id}
                                                                            className={`athlete-item${isSelected ? ' athlete-item--selected' : ''}`}
                                                                            onClick={() => toggleAthleteSelection(athlete.athleteProfileId)}
                                                                        >
                                                                            <div className={`athlete-avatar-sm${isSelected ? ' athlete-avatar-sm--selected' : ''}`}>
                                                                                {isSelected ? <FaUserCheck /> : initials}
                                                                            </div>
                                                                            <div className="athlete-info">
                                                                                <div className="athlete-name">{athlete.fullName}</div>
                                                                                <div className="athlete-details">
                                                                                    {getEmailBase(athlete.email)}
                                                                                    {athlete.nif && <span className="athlete-nif-tag">NIF: {athlete.nif}</span>}
                                                                                </div>
                                                                            </div>
                                                                            <div className={`athlete-select-indicator${isSelected ? ' athlete-select-indicator--on' : ''}`}>
                                                                                {isSelected ? <FaTimes /> : <FaPlus />}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}

                                                                {/* Already in team section */}
                                                                {athletesAlreadyInTeam.length > 0 && (
                                                                    <div className="already-in-team-section">
                                                                        <span className="already-in-team-label">
                                                                            <FaUserCheck /> Já na equipa
                                                                        </span>
                                                                        {athletesAlreadyInTeam.map(athlete => (
                                                                            <div key={athlete.id} className="athlete-item athlete-item--in-team">
                                                                                <div className="athlete-avatar-sm athlete-avatar-sm--in-team">
                                                                                    {athlete.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                                                </div>
                                                                                <div className="athlete-info">
                                                                                    <div className="athlete-name">{athlete.fullName}</div>
                                                                                    <div className="athlete-details">
                                                                                        {athlete.email}
                                                                                        {athlete.nif && <span className="athlete-nif-tag">NIF: {athlete.nif}</span>}
                                                                                    </div>
                                                                                </div>
                                                                                <span className="in-team-badge">Na equipa</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {filteredAthletes.length === 0 && athletesAlreadyInTeam.length === 0 && (
                                                                    <div className="no-results">
                                                                        <div className="no-results-icon">🔍</div>
                                                                        <p>Nenhum atleta encontrado.</p>
                                                                        {hasActiveFilters && (
                                                                            <button className="btn-add" onClick={clearSearchFilters}
                                                                                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', marginTop: '0.5rem' }}>
                                                                                Limpar Pesquisa
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right: Selected Athletes Panel */}
                                                <div className="add-athlete-selected-panel">
                                                    <div className="selected-panel-header">
                                                        <div className="selected-panel-title">
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
                                                    {/* Footer removed, button moved to header */}
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

export default TeamsManager;