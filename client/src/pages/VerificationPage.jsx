import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VerificationPage.css';

const VerificationPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verifyMember = async () => {
            try {
                // Not using Authorization header because this might be accessed by generic scanners
                // However, in a real production environment, you might want to protect this endpoint
                // or use a signed token inside the QR code instead of just the ID.
                const response = await fetch(`http://localhost:5285/api/verification/${id}`);
                const data = await response.json();

                if (response.ok || response.status === 400 || response.status === 404) {
                    setResult(data);
                } else {
                    setError("Erro ao contactar o servidor.");
                }
            } catch (err) {
                console.error("Verification error:", err);
                setError("Falha de ligação ao servidor.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            verifyMember();
        }
    }, [id]);

    const handleBack = () => {
        navigate('/');
    };

    if (loading) {
        return (
            <div className="vp-container vp-loading">
                <i className="fas fa-spinner fa-spin vp-icon"></i>
                <h2>A verificar sócio...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="vp-container vp-error">
                <i className="fas fa-exclamation-triangle vp-icon"></i>
                <h2>Erro de Verificação</h2>
                <p>{error}</p>
                <button className="vp-btn" onClick={handleBack}>Voltar</button>
            </div>
        );
    }

    // Determine styles based on status
    let statusClass = "vp-invalid";
    let iconClass = "fas fa-times-circle";

    if (result?.status === "Valid") {
        statusClass = "vp-valid";
        iconClass = "fas fa-check-circle";
    } else if (result?.status === "Warning") {
        statusClass = "vp-warning";
        iconClass = "fas fa-exclamation-circle";
    }

    return (
        <div className={`vp-container ${statusClass}`}>
            <div className="vp-card">
                <i className={`${iconClass} vp-status-icon`}></i>

                <h1 className="vp-title">
                    {result?.status === "Valid" ? "Acesso Autorizado" :
                        result?.status === "Warning" ? "Atenção (Quotas em Atraso)" :
                            "Acesso Negado"}
                </h1>

                <p className="vp-message">{result?.message || "Sem informação."}</p>

                {result?.memberName && (
                    <div className="vp-details">
                        <div className="vp-detail-item">
                            <span className="vp-label">Sócio:</span>
                            <span className="vp-value">#{result.memberNumber} - {result.memberName}</span>
                        </div>
                        {result.sport && (
                            <div className="vp-detail-item">
                                <span className="vp-label">Modalidade:</span>
                                <span className="vp-value">{result.sport}</span>
                            </div>
                        )}
                    </div>
                )}

                <button className="vp-btn" onClick={handleBack}>Voltar ao Início</button>
            </div>
            <div className="vp-footer">
                Sistema de Verificação • Clube Desportivo da Póvoa
            </div>
        </div>
    );
};

export default VerificationPage;
