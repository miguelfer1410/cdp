import React from 'react';
import { FaTimes, FaUser, FaTshirt } from 'react-icons/fa';
import './TeamDetailsModal.css';

const TeamDetailsModal = ({ isOpen, onClose, teamData }) => {
    if (!isOpen || !teamData) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content team-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><i className="fas fa-users"></i> {teamData.name} - Plantel Completo</h2>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="team-modal-body">
                    {/* Coaches Section */}
                    <div className="team-section">
                        <h3><i className="fas fa-chalkboard-teacher"></i> Equipa Técnica</h3>
                        <div className="team-list">
                            {teamData.coaches?.map((coach) => (
                                <div className="team-list-item" key={`coach-${coach.id}`}>
                                    <div className="member-avatar coach-avatar">
                                        {coach.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div className="member-info">
                                        <h4>{coach.name}</h4>
                                        <p>Treinador</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Athletes Section */}
                    <div className="team-section">
                        <h3><i className="fas fa-running"></i> Atletas</h3>
                        <div className="team-list">
                            {teamData.athletes?.map((athlete) => (
                                <div className="team-list-item" key={`athlete-${athlete.id}`}>
                                    <div className="member-avatar athlete-avatar">
                                        {athlete.jerseyNumber || athlete.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                    </div>
                                    <div className="member-info">
                                        <h4>{athlete.name}</h4>
                                        <p>
                                            {athlete.position || 'Atleta'}
                                            {athlete.isCaptain && <span className="captain-badge">• Capitão</span>}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamDetailsModal;
