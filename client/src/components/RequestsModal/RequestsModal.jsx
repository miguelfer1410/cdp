import React, { useState } from 'react';
import { FaTimes, FaFilePdf, FaUserFriends } from 'react-icons/fa';
import EscalaoRequestCard from '../EscalaoRequest/EscalaoRequestCard';
import FamilyAssociationCard from '../FamilyAssociationModal/FamilyAssociationCard';
import './RequestsModal.css';

const RequestsModal = ({ isOpen, onClose, userId, athleteProfileEscalao }) => {
    const [activeTab, setActiveTab] = useState('escalao');

    if (!isOpen) return null;

    return (
        <div className="req-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="req-modal">
                <div className="req-modal-header">
                    <h2>Requisições & Pedidos</h2>
                    <button className="req-modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="req-tabs">
                    <button
                        className={`req-tab ${activeTab === 'escalao' ? 'active' : ''}`}
                        onClick={() => setActiveTab('escalao')}
                    >
                        <FaFilePdf /> Comprovativo Escalão
                    </button>
                    <button
                        className={`req-tab ${activeTab === 'family' ? 'active' : ''}`}
                        onClick={() => setActiveTab('family')}
                    >
                        <FaUserFriends /> Associação Familiar
                    </button>
                </div>

                <div className="req-modal-body">
                    {activeTab === 'escalao' ? (
                        <EscalaoRequestCard userId={userId} athleteProfileEscalao={athleteProfileEscalao} />
                    ) : (
                        <FamilyAssociationCard userId={userId} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestsModal;
