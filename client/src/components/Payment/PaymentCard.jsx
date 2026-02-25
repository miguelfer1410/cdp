// ═══════════════════════════════════════════════════════════════════════════════
// NOVO FICHEIRO: client/src/components/Payment/PaymentCard.jsx
//
// Componente reutilizável de Estado de Pagamento com breakdown completo.
// Substitui a secção de pagamento inline do DashboardAtleta.
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
    FaCheckCircle, FaExclamationTriangle, FaClock, FaEuroSign,
    FaBarcode, FaSyncAlt, FaChevronDown, FaChevronUp,
    FaUserFriends, FaLayerGroup, FaUsers, FaInfoCircle,
    FaReceipt, FaCalendarAlt
} from 'react-icons/fa';
import './PaymentCard.css';

// ── Discount badge helpers ────────────────────────────────────────────────────
const DiscountBadge = ({ discounts }) => {
    if (!discounts || discounts.length === 0) return null;

    const labels = {
        sibling: { icon: <FaUserFriends />, text: 'Desconto Irmão', color: 'green' },
        second_sport: { icon: <FaLayerGroup />, text: '2ª Modalidade', color: 'blue' },
        parent_member_exemption: { icon: <FaUsers />, text: 'Quota Isenta (pais sócios)', color: 'purple' },
    };

    return (
        <div className="payment-discounts-row">
            {discounts.map(d => {
                const badge = labels[d];
                if (!badge) return null;
                return (
                    <span key={d} className={`payment-discount-badge payment-discount-badge--${badge.color}`}>
                        {badge.icon} {badge.text}
                    </span>
                );
            })}
        </div>
    );
};

