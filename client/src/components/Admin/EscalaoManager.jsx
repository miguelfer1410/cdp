import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import './EscalaoManager.css';

const EscalaoManager = () => {
    const [escalaos, setEscalaos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sports, setSports] = useState([]);

    // Add Form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newMinAge, setNewMinAge] = useState('');
    const [newMaxAge, setNewMaxAge] = useState('');
    const [newSportIds, setNewSportIds] = useState([]);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [editingMinAge, setEditingMinAge] = useState('');
    const [editingMaxAge, setEditingMaxAge] = useState('');
    const [editingSportIds, setEditingSportIds] = useState([]);

    // Search & filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSportId, setFilterSportId] = useState('');

    useEffect(() => {
        fetchEscalaos();
        fetchSports();
    }, []);

    const fetchSports = async () => {
        try {
            const res = await fetch('http://localhost:5285/api/sports');
            if (res.ok) {
                const data = await res.json();
                setSports(data);
            }
        } catch (err) {
            console.error('Erro ao carregar modalidades:', err);
        }
    };

    const fetchEscalaos = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5285/api/escalaos/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEscalaos(data);
            }
        } catch (err) {
            console.error('Erro ao carregar escalões:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newName.trim()) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5285/api/escalaos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: newName.trim(),
                    minAge: newMinAge ? parseInt(newMinAge) : null,
                    maxAge: newMaxAge ? parseInt(newMaxAge) : null,
                    sportIds: newSportIds
                })
            });
            if (res.ok) {
                resetAddForm();
                await fetchEscalaos();
            } else {
                const err = await res.json();
                alert(err.message || 'Erro ao criar escalão');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editingName.trim()) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5285/api/escalaos/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: editingName.trim(),
                    minAge: editingMinAge ? parseInt(editingMinAge) : null,
                    maxAge: editingMaxAge ? parseInt(editingMaxAge) : null,
                    sportIds: editingSportIds
                })
            });
            if (res.ok) {
                setEditingId(null);
                await fetchEscalaos();
            } else {
                const err = await res.json();
                alert(err.message || 'Erro ao atualizar escalão');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Deseja eliminar o escalão "${name}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5285/api/escalaos/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchEscalaos();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (esc) => {
        setEditingId(esc.id);
        setEditingName(esc.name);
        setEditingMinAge(esc.minAge || '');
        setEditingMaxAge(esc.maxAge || '');
        setEditingSportIds(esc.sportIds || []);
        setShowAddForm(false);
    };

    const toggleSport = (id, list, setList) => {
        if (list.includes(id)) {
            setList(list.filter(s => s !== id));
        } else {
            setList([...list, id]);
        }
    };

    const resetAddForm = () => {
        setNewName('');
        setNewMinAge('');
        setNewMaxAge('');
        setNewSportIds([]);
        setShowAddForm(false);
    };

    const filteredEscalaos = escalaos.filter(e => {
        const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSport = !filterSportId ||
            (e.sportIds && e.sportIds.includes(parseInt(filterSportId)));
        return matchesSearch && matchesSport;
    });

    if (loading) {
        return (
            <div className="escalao-manager loading">
                <div className="spinner"></div>
                <p>A carregar configuração de escalões...</p>
            </div>
        );
    }

    return (
        <div className="escalao-manager">
            <header className="manager-header">
                <div className="header-info">
                    <h1>Gestão de Escalões</h1>
                    <p className="header-subtitle">Configurações de idade e modalidades aplicáveis por categoria.</p>
                </div>
                {!showAddForm && (
                    <button className="btn-add" onClick={() => setShowAddForm(true)}>
                        <FaPlus /> Novo Escalão
                    </button>
                )}
            </header>

            {showAddForm && (
                <div className="escalao-add-form-container">
                    <div className="escalao-add-form">
                        <div className="form-grid">
                            <div className="form-column">
                                <div className="form-group">
                                    <label>Nome da Categoria</label>
                                    <input
                                        type="text"
                                        className="escalao-input"
                                        placeholder="Ex: Sub-13, Iniciados..."
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Regras de Idade</label>
                                    <div className="form-row">
                                        <input
                                            type="number"
                                            className="escalao-input"
                                            placeholder="Mínima"
                                            value={newMinAge}
                                            onChange={(e) => setNewMinAge(e.target.value)}
                                        />
                                        <input
                                            type="number"
                                            className="escalao-input"
                                            placeholder="Máxima"
                                            value={newMaxAge}
                                            onChange={(e) => setNewMaxAge(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="form-column">
                                <div className="form-group">
                                    <label>Modalidades Associadas</label>
                                    <div className="sports-selection-area">
                                        <div className="sports-grid">
                                            {sports.map(s => (
                                                <label key={s.id} className={`sport-checkbox-label ${newSportIds.includes(s.id) ? 'selected' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={newSportIds.includes(s.id)}
                                                        onChange={() => toggleSport(s.id, newSportIds, setNewSportIds)}
                                                    />
                                                    {s.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button className="btn-cancel" onClick={resetAddForm}>Cancelar</button>
                            <button className="btn-save" onClick={handleAdd} disabled={submitting || !newName.trim()}>
                                {submitting ? <div className="spinner-small"></div> : <FaCheck />}
                                Criar Escalão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="manager-controls">
                <div className="escalao-search-bar">
                    <FaSearch className="escalao-search-icon" />
                    <input
                        type="text"
                        placeholder="Pesquisar escalões configurados..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="sport-filter-select"
                    value={filterSportId}
                    onChange={(e) => setFilterSportId(e.target.value)}
                >
                    <option value="">Todas as modalidades</option>
                    {sports.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            </div>

            <div className="escalao-table-container">
                <table className="escalao-table">
                    <thead>
                        <tr>
                            <th>Escalão</th>
                            <th>Idades</th>
                            <th>Modalidades</th>
                            <th style={{ textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEscalaos.map((esc) => (
                            <tr key={esc.id} className={editingId === esc.id ? 'editing-row' : ''}>
                                <td data-label="Escalão">
                                    {editingId === esc.id ? (
                                        <input
                                            type="text"
                                            className="escalao-input"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="escalao-name-cell">
                                            <span className="escalao-name">{esc.name}</span>
                                        </div>
                                    )}
                                </td>
                                <td data-label="Idades">
                                    {editingId === esc.id ? (
                                        <div className="age-inputs-inline">
                                            <input type="number" value={editingMinAge} onChange={e => setEditingMinAge(e.target.value)} />
                                            <span>—</span>
                                            <input type="number" value={editingMaxAge} onChange={e => setEditingMaxAge(e.target.value)} />
                                        </div>
                                    ) : (
                                        <div className="age-badge">
                                            <span className="age-range">
                                                {esc.minAge || esc.maxAge ? `${esc.minAge || 0} — ${esc.maxAge || '∞'}` : '0 — ∞'}
                                            </span>
                                            <span className="age-unit">anos</span>
                                        </div>
                                    )}
                                </td>
                                <td data-label="Modalidades">
                                    {editingId === esc.id ? (
                                        <div className="sports-grid-inline">
                                            {sports.map(s => (
                                                <label key={s.id} className={`sport-checkbox-compact ${editingSportIds.includes(s.id) ? 'selected' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editingSportIds.includes(s.id)}
                                                        onChange={() => toggleSport(s.id, editingSportIds, setEditingSportIds)}
                                                    />
                                                    {s.name}
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="sports-tags">
                                            {esc.sportIds && esc.sportIds.length > 0 ? (
                                                esc.sportIds.map(sId => {
                                                    const sportName = sports.find(sp => sp.id === sId)?.name || 'Sport';
                                                    return <span key={sId} className="sport-tag-pill">{sportName}</span>;
                                                })
                                            ) : (
                                                <span className="no-sports-text">Geral (Todas)</span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td data-label="Ações">
                                    {editingId === esc.id ? (
                                        <div className="inline-actions">
                                            <button className="escalao-action-btn save" onClick={handleUpdate}>
                                                <FaCheck />
                                            </button>
                                            <button className="escalao-action-btn cancel" onClick={() => setEditingId(null)}>
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="row-actions">
                                            <button className="action-btn edit" onClick={() => handleEdit(esc)}>
                                                <FaEdit />
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDelete(esc.id, esc.name)}>
                                                <FaTrash />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EscalaoManager;
