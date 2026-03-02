import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import './MembershipCard.css';

/**
 * MembershipCard – Cartão de sócio digital premium (face única)
 *
 * Props:
 *   memberNumber  – string  – número de sócio
 *   name          – string  – nome completo
 *   memberSince   – string  – ano de inscrição (e.g. "2019")
 *   validity      – string  – data de validade (e.g. "31/12/2026")
 *   status        – string  – "Ativo" | "Active" | "Pendente" | ...
 *   sport         – string? – modalidade (só para atletas)
 *   cardType      – 'socio' | 'atleta'
 *   userId        – number  – para download do PDF
 *   compact       – bool    – modo compacto para dashboard
 */
const MembershipCard = ({
    memberNumber = '0000',
    name = 'Nome do Sócio',
    memberSince = '—',
    validity = '31/12/2026',
    status = 'Ativo',
    sport = null,
    cardType = 'socio',
    userId = null,
    compact = false,
}) => {
    const [downloading, setDownloading] = useState(false);

    const isAtleta = cardType === 'atleta';

    const statusLabel =
        status === 'Active' ? 'Ativo' :
            status === 'Pending' ? 'Pendente' :
                status === 'Suspended' ? 'Suspenso' :
                    status === 'Cancelled' ? 'Cancelado' : status;

    const statusClass =
        (status === 'Ativo' || status === 'Active') ? 'status-active' :
            (status === 'Pendente' || status === 'Pending') ? 'status-pending' :
                'status-inactive';

    const numDisplay = memberNumber?.toString().padStart(6, '0') ?? '000000';

    const handleDownload = async (e) => {
        e.stopPropagation();
        if (!userId) return;
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://localhost:5285/api/membershipcard/download?userId=${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Cartao_Socio_${userId}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (err) {
            console.error('Download failed', err);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className={`mc-wrapper${compact ? ' mc-wrapper--compact' : ''}`}>
            {/* ══════ CARTÃO (face única) ══════ */}
            <div className="mc-card">
                {/* Decoração de fundo */}
                <div className="mc-deco-circle mc-deco-circle--1" />
                <div className="mc-deco-circle mc-deco-circle--2" />
                <div className="mc-holo-overlay" />

                {/* Linha 1 – Logo + tipo + estado */}
                <div className="mc-row mc-row--top">
                    <div className="mc-logo-box">
                        <img src="/CDP_logo.png" alt="CDP" className="mc-logo-img" />
                    </div>
                    <div className="mc-row-spacer" />
                    <span className={`mc-badge ${statusClass}`}>
                        <span className="mc-badge-dot" />
                        {statusLabel}
                    </span>
                    <span className="mc-type-pill">
                        {isAtleta ? <><i className="fas fa-running" /> ATLETA</> : <><i className="fas fa-id-card" /> SÓCIO</>}
                    </span>
                </div>

                {/* Corpo: info à esquerda + QR à direita */}
                <div className="mc-front-body">
                    <div className="mc-front-info">
                        {/* Chip */}
                        <div className="mc-row">
                            <div className="mc-chip">
                                <div className="mc-chip-lines">
                                    <div className="mc-chip-line" />
                                    <div className="mc-chip-line" />
                                    <div className="mc-chip-line" />
                                </div>
                            </div>
                        </div>

                        {/* Número */}
                        <div className="mc-number-block">
                            <span className="mc-number-prefix">Nº</span>
                            <span className="mc-number-value">{numDisplay}</span>
                        </div>

                        {/* Campos */}
                        <div className="mc-fields-row">
                            <div className="mc-field">
                                <span className="mc-field-label">TITULAR</span>
                                <span className="mc-field-value">{name}</span>
                            </div>
                            {sport && (
                                <div className="mc-field">
                                    <span className="mc-field-label">MODALIDADE</span>
                                    <span className="mc-field-value">{sport}</span>
                                </div>
                            )}
                            <div className="mc-field">
                                <span className="mc-field-label">VÁLIDO ATÉ</span>
                                <span className="mc-field-value">{validity}</span>
                            </div>
                            <div className="mc-field">
                                <span className="mc-field-label">DESDE</span>
                                <span className="mc-field-value">{memberSince}</span>
                            </div>
                        </div>
                    </div>

                    {/* QR Code a ocupar todo o espaço vertical */}
                    <div className="mc-qr-front">
                        <QRCode
                            value={userId ? `http://localhost:3000/verify/${userId}` : numDisplay}
                            size={120}
                            style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                            bgColor="#ffffff"
                            fgColor="#000000"
                        />
                    </div>
                </div>
            </div>

            {/* Botão abaixo do cartão */}
            <div className="mc-actions">
                {userId && (
                    <button
                        className="mc-download-btn"
                        onClick={handleDownload}
                        disabled={downloading}
                    >
                        {downloading
                            ? <><i className="fas fa-spinner fa-spin" /> A gerar...</>
                            : <><i className="fas fa-download" /> Descarregar PDF</>}
                    </button>
                )}
            </div>
        </div>
    );
};

export default MembershipCard;
