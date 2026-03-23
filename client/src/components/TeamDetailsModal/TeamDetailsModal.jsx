import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaUser, FaTshirt, FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import './TeamDetailsModal.css';

const TeamDetailsModal = ({ isOpen, onClose, teamData, isEditable = false, onTeamUpdate }) => {
    const [addingAthletes, setAddingAthletes] = useState(false);
    const [availableAthletes, setAvailableAthletes] = useState([]);
    const [selectedAthletes, setSelectedAthletes] = useState([]);
    const [athleteSearch, setAthleteSearch] = useState('');
    const [athletesLoading, setAthletesLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && isEditable && addingAthletes) {
            fetchAvailableAthletes();
        }
    }, [isOpen, isEditable, addingAthletes]);

    const fetchAvailableAthletes = async () => {
        setAthletesLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost.232:5285/api/users?profileType=athlete&isActive=true&pageSize=1000', {
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

    const getEmailBase = (email) => {
        if (!email) return '';
        const [localPart, domain] = email.split('@');
        if (!localPart || !domain) return email;
        const [base] = localPart.split('+');
        return `${base}@${domain}`;
    };

    const filteredAthletes = useMemo(() => {
        const term = athleteSearch.toLowerCase().trim();
        return availableAthletes.filter(athlete => {
            const isInTeam = teamData?.athletes?.some(a => a.userId === athlete.id);
            if (isInTeam) return false;
            if (!term) return true;
            return (
                athlete.fullName.toLowerCase().includes(term) ||
                (athlete.nif && athlete.nif.toLowerCase().includes(term)) ||
                getEmailBase(athlete.email).toLowerCase().includes(term)
            );
        });
    }, [availableAthletes, athleteSearch, teamData]);

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
            const response = await fetch(`http://localhost.232:5285/api/teams/${teamData.id}/athletes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ athleteProfileIds: selectedAthletes })
            });
            if (response.ok) {
                alert('Atletas adicionados com sucesso!');
                setSelectedAthletes([]);
                setAddingAthletes(false);
                if (onTeamUpdate) onTeamUpdate();
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

    const handleRemoveAthlete = async (athleteProfileId) => {
        if (!window.confirm('Tem a certeza que deseja remover este atleta da equipa?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/teams/${teamData.id}/athletes/${athleteProfileId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                alert('Atleta removido com sucesso!');
                if (onTeamUpdate) onTeamUpdate();
            } else {
                const error = await response.json();
                alert(error.message || 'Erro ao remover atleta');
            }
        } catch (error) {
            console.error('Error removing athlete:', error);
            alert('Erro ao remover atleta');
        }
    };

    if (!isOpen || !teamData) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onMouseDown={handleOverlayClick}>
            <div className={`modal-content team-modal-content ${addingAthletes ? 'expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><i className="fas fa-users"></i> {teamData.name} - Plantel Completo</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="team-modal-body-container">
                    <div className="team-modal-body">
                        {/* Coaches Section */}
                        <div className="team-section">
                            <h3><i className="fas fa-chalkboard-teacher"></i> Equipa Técnica</h3>
                            <div className="team-list">
                                {teamData.coaches?.map((coach) => (
                                    <div className="team-list-item" key={`coach-${coach.id}`}>
                                        <div className="member-avatar coach-avatar">
                                            {coach.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <div className="member-info">
                                            <h4>{coach.name}</h4>
                                            <p>Treinador</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Athletes Section */}
                        <div className="team-section">
                            <div className="team-section-header">
                                <h3><i className="fas fa-running"></i> Atletas</h3>
                                {isEditable && !addingAthletes && (
                                    <button className="add-athlete-btn" onClick={() => setAddingAthletes(true)}>
                                        <FaPlus /> Adicionar Atletas
                                    </button>
                                )}
                            </div>
                            <div className="team-list">
                                {teamData.athletes?.map((athlete) => (
                                    <div className="team-list-item" key={`athlete-${athlete.id}`}>
                                        <div className="member-avatar athlete-avatar">
                                            {athlete.jerseyNumber || athlete.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                        </div>
                                        <div className="member-info">
                                            <h4>{athlete.name}</h4>
                                            <p>
                                                {athlete.position || 'Atleta'}
                                                {athlete.isCaptain && <span className="captain-badge">• Capitão</span>}
                                            </p>
                                        </div>
                                        {isEditable && (
                                            <button
                                                className="remove-athlete-btn"
                                                onClick={() => handleRemoveAthlete(athlete.athleteProfileId || athlete.id)}
                                                title="Remover Atleta"
                                            >
                                                <FaTrash />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {teamData.athletes?.length === 0 && (
                                    <div className="no-athletes-msg">Sem atletas na equipa.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Add Athletes Panel */}
                    {isEditable && addingAthletes && (
                        <div className="add-athletes-panel">
                            <div className="add-athletes-header">
                                <h3>Adicionar Atletas</h3>
                                <button className="close-panel-btn" onClick={() => { setAddingAthletes(false); setSelectedAthletes([]); setAthleteSearch(''); }}>
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="add-athletes-search">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por nome, NIF ou email..."
                                    value={athleteSearch}
                                    onChange={(e) => setAthleteSearch(e.target.value)}
                                />
                            </div>

                            <div className="available-athletes-list">
                                {athletesLoading ? (
                                    <div className="loading-athletes">A carregar atletas...</div>
                                ) : filteredAthletes.length > 0 ? (
                                    filteredAthletes.map(athlete => {
                                        const isSelected = selectedAthletes.includes(athlete.athleteProfileId);
                                        return (
                                            <div
                                                key={athlete.id}
                                                className={`available-athlete-item ${isSelected ? 'selected' : ''}`}
                                                onClick={() => toggleAthleteSelection(athlete.athleteProfileId)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => { }} // Handled by div click
                                                    className="athlete-checkbox"
                                                />
                                                <div className="available-athlete-info">
                                                    <strong>{athlete.fullName}</strong>
                                                    <span>{athlete.nif ? `NIF: ${athlete.nif}` : 'Sem NIF'} | {getEmailBase(athlete.email)}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="no-athletes-found">Nenhum atleta encontrado.</div>
                                )}
                            </div>

                            <div className="add-athletes-actions">
                                <span className="selected-count">
                                    {selectedAthletes.length} {selectedAthletes.length === 1 ? 'selecionado' : 'selecionados'}
                                </span>
                                <button
                                    className="confirm-add-btn"
                                    onClick={handleAddAthletes}
                                    disabled={selectedAthletes.length === 0 || submitting}
                                >
                                    {submitting ? 'A Adicionar...' : 'Adicionar Selecionados'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamDetailsModal;
