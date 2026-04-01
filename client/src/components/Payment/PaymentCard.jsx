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
    FaReceipt, FaCalendarAlt, FaExclamationCircle, FaCheck, FaPercentage,
    FaCreditCard, FaMobileAlt, FaUniversity, FaExternalLinkAlt
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
            <FaExclamationTriangle style={{ color: '#d97706', fontSize: '1.2rem', marginTop: '3px' }} />
            <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: '#92400e' }}>Taxa de Inscrição Pendente</strong>
                <ul style={{ margin: 0, paddingLeft: '18px', color: '#b45309', fontSize: '0.9rem' }}>
                    {unpaid.map(i => (
                        <li key={`alert-${i.athleteTeamId}`}>
                            {i.sportName}{i.escalao ? ` — ${i.escalao}` : ''}: <strong style={{ marginLeft: '4px' }}>{i.feeDiscount.toFixed(2)} €</strong>
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
    totalDue,
    overdueMonths,
    paymentPreference,
    paymentReference,
    breakdown,
    discountsApplied,
    inscriptionInfo,
    nextPeriod,
    paymentHistory,
    historyInscriptions,
    historyYear,
    onHistoryYearChange,
    onGenerateReference,
    generatingReference,
    onStartPayment,
    startingPayment,
    parentsPaymentWarning,
}) => {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [isOverdueDropdownOpen, setIsOverdueDropdownOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const MONTHS_PT_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const hasUnpaidInscriptions = inscriptionInfo?.some(i => !i.paid && i.feeDiscount > 0) ?? false;
    const effectiveAmount = totalDue != null ? totalDue : (quotaAmount + (overdueMonths?.reduce((s, m) => s + m.amount, 0) || 0));

    // ── Generate history with current month status ────────────────────────────
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Check if current month is in history
    const hasCurrentMonthInHistory = paymentHistory?.some(p => p.periodYear === currentYear && p.periodMonth === currentMonth);

    // Combine and sort history
    let mergedHistory = [
        ...(paymentHistory || []).map(p => ({ ...p, type: 'quota', displayStatus: 'Completed' })),
        ...(historyInscriptions || [])
            .filter(i => i.paid)
            .map(i => ({
                ...i,
                type: 'inscription',
                displayStatus: 'Completed',
                description: `Taxa Incr. ${i.sportName}`,
                paymentDate: i.paymentDate
            }))
    ];

    // Add current month if missing and we are looking at current year
    if (!hasCurrentMonthInHistory && historyYear === currentYear) {
        // Map backend paymentStatus to display status
        // paymentStatus can be 'Regularizada', 'Pendente', 'Unpaid', '-'
        const virtualStatus = paymentStatus === 'Pendente' ? 'Pending' : (paymentStatus === 'Regularizada' ? 'Completed' : 'Unpaid');
        
        if (virtualStatus !== 'Completed') {
            mergedHistory.push({
                type: 'quota',
                periodMonth: currentMonth,
                periodYear: currentYear,
                displayStatus: virtualStatus,
                amount: quotaAmount || 0,
                paymentDate: new Date().toISOString(), // Use now for sorting (it's the top item)
                description: `Quota ${MONTHS_PT[currentMonth - 1]} ${currentYear}`
            });
        }
    }

    mergedHistory.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

    return (
        <div className="dashboard-card">
            <div className="dashboard-card-header">
                <h2><FaReceipt /> Estado de Pagamento</h2>
            </div>

            <div className="payment-card-body-new">
                {parentsPaymentWarning && (
                    <div className="payment-parents-warning-alert" style={{ 
                        backgroundColor: '#fffbeb', 
                        border: '1px solid #fef3c7', 
                        borderRadius: '8px', 
                        padding: '12px', 
                        marginBottom: '15px',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start'
                    }}>
                        <FaExclamationCircle style={{ color: '#d97706', fontSize: '1.2rem', marginTop: '2px' }} />
                        <div>
                            <strong style={{ color: '#92400e', display: 'block', fontSize: '0.9rem' }}>Aviso de Quota</strong>
                            <p style={{ color: '#b45309', fontSize: '0.85rem', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                                O desconto de quota de menor não foi aplicado porque as quotas dos pais não estão regularizadas para o mês atual.
                            </p>
                        </div>
                    </div>
                )}
                {/* 1. Summary Section */}
                <div className="payment-summary-new">
                    <div className="payment-summary-main">
                        <div className="payment-summary-item-new large">
                            <p>Total a Pagar</p>
                            <h3 className={effectiveAmount > 0 ? 'text-danger' : 'text-success'}>
                                {effectiveAmount !== null ? `€${Number(effectiveAmount).toFixed(2)}` : '€0.00'}
                            </h3>
                            <span className="total-due-explanation">
                                {overdueMonths?.length > 0
                                    ? `Quota atual + ${overdueMonths.length} ${overdueMonths.length === 1 ? 'mês em atraso' : 'meses em atraso'}`
                                    : 'Quota do mês atual'}
                            </span>
                        </div>
                        <div className="payment-summary-details">
                            <div className="payment-summary-item-new">
                                <p>Quota Mensal</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>{quotaAmount !== null ? `€${Number(quotaAmount).toFixed(2)}` : '—'}</span>
                                    {breakdown.filter(item => !item.isDiscount && item.amount > 0).length > 0 && (
                                        <button
                                            onClick={() => setShowBreakdown(!showBreakdown)}
                                            style={{ background: 'none', border: 'none', padding: 0, color: '#3b82f6', cursor: 'pointer', fontSize: '0.8rem' }}
                                            title="Ver detalhes"
                                        >
                                            {showBreakdown ? <FaChevronUp /> : <FaInfoCircle />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="payment-summary-item-new">
                                <p>Próximo Pagamento</p>
                                <span>{nextPeriod ? `${MONTHS_PT_SHORT[nextPeriod.month - 1]} ${nextPeriod.year}` : '—'}</span>
                            </div>
                        </div>
                    </div>

                    {showBreakdown && (
                        <div className="payment-breakdown-wrapper" style={{ marginTop: '15px', marginBottom: '15px' }}>
                            <BreakdownList breakdown={breakdown.filter(item => item.amount !== 0)} />
                        </div>
                    )}

                    {/* 2. Overdue Dropdown */}
                    {overdueMonths && overdueMonths.length > 0 && (
                        <div className="overdue-dropdown-container">
                            <button
                                className={`overdue-dropdown-header ${isOverdueDropdownOpen ? 'active' : ''}`}
                                onClick={() => setIsOverdueDropdownOpen(!isOverdueDropdownOpen)}
                            >
                                <div className="header-info">
                                    <FaExclamationCircle className="icon-error" />
                                    <span>{overdueMonths.length} {overdueMonths.length === 1 ? 'Quota em Atraso' : 'Quotas em Atraso'}</span>
                                </div>
                                <div className="header-amount">
                                    <strong>€{overdueMonths.reduce((s, m) => s + m.amount, 0).toFixed(2)}</strong>
                                    {isOverdueDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                            </button>

                            {isOverdueDropdownOpen && (
                                <div className="overdue-dropdown-content">
                                    <div className="overdue-list-scrollable">
                                        {[...overdueMonths]
                                            .sort((a, b) => (b.periodYear * 12 + b.periodMonth) - (a.periodYear * 12 + a.periodMonth))
                                            .map((m, i) => (
                                                <div key={i} className="overdue-month-item">
                                                    <span>{MONTHS_PT[m.periodMonth - 1]} {m.periodYear}</span>
                                                    <strong>€{m.amount.toFixed(2)}</strong>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. Applied Discounts */}
                    {breakdown.some(item => item.isDiscount || item.amount < 0) && (
                        <div className="discounts-applied-container">
                            <div className="discounts-divider"></div>
                            <h4 className="discounts-title">Benefícios e Descontos Aplicados</h4>
                            <div className="discounts-list">
                                {breakdown.filter(item => item.isDiscount || item.amount < 0).map((discount, idx) => (
                                    <div key={idx} className="discount-tag">
                                        <div className="discount-label-area">
                                            <FaPercentage className="discount-icon-small" />
                                            <span>{discount.label}</span>
                                        </div>
                                        <strong className="discount-value">{discount.amount.toFixed(2)} €</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Payment Actions / Status Specifics */}
                <div className="payment-status-actions">
                    {/* ── Pending Stripe payment (awaiting user/webhook) ── */}
                    {paymentStatus === 'Pendente' && (
                        <div className="payment-status-box-new pending">
                            <div className="status-header">
                                <FaClock className="status-icon" />
                                <div>
                                    <h4>Pagamento Pendente</h4>
                                    <p>O seu pagamento está a ser processado. Se escolheu Multibanco, pague a referência no ATM ou homebanking.</p>
                                </div>
                            </div>
                            <button className="payment-btn-new secondary" onClick={() => window.location.reload()}>
                                <FaSyncAlt /> Verificar Estado
                            </button>
                        </div>
                    )}

                    {/* ── Pay button when amount is due and no pending payment ── */}
                    {effectiveAmount > 0 && paymentStatus !== 'Pendente' && paymentStatus !== 'Regularizada' && onStartPayment && (
                        <div className="payment-action-block">
                            <div className="stripe-payment-methods">
                                <span className="stripe-methods-label">Métodos de pagamento aceites:</span>
                                <div className="stripe-methods-icons">
                                    <span className="stripe-method-badge"><FaCreditCard /> Cartão</span>
                                    <span className="stripe-method-badge"><FaUniversity /> Multibanco</span>
                                    <span className="stripe-method-badge"><FaMobileAlt /> MBWay</span>
                                </div>
                            </div>

                            <button
                                className="payment-btn-new primary stripe-pay-btn"
                                onClick={onStartPayment}
                                disabled={startingPayment}
                            >
                                {startingPayment
                                    ? <><FaSyncAlt className="icon-spin" /> A processar…</>
                                    : <><FaExternalLinkAlt /> Pagar Quota ({effectiveAmount.toFixed(2)} €)</>}
                            </button>

                            <p className="stripe-secure-note">🔒 Pagamento seguro via Stripe</p>
                        </div>
                    )}

                    {/* ── All paid ── */}
                    {effectiveAmount === 0 && paymentStatus === 'Regularizada' && (
                        <div className="payment-status-box-new success">
                            <FaCheckCircle className="status-icon" />
                            <div>
                                <h4>Quotas em Dia</h4>
                                <p>Todos os seus pagamentos estão regularizados. Obrigado!</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. Inscription Alert & Advance Payment */}
                <div className="payment-extra-info">
                    <InscriptionAlert inscriptionInfo={inscriptionInfo} />
                </div>

                {/* 6. Payment History */}
                <div className="payment-history-section">
                    <div className="discounts-divider" style={{ margin: '15px 0' }}></div>
                    <div 
                        className="history-header" 
                        style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: isHistoryOpen ? '15px' : '0',
                            cursor: 'pointer'
                        }}
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    >
                        <h4 className="discounts-title" style={{ margin: 0 }}>
                            <FaReceipt /> Histórico de Pagamentos
                            {isHistoryOpen ? <FaChevronUp style={{ marginLeft: '8px', fontSize: '0.8rem', opacity: 0.7 }} /> : <FaChevronDown style={{ marginLeft: '8px', fontSize: '0.8rem', opacity: 0.7 }} />}
                        </h4>
                        
                        {isHistoryOpen && (
                            <select
                                value={historyYear}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => onHistoryYearChange(parseInt(e.target.value))}
                                className="history-year-select"
                                style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '0.8rem' }}
                            >
                                {[2026, 2025, 2024].map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        )}
                    </div>

                    {isHistoryOpen && (
                        <div className="history-list">
                            {mergedHistory.length === 0 ? (
                                <p className="no-history" style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '0.9rem' }}>
                                    Nenhum pagamento efetuado em {historyYear}.
                                </p>
                            ) : (
                                mergedHistory.map((p, idx) => (
                                    <div key={idx} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                        <div className="history-main">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {p.displayStatus === 'Completed' ? (
                                                    <FaCheckCircle style={{ color: '#10b981', fontSize: '0.8rem' }} />
                                                ) : p.displayStatus === 'Pending' ? (
                                                    <FaClock style={{ color: '#f59e0b', fontSize: '0.8rem' }} />
                                                ) : (
                                                    <FaExclamationCircle style={{ color: '#ef4444', fontSize: '0.8rem' }} />
                                                )}
                                                <span style={{ 
                                                    fontSize: '0.9rem', 
                                                    fontWeight: '600',
                                                    color: p.displayStatus === 'Unpaid' ? '#ef4444' : 'inherit'
                                                }}>
                                                    {p.type === 'quota' && p.periodMonth
                                                        ? `Quota ${MONTHS_PT[p.periodMonth - 1]} ${p.periodYear}`
                                                        : p.description}
                                                </span>
                                                {p.type === 'inscription' && <span style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '10px' }}>Inscrição</span>}
                                                {p.displayStatus === 'Pending' && <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '10px' }}>Pendente</span>}
                                                {p.displayStatus === 'Unpaid' && <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '10px' }}>Não Pago</span>}
                                            </div>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '16px' }}>
                                                {p.displayStatus === 'Completed' 
                                                    ? `Pago em ${new Date(p.paymentDate).toLocaleDateString('pt-PT')}`
                                                    : p.displayStatus === 'Pending' ? 'A aguardar pagamento' : 'Pagamento em falta'}
                                            </span>
                                        </div>
                                        <strong style={{ 
                                            fontSize: '0.9rem',
                                            color: p.displayStatus === 'Unpaid' ? '#ef4444' : 'inherit'
                                        }}>
                                            {p.amount.toFixed(2)} €
                                        </strong>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentCard;
