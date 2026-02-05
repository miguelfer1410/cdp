import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaFutbol, FaSortNumericDown } from 'react-icons/fa';
import './SportsManager.css';

const SportsManager = () => {
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingSport, setEditingSport] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        schedule: '',
        contactInfo: '',
        order: 0,
        isActive: true,
        image: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        fetchSports();
    }, []);

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
                setSports(data);
            }
        } catch (error) {
            console.error('Error fetching sports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const token = localStorage.getItem('token');
        const formDataToSend = new FormData();

        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('schedule', formData.schedule || '');
        formDataToSend.append('contactInfo', formData.contactInfo || '');
        formDataToSend.append('order', formData.order);
        formDataToSend.append('isActive', formData.isActive);

        if (formData.image) {
            formDataToSend.append('image', formData.image);
        }

        try {
            const url = editingSport
                ? `http://localhost:5285/api/sports/${editingSport.id}`
                : 'http://localhost:5285/api/sports';

            const method = editingSport ? 'PUT' : 'POST';

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
                fetchSports();
            } else {
                alert('Erro ao guardar modalidade');
            }
        } catch (error) {
            console.error('Error saving sport:', error);
            alert('Erro ao guardar modalidade');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar esta modalidade?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/sports/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchSports();
            }
        } catch (error) {
            console.error('Error deleting sport:', error);
        }
    };

    const handleEdit = (sport) => {
        setEditingSport(sport);
        setFormData({
            name: sport.name,
            description: sport.description,
            schedule: sport.schedule || '',
            contactInfo: sport.contactInfo || '',
            order: sport.order,
            isActive: sport.isActive,
            image: null
        });
        if (sport.imageUrl) {
            setPreviewUrl(getImageUrl(sport.imageUrl));
        }
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            schedule: '',
            contactInfo: '',
            order: 0,
            isActive: true,
            image: null
        });
        setEditingSport(null);
        setPreviewUrl(null);
    };

    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData({ ...formData, image: file });

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
                <p>A carregar modalidades...</p>
            </div>
        );
    }

    return (
        <div className="sports-manager">
            <div className="manager-header">
                <div className="header-content">
                    <h1>Modalidades Desportivas</h1>
                    <p className="header-subtitle">Gerir informações das modalidades do clube</p>
                </div>
                <button className="btn-add" onClick={() => setShowModal(true)}>
                    <FaPlus /> Adicionar Modalidade
                </button>
            </div>

            {sports.length === 0 ? (
                <div className="empty-state">
                    <FaFutbol className="empty-icon" />
                    <h3>Nenhuma modalidade adicionada</h3>
                    <p>Adicione a primeira modalidade desportiva do clube</p>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        <FaPlus /> Adicionar Modalidade
                    </button>
                </div>
            ) : (
                <div className="sports-grid">
                    {sports.map((sport) => (
                        <div key={sport.id} className="sport-card">
                            <div className="sport-image-wrapper">
                                {sport.imageUrl ? (
                                    <img
                                        src={getImageUrl(sport.imageUrl)}
                                        alt={sport.name}
                                        className="sport-image"
                                    />
                                ) : (
                                    <div className="sport-no-image">
                                        <FaFutbol />
                                    </div>
                                )}
                                <div className="sport-overlay">
                                    <button
                                        className="overlay-btn edit"
                                        onClick={() => handleEdit(sport)}
                                        title="Editar"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="overlay-btn delete"
                                        onClick={() => handleDelete(sport.id)}
                                        title="Eliminar"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            <div className="sport-info">
                                <h3>{sport.name}</h3>
                                <p className="sport-description">{sport.description.substring(0, 100)}...</p>
                                <div className="sport-badges">
                                    <span className={`badge ${sport.isActive ? 'badge-active' : 'badge-inactive'}`}>
                                        {sport.isActive ? <><FaEye /> Ativo</> : <><FaEyeSlash /> Inativo</>}
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
                            <h2>{editingSport ? 'Editar Modalidade' : 'Nova Modalidade'}</h2>
                            <button
                                className="modal-close"
                                onClick={() => { setShowModal(false); resetForm(); }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <label className="form-label">Nome da Modalidade *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Basquetebol"
                                    required
                                />
                            </div>

                            <div className="form-section">
                                <label className="form-label">Descrição *</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição detalhada da modalidade..."
                                    rows="4"
                                    required
                                />
                            </div>

                            <div className="form-section">
                                <label className="form-label">Imagem da Modalidade</label>

                                <div className="image-upload-area">
                                    {previewUrl ? (
                                        <div className="image-preview">
                                            <img src={previewUrl} alt="Preview" />
                                            <button
                                                type="button"
                                                className="btn-change-image"
                                                onClick={() => document.getElementById('imageInput').click()}
                                            >
                                                <FaFutbol /> Alterar Imagem
                                            </button>
                                        </div>
                                    ) : (
                                        <label htmlFor="imageInput" className="upload-label">
                                            <FaFutbol className="upload-icon" />
                                            <span>Clique para selecionar uma imagem</span>
                                            <small>Formatos: JPG, PNG, WebP</small>
                                        </label>
                                    )}
                                    <input
                                        id="imageInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
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
                                        {formData.isActive ? 'Modalidade Ativa' : 'Modalidade Inativa'}
                                    </span>
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
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                                            A guardar...
                                        </>
                                    ) : (
                                        editingSport ? 'Atualizar Modalidade' : 'Criar Modalidade'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SportsManager;