import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Bilheteria.css';
import { FaTicketAlt, FaCalendarAlt, FaMapMarkerAlt, FaInfoCircle, FaCheckCircle, FaUser } from 'react-icons/fa';

const Bilheteria = () => {
    const navigate = useNavigate();
    const [selectedModalidade, setSelectedModalidade] = useState('Todas');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchaseStep, setPurchaseStep] = useState('summary'); // 'summary' | 'processing' | 'success'
    const [isSocio, setIsSocio] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [showAnnualInfoModal, setShowAnnualInfoModal] = useState(false);
    const [isAnnualTicketPurchase, setIsAnnualTicketPurchase] = useState(false);
    const [selectedProfiles, setSelectedProfiles] = useState([]);
    const [linkedUsers] = useState(() => {
        try {
            const stored = localStorage.getItem('linkedUsers');
            const parsed = stored ? JSON.parse(stored) : [];
            console.log('Linked Users Debug:', parsed);
            return parsed;
        } catch { return []; }
    });

    useEffect(() => {
        const fetchPublicEvents = async () => {
            try {
                const response = await fetch('http://localhost:5285/api/events/public');
                if (response.ok) {
                    const data = await response.json();

                    // Formatar dados para a interface
                    const formattedEvents = data.map(e => {
                        const dateObj = new Date(e.startDateTime);

                        const homeTeam = e.isHomeGame ? 'CD Póvoa' : (e.opponentName || 'Adversário');
                        const awayTeam = e.isHomeGame ? (e.opponentName || 'Adversário') : 'CD Póvoa';

                        return {
                            ...e, // Keep original data for modal
                            id: e.id,
                            homeTeam,
                            awayTeam,
                            date: dateObj.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }),
                            time: dateObj.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
                            competition: e.title || `Jogo ${e.sportName}`,
                            modalidade: e.sportName,
                            location: e.location || 'Pavilhão Clube Desportivo da Póvoa',
                            status: 'available'
                        };
                    });

                    setEvents(formattedEvents);
                }
            } catch (error) {
                console.error('Error fetching public events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPublicEvents();

        // Check auth status
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);

        // Check if user is socio
        const roles = localStorage.getItem('roles');
        if (roles) {
            try {
                const rolesArray = JSON.parse(roles);
                console.log(rolesArray);
                const hasSocioRole = rolesArray.some(role =>
                    role.toLowerCase() === 'socio' || role.toLowerCase() === 'admin' || role.toLowerCase() === 'atleta'
                );
                setIsSocio(hasSocioRole);
            } catch (e) {
                console.error('Error parsing roles', e);
            }
        }
    }, [isLoggedIn]);

    const handleBuyClick = (event) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        setSelectedEvent(event);
        setIsAnnualTicketPurchase(false);

        if (linkedUsers.length > 1) {
            setPurchaseStep('selection');
            setSelectedProfiles([]);
            setQuantity(0);
        } else {
            setPurchaseStep('summary');
            const defaultProfile = linkedUsers[0] || null;
            setSelectedProfiles(defaultProfile ? [defaultProfile] : []);
            setQuantity(1);
        }
        setShowPurchaseModal(true);
    };

    const handleAnnualTicketBuy = () => {
        setIsAnnualTicketPurchase(true);
        setSelectedEvent({
            id: 'annual-ticket',
            homeTeam: 'Lugar Anual',
            awayTeam: '2025/2026',
            date: 'Época 2025/2026',
            time: 'Todos os jogos',
            location: 'Pavilhão Clube Desportivo da Póvoa',
            ticketPriceSocio: 40,
            ticketPriceNonSocio: 40,
            isAnnual: true
        });
        setShowAnnualInfoModal(false);

        if (linkedUsers.length > 1) {
            setPurchaseStep('selection');
            setSelectedProfiles([]);
            setQuantity(0);
        } else {
            setPurchaseStep('summary');
            const defaultProfile = linkedUsers[0] || null;
            setSelectedProfiles(defaultProfile ? [defaultProfile] : []);
            setQuantity(1);
        }
        setShowPurchaseModal(true);
    };

    const confirmPurchase = () => {
        if (linkedUsers.length > 1 && selectedProfiles.length === 0) {
            alert('Por favor, seleciona pelo menos um perfil para continuar.');
            return;
        }
        setPurchaseStep('processing');
        // Simulate API call
        setTimeout(() => {
            setPurchaseStep('success');
        }, 2000);
    };

    const modalidades = ['Todas', ...new Set(events.map(match => match.modalidade))];

    const filteredMatches = events.filter(match =>
        selectedModalidade === 'Todas' || match.modalidade === selectedModalidade
    );

    const getDisplayPrice = (event) => {
        if (!isLoggedIn) {
            let lowest = 0;
            if (event.ticketPriceSocio !== null && event.ticketPriceNonSocio !== null) {
                lowest = Math.min(event.ticketPriceSocio, event.ticketPriceNonSocio);
            } else if (event.ticketPriceSocio !== null) lowest = event.ticketPriceSocio;
            else if (event.ticketPriceNonSocio !== null) lowest = event.ticketPriceNonSocio;

            if (lowest === 0 && event.ticketPriceSocio === null && event.ticketPriceNonSocio === null) {
                return 'Grátis';
            }
            return `${lowest}€`;
        }

        const price = isSocio ? (event.ticketPriceSocio ?? 0) : (event.ticketPriceNonSocio ?? 0);
        return `${price}€`;
    };

    const getTicketPrice = (event, profile = null) => {
        if (event.isAnnual) return 40;
        if (!isLoggedIn) return 0;

        // Se um perfil específico for fornecido, verificar o seu estatuto
        if (profile) {
            // Usa o flag isSocio vindo do backend, ou fallback para atleta (obrigatório ser sócio)
            const isMember = profile.isSocio || profile.dashboardType?.toLowerCase() === 'atleta';
            return isMember ? (event.ticketPriceSocio ?? 0) : (event.ticketPriceNonSocio ?? 0);
        }

        // Caso contrário, usa o estatuto do utilizador atual
        return isSocio ? (event.ticketPriceSocio ?? 0) : (event.ticketPriceNonSocio ?? 0);
    };

    const calculateTotal = () => {
        if (!selectedEvent) return 0;
        if (selectedProfiles.length > 0) {
            return selectedProfiles.reduce((sum, p) => sum + getTicketPrice(selectedEvent, p), 0);
        }
        return getTicketPrice(selectedEvent) * quantity;
    };

    if (loading) {
        return (
            <div className="bilheteria-page">
                <div className="bilheteria-hero">
                    <div className="hero-content">
                        <img src="/CDP_logo.png" alt="CDP Logo" className="hero-logo" />
                    </div>
                </div>
                <div className="bilheteria-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
                    <div className="spinner"></div>
                    <p style={{ marginTop: '20px', color: '#4a5568', fontSize: '1.2rem' }}>A carregar bilheteira...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bilheteria-page">
            {/* Purchase Modal */}
            {showPurchaseModal && selectedEvent && (
                <div className="purchase-modal-overlay" onClick={() => setShowPurchaseModal(false)}>
                    <div className="purchase-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowPurchaseModal(false)}>×</button>

                        {purchaseStep === 'selection' && (
                            <>
                                <div className="purchase-header">
                                    <FaUser className="main-icon" />
                                    <h2>Para quem é o bilhete?</h2>
                                    <p>Podes selecionar várias pessoas da tua família.</p>
                                </div>
                                <div className="profile-selection-grid">
                                    {linkedUsers.map(profile => {
                                        const isSelected = selectedProfiles.find(p => p.id === profile.id);
                                        return (
                                            <button
                                                key={profile.id}
                                                className={`profile-select-btn ${isSelected ? 'active' : ''}`}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedProfiles(selectedProfiles.filter(p => p.id !== profile.id));
                                                    } else {
                                                        setSelectedProfiles([...selectedProfiles, profile]);
                                                    }
                                                }}
                                            >
                                                <div className="profile-avatar-small">
                                                    {profile.firstName[0]}{profile.lastName[0]}
                                                </div>
                                                <div className="profile-btn-info">
                                                    <span className="profile-name">{profile.firstName} {profile.lastName}</span>
                                                </div>
                                                {isSelected && <FaCheckCircle className="selection-check" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="selection-footer">
                                    <button
                                        className="btn-confirm"
                                        disabled={selectedProfiles.length === 0}
                                        onClick={() => {
                                            setQuantity(selectedProfiles.length);
                                            setPurchaseStep('summary');
                                        }}
                                    >
                                        Continuar ({selectedProfiles.length})
                                    </button>
                                </div>
                            </>
                        )}

                        {purchaseStep === 'summary' && (
                            <>
                                <div className="purchase-header">
                                    <FaTicketAlt className="main-icon" />
                                    <h2>Confirmar Compra</h2>
                                    <p>Estás a um passo de apoiar o CDP!</p>
                                </div>
                                <div className="purchase-details">
                                    <div className="selected-profile-summary multi">
                                        <span className="label">Bilhete para:</span>
                                        <div className="selected-names-list">
                                            {selectedProfiles.map((p, i) => (
                                                <span key={p.id} className="name-tag">
                                                    {p.firstName}{i < selectedProfiles.length - 1 ? ',' : ''}
                                                </span>
                                            ))}
                                        </div>
                                        {linkedUsers.length > 1 && (
                                            <button className="btn-change-profile" onClick={() => setPurchaseStep('selection')}>Alterar</button>
                                        )}
                                    </div>
                                    <div className="match-summary">
                                        <h3>{selectedEvent.homeTeam} VS {selectedEvent.awayTeam}</h3>
                                        <p><FaCalendarAlt /> {selectedEvent.date} às {selectedEvent.time}</p>
                                        <p><FaMapMarkerAlt /> {selectedEvent.location}</p>
                                    </div>
                                    <div className="price-breakdown">
                                        {selectedProfiles.map(p => {
                                            const price = getTicketPrice(selectedEvent, p);
                                            const isMember = p.isSocio || p.dashboardType?.toLowerCase() === 'atleta';
                                            return (
                                                <div key={p.id} className="price-row item">
                                                    <span>{p.firstName}: {price}€</span>
                                                    <span className="profile-badge-small">{isMember ? 'Sócio' : 'Geral'}</span>
                                                </div>
                                            );
                                        })}

                                        {!isAnnualTicketPurchase && selectedProfiles.length === 1 && (
                                            <div className="quantity-selector">
                                                <span>Quantidade Extra</span>
                                                <div className="quantity-controls">
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                        disabled={quantity <= 1}
                                                    >−</button>
                                                    <span className="qty-value">{quantity}</span>
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                                                        disabled={quantity >= 10}
                                                    >+</button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="price-row total">
                                            <span>Total a Pagar</span>
                                            <span>{calculateTotal().toFixed(2)}€</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-confirm" onClick={confirmPurchase}>Confirmar e Reservar</button>
                                <p className="secure-notice"><FaInfoCircle /> Pagamento processado de forma segura.</p>
                            </>
                        )}

                        {purchaseStep === 'processing' && (
                            <div className="purchase-loading">
                                <div className="spinner"></div>
                                <h3>{isAnnualTicketPurchase ? 'A processar o teu Lugar Anual...' : 'A processar o teu bilhete...'}</h3>
                                <p>Por favor, não feches esta janela.</p>
                            </div>
                        )}

                        {purchaseStep === 'success' && (
                            <div className="purchase-success">
                                <FaCheckCircle className="success-icon" />
                                <h3>{isAnnualTicketPurchase ? 'Lugar Anual Adquirido!' : 'Compra Concluída!'}</h3>
                                <p>
                                    {isAnnualTicketPurchase
                                        ? `O Lugar Anual para ${selectedProfiles.map(p => p.firstName).join(', ')} (época 2025/2026) foi processado com sucesso. Bem-vindo à família!`
                                        : `O bilhete para ${selectedProfiles.map(p => p.firstName).join(', ')} para o jogo ${selectedEvent.awayTeam === 'CD Póvoa' ? selectedEvent.homeTeam : selectedEvent.awayTeam} foi reservado com sucesso.`
                                    }
                                </p>
                                <div className="success-actions">
                                    <button className="btn-primary" onClick={() => setShowPurchaseModal(false)}>Fechar</button>
                                    <button className="btn-outline" onClick={() => window.print()}>Imprimir {isAnnualTicketPurchase ? 'Comprovativo' : 'Bilhete'}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Annual Ticket Info Modal */}
            {showAnnualInfoModal && (
                <div className="purchase-modal-overlay" onClick={() => setShowAnnualInfoModal(false)}>
                    <div className="purchase-modal annual-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowAnnualInfoModal(false)}>×</button>

                        <div className="purchase-header">
                            <FaTicketAlt className="main-icon" />
                            <h2>Lugar Anual 2025/2026</h2>
                            <p>Tudo o que precisas de saber</p>
                        </div>

                        <div className="annual-modal-content">
                            <div className="benefits-section">
                                <h3>Vantagens Exclusivas</h3>
                                <ul>
                                    <li><FaCheckCircle className="check-icon" /> Acesso a todos os jogos em casa (Campeonato e Taça)</li>
                                    <li><FaCheckCircle className="check-icon" /> Lugar marcado personalizado no pavilhão</li>
                                    <li><FaCheckCircle className="check-icon" /> 10% de desconto na loja oficial do clube</li>
                                    <li><FaCheckCircle className="check-icon" /> Prioridade na compra de bilhetes para jogos fora</li>
                                    <li><FaCheckCircle className="check-icon" /> Newsletter exclusiva do sócio detentor</li>
                                </ul>
                            </div>

                            <div className="pricing-section">
                                <div className="price-card">
                                    <span className="price-label">Preço Único</span>
                                    <span className="price-amount">40€</span>
                                    <span className="price-period">Época Inteira</span>
                                </div>
                            </div>
                        </div>

                        <button className="btn-confirm" onClick={handleAnnualTicketBuy}>Comprar Agora</button>
                        <p className="secure-notice"><FaInfoCircle /> Disponível para sócios e não sócios.</p>
                    </div>
                </div>
            )}

            <div className="bilheteria-hero">
                <div className="hero-content">
                    <img src="/CDP_logo.png" alt="CDP Logo" className="hero-logo" />
                </div>
            </div>

            <div className="bilheteria-container">
                <section className="season-tickets-promo">
                    <div className="promo-card">
                        <div className="promo-icon"><FaTicketAlt /></div>
                        <h2>Lugar Anual 2025/2026</h2>
                        <p>Junta-te à família CDP e garante o teu lugar para todos os jogos em casa com vantagens exclusivas.</p>
                        <div className="promo-actions">
                            <button className="bilhete-btn-primary" onClick={() => setShowAnnualInfoModal(true)}>Saber Mais</button>
                        </div>
                    </div>
                </section>

                <section className="upcoming-matches">
                    <div className="section-header">
                        <h2>Próximos Jogos</h2>
                        <div className="divider"></div>
                    </div>

                    <div className="filters-container">
                        {modalidades.map((modalidade) => (
                            <button
                                key={modalidade}
                                className={`filter-btn ${selectedModalidade === modalidade ? 'active' : ''}`}
                                onClick={() => setSelectedModalidade(modalidade)}
                            >
                                {modalidade}
                            </button>
                        ))}
                    </div>

                    <div className="matches-grid">
                        {filteredMatches.length > 0 ? (
                            filteredMatches.map((match) => (
                                <div className="match-card" key={match.id}>
                                    <div className="match-competition">{match.competition}</div>
                                    <div className="match-teams">
                                        <div className="team home">
                                            <span className="team-name">{match.homeTeam}</span>
                                        </div>
                                        <div className="vs">VS</div>
                                        <div className="team away">
                                            <span className="team-name">{match.awayTeam}</span>
                                        </div>
                                    </div>

                                    <div className="match-details">
                                        <div className="detail-item">
                                            <FaCalendarAlt className="detail-icon" />
                                            <span>{match.date} | {match.time}</span>
                                        </div>
                                        <div className="detail-item">
                                            <FaMapMarkerAlt className="detail-icon" />
                                            <span>{match.location}</span>
                                        </div>
                                    </div>

                                    <div className="match-footer">
                                        <div className="match-price">
                                            <span className="price-label">{isLoggedIn ? 'Preço' : 'A partir de'}</span>
                                            <span className="price-value">{getDisplayPrice(match)}</span>
                                        </div>
                                        <button
                                            className={`btn-buy ${match.status === 'sold-out' ? 'disabled' : ''}`}
                                            onClick={() => handleBuyClick(match)}
                                        >
                                            {match.status === 'sold-out' ? 'Esgotado' : 'Comprar Bilhete'}
                                        </button>
                                    </div>
                                    {match.status === 'selling-fast' && (
                                        <div className="badge selling-fast">
                                            <FaInfoCircle /> Últimos Bilhetes!
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="no-matches">
                                <p>Não existem jogos disponíveis para esta modalidade.</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="bilheteria-info">
                    <div className="info-box">
                        <h3>Informações Importantes</h3>
                        <ul>
                            <li>Os bilhetes online podem ser apresentados no telemóvel (não é necessário imprimir).</li>
                            <li>Abertura de portas: 1 hora antes do início do jogo.</li>
                            <li>Sócios têm desconto exclusivo na compra de bilhetes e prioridade na aquisição.</li>
                            <li>Crianças até 3 anos (inclusive) não pagam bilhete, desde que acompanhadas por um adulto e não ocupem lugar sentado.</li>
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Bilheteria;
