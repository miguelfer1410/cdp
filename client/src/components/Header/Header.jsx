import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaChevronDown, FaSignOutAlt, FaTachometerAlt, FaCog, FaUserCircle } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    const type = localStorage.getItem('userType');

    if (token && name && type) {
      setIsLoggedIn(true);
      setUserName(name);
      setUserType(type);
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setDropdownOpen(false);
    navigate('/');
  };

  const getDashboardLink = () => {
    switch (userType.toLowerCase()) {
      case 'admin':
        return '/dashboard-admin';
      case 'atleta':
        return '/dashboard-atleta';
      case 'treinador':
        return '/dashboard-treinador';
      case 'socio':
        return '/dashboard-socio';
      default:
        return '/';
    }
  };

  const getMenuOptions = () => {
    const commonOptions = [
      { icon: <FaTachometerAlt />, label: 'Dashboard', link: getDashboardLink() },
    ];

    return commonOptions;
  };

  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/CDP_logo.png" alt="Logo CDP" className="logo-img" />
            <div className="logo-text">
              <h1>Clube Desportivo</h1>
              <span>Da Póvoa</span>
            </div>
          </Link>
        </div>
        <nav className="navbar">
          <div className="nav-links">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Início
            </Link>
            <Link to="/clube" className={location.pathname === '/clube' ? 'active' : ''}>
              Clube
            </Link>
            <Link to="/modalidades" className={location.pathname === '/modalidades' ? 'active' : ''}>
              Modalidades
            </Link>
            <Link to="/noticias" className={location.pathname === '/noticias' ? 'active' : ''}>
              Notícias
            </Link>
            <Link to="/contactos" className={location.pathname === '/contactos' ? 'active' : ''}>
              Contactos
            </Link>
          </div>

          {isLoggedIn ? (
            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-menu-button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <FaUser className="user-icon" />
                <span className="user-name">{userName}</span>
                <FaChevronDown className={`chevron ${dropdownOpen ? 'open' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <span className="user-type-badge">{userType}</span>
                  </div>
                  {getMenuOptions().map((option, index) => (
                    <Link
                      key={index}
                      to={option.link}
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </Link>
                  ))}
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <FaSignOutAlt />
                    <span>Sair</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              <i className="fa-regular fa-user"></i> Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
