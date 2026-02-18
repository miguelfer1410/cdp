import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaRunning, FaIdCard, FaChalkboardTeacher, FaUserShield, FaSort, FaSortUp, FaSortDown, FaCheck, FaArrowRight, FaArrowLeft, FaUser, FaClipboardList, FaLock, FaEye, FaTimes, FaFileExcel } from 'react-icons/fa';
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
    const [currentStep, setCurrentStep] = useState(0);
    const [validationErrors, setValidationErrors] = useState({});
    const [stepErrors, setStepErrors] = useState({});
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
            id: null,
            firstName: '',
            lastName: '',
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

    // Wizard steps definition
    const steps = [
        { id: 'personal', label: 'Dados Pessoais', icon: <FaUser />, description: 'Informação básica' },
        { id: 'profiles', label: 'Perfis', icon: <FaClipboardList />, description: 'Tipo de pessoa' },
        { id: 'details', label: 'Detalhes', icon: <FaEye />, description: 'Dados específicos' },
        { id: 'permissions', label: 'Permissões', icon: <FaLock />, description: 'Acesso ao sistema' },
        { id: 'summary', label: 'Resumo', icon: <FaCheck />, description: 'Confirmar dados' }
    ];

    // Check if details step should be shown
    const hasAthleteProfile = formData.hasAthleteProfile;
    const hasAnyProfile = hasAthleteProfile || formData.hasMemberProfile || formData.hasCoachProfile;

    // Active steps (skip details if no profiles selected)
    const activeSteps = useMemo(() => {
        if (!hasAnyProfile) {
            return steps.filter(s => s.id !== 'details');
        }
        return steps;
    }, [hasAnyProfile]);

    const currentStepId = activeSteps[currentStep]?.id;

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchSports();
        fetchTeams();
    }, [filters]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setFilters(prev => ({ ...prev, search: searchTerm }));
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Auto-select "User" role when Athlete or Coach profile is selected
    useEffect(() => {
        if ((hasAthleteProfile || formData.hasCoachProfile) && roles.length > 0) {
            const userRole = roles.find(role => role.name === 'User');
            if (userRole && !formData.selectedRoles.includes(userRole.id)) {
                setFormData(prev => ({
                    ...prev,
                    selectedRoles: [...prev.selectedRoles, userRole.id]
                }));
            }
        }
    }, [hasAthleteProfile, formData.hasCoachProfile, roles]);

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
                headers: { 'Authorization': `Bearer ${token}` }
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
                headers: { 'Authorization': `Bearer ${token}` }
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
                headers: { 'Authorization': `Bearer ${token}` }
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
                headers: { 'Authorization': `Bearer ${token}` }
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
        if (user.roles && user.roles.some(r => r.name === 'Admin')) {
            badges.push({ type: 'admin', label: 'Admin', icon: <FaUserShield /> });
        }
        if (user.hasAthleteProfile) badges.push({ type: 'athlete', label: 'Atleta', icon: <FaRunning /> });

        if (user.hasMemberProfile && !user.hasAthleteProfile) badges.push({ type: 'member', label: 'Sócio', icon: <FaIdCard /> });

        if (user.hasCoachProfile) badges.push({ type: 'coach', label: 'Treinador', icon: <FaChalkboardTeacher /> });
        return badges;
    };

    const resetForm = () => {
        setFormData({
            email: '', firstName: '', lastName: '', phone: '', birthDate: '', nif: '',
            address: '', postalCode: '', city: '',
            hasAthleteProfile: false,
            hasMemberProfile: false,
            hasCoachProfile: false,
            athleteProfile: { id: null, firstName: '', lastName: '', teamId: '' },
            memberProfile: { membershipStatus: 0, memberSince: '', paymentPreference: '' },
            coachProfile: { sportId: '', teamId: '', licenseNumber: '', licenseLevel: '', licenseExpiry: '', specialization: '' },
            selectedRoles: []
        });
        setEditingUser(null);
        setCurrentStep(0);
        setValidationErrors({});
        setStepErrors({});
    };

    // Helper: create a blank athlete profile entry
    const newAthleteProfileEntry = () => ({
        id: null,       // null = new (not yet saved)
        firstName: '',
        lastName: '',
        teamId: ''
    });

    // Step-specific validation
    const validateStep = (stepId) => {
        const errors = {};

        if (stepId === 'personal') {
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
        }

        if (stepId === 'details') {
            if (formData.hasMemberProfile) {
                if (!formData.memberProfile.memberSince) errors.memberSince = 'Data de início é obrigatória';
                if (formData.memberProfile.membershipStatus === undefined || formData.memberProfile.membershipStatus === '') {
                    errors.membershipStatus = 'Estado é obrigatório';
                }
            }
            if (formData.hasCoachProfile) {
                if (!formData.coachProfile.sportId) errors.coachSport = 'Modalidade é obrigatória';
                if (!formData.coachProfile.licenseLevel) errors.coachLicenseLevel = 'Nível de cédula é obrigatório';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateAllSteps = () => {
        let allErrors = {};

        // Validate personal
        if (!formData.email.trim()) allErrors.email = 'obrigatório';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) allErrors.email = 'inválido';
        if (!formData.firstName.trim()) allErrors.firstName = 'obrigatório';
        if (!formData.lastName.trim()) allErrors.lastName = 'obrigatório';
        if (!formData.phone.trim()) allErrors.phone = 'obrigatório';
        if (!formData.birthDate) allErrors.birthDate = 'obrigatório';
        if (!formData.nif.trim()) allErrors.nif = 'obrigatório';
        else if (formData.nif.length !== 9) allErrors.nif = 'inválido';
        if (!formData.address.trim()) allErrors.address = 'obrigatório';
        if (!formData.postalCode.trim()) allErrors.postalCode = 'obrigatório';
        if (!formData.city.trim()) allErrors.city = 'obrigatório';

        // Validate details
        if (formData.hasMemberProfile) {
            if (!formData.memberProfile.memberSince) allErrors.memberSince = 'obrigatório';
        }
        if (formData.hasCoachProfile) {
            if (!formData.coachProfile.sportId) allErrors.coachSport = 'obrigatório';
            if (!formData.coachProfile.licenseLevel) allErrors.coachLicenseLevel = 'obrigatório';
        }

        setValidationErrors(allErrors);
        return Object.keys(allErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStepId)) {
            if (currentStep < activeSteps.length - 1) {
                setCurrentStep(currentStep + 1);
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            setValidationErrors({});
        }
    };

    const goToStep = (index) => {
        // When editing, allow free navigation to any step
        if (editingUser) {
            setCurrentStep(index);
            setValidationErrors({});
            return;
        }
        // When creating, only allow going back to completed steps
        if (index < currentStep) {
            setCurrentStep(index);
            setValidationErrors({});
        }
    };

    const handleEdit = async (user) => {
        setEditingUser(user);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/users/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                // Strip +alias from email so admin sees the clean base email
                const rawEmail = data.email || '';
                const atIdx = rawEmail.lastIndexOf('@');
                const localPart = atIdx > 0 ? rawEmail.substring(0, atIdx) : rawEmail;
                const domain = atIdx > 0 ? rawEmail.substring(atIdx) : '';
                const plusIdx = localPart.indexOf('+');
                const baseEmail = plusIdx > -1
                    ? localPart.substring(0, plusIdx) + domain
                    : rawEmail;

                setFormData({
                    email: baseEmail,
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
                        id: data.athleteProfile.id,
                        firstName: data.athleteProfile.firstName || '',
                        lastName: data.athleteProfile.lastName || '',
                        teamId: data.athleteProfile.teams && data.athleteProfile.teams.length > 0 ? data.athleteProfile.teams[0].id : ''
                    } : { id: null, firstName: '', lastName: '', teamId: '' },
                    memberProfile: data.memberProfile ? {
                        membershipStatus: data.memberProfile.membershipStatus,
                        memberSince: data.memberProfile.memberSince
                            ? data.memberProfile.memberSince.split('T')[0] : '',
                        paymentPreference: data.memberProfile.paymentPreference || ''
                    } : { membershipStatus: 0, memberSince: '', paymentPreference: '' },
                    coachProfile: data.coachProfile ? {
                        sportId: data.coachProfile.sportId,
                        teamId: data.coachProfile.teamId || '',
                        licenseNumber: data.coachProfile.licenseNumber || '',
                        licenseLevel: data.coachProfile.licenseLevel || '',
                        licenseExpiry: data.coachProfile.licenseExpiry
                            ? data.coachProfile.licenseExpiry.split('T')[0] : '',
                        specialization: data.coachProfile.specialization || ''
                    } : { sportId: '', teamId: '', licenseNumber: '', licenseLevel: '', licenseExpiry: '', specialization: '' },
                    selectedRoles: data.roles.map(r => r.id)
                });
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja desativar este utilizador?')) return;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5285/api/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
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

    const handleSubmit = async () => {
        if (!validateAllSteps()) {
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');

            // Compute the final email to send:
            // If editing and the email field was not changed (matches base of original),
            // keep the original aliased email. If changed, apply the alias to the new base.
            let finalEmail = formData.email;
            if (editingUser) {
                const originalEmail = editingUser.email || '';
                const atIdx = originalEmail.lastIndexOf('@');
                const localPart = atIdx > 0 ? originalEmail.substring(0, atIdx) : originalEmail;
                const domain = atIdx > 0 ? originalEmail.substring(atIdx) : '';
                const plusIdx = localPart.indexOf('+');
                const alias = plusIdx > -1 ? localPart.substring(plusIdx) : ''; // e.g. '+joao' or ''
                const baseOfOriginal = plusIdx > -1 ? localPart.substring(0, plusIdx) + domain : originalEmail;

                if (formData.email.toLowerCase() === baseOfOriginal.toLowerCase()) {
                    // Email not changed — keep original aliased email
                    finalEmail = originalEmail;
                } else if (alias) {
                    // Email changed — apply alias to new base
                    const newAtIdx = formData.email.lastIndexOf('@');
                    const newLocal = newAtIdx > 0 ? formData.email.substring(0, newAtIdx) : formData.email;
                    const newDomain = newAtIdx > 0 ? formData.email.substring(newAtIdx) : '';
                    finalEmail = newLocal + alias + newDomain;
                }
            }

            let userId = editingUser?.id;
            const userPayload = {
                email: finalEmail,
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
                const response = await fetch(`http://localhost:5285/api/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(userPayload)
                });
                if (!response.ok) throw new Error('Erro ao atualizar utilizador');
            } else {
                const response = await fetch('http://localhost:5285/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ ...userPayload, password: 'TempPassword123!' })
                });
                if (!response.ok) throw new Error('Erro ao criar utilizador');
                const data = await response.json();
                userId = data.id;
            }

            // Step 2: Manage Athlete Profile (single)
            if (formData.hasAthleteProfile) {
                const ap = formData.athleteProfile;
                const payload = {
                    firstName: ap.firstName || null,
                    lastName: ap.lastName || null,
                    height: null,
                    weight: null,
                    medicalCertificateExpiry: null,
                    teamId: ap.teamId ? parseInt(ap.teamId) : null
                };

                if (ap.id) {
                    // Existing profile — update
                    await fetch(`http://localhost:5285/api/users/${userId}/athlete-profile`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });
                } else {
                    // New profile — create
                    await fetch(`http://localhost:5285/api/users/${userId}/athlete-profile`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(payload)
                    });
                }
            } else if (editingUser?.hasAthleteProfile) {
                // Profile was removed — delete it
                await fetch(`http://localhost:5285/api/users/${userId}/athlete-profile`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            // Step 3: Manage Member Profile
            if (formData.hasMemberProfile && !editingUser?.hasMemberProfile) {
                await fetch(`http://localhost:5285/api/users/${userId}/member-profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        membershipStatus: parseInt(formData.memberProfile.membershipStatus),
                        memberSince: formData.memberProfile.memberSince || null,
                        paymentPreference: formData.memberProfile.paymentPreference || null
                    })
                });
            } else if (formData.hasMemberProfile && editingUser?.hasMemberProfile) {
                await fetch(`http://localhost:5285/api/users/${userId}/member-profile`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        membershipStatus: parseInt(formData.memberProfile.membershipStatus),
                        memberSince: formData.memberProfile.memberSince || null,
                        paymentPreference: formData.memberProfile.paymentPreference || null
                    })
                });
            } else if (!formData.hasMemberProfile && editingUser?.hasMemberProfile) {
                await fetch(`http://localhost:5285/api/users/${userId}/member-profile`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            // Step 4: Manage Coach Profile
            if (formData.hasCoachProfile && !editingUser?.hasCoachProfile && formData.coachProfile.sportId) {
                await fetch(`http://localhost:5285/api/users/${userId}/coach-profile`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            // Step 5: Manage Roles
            if (editingUser) {
                const currentRoles = editingUser.roles.map(r => r.id);
                const newRoles = formData.selectedRoles;

                const rolesToAdd = newRoles.filter(r => !currentRoles.includes(r));
                for (const roleId of rolesToAdd) {
                    await fetch(`http://localhost:5285/api/users/${userId}/roles`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ roleId })
                    });
                }

                const rolesToRemove = currentRoles.filter(r => !newRoles.includes(r));
                for (const roleId of rolesToRemove) {
                    await fetch(`http://localhost:5285/api/users/${userId}/roles/${roleId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }
            } else {
                for (const roleId of formData.selectedRoles) {
                    await fetch(`http://localhost:5285/api/users/${userId}/roles`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ roleId })
                    });
                }
            }

            setShowModal(false);
            resetForm();
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Erro ao guardar utilizador: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = useMemo(() => {
        let sortableUsers = [...users];
        if (sortConfig.key !== null) {
            sortableUsers.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                if (sortConfig.key === 'profiles') {
                    aValue = getProfileBadges(a).map(b => b.label).join('');
                    bValue = getProfileBadges(b).map(b => b.label).join('');
                } else if (sortConfig.key === 'team') {
                    aValue = a.currentTeam || '';
                    bValue = b.currentTeam || '';
                } else {
                    aValue = aValue ? aValue.toString().toLowerCase() : '';
                    bValue = bValue ? bValue.toString().toLowerCase() : '';
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig]);

    const getSortIcon = (name) => {
        if (sortConfig.key !== name) return <FaSort className="sort-icon" />;
        if (sortConfig.direction === 'ascending') return <FaSortUp className="sort-icon active" />;
        return <FaSortDown className="sort-icon active" />;
    };

    // Helper to get membership status label
    const getMemberStatusLabel = (status) => {
        const s = parseInt(status);
        if (s === 0) return 'Pendente';
        if (s === 1) return 'Ativo';
        if (s === 2) return 'Inativo';
        return '-';
    };

    // Helper to get team name by id
    const getTeamName = (teamId) => {
        const team = teams.find(t => t.id === parseInt(teamId));
        return team ? team.name : '-';
    };

    // Helper to get sport name by id
    const getSportName = (sportId) => {
        const sport = sports.find(s => s.id === parseInt(sportId));
        return sport ? sport.name : '-';
    };

    const handleExport = () => {
        if (!users || users.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }

        // Define headers
        const headers = [
            'Nome Completo',
            'Email',
            'Telefone',
            'NIF',
            'Data Nascimento',
            'Morada',
            'Código Postal',
            'Cidade',
            'Perfis',
            'Equipa',
            'Estado Sócio',
            'Funções'
        ];

        // Format data rows
        const rows = users.map(user => {
            const profiles = getProfileBadges(user).map(b => b.label).join(', ');
            const roles = user.roles ? user.roles.map(r => r.name).join(', ') : '';
            const memberStatus = (user.hasMemberProfile && user.memberProfile) ? getMemberStatusLabel(user.memberProfile.membershipStatus) : '-';

            return [
                `"${user.fullName}"`,
                `"${user.email}"`,
                `"${user.phone || ''}"`,
                `"${user.nif || ''}"`,
                `"${user.birthDate ? user.birthDate.split('T')[0] : ''}"`,
                `"${user.address || ''}"`,
                `"${user.postalCode || ''}"`,
                `"${user.city || ''}"`,
                `"${profiles}"`,
                `"${user.currentTeam || ''}"`,
                `"${memberStatus}"`,
                `"${roles}"`
            ].join(';');
        });

        // Combine headers and rows
        const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n'); // Add BOM for Excel support

        // Create blob and download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `lista_pessoas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderPersonalStep = () => (
        <div className="wizard-step-content">
            <div className="step-intro">
                <h3>Informação Pessoal</h3>
                <p>Preencha os dados pessoais do utilizador. Campos com * são obrigatórios.</p>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Email *</label>
                    <input
                        type="email"
                        placeholder="exemplo@email.com"
                        className={validationErrors.email ? 'error' : ''}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    {validationErrors.email && <span className="error-message">{validationErrors.email}</span>}
                </div>
                <div className="form-group">
                    <label>NIF *</label>
                    <input
                        type="text"
                        maxLength="9"
                        placeholder="123456789"
                        className={validationErrors.nif ? 'error' : ''}
                        value={formData.nif}
                        onChange={(e) => setFormData({ ...formData, nif: e.target.value.replace(/\D/g, '') })}
                    />
                    {validationErrors.nif && <span className="error-message">{validationErrors.nif}</span>}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Primeiro Nome *</label>
                    <input
                        type="text"
                        placeholder="João"
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
                        placeholder="Silva"
                        className={validationErrors.lastName ? 'error' : ''}
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                    {validationErrors.lastName && <span className="error-message">{validationErrors.lastName}</span>}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Telefone *</label>
                    <input
                        type="tel"
                        placeholder="912345678"
                        className={validationErrors.phone ? 'error' : ''}
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    {validationErrors.phone && <span className="error-message">{validationErrors.phone}</span>}
                </div>
                <div className="form-group">
                    <label>Data de Nascimento *</label>
                    <input
                        type="date"
                        className={validationErrors.birthDate ? 'error' : ''}
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                    {validationErrors.birthDate && <span className="error-message">{validationErrors.birthDate}</span>}
                </div>
            </div>

            <div className="form-divider">
                <span>Morada</span>
            </div>

            <div className="form-row">
                <div className="form-group full-width">
                    <label>Morada *</label>
                    <input
                        type="text"
                        placeholder="Rua Exemplo, nº 123"
                        className={validationErrors.address ? 'error' : ''}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    {validationErrors.address && <span className="error-message">{validationErrors.address}</span>}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label>Código Postal *</label>
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
                    <label>Cidade *</label>
                    <input
                        type="text"
                        placeholder="Póvoa de Varzim"
                        className={validationErrors.city ? 'error' : ''}
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                    {validationErrors.city && <span className="error-message">{validationErrors.city}</span>}
                </div>
            </div>
        </div>
    );

    const renderProfilesStep = () => (
        <div className="wizard-step-content">
            <div className="step-intro">
                <h3>Que tipo de pessoa é?</h3>
                <p>Selecione um ou mais perfis para este utilizador. Pode sempre alterar mais tarde.</p>
            </div>

            <div className="profile-cards-grid">
                {/* Athlete Card */}
                <div
                    className={`profile-card ${hasAthleteProfile ? 'selected' : ''}`}
                    onClick={() => {
                        if (hasAthleteProfile) {
                            // Deselect: clear athlete profile
                            setFormData({
                                ...formData,
                                hasAthleteProfile: false,
                                athleteProfile: { id: null, firstName: '', lastName: '', teamId: '' },
                                hasMemberProfile: formData.hasMemberProfile
                            });
                        } else {
                            // Select: enable athlete profile
                            setFormData({
                                ...formData,
                                hasAthleteProfile: true,
                                hasMemberProfile: true
                            });
                        }
                    }}
                >
                    <div className="profile-card-icon athlete">
                        <FaRunning />
                    </div>
                    <div className="profile-card-info">
                        <h4>Atleta</h4>
                        <p>Pessoa que pratica desporto federado no clube</p>
                    </div>
                    <div className="profile-card-check">
                        {hasAthleteProfile && <FaCheck />}
                    </div>
                </div>

                {/* Member Card */}
                <div
                    className={`profile-card ${formData.hasMemberProfile ? 'selected' : ''} ${hasAthleteProfile ? 'locked' : ''}`}
                    onClick={() => {
                        if (!hasAthleteProfile) {
                            setFormData({ ...formData, hasMemberProfile: !formData.hasMemberProfile });
                        }
                    }}
                >
                    <div className="profile-card-icon member">
                        <FaIdCard />
                    </div>
                    <div className="profile-card-info">
                        <h4>Sócio</h4>
                        <p>Membro associado do clube com quotas</p>
                        {hasAthleteProfile && (
                            <span className="auto-tag">Automático — todos os atletas são sócios</span>
                        )}
                    </div>
                    <div className="profile-card-check">
                        {formData.hasMemberProfile && <FaCheck />}
                    </div>
                </div>

                {/* Coach Card */}
                <div
                    className={`profile-card ${formData.hasCoachProfile ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, hasCoachProfile: !formData.hasCoachProfile })}
                >
                    <div className="profile-card-icon coach">
                        <FaChalkboardTeacher />
                    </div>
                    <div className="profile-card-info">
                        <h4>Treinador</h4>
                        <p>Responsável técnico de uma ou mais equipas</p>
                    </div>
                    <div className="profile-card-check">
                        {formData.hasCoachProfile && <FaCheck />}
                    </div>
                </div>
            </div>

            {!hasAnyProfile && (
                <div className="profile-hint">
                    <span>Sem perfis selecionados?</span> A pessoa será criada apenas com dados pessoais. Pode adicionar perfis mais tarde.
                </div>
            )}
        </div>
    );

    const renderDetailsStep = () => (
        <div className="wizard-step-content">
            <div className="step-intro">
                <h3>Detalhes dos Perfis</h3>
                <p>Complete a informação específica de cada perfil selecionado.</p>
            </div>

            {/* Athlete Details - Single Profile */}
            {hasAthleteProfile && (
                <div className="detail-section">
                    <div className="detail-section-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div className="detail-section-icon athlete"><FaRunning /></div>
                            <h4>Perfil de Atleta</h4>
                        </div>
                    </div>
                    <div className="detail-section-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nome do Atleta</label>
                                <input
                                    type="text"
                                    placeholder="João"
                                    value={formData.athleteProfile.firstName}
                                    onChange={(e) => setFormData({ ...formData, athleteProfile: { ...formData.athleteProfile, firstName: e.target.value } })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Apelido do Atleta</label>
                                <input
                                    type="text"
                                    placeholder="Silva"
                                    value={formData.athleteProfile.lastName}
                                    onChange={(e) => setFormData({ ...formData, athleteProfile: { ...formData.athleteProfile, lastName: e.target.value } })}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Equipa</label>
                                <select
                                    value={formData.athleteProfile.teamId}
                                    onChange={(e) => setFormData({ ...formData, athleteProfile: { ...formData.athleteProfile, teamId: e.target.value } })}
                                >
                                    <option value="">Sem equipa atribuída</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>
                                            {team.name} - {team.sportName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Details */}
            {
                formData.hasMemberProfile && (
                    <div className="detail-section">
                        <div className="detail-section-header">
                            <div className="detail-section-icon member"><FaIdCard /></div>
                            <h4>Dados de Sócio</h4>
                        </div>
                        <div className="detail-section-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Estado *</label>
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
                                    <label>Sócio Desde *</label>
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
                    </div>
                )
            }

            {/* Coach Details */}
            {
                formData.hasCoachProfile && (
                    <div className="detail-section">
                        <div className="detail-section-header">
                            <div className="detail-section-icon coach"><FaChalkboardTeacher /></div>
                            <h4>Dados de Treinador</h4>
                        </div>
                        <div className="detail-section-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Modalidade *</label>
                                    <select
                                        className={validationErrors.coachSport ? 'error' : ''}
                                        value={formData.coachProfile.sportId}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            coachProfile: { ...formData.coachProfile, sportId: e.target.value }
                                        })}
                                    >
                                        <option value="">Selecione a modalidade...</option>
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
                                        <option value="">Sem equipa atribuída</option>
                                        {teams.map(team => (
                                            <option key={team.id} value={team.id}>
                                                {team.name} - {team.sportName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nº Cédula</label>
                                    <input
                                        type="text"
                                        placeholder="Número da cédula"
                                        value={formData.coachProfile.licenseNumber}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            coachProfile: { ...formData.coachProfile, licenseNumber: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Nível de Cédula *</label>
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
                                        placeholder="Ex: Formação, Competição..."
                                        value={formData.coachProfile.specialization}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            coachProfile: { ...formData.coachProfile, specialization: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );

    const renderPermissionsStep = () => (
        <div className="wizard-step-content">
            <div className="step-intro">
                <h3>Permissões de Acesso</h3>
                <p>Defina que áreas do sistema este utilizador pode aceder. Pode deixar vazio se não precisar de acesso especial.</p>
            </div>

            <div className="roles-grid">
                {roles.map(role => (
                    <label key={role.id} className={`role-card ${formData.selectedRoles.includes(role.id) ? 'selected' : ''}`}>
                        <input
                            type="checkbox"
                            checked={formData.selectedRoles.includes(role.id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setFormData({ ...formData, selectedRoles: [...formData.selectedRoles, role.id] });
                                } else {
                                    setFormData({ ...formData, selectedRoles: formData.selectedRoles.filter(id => id !== role.id) });
                                }
                            }}
                        />
                        <div className="role-card-content">
                            <FaUserShield className="role-card-icon" />
                            <div>
                                <strong>{role.name}</strong>
                                {role.description && <p>{role.description}</p>}
                            </div>
                        </div>
                    </label>
                ))}
            </div>

            {formData.selectedRoles.length === 0 && (
                <div className="profile-hint">
                    Sem permissões especiais selecionadas. O utilizador terá acesso básico ao sistema.
                </div>
            )}
        </div>
    );

    const renderSummaryStep = () => (
        <div className="wizard-step-content">
            <div className="step-intro">
                <h3>Confirmar Dados</h3>
                <p>Reveja toda a informação antes de {editingUser ? 'atualizar' : 'criar'} o utilizador.</p>
            </div>

            <div className="summary-grid">
                {/* Personal Summary */}
                <div className="summary-card">
                    <div className="summary-card-header">
                        <FaUser />
                        <h4>Dados Pessoais</h4>
                        <button type="button" className="summary-edit-btn" onClick={() => setCurrentStep(0)}>
                            <FaEdit /> Editar
                        </button>
                    </div>
                    <div className="summary-card-body">
                        <div className="summary-row">
                            <span className="summary-label">Nome</span>
                            <span className="summary-value">{formData.firstName} {formData.lastName}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Email</span>
                            <span className="summary-value">{formData.email}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Telefone</span>
                            <span className="summary-value">{formData.phone || '-'}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">NIF</span>
                            <span className="summary-value">{formData.nif}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Data Nasc.</span>
                            <span className="summary-value">{formData.birthDate || '-'}</span>
                        </div>
                        <div className="summary-row">
                            <span className="summary-label">Morada</span>
                            <span className="summary-value">{formData.address}, {formData.postalCode} {formData.city}</span>
                        </div>
                    </div>
                </div>

                {/* Profiles Summary */}
                <div className="summary-card">
                    <div className="summary-card-header">
                        <FaClipboardList />
                        <h4>Perfis</h4>
                        <button type="button" className="summary-edit-btn" onClick={() => setCurrentStep(activeSteps.findIndex(s => s.id === 'profiles'))}>
                            <FaEdit /> Editar
                        </button>
                    </div>
                    <div className="summary-card-body">
                        {!hasAnyProfile && (
                            <div className="summary-row">
                                <span className="summary-value" style={{ color: '#6b7280' }}>Sem perfis atribuídos</span>
                            </div>
                        )}
                        {hasAthleteProfile && (
                            <div className="summary-profile-block">
                                <span className="profile-badge athlete"><FaRunning /> Atleta</span>
                                <div className="summary-details">
                                    <span>
                                        {formData.athleteProfile.firstName || formData.athleteProfile.lastName
                                            ? `${formData.athleteProfile.firstName} ${formData.athleteProfile.lastName}`.trim()
                                            : 'Nome não definido'}
                                        {formData.athleteProfile.teamId ? ` — ${getTeamName(formData.athleteProfile.teamId)}` : ''}
                                    </span>
                                </div>
                            </div>
                        )}
                        {formData.hasMemberProfile && (
                            <div className="summary-profile-block">
                                <span className="profile-badge member"><FaIdCard /> Sócio</span>
                                <div className="summary-details">
                                    <span>Estado: {getMemberStatusLabel(formData.memberProfile.membershipStatus)}</span>
                                    {formData.memberProfile.memberSince && <span>Desde: {formData.memberProfile.memberSince}</span>}
                                </div>
                            </div>
                        )}
                        {formData.hasCoachProfile && (
                            <div className="summary-profile-block">
                                <span className="profile-badge coach"><FaChalkboardTeacher /> Treinador</span>
                                <div className="summary-details">
                                    {formData.coachProfile.sportId && <span>Modalidade: {getSportName(formData.coachProfile.sportId)}</span>}
                                    {formData.coachProfile.licenseLevel && <span>Cédula: {formData.coachProfile.licenseLevel}</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Permissions Summary */}
                <div className="summary-card">
                    <div className="summary-card-header">
                        <FaLock />
                        <h4>Permissões</h4>
                        <button type="button" className="summary-edit-btn" onClick={() => setCurrentStep(activeSteps.findIndex(s => s.id === 'permissions'))}>
                            <FaEdit /> Editar
                        </button>
                    </div>
                    <div className="summary-card-body">
                        {formData.selectedRoles.length === 0 ? (
                            <div className="summary-row">
                                <span className="summary-value" style={{ color: '#6b7280' }}>Acesso básico (sem permissões especiais)</span>
                            </div>
                        ) : (
                            <div className="summary-roles">
                                {formData.selectedRoles.map(roleId => {
                                    const role = roles.find(r => r.id === roleId);
                                    return role ? (
                                        <span key={roleId} className="role-badge"><FaUserShield /> {role.name}</span>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStepContent = () => {
        switch (currentStepId) {
            case 'personal': return renderPersonalStep();
            case 'profiles': return renderProfilesStep();
            case 'details': return renderDetailsStep();
            case 'permissions': return renderPermissionsStep();
            case 'summary': return renderSummaryStep();
            default: return null;
        }
    };

    return (
        <div className="people-manager">
            <div className="manager-header">
                <div className="header-content">
                    <h1>Gestão de Pessoas</h1>
                    <p className="header-subtitle">Gerir atletas, sócios, treinadores e utilizadores do clube</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-export" onClick={handleExport}>
                        <FaFileExcel /> Exportar Excel
                    </button>
                    <button className="btn-add" onClick={() => setShowModal(true)}>
                        <FaPlus /> Adicionar Pessoa
                    </button>
                </div>
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
                                    <td>{(() => {
                                        const raw = user.email || '';
                                        const atIdx = raw.lastIndexOf('@');
                                        const localPart = atIdx > 0 ? raw.substring(0, atIdx) : raw;
                                        const domain = atIdx > 0 ? raw.substring(atIdx) : '';
                                        const plusIdx = localPart.indexOf('+');
                                        return plusIdx > -1 ? localPart.substring(0, plusIdx) + domain : raw;
                                    })()}</td>
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
                                        <button className="action-btn edit" onClick={() => handleEdit(user)} title="Editar">
                                            <FaEdit />
                                        </button>
                                        <button className="action-btn delete" onClick={() => handleDelete(user.id)} title="Desativar">
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Wizard Modal */}
            {showModal && (
                <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm(); } }}>
                    <div className="modal-content wizard-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="modal-header">
                            <h2>{editingUser ? 'Editar Pessoa' : 'Adicionar Pessoa'}</h2>
                            <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>
                                <FaTimes />
                            </button>
                        </div>

                        {/* Wizard Stepper */}
                        <div className="wizard-stepper">
                            <div className="wizard-progress-bar">
                                <div
                                    className="wizard-progress-fill"
                                    style={{ width: `${(currentStep / (activeSteps.length - 1)) * 100}%` }}
                                />
                            </div>
                            <div className="wizard-steps">
                                {activeSteps.map((step, index) => (
                                    <div
                                        key={step.id}
                                        className={`wizard-step ${index === currentStep ? 'active' : ''} ${index < currentStep || editingUser ? 'completed' : ''}`}
                                        onClick={() => goToStep(index)}
                                    >
                                        <div className="wizard-step-number">
                                            {(index < currentStep || (editingUser && index !== currentStep)) ? <FaCheck /> : index + 1}
                                        </div>
                                        <div className="wizard-step-label">
                                            <span className="wizard-step-title">{step.label}</span>
                                            <span className="wizard-step-desc">{step.description}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Step Content */}
                        <div className="modal-body">
                            {renderStepContent()}
                        </div>

                        {/* Footer with navigation */}
                        <div className="modal-footer">
                            <div className="footer-left">
                                {currentStep > 0 && (
                                    <button type="button" className="btn-back" onClick={handleBack}>
                                        <FaArrowLeft /> Voltar
                                    </button>
                                )}
                            </div>
                            <div className="footer-right">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                >
                                    Cancelar
                                </button>

                                {currentStepId === 'summary' ? (
                                    <button
                                        type="button"
                                        className="btn-submit"
                                        disabled={submitting}
                                        onClick={handleSubmit}
                                    >
                                        {submitting ? (
                                            <><div className="spinner-small"></div> A guardar...</>
                                        ) : (
                                            <><FaCheck /> {editingUser ? 'Atualizar Pessoa' : 'Criar Pessoa'}</>
                                        )}
                                    </button>
                                ) : (
                                    <button type="button" className="btn-next" onClick={handleNext}>
                                        Seguinte <FaArrowRight />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeopleManager;