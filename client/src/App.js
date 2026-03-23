import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home';
import Clube from './pages/Clube';
import './styles/global.css';
import Modalidades from './pages/Modalidades';
import News from './components/Home/News/News';
import Noticias from './pages/Noticias';
import NoticiaDetalhe from './pages/NoticiaDetalhe';
import Contactos from './pages/Contactos';
import Login from './pages/auth/Login';
import Registo from './pages/auth/Registo';
import RegistoSucesso from './pages/auth/RegistoSucesso';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import DashboardSocio from './pages/dashboards/DashboardSocio';
import DashboardAdmin from './pages/dashboards/DashboardAdmin';
import DashboardAtleta from './pages/dashboards/DashboardAtleta';
import DashboardTreinador from './pages/dashboards/DashboardTreinador';
import AtivarConta from './pages/auth/AtivarConta';
import VerificationPage from './pages/VerificationPage';
import Bilheteria from './pages/Bilheteria';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import RegulationModal from './components/RegulationModal/RegulationModal';

function AppContent() {
  const location = useLocation();

  const noFooterRoutes = [
    '/dashboard-',
    '/login',
    '/registo',
    '/recuperar-password',
    '/reset-password',
    '/ativar-conta',
    '/verify'
  ];

  const hideFooter = noFooterRoutes.some(route => location.pathname.startsWith(route));

  const [showRegulationModal, setShowRegulationModal] = React.useState(false);

  React.useEffect(() => {
    const checkRegulation = () => {
      const token = localStorage.getItem('token');
      const accepted = localStorage.getItem('acceptedRegulation');
      if (token && accepted === 'false') {
        setShowRegulationModal(true);
      } else {
        setShowRegulationModal(false);
      }
    };

    window.addEventListener('check-regulation', checkRegulation);
    checkRegulation();

    return () => {
      window.removeEventListener('check-regulation', checkRegulation);
    };
  }, [location]);

  const handleAcceptedRegulation = () => {
    setShowRegulationModal(false);
    
    // If the user is on the login page, redirect them now that they've accepted
    if (location.pathname === '/login') {
      const rolesStr = localStorage.getItem('roles');
      if (rolesStr) {
        try {
          const roles = JSON.parse(rolesStr).map(r => r.toLowerCase());
          if (roles.includes('atleta')) {
            window.location.href = '/dashboard-atleta';
          } else if (roles.includes('treinador')) {
            window.location.href = '/dashboard-treinador';
          } else if (roles.includes('admin')) {
            window.location.href = '/dashboard-admin';
          } else if (roles.includes('socio') || roles.includes('user')) {
            window.location.href = '/dashboard-socio';
          } else {
            window.location.href = '/';
          }
        } catch (e) {
          window.location.href = '/';
        }
      }
    }
  };

  return (
    <div className="App">
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registo" element={<Registo />} />
          <Route path="/registo-sucesso" element={<RegistoSucesso />} />
          <Route path="/recuperar-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard-socio" element={<DashboardSocio />} />
          <Route path="/dashboard-admin" element={<DashboardAdmin />} />
          <Route path="/dashboard-atleta" element={<DashboardAtleta />} />
          <Route path="/dashboard-treinador" element={<DashboardTreinador />} />
          <Route path="/clube" element={<Clube />} />
          <Route path="/modalidades" element={<Modalidades />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/noticias/:slug" element={<NoticiaDetalhe />} />
          <Route path="/bilheteria" element={<Bilheteria />} />
          <Route path="/contactos" element={<Contactos />} />
          <Route path="/ativar-conta" element={<AtivarConta />} />
          <Route path="/verify/:id" element={<VerificationPage />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/payment-cancel" element={<PaymentCancel />} />
        </Routes>
      </main>
      {showRegulationModal && (
        <RegulationModal onAccepted={handleAcceptedRegulation} />
      )}
      {!hideFooter && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
