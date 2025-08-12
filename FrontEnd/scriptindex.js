let eventoActivo = false;
let currentFilter = ""; // "" = todos


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
            loadCounters();
        });
    setInterval(loadCounters, fetchInterval);
}

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
    // Después de mostrarLugar
    if (config.mostrarTelefono !== false) {
        optionalColumns.push({ data: 'telefono', title: 'Teléfono' });
    }
    // 🆕 NUEVA COLUMNA RED SOCIAL
    if (config.mostrarRedSocial !== false) {
        optionalColumns.push({ data: 'redSocial', title: 'Red Social' });
    }
    // Si el evento tiene días específicos configurados, mostramos las columnas
    if (config.mostrarDias !== false) {
        optionalColumns.push(
            { data: 'dayOne', title: 'Día 1' },
            { data: 'dayTwo', title: 'Día 2' },
            { data: 'dayThree', title: 'Día 3' }
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

    //    actions += `<button type="button" class="btn btn-info btn-sm" onclick="openGuestQr(${data.id}, '${data.nombre}', '${data.apellido}')">
    //      <i class="bi bi-qr-code-scan"></i>
    //    </button>`;
        
        // Botón de etiqueta (solo si puede acreditar)
        if (puedeHacerAccion('acreditar')) {
            actions += `<button type="button" class="btn btn-secondary btn-sm" onclick="printLabel(${data.id}, '${data.nombre}', '${data.apellido}','${data.telefono || ''}','${data.mail || ''}', '${data.dni || ''}', '${data.profesion || ''}', '${data.cargo || ''}', '${data.empresa || ''}', '${data.redSocial || ''}')">Etiqueta</button>`;
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
            processing: true,
    serverSide: true,
    ajax: {
        url: `${apiUrl}/GetPaginated`,
        type: 'GET',
        data: function(d) {
            return {
                draw: d.draw,
                start: d.start,
                length: d.length,
                search: d.search.value,
                eventId: currentEventId,
                filter: currentFilter || '', // Permitir filtros adicionales
            };
        },
        beforeSend: function(xhr) {
            const token = localStorage.getItem('authToken');
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        },
        dataSrc: function(json) {
            if (json.counters) {
                updateCountersFromResponse(json.counters);
            }
            return json.data || [];
        },
        error: function(xhr, error, code) {
            console.error('Error en DataTable AJAX:', error);
            if (xhr.status === 401) {
                logout();
            }
        }
    },
        pageLength: 50,  // 🔥 DEFAULT 50 EN LUGAR DE 100
        scrollY: "60vh",  // 🔥 ALTURA FIJA PARA SCROLL
        scrollCollapse: true,  // 🔥 PERMITIR COLAPSAR SCROLL
        lengthMenu: [25, 50, 100, 200],  // 🔥 OPCIONES DE PAGINACIÓN 
        paging: true,  // 🔥 HABILITAR PAGINACIÓN
        pagingType: "full_numbers",  // 🔥 NAVEGACIÓN COMPLETA
        language: {
            url: "//cdn.datatables.net/plug-ins/1.13.5/i18n/es-ES.json",
            lengthMenu: "Mostrar _MENU_",
            info: "Mostrando _START_ a _END_ de _TOTAL_ invitados",
            infoEmpty: "Mostrando 0 a 0 de 0 invitados",
            infoFiltered: "(filtrado de _MAX_ total)",
            paginate: {
                first: "Primero",
                last: "Último", 
                next: "Siguiente",
                previous: "Anterior"
            },
            search: "Buscar: "
        },
        dom: "<'row'<'col-sm-6 d-flex justify-content-start'l><'col-sm-6 d-flex justify-content-end'f>>" + // Length y search arriba
            "<'row'<'col-sm-12'tr>>" + // Tabla
            "<'row mt-3'<'col-sm-5'i><'col-sm-7'p>>", // Info y paginación abajo
        responsive: true,
        lengthChange: true,
        autoWidth: true,
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
    document.getElementById('configLugar').checked = configuracion.mostrarLugar !== false;
    document.getElementById('configTelefono').checked = configuracion.mostrarTelefono !== false;
    
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
        mostrarInfoAdicional: document.getElementById('configInfoAdicional').checked,
        mostrarTelefono: document.getElementById('configTelefono').checked,
        mostrarRedSocial: document.getElementById('configRedSocial').checked
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
            loadCounters();
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
        document.getElementById('editGuestTelefono').value = guest.telefono || '';
        document.getElementById('editGuestRedSocial').value = guest.redSocial || ''; // 🆕 NUEVO CAMPO
        
        // Configurar los checkboxes de días según los valores
        document.getElementById('editGuestDayOne').checked = guest.dayOne === 'SI';
        document.getElementById('editGuestDayTwo').checked = guest.dayTwo === 'SI';
        document.getElementById('editGuestDayThree').checked = guest.dayThree === 'SI';
        
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

    // Teléfono
    document.getElementById(`${prefix}GuestTelefonoGroup`).style.display = 
        config?.mostrarTelefono !== false ? 'block' : 'none';

    // 🆕 RED SOCIAL
    document.getElementById(`${prefix}GuestRedSocialGroup`).style.display = 
        config?.mostrarRedSocial !== false ? 'block' : 'none';
    
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
    const telefono = document.getElementById('editGuestTelefono').value;
    const redSocial = document.getElementById('editGuestRedSocial').value; // 🆕 NUEVO CAMPO
    const dayOne = document.getElementById('editGuestDayOne').checked ? 'SI' : 'NO';
    const dayTwo = document.getElementById('editGuestDayTwo').checked ? 'SI' : 'NO';
    const dayThree = document.getElementById('editGuestDayThree').checked ? 'SI' : 'NO';
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
        telefono: telefono,
        redSocial: redSocial,
        dayOne: dayOne,
        dayTwo: dayTwo,
        dayThree: dayThree,
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
            dataTable.ajax.reload(null, false); // Recargar lista de invitados
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
            dataTable.ajax.reload(null, false); // Recargar lista de invitados
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
            dataTable.ajax.reload(null, false); // Recargar lista de invitados
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
const apiUrl = "https://api.rafarearte.com/api/List";
const eventApiUrl = "https://api.rafarearte.com/api/Event";

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

// Función para actualizar contadores desde la respuesta del servidor
const updateCountersFromResponse = (counters) => {
    document.getElementById("totalGuests").textContent = `Invitados: ${counters.total}`;
    document.getElementById("accredited").textContent = `Acreditados: ${counters.acreditados}`;
    document.getElementById("notAccredited").textContent = `No acreditados: ${counters.ausentes}`;
    document.getElementById("new").textContent = `Nuevos: ${counters.nuevos}`;
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
    const telefono = document.getElementById("newGuestTelefono").value;
    const redSocial = document.getElementById("newGuestRedSocial").value; // 🆕 NUEVO CAMPO
    const dayOne = document.getElementById("newGuestDayOne").checked ? "SI" : "NO";
    const dayTwo = document.getElementById("newGuestDayTwo").checked ? "SI" : "NO";
    const dayThree = document.getElementById("newGuestDayThree").checked ? "SI" : "NO";
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
        telefono,
        redSocial,
        dayOne,
        dayTwo,
        dayThree,
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
            dataTable.ajax.reload(null, false); // Recargar lista de invitados
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

// Función para normalizar nombres y evitar problemas con el vCard
const normalizeNameForVCard = (text) => {
    if (!text) return '';
    
    return text
        .trim()
        // Reemplazar caracteres problemáticos
        .replace(/[^\w\s\-\.]/g, '') // Solo letras, números, espacios, guiones y puntos
        // Normalizar espacios múltiples
        .replace(/\s+/g, ' ')
        // Limitar longitud para evitar problemas
        .substring(0, 50)
        .trim();
};

// Función mejorada para dividir nombres largos
const splitLongName = (fullName) => {
    if (!fullName) return { nombre: '', apellido: '' };
    
    const normalized = normalizeNameForVCard(fullName);
    const parts = normalized.split(' ');
    
    if (parts.length === 1) {
        return { nombre: parts[0], apellido: '' };
    } else if (parts.length === 2) {
        return { nombre: parts[0], apellido: parts[1] };
    } else {
        // Si hay más de 2 palabras, tomar la primera como nombre y el resto como apellido
        return { 
            nombre: parts[0], 
            apellido: parts.slice(1).join(' ').substring(0, 30) // Limitar apellido
        };
    }
};

//FUNCIÓN PRINTLABEL MEJORADA CON VALIDACIÓN DE TAMAÑO QR
const printLabel = async (id, nombre, apellido, telefono, email, dni, profesion, cargo, empresa, redSocial) => {
    try {
        console.log('=== DEBUG PRINT LABEL OPTIMIZADO ===');
        console.log('ID:', id);
        console.log('Datos originales:', { nombre, apellido, email, telefono, empresa, cargo, redSocial });

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
            }
        }
        
        // Normalizar y limpiar datos
        const nombreCompleto = `${nombre || ''} ${apellido || ''}`.trim();
        const emailLimpio = (email || '').trim().substring(0, 50);
        const telefonoLimpio = (telefono || '').toString().replace(/[^\d\+\-\s]/g, '').trim();
        const empresaLimpia = (empresa || '').trim();
        const cargoLimpio = (cargo || '').trim();
        const redSocialLimpia = (redSocial || '').trim();
        
        console.log('Datos normalizados:', { nombreCompleto, emailLimpio, telefonoLimpio, empresaLimpia, cargoLimpio, redSocialLimpia });
        
        // Verificar que tenemos al menos un nombre
        if (!nombreCompleto) {
            alert('Error: No se puede generar el código QR sin nombre');
            return;
        }
        
        // 🎯 CREAR vCard OPTIMIZADO CON VALIDACIÓN DE TAMAÑO
        const { vcard, version, estimatedSize } = createOptimizedVCard(nombreCompleto, empresaLimpia, emailLimpio, telefonoLimpio, redSocialLimpia, cargoLimpio);
        
        console.log(`📱 QR generado - Versión: ${version}, Tamaño estimado: ${estimatedSize}`);
        console.log('📄 vCard final (', vcard.length, 'caracteres):', vcard);
        
        // 🚨 VALIDACIÓN CRÍTICA: Si el QR sigue siendo muy grande, usar versión mínima
        if (vcard.length > 300) {
            console.warn('⚠️ QR aún muy grande, forzando versión mínima');
            const minimalVCard = createMinimalVCard(nombreCompleto, telefonoLimpio);
            console.log('📱 QR mínimo:', minimalVCard);
            
            return generateAndPrintLabel(minimalVCard.vcard, nombreCompleto, empresa, cargo, 'mínimo-forzado');
        }
        
        // Generar etiqueta con el vCard optimizado
        generateAndPrintLabel(vcard, nombreCompleto, empresa, cargo, version);
        
        // Actualizar la tabla después de acreditar
        loadCounters();

    } catch (error) {
        console.error('❌ Error:', error);
        alert('Ocurrió un error al generar la etiqueta: ' + error.message);
    }
};


// Guardar nuevo invitado Y imprimir - VERSIÓN CORREGIDA
const saveNewGuestAndPrint = async () => {
    if (!puedeHacerAccion('editar')) {
        alert('No tiene permisos para crear invitados');
        return;
    }
    
    // Obtener los valores del formulario (IGUAL que saveNewGuest)
    const dni = document.getElementById("newGuestDni").value;
    const nombre = document.getElementById("newGuestNombre").value;
    const apellido = document.getElementById("newGuestApellido").value;
    const email = document.getElementById("newGuestEmail").value;
    const empresa = document.getElementById("newGuestEmpresa").value;
    const categoria = document.getElementById("newGuestCategoria").value;
    const profesion = document.getElementById("newGuestProfesion").value;
    const cargo = document.getElementById("newGuestCargo").value;
    const lugar = document.getElementById("newGuestLugar").value;
    const telefono = document.getElementById("newGuestTelefono").value;
    const redSocial = document.getElementById("newGuestRedSocial").value;
    const dayOne = document.getElementById("newGuestDayOne").checked ? "SI" : "NO";
    const dayTwo = document.getElementById("newGuestDayTwo").checked ? "SI" : "NO";
    const dayThree = document.getElementById("newGuestDayThree").checked ? "SI" : "NO";
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
        telefono,
        redSocial,
        dayOne,
        dayTwo,
        dayThree,
        infoAdicional,
        acreditado: 0, // Crear sin acreditar
        eventoId: parseInt(currentEventId),
        esNuevo: true
    };

    try {
        // 1. CREAR EL INVITADO
        const response = await authenticatedFetch(`${apiUrl}/create`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newGuest)
        });

        if (!response) return;

        if (response.ok) {
            const createdGuest = await response.json();
            
            // 2. CERRAR MODAL Y LIMPIAR FORMULARIO
            $("#addGuestModal").modal("hide");
            document.getElementById("addGuestForm").reset();
            
            // 3. IMPRIMIR ETIQUETA (que también va a acreditar)
            setTimeout(() => {
                printLabel(
                    createdGuest.id, 
                    nombre, 
                    apellido, 
                    telefono, 
                    email, 
                    dni, 
                    profesion, 
                    cargo, 
                    empresa, 
                    redSocial
                );
            }, 500);
            
            // 4. RECARGAR LISTA
            loadCounters();
            
            
        } else {
            const errorText = await response.text();
            alert(`Error al crear invitado: ${errorText}`);
        }
    } catch (error) {
        console.error("Error al crear invitado:", error);
        alert("Hubo un error al intentar crear el invitado.");
    }
};

// 🎯 FUNCIÓN PARA CREAR vCard OPTIMIZADO CON MÚLTIPLES NIVELES
const createOptimizedVCard = (nombreCompleto, empresa, email, telefono, redSocial, cargo) => {
    
    // 📏 FUNCIÓN MEJORADA PARA ESTIMAR TAMAÑO DEL QR
    const estimateQRComplexity = (content) => {
        const chars = content.length;
        const complexity = chars + (content.match(/[^\w\s]/g) || []).length * 2; // Caracteres especiales pesan más
        
        if (complexity < 80) return { size: 'pequeño', level: 'L' };
        if (complexity < 150) return { size: 'mediano', level: 'M' };
        if (complexity < 250) return { size: 'grande', level: 'H' };
        return { size: 'xlarge', level: 'H' };
    };

    // NIVEL 1: vCard completo pero optimizado
    let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${nombreCompleto}`;

    if (empresa && empresa.length < 35) {
        vcard += `\nORG:${empresa}`;
    }
    if (email && email.length < 40) {
        vcard += `\nEMAIL:${email}`;
    }
    if (telefono) {
        vcard += `\nTEL:${telefono}`;
    }
    if (cargo && cargo.length < 25) {
        vcard += `\nTITLE:${cargo}`;
    }
    if (redSocial && redSocial.length < 30) {
        vcard += `\nURL:${redSocial}`;
    }
    
    vcard += `\nEND:VCARD`;

    console.log('🧪 Nivel 1 - Completo optimizado:', vcard.length, 'caracteres');
    
    let complexity = estimateQRComplexity(vcard);
    if (complexity.size !== 'xlarge') {
        console.log('✅ vCard completo optimizado OK');
        return { vcard, version: 'completo-opt', estimatedSize: complexity.size };
    }

    // NIVEL 2: Solo datos esenciales de contacto
    vcard = `BEGIN:VCARD
VERSION:3.0
FN:${nombreCompleto}`;

    if (email && email.length < 40) {
        vcard += `\nEMAIL:${email}`;
    }
    if (telefono) {
        vcard += `\nTEL:${telefono}`;
    }
    if (empresa && empresa.length < 20) {
        vcard += `\nORG:${empresa.substring(0, 20)}`;
    }
    
    vcard += `\nEND:VCARD`;

    console.log('🧪 Nivel 2 - Esencial:', vcard.length, 'caracteres');
    
    complexity = estimateQRComplexity(vcard);
    if (complexity.size !== 'xlarge') {
        console.log('✅ vCard esencial OK');
        return { vcard, version: 'esencial', estimatedSize: complexity.size };
    }

    // NIVEL 3: Solo nombre y contacto principal
    const contactoPrincipal = telefono || email;
    vcard = `BEGIN:VCARD
VERSION:3.0
FN:${nombreCompleto}`;

    if (contactoPrincipal) {
        if (telefono) {
            vcard += `\nTEL:${telefono}`;
        } else if (email) {
            vcard += `\nEMAIL:${email}`;
        }
    }
    
    vcard += `\nEND:VCARD`;

    console.log('🧪 Nivel 3 - Básico:', vcard.length, 'caracteres');
    
    complexity = estimateQRComplexity(vcard);
    console.log('✅ vCard básico (siempre funciona)');
    
    return { vcard, version: 'básico', estimatedSize: complexity.size };
};

// 🆘 FUNCIÓN DE EMERGENCIA PARA QRs MÍNIMOS
const createMinimalVCard = (nombreCompleto, telefono) => {
    // Solo nombre y teléfono (lo más básico posible)
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${nombreCompleto}${telefono ? `\nTEL:${telefono}` : ''}
END:VCARD`;

    console.log('🆘 vCard mínimo de emergencia:', vcard.length, 'caracteres');
    return { vcard, version: 'mínimo' };
};

