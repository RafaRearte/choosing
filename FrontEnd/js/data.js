
// Actualizar Contadores
const updateCounters = (guests, newCount = null) => {
    const totalGuests = guests.length;
    const accreditedGuests = guests.filter(guest => guest.acreditado > 0).length;
    const notAccreditedGuests = totalGuests - accreditedGuests;

    document.getElementById("totalGuests").innerText = `Invitados: ${totalGuests}`;
    document.getElementById("accredited").innerText = `Acreditados: ${accreditedGuests}`;
    document.getElementById("notAccredited").innerText = `No acreditados: ${notAccreditedGuests}`;
    if (newCount !== null) {
        document.getElementById("new").innerText = `Nuevos: ${newCount}`;
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

// Obtener y mostrar invitados
const fetchGuests = async () => {
    try {
        await fetchEventData();
        
        const response = await authenticatedFetch(`${apiUrl}/GetAll?eventId=${currentEventId}`);
        if (!response) return; // Si hay redirección por token inválido
        
        if (!response.ok) throw new Error('Error al obtener los invitados');
        const guests = await response.json();

        // Actualizar DataTable
        dataTable.clear();
        dataTable.rows.add(guests);
        dataTable.draw();

        // Obtener el contador de nuevos invitados en una llamada separada
        const newResponse = await authenticatedFetch(`${apiUrl}/GetNuevos?eventId=${currentEventId}`);
        if (newResponse && newResponse.ok) {
            const newGuests = await newResponse.json();
            updateCounters(guests, newGuests.length);
        } else {
            updateCounters(guests);
        }

        configurarElementosSegunPermisos();

    } catch (error) {
        console.error('Error fetching guests:', error);
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