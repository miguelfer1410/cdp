import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaUsers, FaRunning, FaIdCard, FaChalkboardTeacher, FaUserShield, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import './PeopleManager.css';

const PeopleManager = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [sports, setSports] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [activeTab, setActiveTab] = useState('personal'); // personal, profiles, roles
    const [validationErrors, setValidationErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        profileType: 'all',
        roleId: null,
        isActive: true,
        teamId: '',
        search: ''
    });
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [formData, setFormData] = useState({
        // Personal
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        birthDate: '',
        nif: '',
        address: '',
        postalCode: '',
        city: '', // Profile flags
        hasAthleteProfile: false,
        hasMemberProfile: false,
        hasCoachProfile: false,
        // Profile data
        athleteProfile: {
            height: '',
            weight: '',
            medicalCertificateExpiry: '',
            teamId: ''
        },
        memberProfile: {
            membershipStatus: 0, // Pending
            memberSince: '',
            paymentPreference: ''
        },
        coachProfile: {
            sportId: '',
            teamId: '',
            licenseNumber: '',
            licenseLevel: '',
            licenseExpiry: '',
            specialization: ''
        },
        // Roles
        selectedRoles: []
    });

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchSports();
        fetchTeams();
    }, [filters]);

    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchTerm }));
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();

            if (filters.profileType !== 'all') params.append('profileType', filters.profileType);
            if (filters.roleId) params.append('roleId', filters.roleId);
            if (filters.isActive !== null) params.append('isActive', filters.isActive);
            if (filters.teamId) params.append('teamId', filters.teamId);
            if (filters.search) params.append('search', filters.search);

            const response = await fetch(`http://localhost:5285/api/users?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/roles', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setRoles(data);
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchSports = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/sports/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSports(data.filter(s => s.isActive));
            }
        } catch (error) {
            console.error('Error fetching sports:', error);
        }
    };

    const fetchTeams = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5285/api/teams/all', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTeams(data.filter(t => t.isActive));
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const getProfileBadges = (user) => {
        const badges = [];
        // Check for Admin role
        if (user.roles && user.roles.some(r => r.name === 'Admin')) {
            badges.push({ type: 'admin', label: 'Admin', icon: <FaUserShield /> });
        }
        if (user.hasAthleteProfile) badges.push({ type: 'athlete', label: 'Atleta', icon: <FaRunning /> });
        if (user.hasMemberProfile) badges.push({ type: 'member', label: 'Sócio', icon: <FaIdCard /> });
        if (user.hasCoachProfile) badges.push({ type: 'coach', label: 'Treinador', icon: <FaChalkboardTeacher /> });
        return badges;
    };

    const resetForm = () => {
        setFormData({
            email: '',
            firstName: '',
            lastName: '',
            phone: '',
            birthDate: '',
            nif: '',
            address: '',
            postalCode: '',
            city: '',
            hasAthleteProfile: false,
            hasMemberProfile: false,
            hasCoachProfile: false,
            athleteProfile: {
                height: '',
                weight: '',
                medicalCertificateExpiry: '',
                teamId: ''
            },
            memberProfile: {
                membershipStatus: 0,
                memberSince: '',
                paymentPreference: ''
            },
            coachProfile: {
                sportId: '',
                teamId: '',
                licenseNumber: '',
                licenseLevel: '',
                licenseExpiry: '',
                specialization: ''
            },
            selectedRoles: []
        });
        setEditingUser(null);
        setActiveTab('personal');
    };

    // Validation function
    const validateForm = () => {
        const errors = {};

        // Tab 1: Personal Data - Required fields
        if (!formData.email.trim()) errors.email = 'Email é obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Email inválido';

        if (!formData.firstName.trim()) errors.firstName = 'Nome é obrigatório';
        if (!formData.lastName.trim()) errors.lastName = 'Apelido é obrigatório';
        if (!formData.phone.trim()) errors.phone = 'Telefone é obrigatório';
        if (!formData.birthDate) errors.birthDate = 'Data de nascimento é obrigatória';
        if (!formData.nif.trim()) errors.nif = 'NIF é obrigatório';
        else if (formData.nif.length !== 9) errors.nif = 'NIF deve ter 9 dígitos';

        if (!formData.address.trim()) errors.address = 'Morada é obrigatória';
        if (!formData.postalCode.trim()) errors.postalCode = 'Código postal é obrigatório';
        if (!formData.city.trim()) errors.city = 'Localidade é obrigatória';

        // Tab 2: Profiles - Validate enabled profiles
        if (formData.hasAthleteProfile) {
            if (!formData.athleteProfile.height) errors.athleteHeight = 'Altura é obrigatória';
            if (!formData.athleteProfile.weight) errors.athleteWeight = 'Peso é obrigatório';
            if (!formData.athleteProfile.medicalCertificateExpiry) {
                errors.athleteMedical = 'Validade do atestado médico é obrigatória';
            }
        }

        if (formData.hasMemberProfile) {
            if (!formData.memberProfile.memberSince) errors.memberSince = 'Data de início é obrigatória';
            if (formData.memberProfile.membershipStatus === undefined || formData.memberProfile.membershipStatus === '') {
                errors.membershipStatus = 'Estado de sócio é obrigatório';
            }
        }

        if (formData.hasCoachProfile) {
            if (!formData.coachProfile.sportId) errors.coachSport = 'Modalidade é obrigatória';
            if (!formData.coachProfile.licenseLevel) errors.coachLicenseLevel = 'Nível de licença é obrigatório';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEdit = async (user) => {
        setEditingUser(user);

        // Fetch full user details
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/users/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFormData({
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone || '',
                    birthDate: data.birthDate ? data.birthDate.split('T')[0] : '',
                    nif: data.nif || '',
                    address: data.address || '',
                    postalCode: data.postalCode || '',
                    city: data.city || '',
                    hasAthleteProfile: data.hasAthleteProfile,
                    hasMemberProfile: data.hasMemberProfile,
                    hasCoachProfile: data.hasCoachProfile,
                    athleteProfile: data.athleteProfile ? {
                        height: data.athleteProfile.height || '',
                        weight: data.athleteProfile.weight || '',
                        medicalCertificateExpiry: data.athleteProfile.medicalCertificateExpiry
                            ? data.athleteProfile.medicalCertificateExpiry.split('T')[0]
                            : '',
                        teamId: data.athleteProfile.teams && data.athleteProfile.teams.length > 0
                            ? data.athleteProfile.teams[0].id
                            : ''
                    } : {
                        height: '',
                        weight: '',
                        medicalCertificateExpiry: '',
                        teamId: ''
                    },
                    memberProfile: data.memberProfile ? {
                        membershipStatus: data.memberProfile.membershipStatus,
                        memberSince: data.memberProfile.memberSince
                            ? data.memberProfile.memberSince.split('T')[0]
                            : '',
                        paymentPreference: data.memberProfile.paymentPreference || ''
                    } : {
                        membershipStatus: 0,
                        memberSince: '',
                        paymentPreference: ''
                    },
                    coachProfile: data.coachProfile ? {
                        sportId: data.coachProfile.sportId,
                        teamId: data.coachProfile.teamId || '',
                        licenseNumber: data.coachProfile.licenseNumber || '',
                        licenseLevel: data.coachProfile.licenseLevel || '',
                        licenseExpiry: data.coachProfile.licenseExpiry
                            ? data.coachProfile.licenseExpiry.split('T')[0]
                            : '',
                        specialization: data.coachProfile.specialization || ''
                    } : {
                        sportId: '',
                        teamId: '',
                        licenseNumber: '',
                        licenseLevel: '',
                        licenseExpiry: '',
                        specialization: ''
                    },
                    selectedRoles: data.roles.map(r => r.id)
                });
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }

        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja desativar este utilizador?')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchUsers();
            } else {
                alert('Erro ao desativar utilizador');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erro ao desativar utilizador');
        }
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = React.useMemo(() => {
        let sortableUsers = [...users];
        if (sortConfig.key !== null) {
            sortableUsers.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle special cases
                if (sortConfig.key === 'profiles') {
                    aValue = getProfileBadges(a).length;
                    bValue = getProfileBadges(b).length;
                } else if (sortConfig.key === 'team') {
                    aValue = a.currentTeam || '';
                    bValue = b.currentTeam || '';
                } else {
                    // Default string comparison handling nulls
                    aValue = aValue ? aValue.toString().toLowerCase() : '';
                    bValue = bValue ? bValue.toString().toLowerCase() : '';
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig]);

    const getSortIcon = (name) => {
        if (sortConfig.key !== name) {
            return <FaSort className="sort-icon" />;
        }
        if (sortConfig.direction === 'ascending') {
            return <FaSortUp className="sort-icon active" />;
        }
        return <FaSortDown className="sort-icon active" />;
    };


    return (
        <div className="people-manager">
            <div className="manager-header">
                <div className="header-content">
                    <h1>Gestão de Pessoas</h1>
                    <p className="header-subtitle">Gerir atletas, sócios, treinadores e utilizadores do clube</p>
                </div>
                <button className="btn-add" onClick={() => setShowModal(true)}>
                    <FaPlus /> Adicionar Pessoa
                </button>
            </div>

            {/* Filters */}
            <div className="filters-container">
                <div className="filter-group">
                    <label className="filter-label">Tipo de Perfil:</label>
                    <select
                        className="filter-select"
                        value={filters.profileType}
                        onChange={(e) => setFilters({ ...filters, profileType: e.target.value })}
                    >
                        <option value="all">Todos</option>
                        <option value="athlete">Atletas</option>
                        <option value="member">Sócios</option>
                        <option value="coach">Treinadores</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Equipa:</label>
                    <select
                        className="filter-select"
                        value={filters.teamId || ''}
                        onChange={(e) => setFilters({ ...filters, teamId: e.target.value ? parseInt(e.target.value) : '' })}
                    >
                        <option value="">Todas</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Role:</label>
                    <select
                        className="filter-select"
                        value={filters.roleId || ''}
                        onChange={(e) => setFilters({ ...filters, roleId: e.target.value ? parseInt(e.target.value) : null })}
                    >
                        <option value="">Todas</option>
                        {roles.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group search-group">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Pesquisar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>A carregar utilizadores...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="empty-state">
                    <FaUsers className="empty-icon" />
                    <h3>Nenhum utilizador encontrado</h3>
                    <p>Adicione o primeiro utilizador do clube</p>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        <FaPlus /> Adicionar Pessoa
                    </button>
                </div>
            ) : (
                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('fullName')} style={{ cursor: 'pointer' }}>
                                    <div className="th-content">Nome {getSortIcon('fullName')}</div>
                                </th>
                                <th onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                                    <div className="th-content">Email {getSortIcon('email')}</div>
                                </th>
                                <th onClick={() => handleSort('phone')} style={{ cursor: 'pointer' }}>
                                    <div className="th-content">Telefone {getSortIcon('phone')}</div>
                                </th>
                                <th onClick={() => handleSort('profiles')} style={{ cursor: 'pointer' }}>
                                    <div className="th-content">Perfis {getSortIcon('profiles')}</div>
                                </th>
                                <th onClick={() => handleSort('team')} style={{ cursor: 'pointer' }}>
                                    <div className="th-content">Equipa {getSortIcon('team')}</div>
                                </th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="user-name">{user.fullName}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone || '-'}</td>
                                    <td className="profiles-cell">
                                        {getProfileBadges(user).map((badge, idx) => (
                                            <span key={idx} className={`profile-badge ${badge.type}`}>
                                                {badge.icon} {badge.label}
                                            </span>
                                        ))}
                                        {getProfileBadges(user).length === 0 && '-'}
                                    </td>
                                    <td>{user.currentTeam || '-'}</td>
                                    <td className="actions-cell">
                                        <button
                                            className="action-btn edit"
                                            onClick={() => handleEdit(user)}
                                            title="Editar"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="action-btn delete"
                                            onClick={() => handleDelete(user.id)}
                                            title="Desativar"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}


            {/* Modal */}
            {
                showModal && (
                    <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{editingUser ? 'Editar Pessoa' : 'Adicionar Pessoa'}</h2>
                                <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
                            </div>

                            {/* Tabs */}
                            <div className="tabs-container">
                                <button
                                    className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('personal')}
                                >
                                    Dados Pessoais
                                </button>
                                <button
                                    className={`tab ${activeTab === 'profiles' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('profiles')}
                                >
                                    Perfis
                                </button>
                                <button
                                    className={`tab ${activeTab === 'roles' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('roles')}
                                >
                                    Roles
                                </button>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();

                                if (!validateForm()) {
                                    alert('Por favor, preencha todos os campos obrigatórios corretamente.');
                                    return;
                                }

                                setSubmitting(true);

                                try {
                                    const token = localStorage.getItem('token');

                                    // Step 1: Create or update user
                                    let userId = editingUser?.id;
                                    const userPayload = {
                                        email: formData.email,
                                        firstName: formData.firstName,
                                        lastName: formData.lastName,
                                        phone: formData.phone || null,
                                        birthDate: formData.birthDate || null,
                                        nif: formData.nif || null,
                                        address: formData.address || null,
                                        postalCode: formData.postalCode || null,
                                        city: formData.city || null
                                    };

                                    if (editingUser) {
                                        // Update existing user
                                        const response = await fetch(`http://localhost:5285/api/users/${userId}`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify(userPayload)
                                        });

                                        if (!response.ok) {
                                            throw new Error('Erro ao atualizar utilizador');
                                        }
                                    } else {
                                        // Create new user
                                        const response = await fetch('http://localhost:5285/api/users', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({ ...userPayload, password: 'TempPassword123!' })
                                        });

                                        if (!response.ok) {
                                            throw new Error('Erro ao criar utilizador');
                                        }

                                        const data = await response.json();
                                        userId = data.id;
                                    }

                                    console.log(formData.hasAthleteProfile);
                                    console.log(editingUser?.hasAthleteProfile);
                                    if (formData.hasAthleteProfile && !editingUser?.hasAthleteProfile) {
                                        console.log(formData.athleteProfile);
                                        // Create athlete profile
                                        await fetch(`http://localhost:5285/api/users/${userId}/athlete-profile`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                height: formData.athleteProfile.height ? parseInt(formData.athleteProfile.height) : null,
                                                weight: formData.athleteProfile.weight ? parseInt(formData.athleteProfile.weight) : null,
                                                medicalCertificateExpiry: formData.athleteProfile.medicalCertificateExpiry || null,
                                                teamId: formData.athleteProfile.teamId ? parseInt(formData.athleteProfile.teamId) : null
                                            })
                                        });
                                    } else if (formData.hasAthleteProfile && editingUser?.hasAthleteProfile) {
                                        // Update athlete profile
                                        await fetch(`http://localhost:5285/api/users/${userId}/athlete-profile`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                height: formData.athleteProfile.height ? parseInt(formData.athleteProfile.height) : null,
                                                weight: formData.athleteProfile.weight ? parseInt(formData.athleteProfile.weight) : null,
                                                medicalCertificateExpiry: formData.athleteProfile.medicalCertificateExpiry || null,
                                                teamId: formData.athleteProfile.teamId ? parseInt(formData.athleteProfile.teamId) : null
                                            })
                                        });
                                    } else if (!formData.hasAthleteProfile && editingUser?.hasAthleteProfile) {
                                        // Delete athlete profile
                                        await fetch(`http://localhost:5285/api/users/${userId}/athlete-profile`, {
                                            method: 'DELETE',
                                            headers: {
                                                'Authorization': `Bearer ${token}`
                                            }
                                        });
                                    }

                                    // Step 3: Manage Member Profile
                                    if (formData.hasMemberProfile && !editingUser?.hasMemberProfile) {
                                        await fetch(`http://localhost:5285/api/users/${userId}/member-profile`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                membershipStatus: parseInt(formData.memberProfile.membershipStatus),
                                                memberSince: formData.memberProfile.memberSince || null,
                                                paymentPreference: formData.memberProfile.paymentPreference || null
                                            })
                                        });
                                    } else if (formData.hasMemberProfile && editingUser?.hasMemberProfile) {
                                        await fetch(`http://localhost:5285/api/users/${userId}/member-profile`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                membershipStatus: parseInt(formData.memberProfile.membershipStatus),
                                                memberSince: formData.memberProfile.memberSince || null,
                                                paymentPreference: formData.memberProfile.paymentPreference || null
                                            })
                                        });
                                    } else if (!formData.hasMemberProfile && editingUser?.hasMemberProfile) {
                                        await fetch(`http://localhost:5285/api/users/${userId}/member-profile`, {
                                            method: 'DELETE',
                                            headers: {
                                                'Authorization': `Bearer ${token}`
                                            }
                                        });
                                    }

                                    // Step 4: Manage Coach Profile
                                    if (formData.hasCoachProfile && !editingUser?.hasCoachProfile && formData.coachProfile.sportId) {
                                        await fetch(`http://localhost:5285/api/users/${userId}/coach-profile`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                sportId: parseInt(formData.coachProfile.sportId),
                                                teamId: formData.coachProfile.teamId ? parseInt(formData.coachProfile.teamId) : null,
                                                licenseNumber: formData.coachProfile.licenseNumber || null,
                                                licenseLevel: formData.coachProfile.licenseLevel || null,
                                                licenseExpiry: formData.coachProfile.licenseExpiry || null,
                                                specialization: formData.coachProfile.specialization || null
                                            })
                                        });
                                    } else if (formData.hasCoachProfile && editingUser?.hasCoachProfile && formData.coachProfile.sportId) {
                                        await fetch(`http://localhost:5285/api/users/${userId}/coach-profile`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                sportId: parseInt(formData.coachProfile.sportId),
                                                teamId: formData.coachProfile.teamId ? parseInt(formData.coachProfile.teamId) : null,
                                                licenseNumber: formData.coachProfile.licenseNumber || null,
                                                licenseLevel: formData.coachProfile.licenseLevel || null,
                                                licenseExpiry: formData.coachProfile.licenseExpiry || null,
                                                specialization: formData.coachProfile.specialization || null
                                            })
                                        });
                                    } else if (!formData.hasCoachProfile && editingUser?.hasCoachProfile) {
                                        await fetch(`http://localhost:5285/api/users/${userId}/coach-profile`, {
                                            method: 'DELETE',
                                            headers: {
                                                'Authorization': `Bearer ${token}`
                                            }
                                        });
                                    }

                                    // Step 5: Manage Roles
                                    if (editingUser) {
                                        // Get current roles
                                        const currentRoles = editingUser.roles.map(r => r.id);
                                        const newRoles = formData.selectedRoles;

                                        // Roles to add
                                        const rolesToAdd = newRoles.filter(r => !currentRoles.includes(r));
                                        for (const roleId of rolesToAdd) {
                                            await fetch(`http://localhost:5285/api/users/${userId}/roles`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ roleId })
                                            });
                                        }

                                        // Roles to remove
                                        const rolesToRemove = currentRoles.filter(r => !newRoles.includes(r));
                                        for (const roleId of rolesToRemove) {
                                            await fetch(`http://localhost:5285/api/users/${userId}/roles/${roleId}`, {
                                                method: 'DELETE',
                                                headers: {
                                                    'Authorization': `Bearer ${token}`
                                                }
                                            });
                                        }
                                    } else {
                                        // Add all selected roles for new user
                                        for (const roleId of formData.selectedRoles) {
                                            await fetch(`http://localhost:5285/api/users/${userId}/roles`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ roleId })
                                            });
                                        }
                                    }

                                    // Success!
                                    setShowModal(false);
                                    resetForm();
                                    fetchUsers();
                                } catch (error) {
                                    console.error('Error saving user:', error);
                                    alert('Erro ao guardar utilizador: ' + error.message);
                                } finally {
                                    setSubmitting(false);
                                }
                            }}>
                                <div className="modal-body">
                                    {/* Personal Data Tab */}
                                    {activeTab === 'personal' && (
                                        <div className="form-section">
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Email *</label>
                                                    <input
                                                        type="email"
                                                        required
                                                        className={validationErrors.email ? 'error' : ''}
                                                        value={formData.email}
                                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    />
                                                    {validationErrors.email && <span className="error-message">{validationErrors.email}</span>}
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Primeiro Nome *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className={validationErrors.firstName ? 'error' : ''}
                                                        value={formData.firstName}
                                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                    />
                                                    {validationErrors.firstName && <span className="error-message">{validationErrors.firstName}</span>}
                                                </div>
                                                <div className="form-group">
                                                    <label>Apelido *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className={validationErrors.lastName ? 'error' : ''}
                                                        value={formData.lastName}
                                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                    />
                                                    {validationErrors.lastName && <span className="error-message">{validationErrors.lastName}</span>}
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Telefone</label>
                                                    <input
                                                        type="tel"
                                                        className={validationErrors.phone ? 'error' : ''}
                                                        value={formData.phone}
                                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                    />
                                                    {validationErrors.phone && <span className="error-message">{validationErrors.phone}</span>}
                                                </div>
                                                <div className="form-group">
                                                    <label>Data de Nascimento</label>
                                                    <input
                                                        type="date"
                                                        className={validationErrors.birthDate ? 'error' : ''}
                                                        value={formData.birthDate}
                                                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                                                    />
                                                    {validationErrors.birthDate && <span className="error-message">{validationErrors.birthDate}</span>}
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>NIF</label>
                                                    <input
                                                        type="text"
                                                        maxLength="9"
                                                        className={validationErrors.nif ? 'error' : ''}
                                                        value={formData.nif}
                                                        onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                                                    />
                                                    {validationErrors.nif && <span className="error-message">{validationErrors.nif}</span>}
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group full-width">
                                                    <label>Morada</label>
                                                    <input
                                                        type="text"
                                                        className={validationErrors.address ? 'error' : ''}
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                    />
                                                    {validationErrors.address && <span className="error-message">{validationErrors.address}</span>}
                                                </div>
                                            </div>

                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Código Postal</label>
                                                    <input
                                                        type="text"
                                                        placeholder="0000-000"
                                                        className={validationErrors.postalCode ? 'error' : ''}
                                                        value={formData.postalCode}
                                                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                                    />
                                                    {validationErrors.postalCode && <span className="error-message">{validationErrors.postalCode}</span>}
                                                </div>
                                                <div className="form-group">
                                                    <label>Cidade</label>
                                                    <input
                                                        type="text"
                                                        className={validationErrors.city ? 'error' : ''}
                                                        value={formData.city}
                                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    />
                                                    {validationErrors.city && <span className="error-message">{validationErrors.city}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Profiles Tab */}
                                    {activeTab === 'profiles' && (
                                        <div className="form-section">
                                            {/* Athlete Profile */}
                                            <div className="profile-toggle">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.hasAthleteProfile}
                                                        onChange={(e) => setFormData({
                                                            ...formData,
                                                            hasAthleteProfile: e.target.checked,
                                                            // Todos os atletas são sócios
                                                            hasMemberProfile: e.target.checked ? true : formData.hasMemberProfile
                                                        })}
                                                    />
                                                    <FaRunning /> Perfil de Atleta
                                                </label>
                                            </div>

                                            {formData.hasAthleteProfile && (
                                                <div className="profile-fields">
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Altura (cm)</label>
                                                            <input
                                                                type="number"
                                                                className={validationErrors.athleteHeight ? 'error' : ''}
                                                                value={formData.athleteProfile.height}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    athleteProfile: { ...formData.athleteProfile, height: e.target.value }
                                                                })}
                                                            />
                                                            {validationErrors.athleteHeight && <span className="error-message">{validationErrors.athleteHeight}</span>}
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Peso (kg)</label>
                                                            <input
                                                                type="number"
                                                                className={validationErrors.athleteWeight ? 'error' : ''}
                                                                value={formData.athleteProfile.weight}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    athleteProfile: { ...formData.athleteProfile, weight: e.target.value }
                                                                })}
                                                            />
                                                            {validationErrors.athleteWeight && <span className="error-message">{validationErrors.athleteWeight}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Equipa</label>
                                                            <select
                                                                value={formData.athleteProfile.teamId}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    athleteProfile: { ...formData.athleteProfile, teamId: e.target.value }
                                                                })}
                                                            >
                                                                <option value="">Nenhuma</option>
                                                                {teams.map(team => (
                                                                    <option key={team.id} value={team.id}>{team.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Validade Atestado Médico</label>
                                                            <input
                                                                type="date"
                                                                className={validationErrors.athleteMedical ? 'error' : ''}
                                                                value={formData.athleteProfile.medicalCertificateExpiry}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    athleteProfile: { ...formData.athleteProfile, medicalCertificateExpiry: e.target.value }
                                                                })}
                                                            />
                                                            {validationErrors.athleteMedical && <span className="error-message">{validationErrors.athleteMedical}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Member Profile */}
                                            <div className="profile-toggle">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.hasMemberProfile}
                                                        disabled={formData.hasAthleteProfile}
                                                        onChange={(e) => setFormData({ ...formData, hasMemberProfile: e.target.checked })}
                                                    />
                                                    <FaIdCard /> Perfil de Sócio
                                                    {formData.hasAthleteProfile && (
                                                        <span style={{ fontSize: '0.8rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                                                            (obrigatório para atletas)
                                                        </span>
                                                    )}
                                                </label>
                                            </div>

                                            {formData.hasMemberProfile && (
                                                <div className="profile-fields">
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Status</label>
                                                            <select
                                                                className={validationErrors.membershipStatus ? 'error' : ''}
                                                                value={formData.memberProfile.membershipStatus}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    memberProfile: { ...formData.memberProfile, membershipStatus: e.target.value }
                                                                })}
                                                            >
                                                                <option value="0">Pendente</option>
                                                                <option value="1">Ativo</option>
                                                                <option value="2">Inativo</option>
                                                            </select>
                                                            {validationErrors.membershipStatus && <span className="error-message">{validationErrors.membershipStatus}</span>}
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Sócio Desde</label>
                                                            <input
                                                                type="date"
                                                                className={validationErrors.memberSince ? 'error' : ''}
                                                                value={formData.memberProfile.memberSince}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    memberProfile: { ...formData.memberProfile, memberSince: e.target.value }
                                                                })}
                                                            />
                                                            {validationErrors.memberSince && <span className="error-message">{validationErrors.memberSince}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Preferência de Pagamento</label>
                                                            <select
                                                                value={formData.memberProfile.paymentPreference}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    memberProfile: { ...formData.memberProfile, paymentPreference: e.target.value }
                                                                })}
                                                            >
                                                                <option value="">Selecione...</option>
                                                                <option value="Monthly">Mensal</option>
                                                                <option value="Annual">Anual</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Coach Profile */}
                                            <div className="profile-toggle">
                                                <label className="checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.hasCoachProfile}
                                                        onChange={(e) => setFormData({ ...formData, hasCoachProfile: e.target.checked })}
                                                    />
                                                    <FaChalkboardTeacher /> Perfil de Treinador
                                                </label>
                                            </div>

                                            {formData.hasCoachProfile && (
                                                <div className="profile-fields">
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Modalidade *</label>
                                                            <select
                                                                required
                                                                className={validationErrors.coachSport ? 'error' : ''}
                                                                value={formData.coachProfile.sportId}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    coachProfile: { ...formData.coachProfile, sportId: e.target.value }
                                                                })}
                                                            >
                                                                <option value="">Selecione...</option>
                                                                {sports.map(sport => (
                                                                    <option key={sport.id} value={sport.id}>{sport.name}</option>
                                                                ))}
                                                            </select>
                                                            {validationErrors.coachSport && <span className="error-message">{validationErrors.coachSport}</span>}
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Equipa Principal</label>
                                                            <select
                                                                value={formData.coachProfile.teamId}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    coachProfile: { ...formData.coachProfile, teamId: e.target.value }
                                                                })}
                                                            >
                                                                <option value="">Nenhuma</option>
                                                                {teams.map(team => (
                                                                    <option key={team.id} value={team.id}>{team.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Nº Cédula</label>
                                                            <input
                                                                type="text"
                                                                value={formData.coachProfile.licenseNumber}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    coachProfile: { ...formData.coachProfile, licenseNumber: e.target.value }
                                                                })}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Nível de Cédula</label>
                                                            <input
                                                                type="text"
                                                                placeholder="Nível 1, Nível 2, etc."
                                                                className={validationErrors.coachLicenseLevel ? 'error' : ''}
                                                                value={formData.coachProfile.licenseLevel}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    coachProfile: { ...formData.coachProfile, licenseLevel: e.target.value }
                                                                })}
                                                            />
                                                            {validationErrors.coachLicenseLevel && <span className="error-message">{validationErrors.coachLicenseLevel}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="form-row">
                                                        <div className="form-group">
                                                            <label>Validade Cédula</label>
                                                            <input
                                                                type="date"
                                                                value={formData.coachProfile.licenseExpiry}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    coachProfile: { ...formData.coachProfile, licenseExpiry: e.target.value }
                                                                })}
                                                            />
                                                        </div>
                                                        <div className="form-group">
                                                            <label>Especialização</label>
                                                            <input
                                                                type="text"
                                                                value={formData.coachProfile.specialization}
                                                                onChange={(e) => setFormData({
                                                                    ...formData,
                                                                    coachProfile: { ...formData.coachProfile, specialization: e.target.value }
                                                                })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Roles Tab */}
                                    {activeTab === 'roles' && (
                                        <div className="form-section">
                                            <p className="section-description">Selecione as roles de permissão para este utilizador:</p>
                                            <div className="roles-grid">
                                                {roles.map(role => (
                                                    <label key={role.id} className="role-checkbox">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.selectedRoles.includes(role.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFormData({
                                                                        ...formData,
                                                                        selectedRoles: [...formData.selectedRoles, role.id]
                                                                    });
                                                                } else {
                                                                    setFormData({
                                                                        ...formData,
                                                                        selectedRoles: formData.selectedRoles.filter(id => id !== role.id)
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                        <div className="role-info">
                                                            <FaUserShield />
                                                            <div>
                                                                <strong>{role.name}</strong>
                                                                {role.description && <p>{role.description}</p>}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-submit"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <><div className="spinner-small"></div> A guardar...</>
                                        ) : (
                                            editingUser ? 'Atualizar' : 'Criar'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div >
                )
            }
        </div >
    );
};

export default PeopleManager;

