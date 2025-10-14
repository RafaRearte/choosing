/**
 * auth.js - Módulo de Autenticación
 * Gestiona JWT, login, logout y verificación de roles
 */

const Auth = {
    // Keys para localStorage
    TOKEN_KEY: 'choosing_token',
    USER_KEY: 'choosing_user',

    /**
     * Guardar token y usuario después de login/registro
     */
    login(token, user) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    /**
     * Cerrar sesión
     */
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        window.location.href = '/login.html';
    },

    /**
     * Obtener token JWT
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    },

    /**
     * Obtener usuario logueado
     */
    getUser() {
        const userJson = localStorage.getItem(this.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },

    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        // Verificar si el token expiró
        try {
            const payload = this.decodeToken(token);
            const now = Math.floor(Date.now() / 1000);
            return payload.exp > now;
        } catch (e) {
            return false;
        }
    },

    /**
     * Decodificar JWT (solo payload, sin verificar firma)
     */
    decodeToken(token) {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Token inválido');

        const payload = parts[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    },

    /**
     * Obtener userId del token JWT
     */
    getUserId() {
        const token = this.getToken();
        if (!token) return null;

        try {
            const payload = this.decodeToken(token);
            // .NET guarda el userId en el claim "nameid"
            return payload.nameid ? parseInt(payload.nameid) : null;
        } catch (e) {
            console.error('Error al decodificar token:', e);
            return null;
        }
    },

    /**
     * Obtener rol del usuario
     */
    getRole() {
        const user = this.getUser();
        return user ? user.tipoUsuario : null;
    },

    /**
     * Verificar si tiene un rol específico
     */
    hasRole(role) {
        return this.getRole() === role;
    },

    /**
     * Redirigir según rol
     */
    redirectByRole() {
        const role = this.getRole();
        if (role === 'comprador') {
            window.location.href = '/eventos-publicos.html';
        } else if (role === 'organizador') {
            window.location.href = '/event-selection.html'; // Dashboard organizador
        } else if (role === 'admin') {
            window.location.href = '/admin-panel.html';
        }
    },

    /**
     * Proteger página - redirige a login si no está autenticado
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    /**
     * Proteger página por rol - redirige si no tiene el rol
     */
    requireRole(allowedRoles) {
        if (!this.requireAuth()) return false;

        const role = this.getRole();
        if (!allowedRoles.includes(role)) {
            alert('No tienes permisos para acceder a esta página');
            this.redirectByRole();
            return false;
        }
        return true;
    },

    /**
     * Headers para fetch con autorización
     */
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    /**
     * Fetch con autorización automática
     */
    async fetch(url, options = {}) {
        const defaultOptions = {
            headers: this.getAuthHeaders()
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        const response = await fetch(url, mergedOptions);

        // Si es 401 Unauthorized, cerrar sesión
        if (response.status === 401) {
            this.logout();
            throw new Error('Sesión expirada');
        }

        return response;
    },

    /**
     * Mostrar info del usuario en navbar
     */
    displayUserInfo(elementId = 'user-info') {
        const user = this.getUser();
        const element = document.getElementById(elementId);

        if (element && user) {
            const nombre = user.nombre || user.username;
            const roleBadge = this.getRoleBadge(user.tipoUsuario);

            element.innerHTML = `
                <div class="d-flex align-items-center">
                    <span class="me-2">${nombre}</span>
                    ${roleBadge}
                    <button class="btn btn-sm btn-outline-danger ms-3" onclick="Auth.logout()">
                        Salir
                    </button>
                </div>
            `;
        }
    },

    /**
     * Badge HTML según rol
     */
    getRoleBadge(role) {
        const badges = {
            'comprador': '<span class="badge bg-success">Comprador</span>',
            'organizador': '<span class="badge bg-primary">Organizador</span>',
            'admin': '<span class="badge bg-danger">Admin</span>'
        };
        return badges[role] || '';
    }
};

// Exportar para uso global
window.Auth = Auth;
