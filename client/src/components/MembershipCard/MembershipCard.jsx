import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import './MembershipCard.css';

/**
 * MembershipCard – Cartão de sócio digital premium
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
}) => {
    const [flipped, setFlipped] = useState(false);
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
        <div className="mc-wrapper">
            <div
                className={`mc-scene${flipped ? ' mc-flipped' : ''}`}
                onClick={() => setFlipped(f => !f)}
                title="Clique para virar o cartão"
            >
                {/* ══════ FRENTE ══════ */}
                <div className="mc-face mc-front">
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

                    {/* Linha 2 – Chip */}
                    <div className="mc-row">
                        <div className="mc-chip">
                            <div className="mc-chip-lines">
                                <div className="mc-chip-line" />
                                <div className="mc-chip-line" />
                                <div className="mc-chip-line" />
                            </div>
                        </div>
                    </div>

                    {/* Linha 3 – Número */}
                    <div className="mc-row">
                        <div className="mc-number-block">
                            <span className="mc-number-prefix">Nº</span>
                            <span className="mc-number-value">{numDisplay}</span>
                        </div>
                    </div>

                    {/* Linha 4 – Campos */}
                    <div className="mc-row mc-fields-row">
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

                {/* ══════ VERSO ══════ */}
                <div className="mc-face mc-back">
                    <div className="mc-deco-circle mc-deco-circle--1" />
                    <div className="mc-deco-circle mc-deco-circle--2" />
                    <div className="mc-holo-overlay" />

                    {/* Banda magnética */}
                    <div className="mc-stripe" />

                    {/* Conteúdo do verso */}
                    <div className="mc-back-body">
                        {/* Logo + nome do clube */}
                        <div className="mc-row">
                            <div className="mc-logo-box mc-logo-box--sm">
                                <img src="/CDP_logo.png" alt="CDP" className="mc-logo-img" />
                            </div>
                            <span className="mc-club-name">Clube Desportivo da Póvoa</span>
                        </div>

                        {/* Info e QR Code Wrapper */}
                        <div className="mc-back-info-wrapper">
                            {/* Grid de campos */}
                            <div className="mc-back-grid">
                                <div className="mc-back-field">
                                    <span className="mc-field-label">Nº de Sócio</span>
                                    <span className="mc-field-value">#{numDisplay}</span>
                                </div>
                                <div className="mc-back-field">
                                    <span className="mc-field-label">Titular</span>
                                    <span className="mc-field-value">{name}</span>
                                </div>
                                <div className="mc-back-field">
                                    <span className="mc-field-label">Validade</span>
                                    <span className="mc-field-value">{validity}</span>
                                </div>
                                {sport && (
                                    <div className="mc-back-field">
                                        <span className="mc-field-label">Modalidade</span>
                                        <span className="mc-field-value">{sport}</span>
                                    </div>
                                )}
                            </div>

                            {/* QR Code */}
                            <div className="mc-qr-box">
                                <QRCode
                                    value={userId ? `http://localhost:3000/verify/${userId}` : numDisplay}
                                    size={64}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Botões abaixo do cartão – sempre visíveis */}
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

            <p className="mc-flip-hint">
                <i className="fas fa-sync-alt" /> Clique no cartão para ver o verso
            </p>
        </div>
    );
};

export default MembershipCard;
