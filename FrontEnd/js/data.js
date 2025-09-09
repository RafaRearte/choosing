
// Actualizar Contadores
const updateCounters = (guests, newCount = null) => {
    const totalGuests = guests.length;
    const accreditedGuests = guests.filter(guest => guest.acreditado > 0).length;
    const notAccreditedGuests = totalGuests - accreditedGuests;

    document.getElementById("totalGuests").textContent = `Invitados: ${totalGuests}`;
    document.getElementById("accredited").textContent = `Acreditados: ${accreditedGuests}`;
    document.getElementById("notAccredited").textContent = `No acreditados: ${notAccreditedGuests}`;
    if (newCount !== null) {
        document.getElementById("new").textContent = `Nuevos: ${newCount}`;
    }
};
// Función para obtener los datos del evento
const fetchEventData = async () => {
    try {
        const response = await authenticatedFetch(`${eventApiUrl}/${currentEventId}`);
        if (!response) return;
        
        if (!response.ok) throw new Error('Error al obtener los datos del evento');
        eventData = await response.json();

        eventoActivo = eventData.activo;
        
        // Actualizar título con el nombre del evento
        document.title = `Acreditación - ${eventData.nombre}`;
        document.querySelector('.navbar-brand').textContent = `Acreditación - ${eventData.nombre}`;
        
        return eventData;
    } catch (error) {
        console.error('Error fetching event data:', error);
        window.location.href = 'event-selection.html';
    }
}

// Obtener y mostrar invitados con IndexedDB
const fetchGuests = async (forceRefresh = false) => {
    try {
        await fetchEventData();
        
        // Si tenemos filtro activo, usar los endpoints específicos (no cache)
        if (currentFilter) {
            await fetchGuestsFiltered();
            return;
        }

        // Si es force refresh, saltar cache y ir directo al servidor
        if (forceRefresh) {
            showLoading('Actualizando datos...');
            updateProgress(10, 'Conectando al servidor...');
        }
        
        // 1. CARGA INSTANTÁNEA: Primero intentar cargar desde IndexedDB
        if (!forceRefresh) {
            console.log('🔍 Intentando cargar desde cache...');
            showLoading('Cargando invitados...');
            updateProgress(10, 'Revisando cache local...');
            
            const cachedGuests = await loadFromCache();
            
            if (cachedGuests && cachedGuests.length > 0) {
                console.log('🚀 Datos cargados desde cache local (instantáneo)');
                updateProgress(50, 'Datos encontrados en cache...');
                
                allGuests = cachedGuests;
                updateProgress(80, 'Actualizando tabla...');
                updateTable(allGuests);
                updateCounters(allGuests);
                
                // Cargar contador de nuevos desde servidor (rápido)
                fetchNewCount();
                
                configurarElementosSegunPermisos();
                updateProgress(100, 'Completado!');
                
                // Esperar un momento antes de ocultar para mostrar 100%
                setTimeout(hideLoading, 300);
                
                // En background, verificar si hay actualizaciones
                setTimeout(() => refreshInBackground(), 1000);
                return;
            } else {
                console.log('❌ Cache vacío o expirado, cargando desde servidor...');
                updateProgress(20, 'Cache vacío, conectando al servidor...');
                // No ocultar loading aquí, se va a cargar del servidor
            }
        }

        // 2. PRIMERA CARGA: Si no hay cache, cargar desde servidor
        console.log('📡 Cargando desde servidor...');
        updateProgress(30, 'Conectando al servidor...');
        
        const response = await authenticatedFetch(`${apiUrl}/GetAllFast?eventId=${currentEventId}`);
        if (!response) {
            hideLoading();
            return;
        }
        
        updateProgress(50, 'Descargando datos...');
        
        if (!response.ok) throw new Error('Error al obtener los invitados');
        const guests = await response.json();

        updateProgress(70, 'Guardando en cache...');
        // Guardar en cache para próximas cargas
        await saveToCache(guests);
        
        updateProgress(85, 'Actualizando tabla...');
        allGuests = guests;
        updateTable(allGuests);
        updateCounters(allGuests);
        
        // Cargar contador de nuevos desde servidor
        fetchNewCount();
        
        configurarElementosSegunPermisos();
        
        updateProgress(100, 'Completado!');
        setTimeout(hideLoading, 300);

    } catch (error) {
        console.error('Error fetching guests:', error);
        hideLoading();
    }
};

