// NAVEGAÇÃO ENTRE PÁGINAS
document.addEventListener('DOMContentLoaded', function() {
    // Obter todos os links de navegação
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section-page, .dashboard-section');
    
    // Função para mostrar uma seção específica
    function showSection(sectionId) {
        sections.forEach(section => {
            section.style.display = 'none';
        });
        
        const targetSection = document.querySelector(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
        
        // Atualizar link ativo
        navLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`a[href="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Scroll para o topo
        window.scrollTo(0, 0);
    }
    
    // Adicionar event listeners aos links de navegação
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            showSection(targetId);
        });
    });
    
    // Mostrar dashboard por padrão
    showSection('#dashboard');
    
    // FILTROS DE MODALIDADES
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Aqui você pode adicionar lógica de filtro real
            console.log('Filtro selecionado:', this.textContent);
        });
    });
    
    // NOTIFICAÇÕES
    const notificationIcon = document.querySelector('.notifications');
    
    if (notificationIcon) {
        notificationIcon.addEventListener('click', function() {
            alert('Você tem 3 notificações não lidas');
        });
    }
    
    // AVATAR DO USUÁRIO
    const userAvatar = document.querySelector('.user-avatar');
    
    if (userAvatar) {
        userAvatar.addEventListener('click', function() {
            showSection('#perfil');
        });
    }
    
    // BOTÕES DE AÇÃO RÁPIDA
    const quickActionButtons = document.querySelectorAll('.quick-actions .btn');
    
    quickActionButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            if (index === 0) {
                showSection('#modalidades');
            } else if (index === 1) {
                showSection('#pagamentos');
            } else if (index === 2) {
                showSection('#perfil');
            }
        });
    });
    
    // BOTÕES DE INSCRIÇÃO EM MODALIDADES
    const inscricaoButtons = document.querySelectorAll('.modalidade-card .btn-primary');
    
    inscricaoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalidadeName = this.closest('.modalidade-card').querySelector('h3').textContent;
            alert(`Inscrição em ${modalidadeName} iniciada!`);
        });
    });
    
    // BOTÕES DE PAGAMENTO
    const pagamentoButtons = document.querySelectorAll('.payment-item .btn-primary');
    
    pagamentoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const paymentInfo = this.closest('.payment-item').querySelector('h4').textContent;
            alert(`Processando pagamento: ${paymentInfo}`);
        });
    });
    
    // BOTÕES DE CHECK-IN
    const checkinButtons = document.querySelectorAll('.timeline-item .btn-primary');
    
    checkinButtons.forEach(button => {
        button.addEventListener('click', function() {
            const activityName = this.closest('.timeline-content').querySelector('h4').textContent;
            alert(`Check-in confirmado: ${activityName}`);
        });
    });
    
    // ADICIONAR PRODUTO AO CARRINHO
    const addProductButtons = document.querySelectorAll('.product-card .btn');
    
    addProductButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.closest('.product-card').querySelector('h4').textContent;
            alert(`${productName} adicionado ao carrinho!`);
        });
    });
    
    // DOWNLOAD DE FATURAS
    const downloadButtons = document.querySelectorAll('.invoice-item .btn-icon');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const invoiceNumber = this.closest('.invoice-item').querySelector('h4').textContent;
            alert(`Downloading ${invoiceNumber}...`);
        });
    });
    
    // CONTROLES DO CALENDÁRIO
    const prevMonthBtn = document.querySelector('.calendar-controls .btn-icon:first-child');
    const nextMonthBtn = document.querySelector('.calendar-controls .btn-icon:last-child');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            console.log('Mês anterior');
            alert('Navegando para o mês anterior');
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function() {
            console.log('Próximo mês');
            alert('Navegando para o próximo mês');
        });
    }
    
    // DIAS DO CALENDÁRIO CLICÁVEIS
    const calendarDays = document.querySelectorAll('.calendar-day:not(.other-month)');
    
    calendarDays.forEach(day => {
        day.addEventListener('click', function() {
            // Remover seleção anterior
            calendarDays.forEach(d => d.classList.remove('selected'));
            
            // Adicionar seleção ao dia clicado
            this.classList.add('selected');
            
            const dayNumber = this.textContent;
            console.log('Dia selecionado:', dayNumber);
        });
    });
    
    // EDITAR PERFIL
    const editProfileBtn = document.querySelector('.card-header .btn-secondary');
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            const inputs = document.querySelectorAll('.profile-form input');
            
            if (this.textContent === 'Editar') {
                inputs.forEach(input => {
                    input.removeAttribute('readonly');
                    input.style.background = 'white';
                });
                this.textContent = 'Guardar';
                this.classList.remove('btn-secondary');
                this.classList.add('btn-primary');
            } else {
                inputs.forEach(input => {
                    input.setAttribute('readonly', true);
                    input.style.background = 'var(--light-color)';
                });
                this.textContent = 'Editar';
                this.classList.remove('btn-primary');
                this.classList.add('btn-secondary');
                alert('Dados guardados com sucesso!');
            }
        });
    }
    
    // ALTERAR FOTO DE PERFIL
    const changePhotoBtn = document.querySelector('.profile-photo-section .btn');
    
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', function() {
            alert('Funcionalidade de upload de foto será implementada aqui');
        });
    }
    
    // ADICIONAR MÉTODO DE PAGAMENTO
    const addPaymentMethodBtn = document.querySelector('.payment-methods + .btn');
    
    if (addPaymentMethodBtn) {
        addPaymentMethodBtn.addEventListener('click', function() {
            alert('Formulário para adicionar novo método de pagamento');
        });
    }
    
    // ADICIONAR DOCUMENTO
    const addDocumentBtn = document.querySelector('.documents-list + .btn');
    
    if (addDocumentBtn) {
        addDocumentBtn.addEventListener('click', function() {
            alert('Formulário para upload de documento');
        });
    }
    
    // BOTÕES DE SEGURANÇA
    const securityButtons = document.querySelectorAll('.security-actions .btn');
    
    securityButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            if (index === 0) {
                alert('Formulário para alterar password');
            } else if (index === 1) {
                alert('Configurar autenticação de dois fatores');
            } else if (index === 2) {
                if (confirm('Tem a certeza que deseja sair de todas as sessões?')) {
                    alert('Todas as sessões foram terminadas');
                }
            }
        });
    });
    
    // TOGGLE SWITCHES (PREFERÊNCIAS)
    const toggleSwitches = document.querySelectorAll('.switch input[type="checkbox"]');
    
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const preferenceName = this.closest('.preference-item').querySelector('h4').textContent;
            const status = this.checked ? 'ativada' : 'desativada';
            console.log(`${preferenceName} ${status}`);
        });
    });
    
    // ANIMAÇÕES AO SCROLL
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observar cards para animação
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
    
    // HOVER EFFECTS NOS CARDS DE ATIVIDADE
    const activityItems = document.querySelectorAll('.activity-item');
    
    activityItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
    
    // ATUALIZAR NOTIFICAÇÕES (SIMULADO)
    function updateNotificationBadge(count) {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = count;
            if (count === 0) {
                badge.style.display = 'none';
            } else {
                badge.style.display = 'flex';
            }
        }
    }
    
    // Simular atualização de notificações a cada 30 segundos
    setInterval(function() {
        const currentCount = parseInt(document.querySelector('.notification-badge').textContent);
        // Simular nova notificação aleatoriamente
        if (Math.random() > 0.7) {
            updateNotificationBadge(currentCount + 1);
        }
    }, 30000);
    
    // FUNCIONALIDADE DE PESQUISA (PLACEHOLDER)
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K para pesquisa rápida
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            alert('Funcionalidade de pesquisa rápida será implementada aqui');
        }
    });
    
    // LOG DE ATIVIDADE (PARA DEBUG)
    console.log('Sistema de navegação carregado');
    console.log('Total de seções:', sections.length);
    console.log('Total de links de navegação:', navLinks.length);
});

// FUNÇÕES AUXILIARES
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

// EXPORTAR FUNÇÕES PARA USO GLOBAL
window.showSection = function(sectionId) {
    const event = new CustomEvent('navigate', { detail: { sectionId } });
    document.dispatchEvent(event);
};