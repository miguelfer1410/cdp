// CLUBE DESPORTIVO DA PÓVOA - ANIMAÇÕES JAVASCRIPT

// ============================================
// INTERSECTION OBSERVER PARA REVEAL ANIMATIONS
// ============================================
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, observerOptions);

// Observar todos os elementos com classes de reveal
document.querySelectorAll('.reveal-fade-in, .reveal-scale-in, .reveal-slide-up, .reveal-fade-up').forEach(el => {
    observer.observe(el);
});

// ============================================
// CONTADOR ANIMADO PARA ESTATÍSTICAS NO HERO
// ============================================
function animateHeroCounter(element) {
    const target = parseInt(element.dataset.count);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current).toLocaleString('pt-PT');
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString('pt-PT');
        }
    };

    updateCounter();
}

// Iniciar contadores do hero quando a página carregar
window.addEventListener('load', () => {
    document.querySelectorAll('.hero .stat-mini-value').forEach(el => {
        animateHeroCounter(el);
    });
});

// ============================================
// CONTADOR ANIMADO PARA SEÇÃO DE STATS
// ============================================
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
            entry.target.classList.add('counted');
            
            const target = parseInt(entry.target.dataset.target);
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    const value = Math.floor(current);
                    entry.target.textContent = value > 1000 
                        ? value.toLocaleString('pt-PT') + '+'
                        : value;
                    requestAnimationFrame(updateCounter);
                } else {
                    entry.target.textContent = target > 1000 
                        ? target.toLocaleString('pt-PT') + '+'
                        : target;
                }
            };

            updateCounter();
        }
    });
}, { threshold: 0.5 });

// Observar contadores de estatísticas
document.querySelectorAll('.counting').forEach(el => {
    statsObserver.observe(el);
});

// ============================================
// SMOOTH SCROLL PARA LINKS ÂNCORA
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// PARALLAX EFFECT NO HERO
// ============================================
let ticking = false;

function updateParallax(scrollPos) {
    const hero = document.querySelector('.hero');
    if (hero) {
        const heroContent = hero.querySelector('.hero-content');
        const orbs = hero.querySelectorAll('.hero-gradient-orb');
        
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrollPos * 0.3}px)`;
        }
        
        orbs.forEach((orb, index) => {
            const speed = 0.15 + (index * 0.05);
            orb.style.transform = `translateY(${scrollPos * speed}px)`;
        });
    }
}

window.addEventListener('scroll', () => {
    const scrollPos = window.pageYOffset;
    
    if (!ticking) {
        window.requestAnimationFrame(() => {
            if (scrollPos < window.innerHeight) {
                updateParallax(scrollPos);
            }
            ticking = false;
        });
        ticking = true;
    }
});

// ============================================
// EFEITO RIPPLE NOS BOTÕES
// ============================================
function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);
}

document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', createRipple);
});

// CSS para ripple effect (adicionar dinamicamente)
if (!document.getElementById('ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background-color: rgba(255, 255, 255, 0.6);
            width: 100px;
            height: 100px;
            pointer-events: none;
            animation: ripple-animation 0.6s ease-out;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// HEADER SCROLL EFFECT
// ============================================
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.boxShadow = '0 4px 6px -1px rgba(0, 61, 165, 0.15)';
    } else {
        header.style.boxShadow = '0 1px 3px rgba(0, 61, 165, 0.1)';
    }
    
    lastScroll = currentScroll;
});

// ============================================
// ANIMAÇÃO DE ENTRADA DO LOGO
// ============================================
window.addEventListener('load', () => {
    const logo = document.querySelector('.logo-svg');
    if (logo) {
        logo.style.animation = 'scaleIn 0.6s ease-out';
    }
});

// ============================================
// HOVER EFFECT NAS MODALIDADES
// ============================================
document.querySelectorAll('.modalidade-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const glow = card.querySelector('.modalidade-glow');
        if (glow) {
            glow.style.left = `${x - glow.offsetWidth / 2}px`;
            glow.style.top = `${y - glow.offsetHeight / 2}px`;
        }
    });
});

console.log('🏀 Animações do CDP carregadas com sucesso!');