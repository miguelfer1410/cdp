import React, { useState, useEffect } from 'react';
import { FaSave, FaSpinner, FaEuroSign } from 'react-icons/fa';
import './FeeManager.css'; // Will create CSS separately

const FeeManager = () => {
    const [memberFee, setMemberFee] = useState(0);
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingGlobal, setSavingGlobal] = useState(false);
    const [savingSport, setSavingSport] = useState(null); // ID of sport being saved
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchFees();
    }, []);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://51.178.43.232:5285/api/fees', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Falha ao carregar quotas.');

            const data = await response.json();
            setMemberFee(data.memberFee);
            setSports(data.sports);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalFeeChange = (e) => {
        setMemberFee(e.target.value);
    };

    const handleSportFeeChange = (id, value) => {
        setSports(sports.map(s =>
            s.id === id ? { ...s, monthlyFee: value } : s
        ));
    };

    const saveGlobalFee = async () => {
        setSavingGlobal(true);
        setMessage('');
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://51.178.43.232:5285/api/fees/global', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ amount: parseFloat(memberFee) })
            });

            if (!response.ok) throw new Error('Falha ao atualizar quota de sócio.');

            setMessage('Quota de sócio atualizada com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingGlobal(false);
        }
    };

    const saveSportFee = async (sport) => {
        setSavingSport(sport.id);
        setMessage('');
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://51.178.43.232:5285/api/fees/sport/${sport.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ amount: parseFloat(sport.monthlyFee) })
            });

            if (!response.ok) throw new Error(`Falha ao atualizar quota de ${sport.name}.`);

            setMessage(`Quota de ${sport.name} atualizada com sucesso!`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingSport(null);
        }
    };

    if (loading) return <div className="fee-loading"><FaSpinner className="icon-spin" /> A carregar quotas...</div>;

    return (
        <div className="fee-manager">
            <div className="fee-header">
                <h2><FaEuroSign /> Gestão de Quotas</h2>
                <p>Configure os valores das quotas mensais de sócio e modalidades.</p>
            </div>

            {error && <div className="fee-error">{error}</div>}
            {message && <div className="fee-success">{message}</div>}

            <div className="fee-grid">
                {/* Global Member Fee Card */}
                <div className="fee-card highlight">
                    <div className="fee-card-header">
                        <h3>Quota de Sócio Geral</h3>
                        <p>Valor base pago por todos os sócios.</p>
                    </div>
                    <div className="fee-card-body">
                        <div className="input-group">
                            <span className="currency-symbol">€</span>
                            <input
                                type="number"
                                step="0.50"
                                value={memberFee}
                                onChange={handleGlobalFeeChange}
                            />
                        </div>
                        <button
                            className="save-btn"
                            onClick={saveGlobalFee}
                            disabled={savingGlobal}
                        >
                            {savingGlobal ? <FaSpinner className="icon-spin" /> : <FaSave />} Guardar
                        </button>
                    </div>
                </div>

                {/* Sport Fees List */}
                {sports.map(sport => (
                    <div key={sport.id} className="fee-card">
                        <div className="fee-card-header">
                            <h3>{sport.name}</h3>
                            <p>Quota específica da modalidade.</p>
                        </div>
                        <div className="fee-card-body">
                            <div className="input-group">
                                <span className="currency-symbol">€</span>
                                <input
                                    type="number"
                                    step="0.50"
                                    value={sport.monthlyFee}
                                    onChange={(e) => handleSportFeeChange(sport.id, e.target.value)}
                                />
                            </div>
                            <button
                                className="save-btn secondary"
                                onClick={() => saveSportFee(sport)}
                                disabled={savingSport === sport.id}
                            >
                                {savingSport === sport.id ? <FaSpinner className="icon-spin" /> : <FaSave />} Guardar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FeeManager;
