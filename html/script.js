// CDP - Sistema de Gestão de Clube Desportivo
// Navigation and UI functionality

document.addEventListener('DOMContentLoaded', function() {
    // Main Navigation
    initMainNavigation();

    // Sub Navigation (tabs)
    initSubNavigation();

    // Initialize other UI components
    initCalendarControls();
});

// Main Navigation between sections
function initMainNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Get target section
            const targetId = this.getAttribute('href').substring(1);

            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Show/hide sections
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });

            // Scroll to top
            window.scrollTo(0, 0);
        });
    });

    // Handle hash navigation on page load
    if (window.location.hash) {
        const targetLink = document.querySelector(`.nav-link[href="${window.location.hash}"]`);
        if (targetLink) {
            targetLink.click();
        }
    }
}

// Sub Navigation (tabs within sections)
function initSubNavigation() {
    const subNavBtns = document.querySelectorAll('.sub-nav-btn');

    subNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            const parentSection = this.closest('section');

            // Update active button
            parentSection.querySelectorAll('.sub-nav-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');

            // Show/hide tab content
            parentSection.querySelectorAll('.tab-content').forEach(content => {
                if (content.id === `tab-${tabId}`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
}

// Calendar Controls
function initCalendarControls() {
    // This would be expanded with actual calendar functionality
    const calendarControls = document.querySelectorAll('.calendar-controls .btn');

    calendarControls.forEach(btn => {
        btn.addEventListener('click', function() {
            // Placeholder for calendar navigation
            console.log('Calendar navigation clicked');
        });
    });
}

// Filter functionality for tables
function initTableFilters() {
    const searchInputs = document.querySelectorAll('.search-input');

    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const table = this.closest('.card').querySelector('.data-table');
            const rows = table.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    });
}

// Notification handling
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Modal handling
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Form handling utilities
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

// Date formatting utility
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Currency formatting utility
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}

// Export functionality placeholder
function exportToExcel(tableId) {
    console.log('Exporting table:', tableId);
    showNotification('A exportar para Excel...', 'info');
}

// Print functionality
function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>CDP - Impressão</title>
                <link rel="stylesheet" href="styles.css">
            </head>
            <body>
                ${section.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}
