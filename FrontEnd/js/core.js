// URLs para las APIs
const apiUrl = CONFIG.API.LIST;
const eventApiUrl = CONFIG.API.EVENT;
// Inicializar DataTable
let dataTable;
let eventData = null;
let eventoActivo = false;
let currentFilter = ""; // "" = todos
// Verificar que se ha seleccionado un evento
const currentEventId = localStorage.getItem('currentEventId');
const currentEventName = localStorage.getItem('currentEventName');
const token = localStorage.getItem('authToken');
if (!token) {
    window.location.href = 'login.html';
}
if (!currentEventId) {
    window.location.href = 'event-selection.html';
}
// Actualizar cada 30 segundos
const fetchInterval = 30000; 
// Función para cerrar sesión
const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('currentEventId');
    localStorage.removeItem('currentEventName');
    localStorage.removeItem('isGlobalAdmin');
    localStorage.removeItem('eventCodes');
    localStorage.removeItem('currentEventAccess');

    window.location.href = 'login.html';
};
// Función helper para hacer peticiones autenticadas
const authenticatedFetch = async (url, options = {}) => {
    const token = localStorage.getItem('authToken');
    
    // Si no hay token, redirigir al login
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    
    // Configurar headers con autenticación
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        // Si hay error de autenticación, redirigir al login
        if (response.status === 401) {
            toast.error('Sesión expirada. Por favor inicie sesión nuevamente');
            logout();
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
};
// Función para mostrar/ocultar el indicador de carga
const showLoading = (message = 'Cargando...') => {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    const submessageEl = document.getElementById('loadingSubmessage');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    if (overlay) {
        overlay.style.display = 'flex';
        if (messageEl) messageEl.textContent = message;
        if (submessageEl) submessageEl.textContent = 'Preparando datos...';
        if (progressBar) progressBar.style.width = '0%';
        if (progressText) progressText.textContent = '0%';
    }
};

const hideLoading = () => {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
};

const updateProgress = (percentage, message = '') => {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const submessageEl = document.getElementById('loadingSubmessage');
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `${Math.round(percentage)}%`;
    }
    if (message && submessageEl) {
        submessageEl.textContent = message;
    }
};
const puedeHacerAccion = (accion) => {
    const eventAccess = JSON.parse(localStorage.getItem('currentEventAccess') || '{}');
    
    //SI NO ES ADMIN Y EVENTO NO ESTÁ ACTIVO, NO PUEDE NADA
    if (!eventoActivo && eventAccess.tipoAcceso !== 'Admin') return false;
    
    switch(accion) {
        case 'acreditar':
            return eventAccess.permisos?.puedeAcreditar || false;
        case 'editar':
            return eventAccess.permisos?.puedeEditarInvitados || false;
        case 'estadisticas':
            return eventAccess.permisos?.puedeVerEstadisticas || false;
        case 'configurar':
            return eventAccess.permisos?.puedeConfigurar || false;
        default:
            return true;
    }
};
// Función para configurar elementos según permisos
const configurarElementosSegunPermisos = () => {
    // Botón de nuevo invitado
    const addGuestBtns = document.querySelectorAll('.open-add-guest-btn');
    addGuestBtns.forEach(btn => {
        btn.style.display = puedeHacerAccion('editar') ? 'block' : 'none';
    });
    
    // Botón de configurar
    const configBtn = document.querySelector('[onclick="configurarEvento()"]');
    if (configBtn) {
        configBtn.style.display = puedeHacerAccion('configurar') ? 'block' : 'none';
    }
    
    // Enlaces a estadísticas
    const statsLinks = document.querySelectorAll('a[href="stats.html"]');
    statsLinks.forEach(link => {
        link.style.display = puedeHacerAccion('estadisticas') ? 'block' : 'none';
    });
};
