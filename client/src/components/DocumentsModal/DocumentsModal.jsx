import React from 'react';
import { FaTimes, FaFilePdf, FaDownload } from 'react-icons/fa';
import './DocumentsModal.css';

const DocumentsModal = ({ isOpen, onClose, userId }) => {
    if (!isOpen) return null;

    const documents = [
        {
            name: 'Cartão de Sócio',
            description: 'Cartão digital de identificação de sócio.',
            type: 'PDF',
            size: '156 KB',
            isMembershipCard: true
        },
        {
            name: 'Regulamento Interno',
            description: 'Regulamento Geral sobre a Proteção de Dados e normas do clube.',
            type: 'PDF',
            size: '304 KB',
            url: 'http://localhost:5285/docs/regulamento_cdpovoa.pdf'
        },
        {
            name: 'Benefícios 2026',
            description: 'Guia de benefícios e descontos para sócios na época 2025/26.',
            type: 'PDF',
            size: '1.2 MB',
            locked: true
        }
    ];

    const handleDownload = async (doc) => {
        if (doc.locked) return;

        const token = localStorage.getItem('token');
        let downloadUrl = doc.url;
        let fileName = doc.name.replace(/\s+/g, '_') + '.pdf';

        if (doc.isMembershipCard) {
            downloadUrl = `http://localhost:5285/api/membershipcard/download?userId=${userId}`;
            fileName = `Cartao_Socio_${userId}.pdf`;
        }

        try {
            // For membership card we need the token and use fetch because it's an API
            if (doc.isMembershipCard) {
                const response = await fetch(downloadUrl, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } else {
                    alert('Erro ao gerar cartão. Verifique se é um sócio ativo.');
                }
            } else {
                // For static documents, we can just open or download via link
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.target = '_blank';
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            console.error('Download failed', err);
        }
    };

    return (
        <div className="doc-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="doc-modal">
                <div className="doc-modal-header">
                    <h2>Centro de Documentação</h2>
                    <button className="doc-modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="doc-modal-body">
                    <p className="doc-intro">Aqui pode consultar e descarregar todos os documentos oficiais relativos à sua conta e ao clube.</p>

                    <div className="doc-list">
                        {documents.map((doc, index) => (
                            <div key={index} className={`doc-card ${doc.locked ? 'doc-locked' : ''}`}>
                                <div className="doc-icon">
                                    <FaFilePdf />
                                </div>
                                <div className="doc-info">
                                    <h3>{doc.name}</h3>
                                    <p>{doc.description}</p>
                                    <span className="doc-meta">{doc.type} • {doc.size}</span>
                                </div>
                                <div className="doc-actions">
                                    {doc.locked ? (
                                        <span className="doc-lock-badge">Brevemente</span>
                                    ) : (
                                        <button className="doc-download-btn" onClick={() => handleDownload(doc)}>
                                            <FaDownload /> Descarregar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentsModal;
