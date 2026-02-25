import React, { useState, useEffect } from 'react';
import { FaSave, FaSpinner, FaEuroSign, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './FeeManager.css';

// Defined outside FeeManager so React does not remount it on every render
const FeeInput = ({ label, field, sport, onChange }) => (
    <div className="fee-input-container">
        <label>{label}</label>
        <div className="input-group">
            <span className="currency-symbol">€</span>
            <input
                type="number"
                step="0.50"
                min="0"
                value={sport[field]}
                onChange={e => onChange(sport.id, field, e.target.value)}
            />
        </div>
    </div>
);

const FeeManager = () => {
    const [memberFee, setMemberFee] = useState(0);
    const [minorMemberFee, setMinorMemberFee] = useState(0);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingGlobal, setSavingGlobal] = useState(false);
    const [savingSport, setSavingSport] = useState(null);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => { fetchFees(); }, []);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5285/api/fees', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Falha ao carregar quotas.');
            const data = await res.json();
            setMemberFee(data.memberFee);
            setMinorMemberFee(data.minorMemberFee || 0);
            setSports(data.sports.map(s => ({
                ...s,
                feeNormalNormal: s.feeNormalNormal ?? 0,
                feeEscalao1Normal: s.feeEscalao1Normal ?? 0,
                feeEscalao2Normal: s.feeEscalao2Normal ?? 0,
                feeDiscount: s.feeDiscount ?? 0,
                inscriptionFeeNormal: s.inscriptionFeeNormal ?? 0,
                quotaIncluded: s.quotaIncluded ?? true
            })));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSportField = (id, field, value) => {
        setSports(prev => prev.map(s =>
            s.id === id
                ? { ...s, [field]: field === 'quotaIncluded' ? value : value }
                : s
        ));
    };

    const saveGlobalFee = async () => {
        setSavingGlobal(true); setMessage(''); setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5285/api/fees/global', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ amount: parseFloat(memberFee), minorAmount: parseFloat(minorMemberFee) })
            });
            if (!res.ok) throw new Error('Falha ao guardar.');
            setMessage('Quotas de sócio atualizadas!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) { setError(err.message); }
        finally { setSavingGlobal(false); }
    };

    const saveSportFee = async (sport) => {
        setSavingSport(sport.id); setMessage(''); setError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5285/api/fees/sport/${sport.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    feeNormalNormal: parseFloat(sport.feeNormalNormal) || 0,
                    feeEscalao1Normal: parseFloat(sport.feeEscalao1Normal) || 0,
                    feeEscalao2Normal: parseFloat(sport.feeEscalao2Normal) || 0,
                    feeDiscount: parseFloat(sport.feeDiscount) || 0,
                    inscriptionFeeNormal: parseFloat(sport.inscriptionFeeNormal) || 0,
                    quotaIncluded: sport.quotaIncluded,
                })
            });
            if (!res.ok) throw new Error(`Falha ao guardar ${sport.name}.`);
            setMessage(`${sport.name} atualizado!`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) { setError(err.message); }
        finally { setSavingSport(null); }
    };


    if (loading) return (
        <div className="fee-loading"><FaSpinner className="icon-spin" /> A carregar quotas...</div>
    );

    return (
        <div className="fee-manager">
            <div className="fee-header">
                <h2><FaEuroSign /> Gestão de Quotas e Preços</h2>
                <p>Configure as mensalidades, taxas de inscrição e descontos por modalidade.</p>
            </div>

            {error && <div className="fee-error">{error}</div>}
            {message && <div className="fee-success">{message}</div>}

            <div className="fee-grid">

                {/* ── Quota de Sócio Global ─────────────────────────────── */}
                <div className="fee-card highlight fee-card--full">
                    <div className="fee-card-header">
                        <h3>Quota de Sócio Geral</h3>
                        <p>Aplicada quando a modalidade <strong>não inclui</strong> quota (ex: Ténis de Mesa, Atletismo).</p>
                    </div>
                    <div className="fee-card-body fee-card-body--row">
                        <div className="fee-input-container">
                            <label>Adulto (≥ 18 anos)</label>
                            <div className="input-group">
                                <span className="currency-symbol">€</span>
                                <input type="number" step="0.50" min="0" value={memberFee}
                                    onChange={e => setMemberFee(e.target.value)} />
                            </div>
                        </div>
                        <div className="fee-input-container">
                            <label>Menor (≤ 17 anos)</label>
                            <div className="input-group">
                                <span className="currency-symbol">€</span>
                                <input type="number" step="0.50" min="0" value={minorMemberFee}
                                    onChange={e => setMinorMemberFee(e.target.value)} />
                            </div>
                        </div>
                        <button className="save-btn" onClick={saveGlobalFee} disabled={savingGlobal}>
                            {savingGlobal ? <FaSpinner className="icon-spin" /> : <FaSave />} Guardar
                        </button>
                    </div>
                </div>

                {/* ── Cards por Modalidade ──────────────────────────────── */}
                {sports.map(sport => (
                    <div key={sport.id} className="fee-card">

                        <div className="fee-card-header">
                            <div className="fee-sport-title-row">
                                <h3>{sport.name}</h3>
                                <button
                                    className={`quota-toggle ${sport.quotaIncluded ? 'quota-toggle--on' : 'quota-toggle--off'}`}
                                    onClick={() => handleSportField(sport.id, 'quotaIncluded', !sport.quotaIncluded)}
                                >
                                    {sport.quotaIncluded
                                        ? <><FaCheckCircle /> Quota incluída</>
                                        : <><FaTimesCircle /> Quota separada</>}
                                </button>
                            </div>
                            <p className="fee-card-hint">
                                {sport.quotaIncluded
                                    ? 'A mensalidade já inclui a quota de sócio.'
                                    : 'A quota de sócio é somada à mensalidade.'}
                            </p>
                        </div>

                        <div className="fee-card-body fee-card-body--col">
                            <div className="fee-section">
                                <div className="fee-section-label">Mensalidades</div>
                                <div className="fee-row fee-row--5cols">
                                    <FeeInput label="Sem Escalão" field="feeNormalNormal" sport={sport} onChange={handleSportField} />
                                    <FeeInput label="Escalão 1" field="feeEscalao1Normal" sport={sport} onChange={handleSportField} />
                                    <FeeInput label="Escalão 2" field="feeEscalao2Normal" sport={sport} onChange={handleSportField} />
                                    <FeeInput label="Irmão / 2ª Mod." field="feeDiscount" sport={sport} onChange={handleSportField} />
                                    <FeeInput label="Inscrição" field="inscriptionFeeNormal" sport={sport} onChange={handleSportField} />
                                </div>
                            </div>

                            <button
                                className="save-btn save-btn--full"
                                onClick={() => saveSportFee(sport)}
                                disabled={savingSport === sport.id}
                            >
                                {savingSport === sport.id ? <FaSpinner className="icon-spin" /> : <FaSave />}
                                Guardar {sport.name}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeeManager;