const puedeHacerAccion = (accion) => {
    const eventAccess = JSON.parse(localStorage.getItem('currentEventAccess') || '{}');
    
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
            return true; // Por defecto puede ver
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

// Inicializar DataTable
let dataTable;
let eventData = null; // Para almacenar la configuración del evento actual

const token = localStorage.getItem('authToken');
if (!token) {
    window.location.href = 'login.html';
}

// Verificar que se ha seleccionado un evento
const currentEventId = localStorage.getItem('currentEventId');
const currentEventName = localStorage.getItem('currentEventName');
if (!currentEventId) {
    window.location.href = 'event-selection.html';
}

// Actualizar cada 30 segundos
const fetchInterval = 30000; 

const startPolling = () => {
    fetchEventData()
        .then(() => {
            initializeDataTable();
            fetchGuests();
        });
    setInterval(fetchGuests, fetchInterval);
}

// Función para obtener los datos del evento
const fetchEventData = async () => {
    try {
        const response = await authenticatedFetch(`${eventApiUrl}/${currentEventId}`);
        if (!response) return;
        
        if (!response.ok) throw new Error('Error al obtener los datos del evento');
        eventData = await response.json();
        
        // Actualizar título con el nombre del evento
        document.title = `Acreditación - ${eventData.nombre}`;
        document.querySelector('.navbar-brand').textContent = `Acreditación - ${eventData.nombre}`;
        
        return eventData;
    } catch (error) {
        console.error('Error fetching event data:', error);
        alert('Error al obtener los datos del evento. Redirigiendo a la selección de eventos...');
        window.location.href = 'event-selection.html';
    }
}

// Función para inicializar la tabla con las columnas adecuadas según el evento
const initializeDataTable = () => {
    // Definir columnas base que siempre estarán presentes
    const baseColumns = [
        { data: 'id', title: 'ID' },
        { data: 'nombre', title: 'Nombre' },
        { data: 'apellido', title: 'Apellido' }
    ];
    
    // Columnas opcionales basadas en la configuración del evento
    const optionalColumns = [];
    
    // Obtener la configuración del evento o usar valores predeterminados
    const config = eventData.configuracionJson ? JSON.parse(eventData.configuracionJson) : {};
    
    // Si el evento tiene DNI configurado, mostramos la columna
    if (config.mostrarDni !== false) {
        optionalColumns.push({ data: 'dni', title: 'DNI' });
    }
    
    // Si el evento tiene email configurado, mostramos la columna
    if (config.mostrarEmail !== false) {
        optionalColumns.push({ data: 'mail', title: 'Email' });
    }
    
    // Si el evento tiene empresa configurada, mostramos la columna
    if (config.mostrarEmpresa !== false) {
        optionalColumns.push({ data: 'empresa', title: 'Empresa' });
    }
    
    // Si el evento tiene categoría configurada, mostramos la columna
    if (config.mostrarCategoria !== false) {
        optionalColumns.push({ data: 'categoria', title: 'Categoría' });
    }
    
    // Si el evento tiene profesión configurada, mostramos la columna
    if (config.mostrarProfesion !== false) {
        optionalColumns.push({ data: 'profesion', title: 'Profesión' });
    }
    
    // Si el evento tiene cargo configurado, mostramos la columna
    if (config.mostrarCargo !== false) {
        optionalColumns.push({ data: 'cargo', title: 'Cargo' });
    }
    // Si el evento tiene lugar configurado, mostramos la columna
    if (config.mostrarLugar !== false) {
        optionalColumns.push({ data: 'lugar', title: 'Lugar' });
    }
    
    // Si el evento tiene días específicos configurados, mostramos las columnas
    if (config.mostrarDias !== false) {
        optionalColumns.push(
            { data: 'dayOne', title: 'Día 1' },
            { data: 'dayTwo', title: 'Día 2' }
        );
    }
    
    // Columna de estado de acreditación (siempre presente)
    const acreditadoColumn = {
        data: 'acreditado',
        title: 'Estado',
        render: function (data) {
            // Verificar si el valor es mayor que 0 para considerarlo acreditado
            const isAccredited = data > 0;
            return isAccredited ? 
                '<span class="badge bg-success">Ingreso</span>' : 
                '<span class="badge bg-danger">No ingreso</span>';
        }
    };
    
    // Columna de acciones (siempre presente)
const accionesColumn = {
    data: null,
    title: 'Acción',
    render: function (data) {
        const isAccredited = data.acreditado > 0;
        let actions = '<div class="d-flex gap-1">';
        
        // Botón de información (siempre visible)
        actions += `<button type="button" class="btn btn-primary btn-sm" onclick="openEditModal(${data.id})">Info</button>`;
        
        // Botón de etiqueta (solo si puede acreditar)
        if (puedeHacerAccion('acreditar')) {
            actions += `<button type="button" class="btn btn-secondary btn-sm" onclick="printLabel(${data.id}, '${data.nombre}', '${data.apellido}','${data.mail || ''}', '${data.dni || ''}', '${data.profesion || ''}', '${data.cargo || ''}', '${data.empresa || ''}')">Etiqueta</button>`;
        }
        
        // Botón de acreditar (solo si puede acreditar)
        if (puedeHacerAccion('acreditar')) {
            actions += `<button type="button" class="btn btn-sm ${isAccredited ? 'btn-success' : 'btn-outline-success'} rounded-circle toggle-accredit p-0 d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;" data-id="${data.id}" data-status="${isAccredited}" title="${isAccredited ? 'Acreditado' : 'Acreditar'}"><i class="bi ${isAccredited ? 'bi-check-lg' : 'bi-plus-lg'}" style="font-size: 0.8rem;"></i></button>`;
        }
        
        actions += '</div>';
        return actions;
    }
};
    
    // Combinar todas las columnas en el orden correcto
    const allColumns = [...baseColumns, ...optionalColumns, acreditadoColumn, accionesColumn];
    
    // Si ya existe una instancia de DataTable, destruirla
    if (dataTable) {
        dataTable.destroy();
    }
    
    // Inicializar DataTable con las columnas definidas
    dataTable = $('#invitadosTable').DataTable({
        language: {
            url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/es-ES.json",
            lengthMenu: "Mostrar _MENU_",
            info: "_TOTAL_ invitados",
            paginate: {
                previous: "←",
                next: "→"
            },
            search: "Buscar: " // Elimina el label "Search"
        },
        dom: "<'row'<'col-sm-6 d-flex justify-content-start'f>>" + // Solo buscador arriba
            "<'row'<'col-sm-12'tr>>" + // Tabla
            "<'row mt-2'<'col-sm-4'l><'col-sm-4'i>>", // 3 controles abajo
        lengthChange: true,
        searching: true,
        columns: allColumns,
        // Configuración personalizada del search externo:
        initComplete: function() {
            $('#customSearch').on('keyup', function() {
                $('#invitadosTable').DataTable().search(this.value).draw();
            });
        }
    });
    
    // Agregar evento para los botones de toggle acreditación
    $('#invitadosTable').on('click', '.toggle-accredit', function() {
        const id = $(this).data('id');
        const currentStatus = $(this).data('status');
        toggleAccreditStatus(id, currentStatus);
    });
}

$(document).ready(function () {
    // Cargar user info
    loadUserInfo();
    
    // Iniciar polling con la configuración adecuada
    startPolling();
    
    // Agregar manejo de eventos para los contadores como botones
    $('.counter-badge').on('click', function() {
        // Remove active class from all counters
        $('.counter-badge').removeClass('active');
        // Add active class to current counter
        $(this).addClass('active');
        
        // Get the endpoint from the counter
        const endpoint = $(this).data('endpoint');
        // Construct the full URL
        const fullUrl = `${apiUrl}/${endpoint}?eventId=${currentEventId}`;
        // Load filtered data
        loadFilteredData(fullUrl);
    });
    
    // Configurar el botón de guardar configuración
    $(document).on('click', '#saveConfigBtn', function() {
        guardarConfiguracion(currentEventId);
    });
});

// Función para configurar el evento actual
function configurarEvento() {
    // Verificar que se ha seleccionado un evento
    if (!currentEventId) {
        alert("Primero debe seleccionar un evento");
        return;
    }

    // Obtener configuración actual del evento
    showLoading();
    
    // Si eventData ya está cargado, usamos esos datos directamente
    if (eventData) {
        mostrarModalConfiguracion(eventData);
        hideLoading();
        return;
    }
    
    fetch(`${eventApiUrl}/${currentEventId}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al obtener datos del evento');
        return response.json();
    })
    .then(evento => {
        // Mostrar modal de configuración
        mostrarModalConfiguracion(evento);
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al cargar la configuración del evento');
    })
    .finally(() => {
        hideLoading();
    });
}

// Función para mostrar modal de configuración
function mostrarModalConfiguracion(evento) {
    // Cargar configuración actual (si existe)
    const configuracion = evento.configuracionJson ? JSON.parse(evento.configuracionJson) : {};
    
    // Asignar valores a los checkboxes
    document.getElementById('configDni').checked = configuracion.mostrarDni !== false;
    document.getElementById('configEmail').checked = configuracion.mostrarEmail !== false;
    document.getElementById('configEmpresa').checked = configuracion.mostrarEmpresa !== false;
    document.getElementById('configCategoria').checked = configuracion.mostrarCategoria !== false;
    document.getElementById('configProfesion').checked = configuracion.mostrarProfesion !== false;
    document.getElementById('configCargo').checked = configuracion.mostrarCargo !== false;
    document.getElementById('configDias').checked = configuracion.mostrarDias !== false;
    document.getElementById('configInfoAdicional').checked = configuracion.mostrarInfoAdicional !== false;
    
    // Mostrar el modal
    const modalInstance = new bootstrap.Modal(document.getElementById('configModal'));
    modalInstance.show();
}

function guardarConfiguracion(eventoId) {
    // Recopilar configuración del formulario
    const configuracion = {
        mostrarDni: document.getElementById('configDni').checked,
        mostrarEmail: document.getElementById('configEmail').checked,
        mostrarEmpresa: document.getElementById('configEmpresa').checked,
        mostrarCategoria: document.getElementById('configCategoria').checked,
        mostrarProfesion: document.getElementById('configProfesion').checked,
        mostrarCargo: document.getElementById('configCargo').checked,
        mostrarLugar: document.getElementById('configLugar').checked,
        mostrarDias: document.getElementById('configDias').checked,
        mostrarInfoAdicional: document.getElementById('configInfoAdicional').checked
    };
    
    // Guardar configuración directamente usando endpoint específico
    showLoading();
    
    fetch(`${eventApiUrl}/update-config/${eventoId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(JSON.stringify(configuracion))
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al guardar la configuración');
        
        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('configModal'));
        modal.hide();
        
        // Recargar datos para aplicar la nueva configuración
        fetchEventData().then(() => {
            initializeDataTable();
            fetchGuests();
        });
        
        alert('Configuración guardada correctamente');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al guardar la configuración: ' + error.message);
    })
    .finally(() => {
        hideLoading();
    });
}

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

// Agregar evento al botón de cerrar sesión
document.getElementById('logoutButton').addEventListener('click', logout);

// Función para abrir el modal de edición con los datos del invitado
const openEditModal = async (id) => {
    try {
        const response = await authenticatedFetch(`${apiUrl}/GetById/${id}?eventId=${currentEventId}`);
        
        if (!response.ok) throw new Error('No se encontró el invitado');
        
        const guest = await response.json();
        
        // Rellenar el formulario con los datos del invitado
        document.getElementById('editGuestId').value = guest.id;
        document.getElementById('editGuestDni').value = guest.dni || '';
        document.getElementById('editGuestNombre').value = guest.nombre || '';
        document.getElementById('editGuestApellido').value = guest.apellido || '';
        document.getElementById('editGuestEmail').value = guest.mail || '';
        document.getElementById('editGuestEmpresa').value = guest.empresa || '';
        document.getElementById('editGuestCategoria').value = guest.categoria || '';
        document.getElementById('editGuestProfesion').value = guest.profesion || '';
        document.getElementById('editGuestCargo').value = guest.cargo || '';
        document.getElementById('editGuestLugar').value = guest.lugar || '';
        
        // Configurar los checkboxes de días según los valores
        document.getElementById('editGuestDayOne').checked = guest.dayOne === 'SI';
        document.getElementById('editGuestDayTwo').checked = guest.dayTwo === 'SI';
        
        document.getElementById('editGuestInfoAdicional').value = guest.infoAdicional || '';
        document.getElementById('editGuestAcreditado').checked = guest.acreditado > 0;
        
        if (guest.horaAcreditacion) {
            const fecha = new Date(guest.horaAcreditacion);
            const horaFormateada = `${fecha.toLocaleDateString()} ${fecha.toLocaleTimeString()}`;
            document.getElementById('editGuestHoraAcreditacion').innerHTML = `<strong>Hora de acreditación:</strong> ${horaFormateada}`;
        } else {
            document.getElementById('editGuestHoraAcreditacion').innerHTML = '<strong>Hora de acreditación:</strong> No acreditado';
        }
        
        // Mostrar/ocultar campos según la configuración del evento
        configurarCamposModal('edit', eventData.configuracionJson ? JSON.parse(eventData.configuracionJson) : {});
        
        // Abrir el modal
        $('#editGuestModal').modal('show');
    } catch (error) {
        console.error('Error al cargar los datos del invitado:', error);
        alert('No se pudieron cargar los datos del invitado');
    }
};

// Función para configurar los campos visibles en los modales según el evento
const configurarCamposModal = (modalType, config) => {
    const prefix = modalType === 'edit' ? 'edit' : 'new';
    
    // DNI
    document.getElementById(`${prefix}GuestDniGroup`).style.display = 
        config?.mostrarDni !== false ? 'block' : 'none';
    
    // Email
    document.getElementById(`${prefix}GuestEmailGroup`).style.display = 
        config?.mostrarEmail !== false ? 'block' : 'none';
    
    // Empresa
    document.getElementById(`${prefix}GuestEmpresaGroup`).style.display = 
        config?.mostrarEmpresa !== false ? 'block' : 'none';
    
    // Categoría
    document.getElementById(`${prefix}GuestCategoriaGroup`).style.display = 
        config?.mostrarCategoria !== false ? 'block' : 'none';
    
    // Profesión
    document.getElementById(`${prefix}GuestProfesionGroup`).style.display = 
        config?.mostrarProfesion !== false ? 'block' : 'none';
    
    // Cargo
    document.getElementById(`${prefix}GuestCargoGroup`).style.display = 
        config?.mostrarCargo !== false ? 'block' : 'none';

    // Lugar
    document.getElementById(`${prefix}GuestLugarGroup`).style.display = 
        config?.mostrarLugar !== false ? 'block' : 'none';
    
    // Días de asistencia
    document.getElementById(`${prefix}GuestDiasGroup`).style.display = 
        config?.mostrarDias !== false ? 'block' : 'none';
    
    // Información adicional
    document.getElementById(`${prefix}GuestInfoAdicionalGroup`).style.display = 
        config?.mostrarInfoAdicional !== false ? 'block' : 'none';
};

// Función para guardar los cambios del invitado editado
const saveEditedGuest = async () => {
    if (!puedeHacerAccion('editar')) {
        alert('No tiene permisos para editar invitados');
        return;
    }
    // Obtener el ID del invitado
    const id = document.getElementById('editGuestId').value;
    
    // Obtener los valores del formulario
    const dni = document.getElementById('editGuestDni').value;
    const nombre = document.getElementById('editGuestNombre').value;
    const apellido = document.getElementById('editGuestApellido').value;
    const email = document.getElementById('editGuestEmail').value;
    const empresa = document.getElementById('editGuestEmpresa').value;
    const categoria = document.getElementById('editGuestCategoria').value;
    const profesion = document.getElementById('editGuestProfesion').value;
    const cargo = document.getElementById('editGuestCargo').value;
    const lugar = document.getElementById('editGuestLugar').value;
    const dayOne = document.getElementById('editGuestDayOne').checked ? 'SI' : 'NO';
    const dayTwo = document.getElementById('editGuestDayTwo').checked ? 'SI' : 'NO';
    const infoAdicional = document.getElementById('editGuestInfoAdicional').value;
    const acreditado = document.getElementById('editGuestAcreditado').checked ? 1 : 0;
    
    // Validación básica
    if (!nombre || !apellido) {
        alert('Por favor complete los campos obligatorios: Nombre y Apellido');
        return;
    }
    
    // Crear objeto con los datos actualizados
    const updatedGuest = {
        id: parseInt(id),
        dni: dni ? parseInt(dni) : null,
        nombre: nombre,
        apellido: apellido,
        mail: email,
        empresa: empresa,
        categoria: categoria,
        profesion: profesion,
        cargo: cargo,
        lugar: lugar,
        dayOne: dayOne,
        dayTwo: dayTwo,
        infoAdicional: infoAdicional,
        acreditado: acreditado,
        eventoId: parseInt(currentEventId)
    };
    
    try {
        const response = await authenticatedFetch(`${apiUrl}/updateById/${id}?eventId=${currentEventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedGuest)
        });
        
        if (!response) return; // Si hay redirección por token inválido
        
        if (response.ok) {
            alert('Invitado actualizado con éxito');
            $('#editGuestModal').modal('hide');
            fetchGuests(); // Recargar lista de invitados
        } else {
            const errorText = await response.text();
            alert(`Error al actualizar invitado: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al actualizar invitado:', error);
        alert('Ha ocurrido un error al intentar actualizar el invitado');
    }
};

// Función para eliminar un invitado
const deleteGuest = async () => {
        if (!puedeHacerAccion('editar')) {
        alert('No tiene permisos para eliminar invitados');
        return;
    }
    // Obtener el ID del invitado a eliminar
    const id = document.getElementById('editGuestId').value;
    
    // Confirmar la eliminación
    const confirmDelete = confirm(`¿Está seguro que desea eliminar este invitado?`);
    if (!confirmDelete) return;
    
    try {
        const response = await authenticatedFetch(`${apiUrl}/deleteById/${id}?eventId=${currentEventId}`, {
            method: 'DELETE'
        });
        
        if (!response) return; // Si hay redirección por token inválido
        
        if (response.ok) {
            alert('Invitado eliminado con éxito');
            $('#editGuestModal').modal('hide');
            fetchGuests(); // Recargar lista de invitados
        } else {
            const errorText = await response.text();
            alert(`Error al eliminar invitado: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al eliminar invitado:', error);
        alert('Ha ocurrido un error al intentar eliminar el invitado');
    }
};

// Función para cambiar el estado de acreditación (toggle)
const toggleAccreditStatus = async (id, currentStatus) => {
    if (!puedeHacerAccion('acreditar')) {
        alert('No tiene permisos para acreditar invitados');
        return;
    }
        // Verificar fechas del evento
    const eventAccess = JSON.parse(localStorage.getItem('currentEventAccess') || '{}');
    if (!eventAccess.eventoEnFechas && eventAccess.tipoAcceso !== 'Admin') {
        alert('El evento no está en fechas válidas para acreditación');
        return;
    }
    try {
        // Convertir el estado actual a un valor booleano
        const isCurrentlyAccredited = currentStatus === 'true' || currentStatus === true;
        
        // Llamar al endpoint con el nuevo estado (opuesto al actual)
        const newStatus = isCurrentlyAccredited ? 0 : 1;
        
        const response = await authenticatedFetch(`${apiUrl}/updateAccreditStatusById/${id}?eventId=${currentEventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ acreditado: newStatus })
        });
        
        if (!response) return; // Si hay redirección por token inválido
        
        if (response.ok) {
            // No mostrar alert para una mejor experiencia de usuario
            fetchGuests(); // Recargar lista de invitados
        } else {
            const errorText = await response.text();
            alert(`Error al cambiar estado de acreditación: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al cambiar estado de acreditación:', error);
        alert('Ha ocurrido un error al intentar cambiar el estado de acreditación');
    }
};

// URLs para las APIs
const apiUrl = "https://choosing-rafa.duckdns.org/api/List";
const eventApiUrl = "https://choosing-rafa.duckdns.org/api/Event";

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
    } else {
        fetchNewCount();
    }
};

// Obtener y mostrar invitados
const fetchGuests = async () => {
    try {
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
    } catch (error) {
        console.error('Error fetching guests:', error);
    }
};
    // Guardar nuevo invitado (continuación)
const saveNewGuest = async () => {
        if (!puedeHacerAccion('editar')) {
        alert('No tiene permisos para crear invitados');
        return;
    }
    // Obtener los valores del formulario
    const dni = document.getElementById("newGuestDni").value;
    const nombre = document.getElementById("newGuestNombre").value;
    const apellido = document.getElementById("newGuestApellido").value;
    const email = document.getElementById("newGuestEmail").value;
    const empresa = document.getElementById("newGuestEmpresa").value;
    const categoria = document.getElementById("newGuestCategoria").value;
    const profesion = document.getElementById("newGuestProfesion").value;
    const cargo = document.getElementById("newGuestCargo").value;
    const lugar = document.getElementById("newGuestLugar").value;
    const dayOne = document.getElementById("newGuestDayOne").checked ? "SI" : "NO";
    const dayTwo = document.getElementById("newGuestDayTwo").checked ? "SI" : "NO";
    const infoAdicional = document.getElementById("newGuestInfoAdicional").value;

    // Validación básica
    if (!nombre || !apellido) {
        alert("Por favor, complete los campos obligatorios: Nombre y Apellido.");
        return;
    }

    // Crear objeto con los datos del nuevo invitado
    const newGuest = {
        dni: dni ? parseInt(dni) : null,
        nombre,
        apellido,
        mail: email,
        empresa,
        categoria,
        profesion,
        cargo,
        lugar,
        dayOne,
        dayTwo,
        infoAdicional,
        acreditado: 0,
        eventoId: parseInt(currentEventId),
        esNuevo: true
    };

    try {
        const response = await authenticatedFetch(`${apiUrl}/create`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newGuest)
        });

        if (!response) return; // Si hay redirección por token inválido

        if (response.ok) {
            alert("Invitado agregado con éxito.");
            $("#addGuestModal").modal("hide");
            document.getElementById("addGuestForm").reset();
            fetchGuests(); // Recargar lista de invitados
        } else {
            const errorText = await response.text();
            alert(`Error al crear invitado: ${errorText}`);
        }
    } catch (error) {
        console.error("Error al crear invitado:", error);
        alert("Hubo un error al intentar crear el invitado.");
    }
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

// Función para cargar datos filtrados según el contador seleccionado
const loadFilteredData = async (url) => {
    // Mostrar indicador de carga
    document.getElementById('loadingIndicator').style.display = 'block';
    
    try {
        const response = await authenticatedFetch(url);
        if (!response) return;
        
        if (!response.ok) throw new Error('Error al obtener los datos filtrados');
        const guests = await response.json();

        // Limpiar y actualizar la tabla
        dataTable.clear();
        dataTable.rows.add(guests);
        dataTable.draw();
        
        // Si el filtro es GetAll, actualizar todos los contadores
        if (url.endsWith(`GetAll?eventId=${currentEventId}`)) {
            updateCounters(guests);
        }
    } catch (error) {
        console.error('Error loading filtered data:', error);
        alert('Error al cargar los datos filtrados');
    } finally {
        // Ocultar indicador de carga
        document.getElementById('loadingIndicator').style.display = 'none';
    }
};

// Imprimir etiqueta y acreditar invitado
const printLabel = async (id,nombre, apellido,email, dni, profesion, cargo, empresa) => {
    try {
        // Si hay id, acreditar al invitado
        if (id) {
            const response = await authenticatedFetch(`${apiUrl}/updateAccreditStatusById/${id}?eventId=${currentEventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ acreditado: 1 })
            });
            
            if (!response || !response.ok) {
                console.error('Error al acreditar al invitado');
                // Continuamos con la impresión aunque no se haya podido acreditar
            }
        }
        
        // Generar vCard para el QR
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${nombre} ${apellido}
ORG:${empresa || ''}
TITLE:${profesion || ''}
EMAIL:${email}
NOTE:DNI: ${dni || ''} 
END:VCARD`;
        
// Generar QR usando la nueva biblioteca
        const qr = qrcode(0, 'L');
        qr.addData(vcard);
        qr.make();
        
        // Crear imagen del QR
        const qrSvg = qr.createSvgTag(2, 0);
        
        
        // Etiqueta con QR
        const etiquetaHTML = `
        <div style="
            width: 90mm;
            height: 26mm;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            margin: 0;
            padding: 2mm;
            box-sizing: border-box;
        ">
            <div style="flex: 1; text-align: center;">
                <div style="font-weight: bold; font-size: 16pt; margin-bottom: 2px;">${nombre} ${apellido}</div>
                <div style="font-size: 12pt; margin-bottom: 1px;">${empresa || ''}</div>
                <div style="font-size: 12pt; margin-bottom: 1px;">${cargo || ''}</div>
                ${dni ? `<div style="font-size: 10pt;">DNI: ${dni}</div>` : ''}
            </div>
            <div style="margin-right: 5mm; width: 20mm; height: 20mm;">
                ${qrSvg}
            </div>
        </div>
        `;
        
        const printWindow = window.open('', '', 'width=600,height=400');
        printWindow.document.write(etiquetaHTML);
        printWindow.document.close();
        printWindow.print();
        
        // Actualizar la tabla después de acreditar
        fetchGuests();
    } catch (error) {
        console.error('Error:', error);
        alert('Ocurrió un error al acreditar al invitado');
    }
};

// Función para cargar información del usuario
function loadUserInfo() {
    // Obtener datos del usuario del localStorage (guardados durante el login)
    const userData = JSON.parse(localStorage.getItem('userData'));
    
    if (userData) {
        // Mostrar el nombre del usuario
        document.getElementById('userName').textContent = userData.name || 'Usuario';
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

// Función para abrir el modal de nuevo invitado con configuración adecuada
const openAddGuestModal = () => {
    // Restablecer el formulario
    document.getElementById("addGuestForm").reset();
    
    // Configurar los campos visibles según el evento actual
    configurarCamposModal('new', eventData.configuracionJson ? JSON.parse(eventData.configuracionJson) : {});
    
    // Mostrar el modal
    $('#addGuestModal').modal('show');
};

// Función para mostrar/ocultar el indicador de carga
const showLoading = () => {
    document.getElementById('loadingIndicator').style.display = 'block';
};

const hideLoading = () => {
    document.getElementById('loadingIndicator').style.display = 'none';
};

// Agregar eventos para botón del modal
document.addEventListener("DOMContentLoaded", function() {
    // Botón para abrir el modal de nuevo invitado
    document.querySelectorAll('.open-add-guest-btn').forEach(btn => {
        btn.addEventListener('click', openAddGuestModal);
    });
    
    // Verificar si tiene acceso al evento actual
    const currentEventId = localStorage.getItem('currentEventId');
    const eventAccess = localStorage.getItem('currentEventAccess');
    
    if (currentEventId && !eventAccess) {
        alert('Necesita un código de acceso para este evento');
        window.location.href = 'event-selection.html';
        return;
    }
    
    // Configurar permisos en la UI
    configurarElementosSegunPermisos();
    
    // Mostrar tipo de acceso en algún lugar (opcional)
    const accessInfo = JSON.parse(eventAccess || '{}');
    if (accessInfo.tipoAcceso) {
        console.log(`Acceso como: ${accessInfo.tipoAcceso}`);
        // Opcional: mostrar en la UI el tipo de acceso
        // document.querySelector('.navbar-brand').innerHTML += ` <small class="badge bg-secondary">${accessInfo.tipoAcceso}</small>`;
    }
    });

    // Variables para el modo escaneo
let scanModalInstance = null;
let scanTimeout = null;

// Función para abrir el modal de escaneo
const openScanMode = () => {
    if (!puedeHacerAccion('acreditar')) {
        alert('No tiene permisos para acreditar invitados');
        return;
    }
    
    // Mostrar modal
    scanModalInstance = new bootstrap.Modal(document.getElementById('scanModal'));
    scanModalInstance.show();
    
    // Resetear el campo
    document.getElementById('scanInput').value = '';
    document.getElementById('scanResult').style.display = 'none';
    document.getElementById('scanSpinner').style.display = 'block';
    
    // Focus en el input para que la lectora escriba ahí
    setTimeout(() => {
        document.getElementById('scanInput').focus();
    }, 500);
};

// Función para procesar el código escaneado (versión mejorada)
const processScanInput = (scannedData) => {
    if (!scannedData.trim()) return;
    
    console.log('Código escaneado:', scannedData);
    
    // Ocultar spinner
    document.getElementById('scanSpinner').style.display = 'none';
    
    // Determinar tipo de código
    if (scannedData.startsWith('QR:')) {
        // Es un QR personalizado - extraer ID
        const guestId = scannedData.replace('QR:', '');
        searchGuestById(guestId);
    } else if (scannedData.includes('@') && scannedData.length > 50) {
        // Es muy probable que sea un PDF417 de DNI argentino
        const parsedDni = parseDniFromPdf417(scannedData);
        if (parsedDni) {
            searchGuestByDni(parsedDni);
        } else {
            showScanError('No se pudo extraer el DNI del código PDF417');
        }
    } else if (/^\d{7,8}$/.test(scannedData.trim())) {
        // Es un DNI numérico directo
        searchGuestByDni(scannedData.trim());
    } else {
        showScanError(`Código no reconocido. Tipo: ${scannedData.length > 20 ? 'PDF417' : 'Otro'}`);
    }
};

// Función para parsear DNI del código PDF417 argentino
const parseDniFromPdf417 = (pdf417Data) => {
    try {
        console.log('Código PDF417 recibido:', pdf417Data);
        
        // Formato real: NRO_TRAMITE@APELLIDOS@NOMBRES@SEXO@DNI@TIPO@FECHA_NAC@FECHA_EMISION@COD_SEGURIDAD
        // Ejemplo: 00509616293@REARTE ARIZA@CESAR RAFAEL@M@44274648@A@11/09/2002@16/08/2017@207
        const parts = pdf417Data.split('@');
        
        if (parts.length >= 5) {
            // El DNI está en la posición 4 (índice 4)
            const dni = parts[4].trim();
            
            // Validar que sea un DNI válido (7-8 dígitos)
            if (/^\d{7,8}$/.test(dni)) {
                console.log('DNI extraído del PDF417:', dni);
                return dni;
            }
        }
        
        // Método de respaldo: buscar secuencia de 7-8 dígitos que no sea el número de trámite
        const dniMatches = pdf417Data.match(/\b\d{7,8}\b/g);
        if (dniMatches && dniMatches.length > 1) {
            // El primer match suele ser el nro de trámite (más largo), el segundo el DNI
            for (let i = 1; i < dniMatches.length; i++) {
                if (dniMatches[i].length >= 7 && dniMatches[i].length <= 8) {
                    console.log('DNI extraído por método alternativo:', dniMatches[i]);
                    return dniMatches[i];
                }
            }
        }
        
        console.warn('No se pudo extraer DNI del código PDF417');
        return null;
    } catch (error) {
        console.error('Error parsing PDF417:', error);
        return null;
    }
};

// Buscar invitado por ID
const searchGuestById = async (guestId) => {
    try {
        const response = await authenticatedFetch(`${apiUrl}/GetById/${guestId}?eventId=${currentEventId}`);
        
        if (!response || !response.ok) {
            showScanError(`No se encontró invitado con ID: ${guestId}`);
            return;
        }
        
        const guest = await response.json();
        showGuestFound(guest);
    } catch (error) {
        console.error('Error buscando por ID:', error);
        showScanError('Error al buscar el invitado');
    }
};

// Buscar invitado por DNI
const searchGuestByDni = async (dni) => {
    try {
        const response = await authenticatedFetch(`${apiUrl}/searchByDni?dni=${dni}&eventId=${currentEventId}`);
        
        if (!response || !response.ok) {
            showScanError(`No se encontró invitado con DNI: ${dni}`);
            return;
        }
        
        const guest = await response.json();
        showGuestFound(guest);
    } catch (error) {
        console.error('Error buscando por DNI:', error);
        showScanError('Error al buscar el invitado');
    }
};

// Mostrar invitado encontrado
const showGuestFound = (guest) => {
    const isAccredited = guest.acreditado > 0;
    const statusBadge = isAccredited ? 
        '<span class="badge bg-success">YA ACREDITADO</span>' : 
        '<span class="badge bg-warning">PENDIENTE</span>';
    
    const resultHtml = `
        <div class="alert alert-success">
            <h5><i class="bi bi-person-check me-2"></i>Invitado Encontrado</h5>
            <div class="row">
                <div class="col-md-6">
                    <strong>${guest.nombre} ${guest.apellido}</strong><br>
                    ${guest.dni ? `DNI: ${guest.dni}<br>` : ''}
                    ${guest.empresa ? `Empresa: ${guest.empresa}<br>` : ''}
                    ${guest.categoria ? `Categoría: ${guest.categoria}` : ''}
                </div>
                <div class="col-md-6 text-end">
                    <h4>${statusBadge}</h4>
                    ${isAccredited && guest.horaAcreditacion ? 
                        `<small class="text-muted">Acreditado: ${new Date(guest.horaAcreditacion).toLocaleString()}</small>` : 
                        ''}
                </div>
            </div>
        </div>
        
        <div class="d-grid gap-2">
            ${!isAccredited ? `
                <button class="btn btn-success btn-lg" onclick="quickAccredit(${guest.id})">
                    <i class="bi bi-check-lg me-2"></i>Acreditar Ahora
                </button>
                <button class="btn btn-primary btn-lg" onclick="accreditAndPrint(${guest.id}, '${guest.nombre}', '${guest.apellido}', '${guest.dni || ''}', '${guest.profesion || ''}', '${guest.cargo || ''}', '${guest.empresa || ''}')">
                    <i class="bi bi-printer me-2"></i>Acreditar e Imprimir
                </button>
            ` : `
                <button class="btn btn-outline-primary btn-lg" onclick="printLabel(${guest.id}, '${guest.nombre}', '${guest.apellido}', '${guest.dni || ''}', '${guest.profesion || ''}', '${guest.cargo || ''}', '${guest.empresa || ''}')">
                    <i class="bi bi-printer me-2"></i>Reimprimir Etiqueta
                </button>
            `}
            <button class="btn btn-outline-secondary" onclick="openEditModal(${guest.id}); closeScanModal();">
                <i class="bi bi-pencil me-2"></i>Ver/Editar Detalles
            </button>
        </div>
    `;
    
    document.getElementById('scanResult').innerHTML = resultHtml;
    document.getElementById('scanResult').style.display = 'block';
};

// Mostrar error de escaneo
const showScanError = (message) => {
    const errorHtml = `
        <div class="alert alert-danger">
            <h5><i class="bi bi-exclamation-triangle me-2"></i>No Encontrado</h5>
            <p>${message}</p>
            <button class="btn btn-warning btn-sm" onclick="resetScanMode()">
                <i class="bi bi-arrow-clockwise me-1"></i>Escanear Nuevamente
            </button>
        </div>
    `;
    
    document.getElementById('scanResult').innerHTML = errorHtml;
    document.getElementById('scanResult').style.display = 'block';
};

// Acreditación rápida
const quickAccredit = async (guestId) => {
    try {
        const response = await authenticatedFetch(`${apiUrl}/acreditarById/${guestId}?eventId=${currentEventId}`, {
            method: 'PUT'
        });
        
        if (response && response.ok) {
            alert('✅ Invitado acreditado exitosamente');
            closeScanModal();
            fetchGuests(); // Actualizar tabla
        } else {
            alert('Error al acreditar invitado');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al acreditar invitado');
    }
};

// Acreditar e imprimir
const accreditAndPrint = async (id, nombre, apellido, dni, profesion, cargo, empresa) => {
    await quickAccredit(id);
    setTimeout(() => {
        printLabel(id, nombre, apellido, dni, profesion, cargo, empresa);
    }, 500);
};

// Resetear modo escaneo
const resetScanMode = () => {
    document.getElementById('scanInput').value = '';
    document.getElementById('scanResult').style.display = 'none';
    document.getElementById('scanSpinner').style.display = 'block';
    document.getElementById('scanInput').focus();
};

// Cerrar modal de escaneo
const closeScanModal = () => {
    if (scanModalInstance) {
        scanModalInstance.hide();
    }
};

// Event Listeners para el escaneo
document.addEventListener('DOMContentLoaded', function() {
    // Botón de escaneo
    document.getElementById('scanModeBtn').addEventListener('click', openScanMode);
    
    // Input de escaneo - detectar cuando se completa el escaneo
    document.getElementById('scanInput').addEventListener('input', function(e) {
        clearTimeout(scanTimeout);
        
        // Esperar un poco después del último carácter para procesar
        scanTimeout = setTimeout(() => {
            const value = e.target.value.trim();
            if (value.length > 3) { // Mínimo 4 caracteres
                processScanInput(value);
            }
        }, 300); // 300ms después del último carácter
    });
    
    
    // Auto-focus cuando se abre el modal
    document.getElementById('scanModal').addEventListener('shown.bs.modal', function() {
        document.getElementById('scanInput').focus();
    });
});