/**
 * navbar.js - Componente de navegación unificado
 * Genera una navbar consistente para todas las páginas según el rol del usuario
 */

const Navbar = {
    /**
     * Renderizar la navbar en el elemento especificado
     * @param {string} containerId - ID del elemento contenedor
     * @param {object} options - Opciones de configuración
     */
    render(containerId = 'navbar-container', options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`No se encontró el contenedor con ID: ${containerId}`);
            return;
        }

        const user = Auth.getUser();
        if (!user) {
            // Si no hay usuario, mostrar navbar básica
            container.innerHTML = this.getPublicNavbar();
            return;
        }

        const role = user.tipoUsuario;
        const navbar = this.getNavbarByRole(role, user, options);
        container.innerHTML = navbar;

        // Agregar event listeners
        this.attachEventListeners();
    },

    /**
     * Obtener navbar según el rol
     */
    getNavbarByRole(role, user, options) {
        switch (role) {
            case 'admin':
                return this.getAdminNavbar(user, options);
            case 'organizador':
                return this.getOrganizadorNavbar(user, options);
            case 'comprador':
                return this.getCompradorNavbar(user, options);
            default:
                return this.getPublicNavbar();
        }
    },

    /**
     * Navbar para Admin
     */
    getAdminNavbar(user, options) {
        const userName = user.nombre || user.username || 'Admin';
        const currentPage = options.currentPage || '';

        return `
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container-fluid">
                    <a class="navbar-brand" href="/landing.html" style="cursor: pointer;">
                        <i class="bi bi-star me-2"></i>Choosing
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link ${currentPage === 'admin-panel' ? 'active' : ''}" href="/admin-panel.html">
                                    <i class="bi bi-speedometer2"></i> Admin Panel
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link ${currentPage === 'event-selection' ? 'active' : ''}" href="/event-selection.html">
                                    <i class="bi bi-calendar-event"></i> Eventos
                                </a>
                            </li>
                        </ul>
                        <div class="d-flex align-items-center gap-3">
                            <span class="text-white">
                                <i class="bi bi-person-circle me-1"></i>${userName}
                                <span class="badge bg-danger ms-2">Admin</span>
                            </span>
                            <button class="btn btn-outline-light btn-sm" onclick="Auth.logout()">
                                <i class="bi bi-box-arrow-right me-1"></i>Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    },

    /**
     * Navbar para Organizador
     */
    getOrganizadorNavbar(user, options) {
        const userName = user.nombre || user.username || 'Organizador';
        const currentPage = options.currentPage || '';
        const eventId = localStorage.getItem('currentEventId');
        const eventName = localStorage.getItem('currentEventName');

        return `
            <nav class="navbar navbar-expand-lg navbar-dark" style="background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);">
                <div class="container-fluid">
                    <a class="navbar-brand" href="/landing.html" style="cursor: pointer;">
                        <i class="bi bi-star me-2"></i>Choosing
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link ${currentPage === 'dashboard' ? 'active' : ''}" href="/organizador-dashboard.html">
                                    <i class="bi bi-speedometer2"></i> Dashboard
                                </a>
                            </li>
                            ${eventId ? `
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                        <i class="bi bi-folder-open"></i> ${eventName || 'Evento Actual'}
                                    </a>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="/Index.html?eventId=${eventId}">
                                            <i class="bi bi-check-circle"></i> Acreditar
                                        </a></li>
                                        <li><a class="dropdown-item" href="/stats.html?eventId=${eventId}">
                                            <i class="bi bi-graph-up"></i> Estadísticas
                                        </a></li>
                                        <li><a class="dropdown-item" href="/admin-panel.html?eventId=${eventId}">
                                            <i class="bi bi-gear"></i> Configurar
                                        </a></li>
                                        <li><a class="dropdown-item" href="/print-labels.html?eventId=${eventId}">
                                            <i class="bi bi-printer"></i> Etiquetas
                                        </a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item" href="/organizador-dashboard.html">
                                            <i class="bi bi-arrow-left"></i> Cambiar Evento
                                        </a></li>
                                    </ul>
                                </li>
                            ` : ''}
                            <li class="nav-item">
                                <a class="nav-link ${currentPage === 'crear-evento' ? 'active' : ''}" href="/organizador-crear-evento.html">
                                    <i class="bi bi-plus-circle"></i> Crear Evento
                                </a>
                            </li>
                        </ul>
                        <div class="d-flex align-items-center gap-3">
                            <span class="text-white">
                                <i class="bi bi-person-circle me-1"></i>${userName}
                                <span class="badge bg-info ms-2">Organizador</span>
                            </span>
                            <button class="btn btn-outline-light btn-sm" onclick="Auth.logout()">
                                <i class="bi bi-box-arrow-right me-1"></i>Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    },

    /**
     * Navbar para Comprador
     */
    getCompradorNavbar(user, options) {
        const userName = user.nombre || user.username || 'Usuario';
        const currentPage = options.currentPage || '';

        return `
            <nav class="navbar navbar-expand-lg navbar-dark bg-success">
                <div class="container-fluid">
                    <a class="navbar-brand" href="/landing.html" style="cursor: pointer;">
                        <i class="bi bi-star me-2"></i>Choosing
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            <li class="nav-item">
                                <a class="nav-link ${currentPage === 'eventos' ? 'active' : ''}" href="/eventos-publicos.html">
                                    <i class="bi bi-calendar-event"></i> Eventos
                                </a>
                            </li>
                            <li class="nav-item">
                                <a class="nav-link ${currentPage === 'mis-entradas' ? 'active' : ''}" href="/mis-entradas.html">
                                    <i class="bi bi-ticket-detailed"></i> Mis Entradas
                                </a>
                            </li>
                        </ul>
                        <div class="d-flex align-items-center gap-3">
                            <span class="text-white">
                                <i class="bi bi-person-circle me-1"></i>${userName}
                                <span class="badge bg-light text-success ms-2">Comprador</span>
                            </span>
                            <button class="btn btn-outline-light btn-sm" onclick="Auth.logout()">
                                <i class="bi bi-box-arrow-right me-1"></i>Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;
    },

    /**
     * Navbar pública (sin autenticación)
     */
    getPublicNavbar() {
        return `
            <nav class="navbar navbar-expand-lg navbar-light bg-light">
                <div class="container-fluid">
                    <a class="navbar-brand" href="/landing.html">
                        <i class="bi bi-star me-2"></i>Choosing
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav ms-auto">
                            <li class="nav-item">
                                <a class="nav-link" href="/login.html">
                                    <i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        `;
    },

    /**
     * Adjuntar event listeners
     */
    attachEventListeners() {
        // Agregar cualquier listener adicional si es necesario
    }
};

// Exportar para uso global
window.Navbar = Navbar;
