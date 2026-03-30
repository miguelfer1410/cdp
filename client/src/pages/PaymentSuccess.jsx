import React, { useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './PaymentPages.css';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Here we could call an API to verify the session if we wanted immediate feedback,
        // but the webhook will handle the ticket generation.
    }, [sessionId]);

    return (
        <div className="payment-page-wrapper">
            <div className="payment-card success">
                <div className="icon-circle">
                    <i className="fas fa-check"></i>
                </div>
                <h1>Pagamento Concluído!</h1>
                <p>O seu bilhete foi gerado com sucesso e enviado para o seu email.</p>
                <p className="note">Por favor, verifique a sua caixa de entrada (e a pasta de spam).</p>
                <div className="actions">
                    <Link to="/dashboard-atleta" className="btn-primary">Voltar ao Dashboard</Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