// FUNCIÓN PARA FILTROS (sin cache, directo al servidor)
const fetchGuestsFiltered = async () => {
    let url;
    switch (currentFilter) {
        case "acreditados":
            url = `${apiUrl}/GetAcreditados?eventId=${currentEventId}`;
            break;
        case "no-acreditados":
            url = `${apiUrl}/GetNoAcreditados?eventId=${currentEventId}`;
            break;
        case "nuevos":
            url = `${apiUrl}/GetNuevos?eventId=${currentEventId}`;
            break;
        default:
            url = `${apiUrl}/GetAllFast?eventId=${currentEventId}`;
    }
    
    const response = await authenticatedFetch(url);
    if (!response) return;
    
    if (!response.ok) throw new Error('Error al obtener los invitados filtrados');
    const guests = await response.json();

    updateTable(guests);
    if (!currentFilter) {
        updateCounters(guests);
    }
};

// CARGAR DESDE CACHE
const loadFromCache = async () => {
    try {
        console.log('🔍 Cargando desde IndexedDB para evento:', currentEventId);
        const guests = await superSimpleCache.load(currentEventId);
        return guests;
    } catch (error) {
        console.error('💥 Error loading from cache:', error);
        return null;
    }
};

// GUARDAR EN CACHE
const saveToCache = async (guests) => {
    try {
        await superSimpleCache.save(currentEventId, guests);
    } catch (error) {
        console.error('Error saving to cache:', error);
    }
};

// ACTUALIZAR TABLA (separado para reutilizar)
const updateTable = (guests) => {
    // Si DataTable no existe, inicializarla
    if (!dataTable || !$.fn.DataTable.isDataTable('#invitadosTable')) {
        // Actualizar allGuests antes de inicializar
        allGuests = guests;
        initializeDataTable();
    } else {
        // Actualizar DataTable existente
        dataTable.clear();
        dataTable.rows.add(guests);
        dataTable.draw();
    }
    
};

// REFRESCAR EN BACKGROUND (cada minuto)
const refreshInBackground = async () => {
    try {
        console.log('🔄 Sincronizando en background...');
        
        const response = await authenticatedFetch(`${apiUrl}/GetAllFast?eventId=${currentEventId}`);
        if (!response || !response.ok) return;
        
        const serverGuests = await response.json();
        
        // Comparar si hay cambios
        if (serverGuests.length !== allGuests.length || 
            JSON.stringify(serverGuests) !== JSON.stringify(allGuests)) {
            
            console.log('📥 Actualizaciones encontradas, sincronizando...');
            
            // Actualizar cache y datos locales
            await saveToCache(serverGuests);
            allGuests = serverGuests;
            
            // Solo actualizar tabla si no hay filtro activo
            if (!currentFilter) {
                updateTable(allGuests);
                updateCounters(allGuests);
                
                // Actualizar contador de nuevos también
                fetchNewCount();
                
                // toast.success('Datos actualizados automáticamente'); // Opcional
            }
        }
    } catch (error) {
        console.error('Error en refresh background:', error);
    }
};

// Función para cargar contadores optimizada
const loadCounters = async () => {
    try {
        const response = await authenticatedFetch(`${apiUrl}/GetCounters?eventId=${currentEventId}`);
        if (!response?.ok) {
            // Fallback: usar fetchGuests
            await fetchGuests();
            return;
        }
        
        const counters = await response.json();
        updateCountersFromResponse(counters);
        
    } catch (error) {
        console.error('Error loading counters:', error);
        // Fallback silencioso
        await fetchGuests();
    }
};

// Función para actualizar contadores desde la respuesta del servidor
const updateCountersFromResponse = (counters) => {
    document.getElementById("totalGuests").textContent = `Invitados: ${counters.total}`;
    document.getElementById("accredited").textContent = `Acreditados: ${counters.acreditados}`;
    document.getElementById("notAccredited").textContent = `No acreditados: ${counters.ausentes}`;
    document.getElementById("new").textContent = `Nuevos: ${counters.nuevos}`;
};

// Función para obtener el contador de nuevos invitados
const fetchNewCount = async () => {
    try {
        const response = await authenticatedFetch(`${apiUrl}/GetNuevos?eventId=${currentEventId}`);
        if (!response) return;
        
        if (!response.ok) throw new Error('Error al obtener nuevos invitados');
        const newGuests = await response.json();
        
        document.getElementById("new").innerText = `Nuevos: ${newGuests.length}`;
    } catch (error) {
        console.error('Error fetching new guests count:', error);
    }
};

// Función para cargar información del usuario
function loadUserInfo() {
    // Obtener datos del usuario del localStorage (guardados durante el login)
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (userData) {
        // Mostrar el nombre del usuario
        document.getElementById('userName').textContent = userData.name || 'Usuario';
        if (userData.name === 'admin' || userData.name === 'rafa') {
            document.getElementById('adminSection').style.display = 'block';
        }
    }
    
    // Mostrar el nombre del evento
    const eventElement = document.getElementById('currentEventName');
    if (eventElement && currentEventName) {
        eventElement.textContent = currentEventName;
    }
    
    const menuEventElement = document.getElementById('menuCurrentEventName');
    if (menuEventElement && currentEventName) {
        menuEventElement.textContent = currentEventName;
    }
}

