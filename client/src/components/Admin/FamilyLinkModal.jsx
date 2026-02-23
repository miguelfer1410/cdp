import React, { useState, useEffect } from 'react';
import { FaUserFriends, FaSearch, FaTimes, FaPlus, FaTrash, FaUser, FaCheck } from 'react-icons/fa';
import './FamilyLinkModal.css';

const FamilyLinkModal = ({ isOpen, onClose, user }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentLinks, setCurrentLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const API_URL = process.env.REACT_APP_API_URL || 'http://51.178.43.232:5285/api';

    useEffect(() => {
        if (isOpen && user) {
            fetchCurrentLinks();
        }
    }, [isOpen, user]);

    const fetchCurrentLinks = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/${user.id}/family-links`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setCurrentLinks(data);
            }
        } catch (err) {
            console.error('Error fetching links:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (term.length < 3) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users?search=${encodeURIComponent(term)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Filter out the current user and users already linked
                const filtered = data.filter(u =>
                    u.id !== user.id &&
                    !currentLinks.some(link => link.userId === u.id)
                );
                setSearchResults(filtered);
            }
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleAddLink = async (linkedUserId) => {
        setError(null);
        setSuccess(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/${user.id}/family-links`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ linkedUserId })
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Associação criada com sucesso!');
                setSearchTerm('');
                setSearchResults([]);
                fetchCurrentLinks();
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.message || 'Erro ao criar associação.');
            }
        } catch (err) {
            setError('Erro de conexão com o servidor.');
        }
    };

    const handleRemoveLink = async (linkId) => {
        if (!window.confirm('Tem a certeza que deseja remover esta associação familiar?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_URL}/users/${user.id}/family-links/${linkId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setSuccess('Associação removida.');
                fetchCurrentLinks();
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            setError('Erro ao remover associação.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fam-link-overlay" onClick={onClose}>
            <div className="fam-link-modal" onClick={e => e.stopPropagation()}>
                <div className="fam-link-header">
                    <div className="fam-link-title-group">
                        <FaUserFriends className="fam-link-main-icon" />
                        <div>
                            <h2>Associações Familiares</h2>
                            <p>Gerir ligações de <strong>{user.fullName}</strong></p>
                        </div>
                    </div>
                    <button className="fam-link-close" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="fam-link-body">
                    {/* Error/Success Messages */}
                    {error && <div className="fam-link-msg error">{error}</div>}
                    {success && <div className="fam-link-msg success">{success}</div>}

                    {/* Links List */}
                    <div className="fam-link-section">
                        <h3>Membros Associados ({currentLinks.length})</h3>
                        {loading ? (
                            <div className="fam-link-loading">A carregar ligações...</div>
                        ) : currentLinks.length > 0 ? (
                            <div className="fam-link-list">
                                {currentLinks.map(link => (
                                    <div key={link.linkId} className="fam-link-item">
                                        <div className="fam-link-user-info">
                                            <div className="fam-link-avatar"><FaUser /></div>
                                            <div>
                                                <div className="fam-link-name">{link.fullName}</div>
                                                <div className="fam-link-email">{link.email}</div>
                                            </div>
                                        </div>
                                        <button
                                            className="fam-link-delete-btn"
                                            onClick={() => handleRemoveLink(link.linkId)}
                                            title="Remover Associação"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="fam-link-empty">Nenhum familiar associado explicitamente.</div>
                        )}
                    </div>

                    <hr className="fam-link-divider" />

                    {/* Search Section */}
                    <div className="fam-link-section">
                        <h3>Adicionar Nova Associação</h3>
                        <p className="fam-link-help">Pesquise por nome ou email para associar um familiar.</p>
                        <div className="fam-link-search-wrapper">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Pesquisar utilizador..."
                                value={searchTerm}
                                onChange={handleSearch}
                                autoFocus
                            />
                            {searching && <div className="spinner-mini"></div>}
                        </div>

                        {searchResults.length > 0 && (
                            <div className="fam-link-results">
                                {searchResults.map(result => (
                                    <div key={result.id} className="fam-link-result-item">
                                        <div className="fam-link-user-info">
                                            <div className="fam-link-avatar"><FaUser /></div>
                                            <div>
                                                <div className="fam-link-name">{result.fullName}</div>
                                                <div className="fam-link-email">{result.email}</div>
                                            </div>
                                        </div>
                                        <button
                                            className="fam-link-add-btn"
                                            onClick={() => handleAddLink(result.id)}
                                        >
                                            <FaPlus /> Associar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchTerm.length >= 3 && searchResults.length === 0 && !searching && (
                            <div className="fam-link-no-results">Nenhum utilizador encontrado para "{searchTerm}".</div>
                        )}
                    </div>
                </div>

                <div className="fam-link-footer">
                    <button className="fam-link-done-btn" onClick={onClose}><FaCheck /> Concluído</button>
                </div>
            </div>
        </div>
    );
};

export default FamilyLinkModal;
