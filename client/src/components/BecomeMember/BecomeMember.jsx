import React from 'react';
import { FaCreditCard, FaCheckCircle, FaGift, FaCalendarAlt, FaUsers, FaTrophy, FaPercentage } from 'react-icons/fa';
import './BecomeMember.css';

const BecomeMember = ({ userData }) => {
    const [fees, setFees] = React.useState({ memberFee: 3, minorMemberFee: 3 });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchFees = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('http://localhost:5285/api/fees', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setFees({
                        memberFee: data.memberFee,
                        minorMemberFee: data.minorMemberFee || data.memberFee
                    });
                }
            } catch (err) {
                console.error('Error fetching fees:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFees();
    }, []);

    const calculateAge = (birthDate) => {
        if (!birthDate) return 18;
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    const isMinor = calculateAge(userData.birthDate) < 18;
    const currentFee = isMinor ? fees.minorMemberFee : fees.memberFee;

    const benefits = [
        {
            icon: <FaPercentage />,
            title: 'Descontos Exclusivos',
            description: 'Até 20% de desconto em eventos e atividades'
        },
        {
            icon: <FaCalendarAlt />,
            title: 'Acesso a Eventos',
            description: 'Participe em todos os eventos do clube'
        },
        {
            icon: <FaTrophy />,
            title: 'Competições',
            description: 'Inscrição prioritária em torneios'
        },
        {
            icon: <FaUsers />,
            title: 'Comunidade',
            description: 'Faça parte da família CDP'
        }
    ];

    const handlePayment = () => {
        // TODO: Integrate with Stripe payment
        alert('Integração com Stripe em breve!');
    };

    if (loading) return null;

    return (
        <div className="become-member-container">
            {/* Welcome Section */}
            <div className="welcome-section">
                <div className="welcome-icon">
                    <FaUsers />
                </div>
                <h1>Bem-vindo, {userData.firstName}!</h1>
                <p className="welcome-text">
                    Obrigado por se registar no Clube Desportivo da Póvoa.
                    Para se tornar sócio oficial e ter acesso a todos os benefícios,
                    complete o seu registo pagando a primeira quota.
                </p>
            </div>

            {/* Benefits Grid */}
            <div className="benefits-section">
                <h2>Benefícios de Sócio</h2>
                <div className="benefits-grid">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="benefit-card">
                            <div className="benefit-icon">{benefit.icon}</div>
                            <h3>{benefit.title}</h3>
                            <p>{benefit.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Section */}
            <div className="payment-section">
                <div className="payment-container">
                    <div className="payment-header">
                        <FaCreditCard />
                        <h2>Torne-se Sócio Agora</h2>
                    </div>

                    <div className="payment-content">
                        <div className="price-display">
                            <span className="price-label">Quota Mensal {isMinor ? '(Menor)' : ''}</span>
                            <span className="price-value">€{currentFee.toFixed(2)}</span>
                        </div>

                        <div className="payment-info">
                            <p className="info-text">
                                Ao tornar-se sócio, terá acesso imediato a todos os benefícios
                                e poderá participar em todas as atividades do clube.
                            </p>
                        </div>

                        <button className="payment-button" onClick={handlePayment}>
                            <FaCreditCard />
                            Pagar Primeira Quota
                        </button>

                        <div className="payment-note">
                            <p>
                                Pagamento seguro processado via Stripe.
                                Após a confirmação do pagamento, o seu acesso será ativado automaticamente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="contact-section">
                    <h3>Precisa de Ajuda?</h3>
                    <p>Entre em contacto com a nossa secretaria:</p>
                    <div className="contact-details">
                        <div className="contact-item">
                            <strong>Email:</strong>
                            <a href="mailto:socios@cdp.pt">geral@cdpovoa.pt</a>
                        </div>
                        <div className="contact-item">
                            <strong>Telefone:</strong>
                            <a href="tel:+351252000000">+351 252 682 109</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BecomeMember;
