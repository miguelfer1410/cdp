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
  const [linkedUsers, setLinkedUsers] = useState([]);
  const [userId, setUserId] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userType');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('roles');
    localStorage.removeItem('linkedUsers');
    localStorage.removeItem('userId');
    localStorage.removeItem('primaryUserId');
    localStorage.removeItem('acceptedRegulation');
    setIsLoggedIn(false);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    const type = localStorage.getItem('userType');
    const rolesStr = localStorage.getItem('roles');
    const linkedUsersStr = localStorage.getItem('linkedUsers');
    const storedUserId = localStorage.getItem('userId');

    if (token && name && !isTokenExpired(token)) {
      setIsLoggedIn(true);
      setUserName(name);
      setUserId(storedUserId ? parseInt(storedUserId) : null);

      if (rolesStr) {
        try {
          setUserRoles(JSON.parse(rolesStr));
        } catch (e) {
          setUserRoles(type ? [type] : ['User']);
        }
      } else {
        setUserRoles(type ? [type] : ['User']);
      }

      if (linkedUsersStr) {
        try {
          setLinkedUsers(JSON.parse(linkedUsersStr));
        } catch (e) {
          setLinkedUsers([]);
        }
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
    localStorage.removeItem('linkedUsers');
    localStorage.removeItem('userId');
    localStorage.removeItem('primaryUserId');
    localStorage.removeItem('acceptedRegulation');
    setIsLoggedIn(false);
    setDropdownOpen(false);
    navigate('/');
  };

  const handleSwitchUser = async (targetUserId, link) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5285/api/auth/switch-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('roles', JSON.stringify(data.roles));
        localStorage.setItem('userName', `${data.firstName} ${data.lastName}`);
        localStorage.setItem('userEmail', data.email);
        localStorage.setItem('userId', data.id.toString());
        localStorage.setItem('acceptedRegulation', data.acceptedRegulation ? 'true' : 'false');
        if (data.linkedUsers) {
          localStorage.setItem('linkedUsers', JSON.stringify(data.linkedUsers));
        }

        // Use navigate + reload to ensure all components refresh with the new token/roles
        navigate(link);
        window.location.reload();
      } else {
        const err = await response.json();
        alert(err.message || 'Erro ao trocar de utilizador');
      }
    } catch (err) {
      console.error('Error switching user:', err);
    }
  };

  const getMenuOptions = () => {
    const options = [];
    const primaryUserId = parseInt(localStorage.getItem('primaryUserId') || localStorage.getItem('userId'));

    // Check all users (current + linked) to find available dashboards
    const allUsersData = [
      { id: userId, roles: userRoles },
      ...linkedUsers.map(lu => ({ id: lu.id, roles: lu.roles || [lu.dashboardType] || [] }))
    ];

    const hasAdmin = allUsersData.some(u => u.roles.some(r => r.toLowerCase() === 'admin'));
    const hasAtleta = allUsersData.some(u => u.roles.some(r => r.toLowerCase() === 'atleta'));
    const hasTreinador = allUsersData.some(u => u.roles.some(r => r.toLowerCase() === 'treinador'));

    // Sócio is shown only if there's someone who is "exclusively" a socio (no other major roles)
    const hasExclusiveSocio = allUsersData.some(u => {
      const roles = u.roles.map(r => r.toLowerCase());
      const isSocio = roles.includes('socio') || roles.includes('user');
      const hasOther = roles.includes('admin') || roles.includes('atleta') || roles.includes('treinador');
      return isSocio && !hasOther;
    });

    if (hasAdmin) {
      const u = allUsersData.find(u => u.roles.some(r => r.toLowerCase() === 'admin'));
      options.push({ icon: <FaTachometerAlt />, label: 'Dashboard Admin', link: '/dashboard-admin', userId: u.id });
    }
    if (hasAtleta) {
      const u = allUsersData.find(u => u.roles.some(r => r.toLowerCase() === 'atleta'));
      options.push({ icon: <FaTachometerAlt />, label: 'Dashboard Atleta', link: '/dashboard-atleta', userId: u.id });
    }
    if (hasTreinador) {
      const u = allUsersData.find(u => u.roles.some(r => r.toLowerCase() === 'treinador'));
      options.push({ icon: <FaTachometerAlt />, label: 'Dashboard Treinador', link: '/dashboard-treinador', userId: u.id });
    }
    if (hasExclusiveSocio) {
      const u = allUsersData.find(u => {
        const roles = u.roles.map(r => r.toLowerCase());
        const isSocio = roles.includes('socio') || roles.includes('user');
        const hasOther = roles.includes('admin') || roles.includes('atleta') || roles.includes('treinador');
        return isSocio && !hasOther;
      });
      options.push({ icon: <FaTachometerAlt />, label: 'Dashboard Sócio', link: '/dashboard-socio', userId: u.id });
    }

    // 3. Sort options to maintain consistent order: Admin, Atleta, Treinador, Socio
    const order = { 'admin': 1, 'atleta': 2, 'treinador': 3, 'socio': 4 };
    options.sort((a, b) => {
      const getType = (opt) => {
        if (opt.link.includes('admin')) return 'admin';
        if (opt.link.includes('atleta')) return 'atleta';
        if (opt.link.includes('treinador')) return 'treinador';
        if (opt.link.includes('socio')) return 'socio';
        return 'other';
      };
      return (order[getType(a)] || 99) - (order[getType(b)] || 99);
    });

    // Fallback if no roles match
    if (options.length === 0) {
      options.push({ icon: <FaTachometerAlt />, label: 'Dashboard', link: '/', userId: primaryUserId });
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
                      onClick={(e) => {
                        if (option.userId && option.userId !== userId) {
                          e.preventDefault();
                          handleSwitchUser(option.userId, option.link);
                        } else {
                          setDropdownOpen(false);
                          setMobileMenuOpen(false);
                        }
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
