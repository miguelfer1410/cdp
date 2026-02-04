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

function AppContent() {
  const location = useLocation();
  const isAdminDashboard = location.pathname === '/dashboard-admin';

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
          <Route path="/clube" element={<Clube />} />
          <Route path="/modalidades" element={<Modalidades />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/noticias/:slug" element={<NoticiaDetalhe />} />
          <Route path="/contactos" element={<Contactos />} />
        </Routes>
      </main>
      {!isAdminDashboard && <Footer />}
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
