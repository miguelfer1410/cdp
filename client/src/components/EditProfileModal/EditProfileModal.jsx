import React, { useState } from 'react';
import { FaPhone, FaMapMarkerAlt, FaIdCard, FaTimes, FaSave } from 'react-icons/fa';
import './EditProfileModal.css';

const EditProfileModal = ({ isOpen, onClose, userData, onSave }) => {
    const [formData, setFormData] = useState({
        phone: userData?.phone || '',
        nif: userData?.nif || '',
        address: userData?.address || '',
        postalCode: userData?.postalCode || '',
        city: userData?.city || ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            const response = await fetch('http://localhost:5285/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Erro ao atualizar perfil');
            }

            const updatedData = await response.json();
            onSave(updatedData);
            onClose();
        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Erro ao atualizar perfil. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Editar Informações Pessoais</h2>
                    <button className="close-btn" onClick={onClose} disabled={loading}>
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Telemóvel</label>
                        <div className="input-wrapper">
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+351 912 345 678"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>NIF</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                name="nif"
                                value={formData.nif}
                                onChange={handleChange}
                                placeholder="123456789"
                                maxLength="9"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Morada</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Rua, número, andar"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Código Postal</label>
                            <input
                                type="text"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleChange}
                                placeholder="4490-500"
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Localidade</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Póvoa de Varzim"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-save"
                            disabled={loading}
                        >
                            <FaSave />
                            {loading ? 'A guardar...' : 'Guardar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