// 🏷️ FUNCIÓN CON MÁRGENES VERTICALES ARREGLADOS
const generateAndPrintLabel = (vcard, nombreCompleto, empresa, cargo, version) => {
    try {
        // Generar QR con nivel de corrección apropiado
        const qr = qrcode(0, version === 'mínimo-forzado' ? 'L' : 'M');
        qr.addData(vcard);
        qr.make();
        
        // QR de tamaño normal
        const qrSvg = qr.createSvgTag(2.0, 0); // Un poquito más chico para dar más margen
        
        // 🏷️ ETIQUETA CON MÁRGENES VERTICALES SEGUROS
        const etiquetaHTML = `
        <div style="
            width: 90mm;
            height: 26mm;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            margin: 0;
            padding: 3mm 2mm; 
            box-sizing: border-box;
        ">
            <!-- Contenedor del texto -->
            <div style="
                flex: 1; 
                text-align: left;
                padding-right: 4mm;
            ">
                <div style="
                    font-weight: bold; 
                    font-size: 16pt; 
                    margin-bottom: 1mm; 
                    line-height: 1.1;
                ">
                    ${nombreCompleto}
                </div>
                
                ${empresa ? `<div style="
                    font-size: 12pt; 
                    margin-bottom: 0.5mm; 
                    line-height: 1.1;
                    color: #333;
                ">
                    ${empresa.length > 40 ? empresa.substring(0, 40) + '...' : empresa}
                </div>` : ''}
                
                ${cargo ? `<div style="
                    font-size: 11pt; 
                    line-height: 1.1;
                    color: #555;
                ">
                    ${cargo.length > 30 ? cargo.substring(0, 30) + '...' : cargo}
                </div>` : ''}
            </div>
            
            <!-- Contenedor del QR con márgenes verticales -->
            <div style="
                width: 18mm; 
                height: 18mm; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                flex-shrink: 0;
                margin: 2mm 2mm 2mm 0mm;
            ">
                ${qrSvg}
            </div>
        </div>
        `;

        // Mostrar etiqueta
        const printWindow = window.open('', '', 'width=600,height=400');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Etiqueta</title>
                <style>
                    @page {
                        size: 90mm 26mm;
                        margin: 0;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                    }
                </style>
            </head>
            <body>
                ${etiquetaHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        
        console.log('✅ Etiqueta con márgenes verticales arreglados');
        
    } catch (error) {
        console.error('❌ Error generando etiqueta:', error);
        
        // FALLBACK: Etiqueta sin QR
        const etiquetaSinQR = `
        <div style="
            width: 90mm;
            height: 26mm;
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 4mm 3mm;
            box-sizing: border-box;
        ">
            <div style="font-weight: bold; font-size: 18pt; margin-bottom: 2mm; text-align: center;">
                ${nombreCompleto}
            </div>
            ${empresa ? `<div style="font-size: 14pt; margin-bottom: 1mm; text-align: center;">
                ${empresa.length > 45 ? empresa.substring(0, 45) + '...' : empresa}
            </div>` : ''}
            ${cargo ? `<div style="font-size: 12pt; text-align: center;">
                ${cargo.length > 35 ? cargo.substring(0, 35) + '...' : cargo}
            </div>` : ''}
        </div>
        `;
        
        const printWindow = window.open('', '', 'width=600,height=400');
        printWindow.document.write(`<!DOCTYPE html><html><head><title>Etiqueta</title><style>@page{size:90mm 26mm;margin:0;}body{margin:0;padding:0;font-family:Arial,sans-serif;}</style></head><body>${etiquetaSinQR}</body></html>`);
        printWindow.document.close();
        printWindow.print();
    }
};

// 🆘 FALLBACK: Etiqueta sin QR con layout optimizado
const generateLabelWithoutQROptimized = (nombreCompleto, empresa, cargo) => {
    return `
    <div style="
        width: 90mm;
        height: 26mm;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        margin: 0;
        padding: 3mm 4mm;
        box-sizing: border-box;
        border: 1px solid #ddd;
    ">
        <div style="
            font-weight: bold; 
            font-size: 20pt; 
            margin-bottom: 2mm; 
            line-height: 1.0;
            color: #000;
            width: 100%;
        ">
            ${nombreCompleto}
        </div>
        
        ${empresa ? `<div style="
            font-size: 14pt; 
            margin-bottom: 1mm; 
            line-height: 1.1;
            color: #333;
            width: 100%;
        ">
            ${empresa.length > 50 ? empresa.substring(0, 50) + '...' : empresa}
        </div>` : ''}
        
        ${cargo ? `<div style="
            font-size: 13pt; 
            line-height: 1.1;
            color: #555;
            width: 100%;
        ">
            ${cargo.length > 40 ? cargo.substring(0, 40) + '...' : cargo}
        </div>` : ''}
        
        <div style="
            font-size: 8pt; 
            color: #999; 
            margin-top: auto;
            width: 100%;
        ">
            Sin QR - Layout optimizado
        </div>
    </div>
    `;
};
const openGuestQr = (id, nombre, apellido) => {
    const qrContent = `${id}`; // solo el ID para escanear

    // Crear el QR
    const qr = qrcode(0, 'L');
    qr.addData(qrContent);
    qr.make();
    const qrHtml = qr.createSvgTag(4, 0); // tamaño x4

    // Abrir nueva ventana con el QR
    const html = `
        <html>
        <head>
            <title>QR Invitado</title>
        </head>
        <body style="text-align: center; font-family: sans-serif;">
            <h2>${nombre} ${apellido}</h2>
            <div>${qrHtml}</div>
            <p>ID: ${id}</p>
            <button onclick="window.print()">Imprimir</button>
        </body>
        </html>
    `;

    const qrWindow = window.open('', '_blank');
    qrWindow.document.write(html);
    qrWindow.document.close();
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

const resetScan = () => {
    // Limpiar input y spinner
    const input = document.getElementById('scanInput');
    const result = document.getElementById('scanResult');
    const spinner = document.getElementById('scanSpinner');

    if (input) input.value = '';
    if (result) result.style.display = 'none';
    if (spinner) spinner.style.display = 'block';

    // Dejar el foco de nuevo en el input
    setTimeout(() => {
        input.focus();
    }, 200);
};


// Función para procesar el código escaneado (versión mejorada)
const processScanInput = (scannedData) => {
    if (!scannedData.trim()) return;

    console.log('Código escaneado:', scannedData);
    const cleanData = scannedData.trim();

    // Ocultar spinner
    const spinner = document.getElementById('scanSpinner');
    if (spinner) spinner.style.display = 'none';

    // 1. PDF417 (más de 50 caracteres)
    if (cleanData.length > 50) {
        const dni = parseDniFromPdf417(cleanData);
        if (dni) {
            searchGuestByDni(dni);
        } else {
            showScanError('No se pudo extraer el DNI del código PDF417');
        }

    // 3. 🆕 CÓDIGOS ALFANUMÉRICOS (IdCode de invitaciones externas)
    } else if (/^[A-Za-z0-9\-_]+$/.test(cleanData) && cleanData.length >= 6) {
        // Código de barras o QR de invitación externa
        console.log('🎫 Detectado código de invitación externa:', cleanData);
        searchGuestByIdCode(cleanData);

    // 4. Otro formato no reconocido
    } else {
        showScanError(`Código no reconocido. Formato: "${cleanData}". Longitud: ${cleanData.length}`);
    }
};



// Función para parsear DNI del código PDF417 argentino
const parseDniFromPdf417 = (data) => {
    try {
        console.log('Código recibido:', data);

        // Buscar todos los números de 7 u 8 dígitos
        const matches = data.match(/\d{7,8}/g);

        if (matches && matches.length >= 2) {
            const dni = matches[1];
            console.log('DNI extraído:', dni);
            return dni;
        }

        console.warn('No se encontró un DNI válido');
        return null;

    } catch (error) {
        console.error('Error al parsear PDF417:', error);
        return null;
    }
};

// 🆕 NUEVA FUNCIÓN PARA BUSCAR POR IdCode
const searchGuestByIdCode = async (idCode) => {
    try {
        console.log('🔍 Buscando invitado por IdCode:', idCode);
        
        const response = await authenticatedFetch(`${apiUrl}/searchByIdCode?idCode=${encodeURIComponent(idCode)}&eventId=${currentEventId}`);
        
        if (!response || !response.ok) {
            showScanError(`No se encontró invitado con el código: ${idCode}`);
            return;
        }
        
        const guest = await response.json();
        console.log('✅ Invitado encontrado por IdCode:', guest);
        showGuestFound(guest);
    } catch (error) {
        console.error('Error buscando por IdCode:', error);
        showScanError('Error al buscar el invitado por código');
    }
};

// 🆕 ACREDITACIÓN RÁPIDA POR IdCode
const quickAccreditByIdCode = async (idCode) => {
    try {
        const response = await authenticatedFetch(`${apiUrl}/acreditarByIdCode/${encodeURIComponent(idCode)}?eventId=${currentEventId}`, {
            method: 'PUT'
        });
        
        if (response && response.ok) {
            alert('✅ Invitado acreditado exitosamente');
            closeScanModal();
            dataTable.ajax.reload(null, false); // Actualizar tabla
        } else {
            alert('Error al acreditar invitado');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al acreditar invitado');
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
        '<span class="badge bg-danger">NO ACREDITADO</span>';
    
    // 🆕 MOSTRAR INFORMACIÓN DEL IdCode SI EXISTE

    const idCodeInfo = guest.idCode ? 
        `<small class="text-muted d-block">Código de invitación: ${guest.idCode}</small>` : '';
    
    const resultHtml = `
        <div class="">
            <div class="row mb-3">
                <h3 style="font-size: 2rem;"><i class="bi bi-person-check me-2"></i>Invitado Encontrado</h3>
                <div class="">
                    <strong style="font-size: 1.5rem;">${guest.nombre} ${guest.apellido}</strong><br>
                    ${guest.dni ? `<span style="font-size: 1.1rem;">DNI: ${guest.dni}</span><br>` : ''}
                    ${guest.empresa ? `<span style="font-size: 1.1rem;">Empresa: ${guest.empresa}</span><br>` : ''}
                    ${guest.categoria ? `<span style="font-size: 1.1rem;">Categoría: ${guest.categoria}</span><br>` : ''}
                    ${idCodeInfo}
                </div>
            </div>
            <div class="row mt-4">
                <div class="col-12 text-center mb-3">
                    <h4>${statusBadge}</h4>
                    ${isAccredited && guest.horaAcreditacion ? 
                        `<small class="text-muted">Acreditado: ${new Date(guest.horaAcreditacion).toLocaleString()}</small>` : 
                        ''}
                </div>
                <div class="col-12 text-center">
                    <div class="d-flex justify-content-center gap-2 mt-2 flex-row">
                        <button class="btn ${isAccredited ? 'btn-outline-danger' : 'btn-success'} btn-sm" style="min-width:110px;" onclick="toggleAccreditStatus(${guest.id}, ${isAccredited})">
                            <i class="bi bi-check-lg me-1"></i>${isAccredited ? 'Desacreditar' : 'Acreditar'}
                        </button>
                        <button class="btn ${isAccredited ? 'btn-outline-primary' : 'btn-primary'} btn-sm" style="min-width:110px;" onclick="printLabel(${guest.id}, '${guest.nombre}', '${guest.apellido}','${guest.telefono || ''}', '${guest.email || ''}', '${guest.dni || ''}', '${guest.profesion || ''}', '${guest.cargo || ''}', '${guest.empresa || ''}', '${guest.redSocial || ''}')">
                            <i class="bi bi-printer me-1"></i>${isAccredited ? 'Etiqueta' : 'Acreditar+Imprimir'}
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" style="min-width:110px;" onclick="openEditModal(${guest.id}); closeScanModal();">
                            <i class="bi bi-pencil me-1"></i>Editar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('scanResult').innerHTML = resultHtml;
    document.getElementById('scanResult').style.display = 'block';
setTimeout(() => {
    const printBtn = document.querySelector('#scanResult button[onclick*="printLabel"]');
    if (printBtn) {
        printBtn.focus();
        printBtn.style.outline = '2px solid #0d6efd';
    }
}, 200);
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
            closeScanModal();
            dataTable.ajax.reload(null, false); // Actualizar tabla
        } else {
            alert('Error al acreditar invitado');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al acreditar invitado');
    }
};

// Acreditar e imprimir
const accreditAndPrint = async (id, nombre, apellido,telefono, dni, profesion, cargo, empresa) => {
    await quickAccredit(id);
    setTimeout(() => {
        printLabel(id, nombre, apellido,telefono, dni, profesion, cargo, empresa);
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