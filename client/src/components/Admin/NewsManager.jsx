import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaNewspaper, FaCalendarAlt, FaImage } from 'react-icons/fa';
import './NewsManager.css';

const NewsManager = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingNews, setEditingNews] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        category: '',
        isPublished: false,
        image: null
    });
    const [previewUrl, setPreviewUrl] = useState(null);

    const categories = [
        'Clube',
        'Atletismo',
        'Badminton',
        'Basquetebol',
        'Futevólei',
        'Futsal',
        'Hóquei em Patins',
        'Ténis de Mesa',
        'Voleibol'
    ];

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/news/admin/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNews(data);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const token = localStorage.getItem('token');
        const formDataToSend = new FormData();

        formDataToSend.append('title', formData.title);
        formDataToSend.append('excerpt', formData.excerpt);
        formDataToSend.append('content', formData.content);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('isPublished', formData.isPublished);

        if (formData.image) {
            formDataToSend.append('image', formData.image);
        }

        try {
            const url = editingNews
                ? `http://localhost:5285/api/news/${editingNews.id}`
                : 'http://localhost:5285/api/news';

            const method = editingNews ? 'PUT' : 'POST';

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
                fetchNews();
            } else {
                alert('Erro ao guardar notícia');
            }
        } catch (error) {
            console.error('Error saving news:', error);
            alert('Erro ao guardar notícia');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar esta notícia?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/news/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchNews();
            }
        } catch (error) {
            console.error('Error deleting news:', error);
        }
    };

    const handleEdit = (article) => {
        setEditingNews(article);
        setFormData({
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            category: article.category,
            isPublished: article.isPublished,
            image: null
        });
        if (article.imageUrl) {
            setPreviewUrl(getImageUrl(article.imageUrl));
        }
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            excerpt: '',
            content: '',
            category: '',
            isPublished: false,
            image: null
        });
        setEditingNews(null);
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

    const formatDate = (dateString) => {
        if (!dateString) return 'Não publicado';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>A carregar notícias...</p>
            </div>
        );
    }

    return (
        <div className="news-manager">
            <div className="manager-header">
                <div className="header-content">
                    <h1>Gestão de Notícias</h1>
                    <p className="header-subtitle">Criar, editar e publicar notícias do clube</p>
                </div>
                <button className="btn-add" onClick={() => setShowModal(true)}>
                    <FaPlus /> Nova Notícia
                </button>
            </div>

            {news.length === 0 ? (
                <div className="empty-state">
                    <FaNewspaper className="empty-icon" />
                    <h3>Nenhuma notícia criada</h3>
                    <p>Crie a primeira notícia do clube</p>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        <FaPlus /> Nova Notícia
                    </button>
                </div>
            ) : (
                <div className="news-grid">
                    {news.map((article) => (
                        <div key={article.id} className="news-card">
                            <div className="news-image-wrapper">
                                {article.imageUrl ? (
                                    <img
                                        src={getImageUrl(article.imageUrl)}
                                        alt={article.title}
                                        className="news-image"
                                    />
                                ) : (
                                    <div className="news-no-image">
                                        <FaNewspaper />
                                    </div>
                                )}
                                <div className="news-overlay">
                                    <button
                                        className="overlay-btn edit"
                                        onClick={() => handleEdit(article)}
                                        title="Editar"
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="overlay-btn delete"
                                        onClick={() => handleDelete(article.id)}
                                        title="Eliminar"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                            <div className="news-info">
                                <div className="news-meta">
                                    <span className="news-category">{article.category}</span>
                                    <span className="news-date">
                                        <FaCalendarAlt /> {formatDate(article.publishedAt)}
                                    </span>
                                </div>
                                <h3>{article.title}</h3>
                                <p className="news-excerpt">{article.excerpt}</p>
                                <div className="news-badges">
                                    <span className={`badge ${article.isPublished ? 'badge-published' : 'badge-draft'}`}>
                                        {article.isPublished ? <><FaEye /> Publicado</> : <><FaEyeSlash /> Rascunho</>}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
                    <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingNews ? 'Editar Notícia' : 'Nova Notícia'}</h2>
                            <button
                                className="modal-close"
                                onClick={() => { setShowModal(false); resetForm(); }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <label className="form-label">Título *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Título da notícia..."
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-section">
                                    <label className="form-label">Categoria *</label>
                                    <select
                                        className="form-input"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione uma categoria</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-section">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={formData.isPublished}
                                            onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span className="toggle-label">
                                            {formData.isPublished ? 'Publicar' : 'Guardar como rascunho'}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-section">
                                <label className="form-label">Resumo (Excerto) *</label>
                                <textarea
                                    className="form-textarea"
                                    value={formData.excerpt}
                                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                                    placeholder="Breve resumo da notícia (máximo 500 caracteres)..."
                                    rows="3"
                                    maxLength="500"
                                    required
                                />
                                <small className="char-count">{formData.excerpt.length}/500</small>
                            </div>

                            <div className="form-section">
                                <label className="form-label">Imagem de Destaque</label>

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
                                            <small>Formatos: JPG, PNG, WebP (recomendado: 1200x800px)</small>
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
                                <label className="form-label">Conteúdo *</label>
                                <textarea
                                    className="form-textarea content-editor"
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Escreva o conteúdo completo da notícia..."
                                    rows="12"
                                    required
                                />
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
                                        editingNews ? 'Atualizar Notícia' : 'Criar Notícia'
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

export default NewsManager;