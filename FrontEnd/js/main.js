let allGuests = []; // Cache local de todos los invitados
let offlineQueue = []; // Queue de acreditaciones pendientes
let isOnline = navigator.onLine;
let useOfflineMode = false; // Flag para controlar modo


const startPolling = () => {
    fetchEventData()
        .then(() => {
            initializeDataTable();
            loadCounters();
        });
    setInterval(loadCounters, fetchInterval);
}



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