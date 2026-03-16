import React from 'react';
import { Link } from 'react-router-dom';
import './PaymentPages.css';

const PaymentCancel = () => {
    return (
        <div className="payment-page-wrapper">
            <div className="payment-card cancel">
                <div className="icon-circle">
                    <i className="fas fa-times"></i>
                </div>
                <h1>Pagamento Cancelado</h1>
                <p>O processo de compra de bilhete foi interrompido.</p>
                <p>Não foi efetuada qualquer cobrança.</p>
                <div className="actions">
                    <Link to="/dashboard/atleta" className="btn-primary">Tentar Novamente</Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentCancel;
