import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaArrowLeft } from 'react-icons/fa';
import ImageGallery from '../components/ImageGallery/ImageGallery';
import './NoticiaDetalhe.css';

const NoticiaDetalhe = () => {
    const { slug } = useParams();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        fetchNewsDetail();
    }, [slug]);

    const fetchNewsDetail = async () => {
        try {
            const response = await fetch(`http://localhost:5285/api/news/${slug}`);
            if (response.ok) {
                const data = await response.json();
                setNews(data);
            } else {
                setError(true);
            }
        } catch (error) {
            console.error('Error fetching news detail:', error);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return '/CDP_logo.png';
        if (imageUrl.startsWith('http')) return imageUrl;
        return `http://localhost:5285${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="noticia-loading">
                <div className="spinner"></div>
                <p>A carregar notícia...</p>
            </div>
        );
    }

    if (error || !news) {
        return (
            <div className="noticia-error">
                <h2>Notícia não encontrada</h2>
                <p>A notícia que procura não existe ou foi removida.</p>
                <Link to="/noticias" className="btn-back">
                    <FaArrowLeft /> Voltar às Notícias
                </Link>
            </div>
        );
    }

    return (
        <div className="noticia-detalhe-page">
            <header className="noticia-header">
                <div className="container noticia-header-content">
                    <span className="noticia-category">{news.category}</span>
                    <h1>{news.title}</h1>
                    <div className="noticia-meta">
                        <span>
                            <FaCalendarAlt /> {formatDate(news.publishedAt)}
                        </span>
                    </div>
                </div>
            </header>

            <div className="noticia-container">
                <div className="noticia-content-wrapper">
                    {/* Combined Image Gallery: Featured image + Gallery images */}
                    {(() => {
                        const allImages = [];

                        // Add featured image as first image
                        if (news.imageUrl) {
                            allImages.push(getImageUrl(news.imageUrl));
                        }

                        // Add gallery images
                        if (news.galleryImages && news.galleryImages.length > 0) {
                            const galleryUrls = news.galleryImages.map(img => getImageUrl(img.imageUrl));
                            allImages.push(...galleryUrls);
                        }

                        console.log('All carousel images:', allImages);

                        // Show carousel if there are any images
                        if (allImages.length > 0) {
                            return (
                                <ImageGallery
                                    images={allImages}
                                    alt={news.title}
                                />
                            );
                        }

                        return null;
                    })()}

                    <div className="noticia-body">
                        {/* We use white-space: pre-wrap in CSS to handle newlines from textarea */}
                        {news.content.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>

                    <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <Link to="/noticias" className="btn-back" style={{ background: 'transparent', color: '#003380', border: '1px solid #003380' }}>
                            <FaArrowLeft /> Voltar à lista de notícias
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoticiaDetalhe;
