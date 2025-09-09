let allGuests = []; // Cache local de todos los invitados
let offlineQueue = []; // Queue de acreditaciones pendientes
let isOnline = navigator.onLine;
let useOfflineMode = false; // Flag para controlar modo


// NUEVA FUNCIÓN CON INDEXEDDB + AUTO-REFRESH
const startPolling = async () => {
    console.log('🚀 Iniciando startPolling...');
    
    await fetchEventData();
    
    // Cargar datos iniciales con cache IndexedDB
    console.log('📡 Llamando fetchGuests...');
    await fetchGuests();
    
    // Auto-refresh en background cada 1 minuto
    setInterval(() => {
        if (!currentFilter && allGuests.length > 0) {
            refreshInBackground();
        }
    }, 60000); // 60 segundos
    
    // Mantener contadores cada 30 segundos
    setInterval(loadCounters, fetchInterval);
    
    console.log('✅ startPolling completado');
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
            case "GetAll":
            default:
                currentFilter = "";
        }

        // Recargar DataTable para que mande el filtro al backend
        fetchGuests(); // Recargar lista de invitados
    });

    
    // Configurar el botón de guardar configuración
    $(document).on('click', '#saveConfigBtn', function() {
        guardarConfiguracion(currentEventId);
    });
});


// Agregar evento al botón de cerrar sesión cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Configurar el modal de configuración unificado
    setupConfigModal();
});

function setupConfigModal() {
    // Manejar el toggle del QR
    const qrToggle = document.getElementById('labelMostrarQR');
    const qrSection = document.getElementById('qrConfigSection');
    
    if (qrToggle && qrSection) {
        // Función para habilitar/deshabilitar la sección QR
        const toggleQRSection = () => {
            const isEnabled = qrToggle.checked;
            const qrCheckboxes = qrSection.querySelectorAll('input[type="checkbox"]');
            
            qrCheckboxes.forEach(checkbox => {
                checkbox.disabled = !isEnabled;
                if (!isEnabled) {
                    checkbox.checked = false;
                }
            });
            
            qrSection.style.opacity = isEnabled ? '1' : '0.5';
        };
        
        // Configurar estado inicial
        toggleQRSection();
        
        // Escuchar cambios
        qrToggle.addEventListener('change', toggleQRSection);
    }
}