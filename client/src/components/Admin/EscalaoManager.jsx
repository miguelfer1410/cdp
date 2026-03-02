import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import './EscalaoManager.css';

const EscalaoManager = () => {
    const [escalaos, setEscalaos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Inline add state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');

    // Inline edit state
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');

    // Search state
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEscalaos();
    }, []);

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

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5285/api/escalaos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (res.ok) {
                setNewName('');
                setShowAddForm(false);
                await fetchEscalaos();
            } else {
                const err = await res.json();
                alert(err.message || 'Erro ao criar escalão');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao criar escalão');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (id) => {
        if (!editingName.trim()) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5285/api/escalaos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ name: editingName.trim() })
            });
            if (res.ok) {
                setEditingId(null);
                setEditingName('');
                await fetchEscalaos();
            } else {
                const err = await res.json();
                alert(err.message || 'Erro ao atualizar escalão');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar escalão');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Tem a certeza que deseja eliminar o escalão "${name}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5285/api/escalaos/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchEscalaos();
            } else {
                const err = await res.json();
                alert(err.message || 'Erro ao eliminar escalão');
            }
        } catch (err) {
            console.error(err);
            alert('Erro ao eliminar escalão');
        }
    };

    const startEdit = (escalao) => {
        setEditingId(escalao.id);
        setEditingName(escalao.name);
        setShowAddForm(false);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    if (loading) {
        return (
            <div className="escalao-manager">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>A carregar escalões...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="escalao-manager">
            <div className="manager-header">
                <div className="header-content">
                    <h1>Gestão de Escalões</h1>
                    <p className="header-subtitle">
                        {escalaos.length} {escalaos.length === 1 ? 'escalão' : 'escalões'} registado{escalaos.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button className="btn-add" onClick={() => { setShowAddForm(true); setEditingId(null); }}>
                    <FaPlus /> Novo Escalão
                </button>
            </div>

            <div className="manager-controls">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Pesquisar escalão..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Inline Add Form */}
            {showAddForm && (
                <div className="escalao-add-form">
                    <input
                        type="text"
                        className="escalao-input"
                        placeholder="Nome do escalão (ex: Sub-7, Sénior...)"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowAddForm(false); }}
                        autoFocus
                    />
                    <button
                        className="escalao-action-btn save"
                        onClick={handleCreate}
                        disabled={submitting || !newName.trim()}
                        title="Guardar"
                    >
                        <FaCheck />
                    </button>
                    <button
                        className="escalao-action-btn cancel"
                        onClick={() => { setShowAddForm(false); setNewName(''); }}
                        title="Cancelar"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {escalaos.length === 0 && !showAddForm ? (
                <div className="empty-state">
                    <div className="empty-icon">🏅</div>
                    <h3>Nenhum escalão registado</h3>
                    <p>Comece por criar o primeiro escalão</p>
                    <button className="btn-add" onClick={() => setShowAddForm(true)}>
                        <FaPlus /> Criar Primeiro Escalão
                    </button>
                </div>
            ) : (
                <div className="escalao-table-container">
                    <table className="escalao-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th className="th-actions">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {escalaos
                                .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(e => (
                                    <tr key={e.id} className={editingId === e.id ? 'editing-row' : ''}>
                                        <td data-label="Nome">
                                            {editingId === e.id ? (
                                                <input
                                                    type="text"
                                                    className="escalao-input inline"
                                                    value={editingName}
                                                    onChange={(ev) => setEditingName(ev.target.value)}
                                                    onKeyDown={(ev) => { if (ev.key === 'Enter') handleUpdate(e.id); if (ev.key === 'Escape') cancelEdit(); }}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="escalao-name">{e.name}</span>
                                            )}
                                        </td>
                                        <td data-label="Ações">
                                            <div className="actions-cell">
                                                {editingId === e.id ? (
                                                    <>
                                                        <button
                                                            className="escalao-action-btn save"
                                                            onClick={() => handleUpdate(e.id)}
                                                            disabled={submitting || !editingName.trim()}
                                                            title="Guardar"
                                                        >
                                                            <FaCheck />
                                                        </button>
                                                        <button
                                                            className="escalao-action-btn cancel"
                                                            onClick={cancelEdit}
                                                            title="Cancelar"
                                                        >
                                                            <FaTimes />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="action-btn edit"
                                                            onClick={() => startEdit(e)}
                                                            title="Editar nome"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handleDelete(e.id, e.name)}
                                                            title="Eliminar"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EscalaoManager;