// ── Inscription alert ─────────────────────────────────────────────────────────
const InscriptionAlert = ({ inscriptionInfo }) => {
    const unpaid = inscriptionInfo?.filter(i => !i.paid && i.feeDiscount > 0);
    if (!unpaid || unpaid.length === 0) return null;

    return (
        <div className="payment-inscription-alert">
            <FaExclamationTriangle />
            <div>
                <strong>Taxa de inscrição pendente</strong>
                <ul>
                    {unpaid.map(i => (
                        <li key={i.athleteTeamId}>
                            {i.sportName}{i.escalao ? ` — ${i.escalao}` : ''}: <strong>{i.feeDiscount.toFixed(2)} €</strong>
                            <span className="inscription-note">(pagar na secretaria)</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// ── Breakdown list ────────────────────────────────────────────────────────────
const BreakdownList = ({ breakdown }) => {
    if (!breakdown || breakdown.length === 0) return null;

    return (
        <div className="payment-breakdown">
            {breakdown.map((item, i) => (
                <div
                    key={i}
                    className={`payment-breakdown-item ${item.isDiscount ? 'is-discount' : ''} ${item.quotaIncluded ? 'quota-included' : ''}`}
                >
                    <span className="breakdown-label">
                        {item.quotaIncluded && <span className="breakdown-dot breakdown-dot--included" title="Quota incluída" />}
                        {item.isDiscount && <span className="breakdown-dot breakdown-dot--discount" title="Desconto" />}
                        {!item.quotaIncluded && !item.isDiscount && <span className="breakdown-dot breakdown-dot--normal" />}
                        {item.label}
                    </span>
                    <span className="breakdown-amount">
                        {item.isDiscount
                            ? <span className="amount-discount">− {Math.abs(item.amount).toFixed(2)} €</span>
                            : <span>{item.amount.toFixed(2)} €</span>}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ── Main PaymentCard component ────────────────────────────────────────────────
const PaymentCard = ({
    paymentStatus,
    quotaAmount,
    paymentPreference,
    paymentReference,
    breakdown,
    discountsApplied,
    inscriptionInfo,
    nextPeriod,
    paymentHistory,
    historyYear,
    onHistoryYearChange,
    onGenerateReference,
    generatingReference,
}) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // ── PAID state ────────────────────────────────────────────────────────────
    const renderPaid = () => (
        <div className="payment-status-box payment-status-box--paid">
            <div className="payment-status-icon"><FaCheckCircle /></div>
            <div>
                <h4>Quotas em Dia</h4>
                <p>
                    {paymentPreference === 'Annual'
                        ? `Quota anual de ${quotaAmount?.toFixed(2)} € paga com sucesso.`
                        : `Pagamento de ${quotaAmount?.toFixed(2)} € concluído com sucesso.`}
                </p>
            </div>
        </div>
    );

    // ── PENDING reference state ───────────────────────────────────────────────
    const renderPending = () => (
        <div className="payment-status-box payment-status-box--pending">
            <div className="payment-status-icon"><FaClock /></div>
            <div style={{ flex: 1 }}>
                <h4>Referência Multibanco Gerada</h4>
                <p style={{ marginBottom: 12 }}>Efectue o pagamento com os dados abaixo.</p>
                <div className="payment-mb-grid">
                    <div className="payment-mb-field">
                        <span className="mb-label">Entidade</span>
                        <span className="mb-value">{paymentReference?.entity}</span>
                    </div>
                    <div className="payment-mb-field">
                        <span className="mb-label">Referência</span>
                        <span className="mb-value">{paymentReference?.reference}</span>
                    </div>
                    <div className="payment-mb-field">
                        <span className="mb-label">Valor</span>
                        <span className="mb-value">{quotaAmount?.toFixed(2)} €</span>
                    </div>
                </div>
                <button className="payment-btn payment-btn--outline" onClick={() => window.location.reload()}>
                    <FaSyncAlt /> Verificar Pagamento
                </button>
            </div>
        </div>
    );

    // ── UNPAID state ──────────────────────────────────────────────────────────
    const renderUnpaid = () => (
        <div className="payment-status-box payment-status-box--unpaid">
            <div className="payment-status-icon"><FaExclamationTriangle /></div>
            <div style={{ flex: 1 }}>
                <h4>Quota por Pagar</h4>
                <p>
                    {paymentPreference === 'Annual' ? 'Quota Anual' : 'Quota Mensal'}:{' '}
                    <strong style={{ color: '#003380' }}>
                        {quotaAmount !== null ? `${quotaAmount?.toFixed(2)} €` : '…'}
                    </strong>
                </p>
                <button
                    className="payment-btn payment-btn--primary"
                    onClick={() => onGenerateReference()}
                    disabled={generatingReference || quotaAmount === null}
                >
                    {generatingReference ? <><FaSyncAlt className="icon-spin" /> A gerar…</> : <><FaBarcode /> Gerar Referência MB</>}
                </button>
            </div>
        </div>
    );

    // ── Advance payment (when already paid) ───────────────────────────────────
    const renderAdvance = () => {
        if (!nextPeriod || paymentStatus !== 'Regularizada') return null;
        return (
            <div className="payment-advance">
                <FaInfoCircle style={{ color: '#003380', flexShrink: 0 }} />
                <div>
                    <span>Adiantar próximo período ({nextPeriod.month ? `${MONTHS_PT[nextPeriod.month - 1]} ${nextPeriod.year}` : nextPeriod.year})? </span>
                    <button
                        className="payment-btn payment-btn--sm"
                        onClick={() => onGenerateReference(nextPeriod.month, nextPeriod.year)}
                        disabled={generatingReference}
                    >
                        {generatingReference ? <FaSyncAlt className="icon-spin" /> : 'Gerar Referência'}
                    </button>
                </div>
            </div>
        );
    };

    // ── Payment history ───────────────────────────────────────────────────────
    const renderHistory = () => (
        <div className="payment-history">
            <div className="payment-history-controls">
                <FaCalendarAlt />
                <label>Ano:</label>
                <select value={historyYear} onChange={e => onHistoryYearChange(parseInt(e.target.value))}>
                    {[2026, 2025, 2024, 2023].map(y => <option key={y}>{y}</option>)}
                </select>
            </div>
            {paymentHistory.length === 0 ? (
                <p className="payment-history-empty">Sem pagamentos registados para {historyYear}.</p>
            ) : (
                <div className="payment-history-list">
                    {paymentHistory.map(p => (
                        <div key={p.id} className="payment-history-item">
                            <div className="history-item-left">
                                <FaCheckCircle style={{ color: '#16a34a' }} />
                                <span className="history-label">
                                    {p.periodMonth ? `${MONTHS_PT[p.periodMonth - 1]} ${p.periodYear}` : `Anual ${p.periodYear}`}
                                    {p.description && <span className="history-desc"> — {p.description}</span>}
                                </span>
                            </div>
                            <span className="history-amount">{p.amount?.toFixed(2)} €</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="payment-card">
            {/* Header */}
            <div className="payment-card-header">
                <h2><i className="fas fa-credit-card" /> Estado de Pagamento</h2>
            </div>

            <div className="payment-card-body">
                {/* Discount badges */}
                <DiscountBadge discounts={discountsApplied} />

                {/* Inscription alert */}

                {/* Main status */}
                {paymentStatus === 'Regularizada' && renderPaid()}
                {paymentStatus === 'Pendente' && renderPending()}
                {paymentStatus !== 'Regularizada' && paymentStatus !== 'Pendente' && renderUnpaid()}

                {/* Advance payment */}
                {renderAdvance()}

                {/* Breakdown toggle */}
                {breakdown && breakdown.length > 0 && (
                    <div className="payment-breakdown-toggle">
                        <button
                            className="breakdown-toggle-btn"
                            onClick={() => setShowBreakdown(v => !v)}
                        >
                            <FaReceipt />
                            Detalhe da quota
                            {showBreakdown ? <FaChevronUp /> : <FaChevronDown />}
                        </button>

                        {showBreakdown && (
                            <>
                                <BreakdownList breakdown={breakdown} />
                                <div className="payment-breakdown-total">
                                    <span>Total mensal</span>
                                    <strong>{quotaAmount?.toFixed(2)} €</strong>
                                </div>
                                <div className="payment-breakdown-legend">
                                    <span><span className="breakdown-dot breakdown-dot--included" /> Quota incluída na mensalidade</span>
                                    <span><span className="breakdown-dot breakdown-dot--discount" /> Desconto aplicado</span>
                                    <span><span className="breakdown-dot breakdown-dot--normal" /> Valor normal</span>
                                </div>
                            </>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default PaymentCard;