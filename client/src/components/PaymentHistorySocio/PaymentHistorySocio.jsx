import React, { useState, useEffect, useCallback } from 'react';
import {
    FaChevronLeft, FaChevronRight, FaCheckCircle, FaExclamationCircle,
    FaClock, FaHistory, FaEuroSign, FaListUl, FaInfinity,
    FaCalendarCheck, FaTimes,
} from 'react-icons/fa';
import './PaymentHistorySocio.css';

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1984;

const PaymentHistorySocio = ({ isOpen, onClose, userId, overdueMonths = [] }) => {
    const [year, setYear] = useState(CURRENT_YEAR);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchHistory = useCallback(async (y) => {
        if (!userId) return;
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(
                `http://localhost${y}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error('Erro ao carregar histórico');
            setPayments(await res.json());
        } catch (e) {
            setError(e.message);
            setPayments([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (isOpen) fetchHistory(year);
    }, [year, isOpen, fetchHistory]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Lock body scroll while open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    // ── Derived ───────────────────────────────────────────────────────────────
    const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const isLifetime = payments.some(p => p.periodYear >= 2099);
    const overdueThisYear = overdueMonths.filter(m => m.periodYear === year);
    const isEmpty = payments.length === 0 && overdueThisYear.length === 0;
    const canGoBack = year > MIN_YEAR;
    const canGoForward = year < CURRENT_YEAR;

    const labelForPayment = (p) => {
        if (p.periodYear >= 2099) return 'Quota Vitalícia';
        if (!p.periodMonth) return `Quota Anual ${p.periodYear}`;
        return `${MONTHS_PT[p.periodMonth - 1]} ${p.periodYear}`;
    };

    const methodLabel = (m) => {
        if (!m || m === 'Histórico') return 'Histórico';
        if (m === 'MB') return 'Multibanco';
        if (m === 'Manual') return 'Manual';
        return m;
    };

    const cleanDescription = (desc) => {
        if (!desc) return null;
        return desc.replace(/ — pago até \d{2}\/\d{4}/, '').replace(/ \(Vitalício\)/, '').trim();
    };

    return (
        <div className="phs-overlay" onClick={onClose}>
            <div className="phs-modal" onClick={(e) => e.stopPropagation()}>

                {/* ── Modal header ─────────────────────────────────────────── */}
                <div className="phs-modal-header">
                    <div className="phs-title">
                        <FaHistory className="phs-title-icon" />
                        <h2>Histórico de Quotas</h2>
                    </div>
                    <div className="phs-header-right">
                        <div className="phs-year-nav">
                            <button
                                className="phs-nav-btn"
                                onClick={() => setYear(y => y - 1)}
                                disabled={!canGoBack}
                                title="Ano anterior"
                            >
                                <FaChevronLeft />
                            </button>
                            <span className="phs-year-label">{year}</span>
                            <button
                                className="phs-nav-btn"
                                onClick={() => setYear(y => y + 1)}
                                disabled={!canGoForward}
                                title="Próximo ano"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                        <button className="phs-close-btn" onClick={onClose} title="Fechar">
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* ── Summary bar ──────────────────────────────────────────── */}
                {!loading && !isEmpty && (
                    <div className="phs-summary">
                        <div className="phs-summary-item">
                            <FaEuroSign className="phs-summary-icon phs-icon-blue" />
                            <div>
                                <span className="phs-summary-label">Total pago</span>
                                <strong className="phs-summary-value">
                                    {isLifetime ? '—' : `${totalPaid.toFixed(2)} €`}
                                </strong>
                            </div>
                        </div>
                        <div className="phs-summary-item">
                            <FaListUl className="phs-summary-icon phs-icon-blue" />
                            <div>
                                <span className="phs-summary-label">Registos</span>
                                <strong className="phs-summary-value">{payments.length}</strong>
                            </div>
                        </div>
                        {overdueThisYear.length > 0 && (
                            <div className="phs-summary-item phs-summary-item--warn">
                                <FaExclamationCircle className="phs-summary-icon phs-icon-red" />
                                <div>
                                    <span className="phs-summary-label">Em atraso</span>
                                    <strong className="phs-summary-value phs-value-red">
                                        {overdueThisYear.length} {overdueThisYear.length === 1 ? 'mês' : 'meses'}
                                    </strong>
                                </div>
                            </div>
                        )}
                        {isLifetime && (
                            <div className="phs-summary-item phs-summary-item--lifetime">
                                <FaInfinity className="phs-summary-icon phs-icon-gold" />
                                <div>
                                    <span className="phs-summary-label">Estatuto</span>
                                    <strong className="phs-summary-value phs-value-gold">Vitalício</strong>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Body ─────────────────────────────────────────────────── */}
                <div className="phs-body">

                    {loading && (
                        <div className="phs-state">
                            <div className="phs-spinner" />
                            <p>A carregar...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="phs-state phs-state--error">
                            <FaExclamationCircle />
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && !error && isEmpty && (
                        <div className="phs-state phs-state--empty">
                            <FaCalendarCheck className="phs-empty-icon" />
                            <p>Sem registos de pagamentos em {year}.</p>
                            {canGoBack && (
                                <button className="phs-btn-ghost" onClick={() => setYear(y => y - 1)}>
                                    Ver {year - 1}
                                </button>
                            )}
                        </div>
                    )}

                    {!loading && !error && !isEmpty && (
                        <div className="phs-list">

                            {/* Overdue first */}
                            {overdueThisYear.map((m, i) => (
                                <div key={`overdue-${i}`} className="phs-item phs-item--overdue">
                                    <div className="phs-item-left">
                                        <span className="phs-item-dot phs-dot--red">
                                            <FaExclamationCircle />
                                        </span>
                                        <div className="phs-item-info">
                                            <span className="phs-item-period">
                                                {MONTHS_PT[m.periodMonth - 1]} {m.periodYear}
                                            </span>
                                            <span className="phs-item-badge phs-badge--overdue">Em atraso</span>
                                        </div>
                                    </div>
                                    <div className="phs-item-right">
                                        <span className="phs-item-amount phs-amount--red">
                                            {m.amount?.toFixed(2)} €
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {/* Paid entries */}
                            {payments.map((p) => {
                                const isImported = p.paymentMethod === 'Histórico';
                                const isVitalicio = p.periodYear >= 2099;

                                return (
                                    <div
                                        key={p.id}
                                        className={`phs-item${isImported ? ' phs-item--imported' : ''}${isVitalicio ? ' phs-item--lifetime' : ''}`}
                                    >
                                        <div className="phs-item-left">
                                            <span className={`phs-item-dot ${isVitalicio ? 'phs-dot--gold' : 'phs-dot--green'}`}>
                                                {isVitalicio ? <FaInfinity /> : <FaCheckCircle />}
                                            </span>
                                            <div className="phs-item-info">
                                                <span className="phs-item-period">{labelForPayment(p)}</span>
                                                <div className="phs-item-meta">
                                                    {isImported ? (
                                                        <span className="phs-item-badge phs-badge--historic">Histórico</span>
                                                    ) : p.paymentDate ? (
                                                        <span className="phs-item-date">
                                                            <FaClock />
                                                            {new Date(p.paymentDate).toLocaleDateString('pt-PT', {
                                                                day: '2-digit', month: 'short', year: 'numeric'
                                                            })}
                                                        </span>
                                                    ) : null}
                                                    <span className="phs-item-method">{methodLabel(p.paymentMethod)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="phs-item-right">
                                            <span className={`phs-item-amount${isVitalicio ? ' phs-amount--gold' : ''}`}>
                                                {isVitalicio ? '—' : p.amount > 0 ? `${p.amount.toFixed(2)} €` : '—'}
                                            </span>
                                            <span className="phs-item-badge phs-badge--paid">Pago</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default PaymentHistorySocio;