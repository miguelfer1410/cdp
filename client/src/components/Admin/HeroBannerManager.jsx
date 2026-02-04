import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaImage, FaSortNumericDown } from 'react-icons/fa';
import './HeroBannerManager.css';

const HeroBannerManager = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBanner, setEditingBanner] = useState(null);
    const [formData, setFormData] = useState({
        order: 0,
        isActive: true,
        image: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/herobanner/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setBanners(data);
            }
        } catch (error) {
            console.error('Error fetching banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const formDataToSend = new FormData();

        if (formData.image) {
            formDataToSend.append('image', formData.image);
        }
        formDataToSend.append('order', formData.order);
        formDataToSend.append('isActive', formData.isActive);

        try {
            const url = editingBanner
                ? `http://localhost:5285/api/herobanner/${editingBanner.id}`
                : 'http://localhost:5285/api/herobanner';

            const method = editingBanner ? 'PUT' : 'POST';

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
                fetchBanners();
            } else {
                alert('Erro ao guardar banner');
            }
        } catch (error) {
            console.error('Error saving banner:', error);
            alert('Erro ao guardar banner');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar este banner?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/herobanner/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchBanners();
            }
        } catch (error) {
            console.error('Error deleting banner:', error);
        }
    };

    const handleEdit = (banner) => {
        setEditingBanner(banner);
        setFormData({
            order: banner.order,
            isActive: banner.isActive,
            image: null
        });
        setPreviewUrl(getImageUrl(banner.imageUrl));
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            order: 0,
            isActive: true,
            image: null
        });
        setEditingBanner(null);
        setPreviewUrl(null);
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, image: file });

            // Preview da imagem
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return null;
        if (imageUrl.startsWith('http')) return imageUrl;
        return `http://localhost:5285${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>A carregar banners...</p>
            </div>
        );
    }

    return (
        <div className="hero-banner-manager">
            <div className="manager-header">
                <div className="header-content">
                    <h1>Hero Banners</h1>
                    <p className="header-subtitle">Gerir imagens do carrossel principal</p>
                </div>
                <button className="btn-add" onClick={() => setShowModal(true)}>
                    <FaPlus /> Adicionar Banner
                </button>
            </div>

            {banners.length === 0 ? (
                <div className="empty-state">
                    <FaImage className="empty-icon" />
                    <h3>Nenhum banner adicionado</h3>
                    <p>Adicione o primeiro banner para começar o carrossel</p>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        <FaPlus /> Adicionar Banner
                    </button>
                </div>
            ) : (
                <div className="banners-grid">
                    {banners.map((banner) => (
                        <div key={banner.id} className="banner-card">
                            <div className="banner-image-wrapper">
                                <img
                                    src={getImageUrl(banner.imageUrl)}
                                    alt="Hero Banner"
                                    className="banner-image"
                                />
                                <div className="banner-overlay">
                                    <button
                                        className="overlay-btn edit"
                                        onClick={() => handleEdit(banner)}
                                        title="Editar"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="overlay-btn delete"
                                        onClick={() => handleDelete(banner.id)}
                                        title="Eliminar"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            <div className="banner-info">
                                <div className="banner-badges">
                                    <span className={`badge ${banner.isActive ? 'badge-active' : 'badge-inactive'}`}>
                                        {banner.isActive ? <><FaEye /> Ativo</> : <><FaEyeSlash /> Inativo</>}
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
                            <h2>{editingBanner ? 'Editar Banner' : 'Novo Banner'}</h2>
                            <button
                                className="modal-close"
                                onClick={() => { setShowModal(false); resetForm(); }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <label className="form-label">
                                    Imagem {!editingBanner && '*'}
                                </label>

                                <div className="image-upload-area">
                                    {previewUrl ? (
                                        <div className="image-preview">
                                            <img src={previewUrl} alt="Preview" />
                                            <button
                                                type="button"
                                                className="btn-change-image"
                                                onClick={() => document.getElementById('imageInput').click()}
                                            >
                                                <FaImage /> Alterar Imagem
                                            </button>
                                        </div>
                                    ) : (
                                        <label htmlFor="imageInput" className="upload-label">
                                            <FaImage className="upload-icon" />
                                            <span>Clique para selecionar uma imagem</span>
                                            <small>Formatos: JPG, PNG, WebP</small>
                                        </label>
                                    )}
                                    <input
                                        id="imageInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        required={!editingBanner}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                                <small className="form-hint">
                                    A imagem será otimizada automaticamente para WebP
                                </small>
                            </div>

                            <div className="form-row">
                                <div className="form-section">
                                    <label className="form-label">Ordem de Apresentação</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                        min="0"
                                    />
                                    <small className="form-hint">
                                        Ordem crescente (0, 1, 2...)
                                    </small>
                                </div>

                                <div className="form-section">
                                    <label className="form-label">Estado</label>
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span className="toggle-label">
                                            {formData.isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </label>
                                </div>
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
                                    {editingBanner ? 'Atualizar Banner' : 'Criar Banner'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroBannerManager;