import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home';
import Clube from './pages/Clube';
import './styles/global.css';
import Modalidades from './pages/Modalidades';
import News from './components/Home/News/News';
import Noticias from './pages/Noticias';
import Contactos from './pages/Contactos';
import Login from './pages/auth/Login';
import Registo from './pages/auth/Registo';
import RegistoSucesso from './pages/auth/RegistoSucesso';
import DashboardSocio from './pages/dashboards/DashboardSocio';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registo" element={<Registo />} />
            <Route path="/registo-sucesso" element={<RegistoSucesso />} />
            <Route path="/dashboard-socio" element={<DashboardSocio />} />
            <Route path="/clube" element={<Clube />} />
            <Route path="/modalidades" element={<Modalidades />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/contactos" element={<Contactos />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
