import React, { useState } from 'react';
import { FaSync, FaSearch, FaChevronDown, FaChevronUp, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './PromotionManager.css';

const PromotionManager = () => {
    const [preview, setPreview] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]); // Array of { athleteId, currentTeamId, targetTeamId }
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [message, setMessage] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Promotion'); // 'Promotion' or 'Relegation'

    const handleFetchPreview = async () => {
        setLoading(true);
        setMessage(null);
        setPreview([]); // Garantir refresh total
        setSelectedItems([]);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5285/api/escalaos/preview-promotion', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPreview(data);
                // Pré-selecionar todos os que têm equipa de destino
                const initialSelected = data
                    .filter(item => item.targetTeamId)
                    .map(item => ({
                        athleteId: item.athleteId,
                        currentTeamId: item.currentTeamId,
                        targetTeamId: item.targetTeamId
                    }));
                setSelectedItems(initialSelected);
                setShowPreview(true);
            } else {
                setMessage({ type: 'error', text: 'Erro ao obter pré-visualização' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro de ligação ao servidor' });
        } finally {
            setLoading(false);
        }
    };

    const toggleSelect = (item) => {
        if (!item.targetTeamId) return;

        const isSelected = selectedItems.some(s => s.athleteId === item.athleteId && s.currentTeamId === item.currentTeamId);
        if (isSelected) {
            setSelectedItems(selectedItems.filter(s => !(s.athleteId === item.athleteId && s.currentTeamId === item.currentTeamId)));
        } else {
            setSelectedItems([...selectedItems, {
                athleteId: item.athleteId,
                currentTeamId: item.currentTeamId,
                targetTeamId: item.targetTeamId
            }]);
        }
    };

    const toggleSelectAll = () => {
        const selectableInView = filteredPreview.filter(item => item.targetTeamId);
        const allSelectableInViewSelected = selectableInView.every(item => isItemSelected(item));

        if (allSelectableInViewSelected) {
            // Unselect only those in current filtered view
            const idsToRemove = new Set(selectableInView.map(i => `${i.athleteId}-${i.currentTeamId}`));
            setSelectedItems(selectedItems.filter(s => !idsToRemove.has(`${s.athleteId}-${s.currentTeamId}`)));
        } else {
            // Add those not already selected from current view
            const newSelections = [...selectedItems];
            selectableInView.forEach(item => {
                if (!isItemSelected(item)) {
                    newSelections.push({
                        athleteId: item.athleteId,
                        currentTeamId: item.currentTeamId,
                        targetTeamId: item.targetTeamId
                    });
                }
            });
            setSelectedItems(newSelections);
        }
    };

    const handlePromote = async () => {
        if (selectedItems.length === 0) {
            alert('Por favor, selecione pelo menos um atleta.');
            return;
        }

        const msg = activeTab === 'Promotion'
            ? `Tem a certeza que deseja promover ${selectedItems.length} atleta(s)?`
            : `Tem a certeza que deseja ajustar o escalão de ${selectedItems.length} atleta(s)?`;

        if (!window.confirm(msg)) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5285/api/escalaos/promote', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectedItems)
            });
            if (res.ok) {
                const data = await res.json();
                setMessage({ type: 'success', text: `${data.promotedCount} atleta(s) promovido(s) com sucesso!` });
                setPreview([]);
                setSelectedItems([]);
                setShowPreview(false);
            } else {
                const errData = await res.json();
                setMessage({ type: 'error', text: errData.message || 'Erro ao executar promoção' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Erro de ligação ao servidor' });
        } finally {
            setSubmitting(false);
        }
    };

    const isItemSelected = (item) => selectedItems.some(s => s.athleteId === item.athleteId && s.currentTeamId === item.currentTeamId);

    const filteredPreview = preview.filter(item => {
        // Filter by tab
        if (activeTab === 'Promotion' && item.movementType !== 'Promotion') return false;
        if (activeTab === 'Relegation' && item.movementType === 'Promotion') return false;

        const search = searchTerm.toLowerCase().trim();
        if (!search) return true;

        return (
            item.athleteName.toLowerCase().includes(search) ||
            item.currentTeamName.toLowerCase().includes(search) ||
            item.sportName.toLowerCase().includes(search) ||
            item.newEscalaoName.toLowerCase().includes(search)
        );
    });

    return (
        <div className="promotion-manager">
            <div className="promotion-actions-bar">
                <div className="action-buttons">
                    <button
                        className="btn-preview"
                        onClick={handleFetchPreview}
                        disabled={loading || submitting}
                    >
                        {loading ? <div className="spinner-small"></div> : <FaSync className={loading ? 'spinning' : ''} />}
                        {showPreview ? 'Atualizar Dados' : 'Analisar Promoções'}
                    </button>

                    {preview.length > 0 && (
                        <button
                            className="btn-promote"
                            onClick={handlePromote}
                            disabled={submitting || selectedItems.length === 0}
                        >
                            {submitting ? <div className="spinner-small"></div> : <FaCheckCircle />}
                            Confirmar Promoções ({selectedItems.length})
                        </button>
                    )}
                </div>

                {message && (
                    <div className={`promotion-status-message ${message.type}`}>
                        {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                        {message.text}
                    </div>
                )}
            </div>

            {showPreview && (
                <div className="preview-content-area">
                    <div className="preview-controls">
                        <div className="promotion-tabs-container">
                            <button
                                className={`tab-pill ${activeTab === 'Promotion' ? 'active' : ''}`}
                                onClick={() => setActiveTab('Promotion')}
                            >
                                <span className="tab-label">Subidas</span>
                                <span className="tab-count">{preview.filter(i => i.movementType === 'Promotion').length}</span>
                            </button>
                            <button
                                className={`tab-pill ${activeTab === 'Relegation' ? 'active' : ''}`}
                                onClick={() => setActiveTab('Relegation')}
                            >
                                <span className="tab-label">Descidas / Ajustes</span>
                                <span className="tab-count">{preview.filter(i => i.movementType !== 'Promotion').length}</span>
                            </button>
                        </div>

                        <div className="preview-search-box">
                            <div className="search-field">
                                <FaSearch className="search-icon-fixed" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar por atleta, equipa ou modalidade..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                {searchTerm && (
                                    <button className="search-clear-btn" onClick={() => setSearchTerm('')}>&times;</button>
                                )}
                            </div>
                        </div>
                    </div>

                    {filteredPreview.length === 0 ? (
                        <div className="empty-results">
                            <FaExclamationTriangle className="empty-icon" />
                            <p>Nenhum atleta encontrado para os critérios selecionados.</p>
                        </div>
                    ) : (
                        <div className="promotion-table-container">
                            <table className="modern-promotion-table">
                                <thead>
                                    <tr>
                                        <th className="col-check">
                                            <input
                                                type="checkbox"
                                                checked={filteredPreview.length > 0 && filteredPreview.filter(i => i.targetTeamId).every(isItemSelected)}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th>Atleta</th>
                                        <th>Idade</th>
                                        <th>Equipa Atual</th>
                                        <th>Destino Sugerido</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPreview.map((item, idx) => (
                                        <tr key={idx} className={`${!item.targetTeamId ? 'row-no-target' : ''} ${isItemSelected(item) ? 'row-selected' : ''}`}>
                                            <td className="col-check">
                                                <input
                                                    type="checkbox"
                                                    checked={isItemSelected(item)}
                                                    onChange={() => toggleSelect(item)}
                                                    disabled={!item.targetTeamId}
                                                />
                                            </td>
                                            <td>
                                                <div className="athlete-profile-cell">
                                                    <span className="athlete-name-text">{item.athleteName}</span>
                                                    <span className="athlete-birth-date">{new Date(item.birthDate).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td><span className="age-text">{item.age} anos</span></td>
                                            <td>
                                                <div className="team-context-cell">
                                                    <span className="team-name-label">{item.currentTeamName}</span>
                                                    <span className="sport-name-sublabel">{item.sportName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="destination-cell">
                                                    <span className="dest-team-label">{item.targetTeamName}</span>
                                                    <span className="dest-sport-badge">
                                                        {item.sportName}
                                                        {(item.targetMinAge != null || item.targetMaxAge != null) && (
                                                            <span className="age-bracket"> • {item.targetMinAge ?? '?'}–{item.targetMaxAge ?? '?'} anos</span>
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PromotionManager;
