let allGuests = []; // Cache local de todos los invitados
let offlineQueue = []; // Queue de acreditaciones pendientes
let isOnline = navigator.onLine;
let useOfflineMode = false; // Flag para controlar modo

// Verificar que se ha seleccionado un evento
const currentEventId = localStorage.getItem('currentEventId');
const currentEventName = localStorage.getItem('currentEventName');
if (!currentEventId) {
    window.location.href = 'event-selection.html';
}

const startPolling = () => {
    fetchEventData()
        .then(() => {
            initializeDataTable();
            loadCounters();
        });
    setInterval(loadCounters, fetchInterval);
}



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
            alert('Sesión expirada. Por favor inicie sesión nuevamente.');
            logout();
            return null;
        }
        
        return response;
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
};

$(document).ready(function () {
    // Cargar user info
    loadUserInfo();
    
    // Iniciar polling con la configuración adecuada
    startPolling();
    
    // Reemplaza el manejo de contadores por este:
    $('.counter-badge').on('click', function() {
        // Visualmente marcar el contador activo
        $('.counter-badge').removeClass('active');
        $(this).addClass('active');

        // Según el endpoint del data-attribute, setear el filtro
        const endpoint = $(this).data('endpoint');
        switch (endpoint) {
            case "GetAcreditados":
                currentFilter = "acreditados";
                break;
            case "GetNoAcreditados":
                currentFilter = "no-acreditados";
                break;
            case "GetNuevos":
                currentFilter = "nuevos";
                break;
            default:
                currentFilter = "";
        }

        // Recargar DataTable para que mande el filtro al backend
        dataTable.ajax.reload();
    });

    
    // Configurar el botón de guardar configuración
    $(document).on('click', '#saveConfigBtn', function() {
        guardarConfiguracion(currentEventId);
    });
});


// Agregar evento al botón de cerrar sesión
document.getElementById('logoutButton').addEventListener('click', logout);