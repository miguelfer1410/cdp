import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaImage, FaHandshake, FaEye, FaEyeSlash, FaSortNumericDown } from 'react-icons/fa';
import './PartnersManager.css';

const PartnersManager = () => {
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPartner, setEditingPartner] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        websiteUrl: '',
        description: '',
        order: 0,
        isActive: true,
        logo: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchPartners();
    }, []);

    const fetchPartners = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/partners/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setPartners(data);
            }
        } catch (error) {
            console.error('Error fetching partners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const formDataToSend = new FormData();

        formDataToSend.append('name', formData.name);
        formDataToSend.append('websiteUrl', formData.websiteUrl || '');
        formDataToSend.append('description', formData.description || '');
        formDataToSend.append('order', formData.order);
        formDataToSend.append('isActive', formData.isActive);

        if (formData.logo) {
            formDataToSend.append('logo', formData.logo);
        }

        try {
            const url = editingPartner
                ? `http://localhost:5285/api/partners/${editingPartner.id}`
                : 'http://localhost:5285/api/partners';

            const method = editingPartner ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formDataToSend
            });

            if (response.ok) {
                setShowModal(false);
                resetForm();
                fetchPartners();
            } else {
                alert('Erro ao guardar parceiro');
            }
        } catch (error) {
            console.error('Error saving partner:', error);
            alert('Erro ao guardar parceiro');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar este parceiro?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/partners/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchPartners();
            }
        } catch (error) {
            console.error('Error deleting partner:', error);
        }
    };

    const handleEdit = (partner) => {
        setEditingPartner(partner);
        setFormData({
            name: partner.name,
            websiteUrl: partner.websiteUrl || '',
            description: partner.description || '',
            order: partner.order,
            isActive: partner.isActive,
            logo: null
        });
        if (partner.logoUrl) {
            setPreviewUrl(getImageUrl(partner.logoUrl));
        }
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            websiteUrl: '',
            description: '',
            order: 0,
            isActive: true,
            logo: null
        });
        setEditingPartner(null);
        setPreviewUrl(null);
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, logo: file });

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const getImageUrl = (logoUrl) => {
        if (!logoUrl) return null;
        if (logoUrl.startsWith('http')) return logoUrl;
        return `http://localhost:5285${logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl}`;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>A carregar parceiros...</p>
            </div>
        );
    }

    return (
        <div className="partners-manager">
            <div className="manager-header">
                <div className="header-content">
                    <h1>Gestão de Parceiros Institucionais</h1>
                    <p className="header-subtitle">Gerir logos e informações dos parceiros do clube</p>
                </div>
                <button className="btn-add" onClick={() => setShowModal(true)}>
                    <FaPlus /> Novo Parceiro
                </button>
            </div>

            {partners.length === 0 ? (
                <div className="empty-state">
                    <FaHandshake className="empty-icon" />
                    <h3>Nenhum parceiro adicionado</h3>
                    <p>Adicione o primeiro parceiro institucional</p>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        <FaPlus /> Novo Parceiro
                    </button>
                </div>
            ) : (
                <div className="partners-grid">
                    {partners.map((partner) => (
                        <div key={partner.id} className="partner-card">
                            <div className="partner-logo-wrapper">
                                {partner.logoUrl ? (
                                    <img
                                        src={getImageUrl(partner.logoUrl)}
                                        alt={partner.name}
                                        className="partner-logo"
                                    />
                                ) : (
                                    <div className="partner-no-logo">
                                        <FaHandshake />
                                    </div>
                                )}
                                <div className="partner-overlay">
                                    <button
                                        className="overlay-btn edit"
                                        onClick={() => handleEdit(partner)}
                                        title="Editar"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="overlay-btn delete"
                                        onClick={() => handleDelete(partner.id)}
                                        title="Eliminar"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            <div className="partner-info">
                                <h3>{partner.name}</h3>
                                {partner.websiteUrl && (
                                    <a
                                        href={partner.websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="partner-website"
                                    >
                                        🔗 Website
                                    </a>
                                )}
                                <div className="partner-badges">
                                    <span className={`badge ${partner.isActive ? 'badge-active' : 'badge-inactive'}`}>
                                        {partner.isActive ? <><FaEye /> Ativo</> : <><FaEyeSlash /> Inativo</>}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}</h2>
                            <button
                                className="modal-close"
                                onClick={() => { setShowModal(false); resetForm(); }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <label className="form-label">Nome do Parceiro *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Câmara Municipal da Póvoa de Varzim"
                                    required
                                />
                            </div>

                            <div className="form-section">
                                <label className="form-label">Website (URL)</label>
                                <input
                                    type="url"
                                    className="form-input"
                                    value={formData.websiteUrl}
                                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                                    placeholder="https://exemplo.pt"
                                />
                            </div>

                            <div className="form-section">
                                <label className="form-label">Logo do Parceiro *</label>

                                <div className="image-upload-area">
                                    {previewUrl ? (
                                        <div className="image-preview logo-preview">
                                            <img src={previewUrl} alt="Preview" />
                                            <button
                                                type="button"
                                                className="btn-change-image"
                                                onClick={() => document.getElementById('logoInput').click()}
                                            >
                                                <FaImage /> Alterar Logo
                                            </button>
                                        </div>
                                    ) : (
                                        <label htmlFor="logoInput" className="upload-label">
                                            <FaImage className="upload-icon" />
                                            <span>Clique para selecionar o logo</span>
                                            <small>Formatos: PNG, SVG (recomendado: fundo transparente)</small>
                                        </label>
                                    )}
                                    <input
                                        id="logoInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                        required={!editingPartner}
                                    />
                                </div>
                            </div>

                            <div className="form-section">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span className="toggle-slider"></span>
                                    <span className="toggle-label">
                                        {formData.isActive ? 'Parceiro Ativo' : 'Parceiro Inativo'}
                                    </span>
                                </label>
                                <small className="form-hint">
                                    Apenas parceiros ativos aparecem no website público
                                </small>
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-submit">
                                    {editingPartner ? 'Atualizar Parceiro' : 'Adicionar Parceiro'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnersManager;