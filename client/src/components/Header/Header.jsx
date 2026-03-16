import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaChevronDown, FaSignOutAlt, FaTachometerAlt, FaCog, FaUserCircle, FaBars, FaTimes } from 'react-icons/fa';
import './Header.css';

const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRoles, setUserRoles] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('roles');
    setIsLoggedIn(false);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    const type = localStorage.getItem('userType');
    const rolesStr = localStorage.getItem('roles');

    if (token && name && !isTokenExpired(token)) {
      setIsLoggedIn(true);
      setUserName(name);

      if (rolesStr) {
        try {
          const roles = JSON.parse(rolesStr);
          setUserRoles(roles);
        } catch (e) {
          setUserRoles(type ? [type] : ['User']);
        }
      } else {
        setUserRoles(type ? [type] : ['User']);
      }
    } else if (token && isTokenExpired(token)) {
      clearSession();
    }
  }, [location]);

  // Periodically check token expiry while the page is open
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token && isTokenExpired(token)) {
        clearSession();
      }
    }, 60000); // check every 60 seconds
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
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
    localStorage.removeItem('roles');
    setIsLoggedIn(false);
    setDropdownOpen(false);
    navigate('/');
  };

  const getMenuOptions = () => {
    const options = [];
    const rolesLower = userRoles.map(r => r.toLowerCase());

    if (rolesLower.includes('admin')) {
      options.push({ 
        icon: <FaTachometerAlt />, 
        label: 'Dashboard Admin', 
        link: '/dashboard-admin' 
      });
    }
    
    if (rolesLower.includes('treinador')) {
      options.push({ 
        icon: <FaTachometerAlt />, 
        label: 'Dashboard Treinador', 
        link: '/dashboard-treinador' 
      });
    }

    if (rolesLower.includes('atleta')) {
      options.push({ 
        icon: <FaTachometerAlt />, 
        label: 'Dashboard Atleta', 
        link: '/dashboard-atleta' 
      });
    }

    if (rolesLower.includes('socio') || rolesLower.includes('user')) {
      options.push({ 
        icon: <FaTachometerAlt />, 
        label: 'Dashboard Sócio', 
        link: '/dashboard-socio' 
      });
    }

    // Default fallback if no roles match
    if (options.length === 0) {
      options.push({ icon: <FaTachometerAlt />, label: 'Dashboard', link: '/' });
    }

    return options;
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
        <div className="mobile-menu-icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <nav className={`navbar ${mobileMenuOpen ? 'active' : ''}`}>
          <div className="nav-links">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              Início
            </Link>
            <Link to="/clube" className={location.pathname === '/clube' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              Clube
            </Link>
            <Link to="/modalidades" className={location.pathname === '/modalidades' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              Modalidades
            </Link>
            <Link to="/noticias" className={location.pathname === '/noticias' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              Notícias
            </Link>
            <Link to="/bilheteria" className={location.pathname === '/bilheteria' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
              Bilheteira
            </Link>
            <Link to="/contactos" className={location.pathname === '/contactos' ? 'active' : ''} onClick={() => setMobileMenuOpen(false)}>
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
                <FaChevronDown className={`chevron ${dropdownOpen ? 'open' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <img src="/CDP_logo.png" alt="Logo CDP" className="logo-img" />
                    <div className="logo-text">
                      <h1>Clube Desportivo</h1>
                      <span>Da Póvoa</span>
                    </div>
                  </div>
                  {getMenuOptions().map((option, index) => (
                    <Link
                      key={index}
                      to={option.link}
                      className="dropdown-item"
                      onClick={() => {
                        setDropdownOpen(false);
                        setMobileMenuOpen(false);
                      }}
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
            <Link to="/login" className="btn-login" onClick={() => setMobileMenuOpen(false)}>
              <i className="fa-regular fa-user"></i> Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
