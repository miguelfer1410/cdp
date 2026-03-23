import React, { useState } from 'react';
import './RegulationModal.css';

const RegulationModal = ({ onAccepted }) => {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    if (!accepted) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5285/api/user/accept-regulation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        localStorage.setItem('acceptedRegulation', 'true');
        onAccepted();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao aceitar o regulamento');
      }
    } catch (err) {
      console.error('Error accepting regulation:', err);
      setError(err.message || 'Ocorreu um erro. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="regulation-modal-overlay">
      <div className="regulation-modal">
        <div className="regulation-modal-header">
          <h2>Regulamento Interno</h2>
        </div>
        <div className="regulation-modal-body">
          <p>Bem-vindo ao Clube Desportivo da Póvoa!</p>
          <p>Para continuar a utilizar a nossa plataforma, é necessário ler e aceitar o nosso regulamento interno e política de privacidade.</p>

          <div className="regulation-content-placeholder">
            <h3>Termos Principais</h3>
            <ul>
              <li>O utilizador compromete-se a fornecer dados verdadeiros.</li>
              <li>O acesso à área reservada é pessoal e intransmissível.</li>
              <li>O clube reserva-se ao direito de suspender contas que violem os termos.</li>
              <li>Os dados são tratados de acordo com o RGPD.</li>
            </ul>
            <div className="regulation-download-highlight">
              <p>Consulte o documento completo para melhor compreensão:</p>
              <a href="http://localhost:5285/docs/regulamento_cdpovoa.pdf" target="_blank" rel="noopener noreferrer" className="btn-download-pdf">
                <i className="fa-solid fa-file-pdf"></i> Visualizar Regulamento Interno (PDF)
              </a>
            </div>
          </div>
        </div>
        <div className="regulation-modal-footer">
          {error && <div className="error-message">{error}</div>}

          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={loading}
            />
            <span className="checkbox-text">
              Li e aceito o <strong>Regulamento Interno</strong> do Clube Desportivo da Póvoa.
            </span>
          </label>

          <button
            className="btn-accept-regulation"
            onClick={handleAccept}
            disabled={!accepted || loading}
          >
            {loading ? 'A processar...' : 'Aceitar e Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegulationModal;
