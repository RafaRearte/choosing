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
    
    // Columnas opcionales basadas en la configuración del evento y presencia de datos
    const optionalColumns = [];
    
    // Obtener la configuración del evento o usar valores predeterminados
    const config = eventData.configuracion || {};
    
    // Función helper para verificar si una columna tiene datos
    const columnHasData = (fieldName) => {
        if (!eventData || !fieldName) return false;
        // Ver si al menos un invitado tiene datos en este campo
        return true; // Por ahora asumimos que puede haber datos
    };
    
    // Si el evento tiene DNI configurado y hay datos, mostramos la columna
    if (config.mostrarDni !== false && columnHasData('dni')) {
        optionalColumns.push({ data: 'dni', title: 'DNI' });
    }
    
    // Si el evento tiene email configurado y hay datos, mostramos la columna
    if (config.mostrarEmail !== false && columnHasData('mail')) {
        optionalColumns.push({ data: 'mail', title: 'Email' });
    }
    
    // Si el evento tiene empresa configurada y hay datos, mostramos la columna
    if (config.mostrarEmpresa !== false && columnHasData('empresa')) {
        optionalColumns.push({ data: 'empresa', title: 'Empresa' });
    }
    
    // Si el evento tiene categoría configurada y hay datos, mostramos la columna
    if (config.mostrarCategoria !== false && columnHasData('categoria')) {
        optionalColumns.push({ data: 'categoria', title: 'Categoría' });
    }
    
    // Si el evento tiene días específicos configurados y hay datos, mostramos las columnas
    if (config.mostrarDias !== false && (columnHasData('dayOne') || columnHasData('dayTwo'))) {
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
            // Verificar si el invitado está acreditado
            const isAccredited = data.acreditado > 0;
            
            return `
                <div class="d-flex gap-1">
                    <button type="button" class="btn btn-primary btn-sm" onclick="openEditModal(${data.id})">
                        Info
                    </button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="printLabel('${data.nombre}', '${data.apellido}', '${data.dni || ''}', '${data.profesion || ''}', '${data.cargo || ''}')">
                        Etiqueta
                    </button>
                    <button type="button" 
                        class="btn btn-sm ${isAccredited ? 'btn-success' : 'btn-outline-success'} rounded-circle toggle-accredit p-0 d-flex align-items-center justify-content-center" 
                        style="width: 28px; height: 28px;"
                        data-id="${data.id}" 
                        data-status="${isAccredited}"
                        title="${isAccredited ? 'Acreditado' : 'Acreditar'}">
                        <i class="bi ${isAccredited ? 'bi-check-lg' : 'bi-plus-lg'}" style="font-size: 0.8rem;"></i>
                    </button>
                </div>
            `;
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
});

// Función para cerrar sesión
const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('currentEventId');
    localStorage.removeItem('currentEventName');
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
        configurarCamposModal('edit', eventData.configuracion);
        
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
    
    // Días de asistencia
    document.getElementById(`${prefix}GuestDiasGroup`).style.display = 
        config?.mostrarDias !== false ? 'block' : 'none';
    
    // Información adicional
    document.getElementById(`${prefix}GuestInfoAdicionalGroup`).style.display = 
        config?.mostrarInfoAdicional !== false ? 'block' : 'none';
};

// Función para guardar los cambios del invitado editado
const saveEditedGuest = async () => {
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

// Guardar nuevo invitado
const saveNewGuest = async () => {
    // Obtener los valores del formulario
    const dni = document.getElementById("newGuestDni").value;
    const nombre = document.getElementById("newGuestNombre").value;
    const apellido = document.getElementById("newGuestApellido").value;
    const email = document.getElementById("newGuestEmail").value;
    const empresa = document.getElementById("newGuestEmpresa").value;
    const categoria = document.getElementById("newGuestCategoria").value;
    const profesion = document.getElementById("newGuestProfesion").value;
    const cargo = document.getElementById("newGuestCargo").value;
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
const printLabel = async (nombre, apellido, dni, profesion, cargo) => {
    try {
        // Primero acreditar al usuario (usando el ID en lugar del DNI)
        const response = await authenticatedFetch(`${apiUrl}/updateAccreditStatus/${dni}?eventId=${currentEventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ acreditado: 1 })
        });
        
        if (!response || !response.ok) {
            throw new Error('Error al acreditar al invitado');
        }
        
        // Luego imprimir la etiqueta
        const etiquetaHTML = `
        <div style="
            width: 90mm;
            height: 26mm;
            font-family: Arial, sans-serif;
            font-size: 16pt;
            line-height: 1.1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            margin: 0;
            padding: 0mm;
            box-sizing: border-box;
        ">
            <div style="font-weight: bold;">${nombre} ${apellido}</div>
            <div>${profesion || ''}</div>
            <div>${cargo || ''}</div>
            ${dni ? `<div>DNI: ${dni}</div>` : ''}
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
}

// Función para abrir el modal de nuevo invitado con configuración adecuada
const openAddGuestModal = () => {
    // Restablecer el formulario
    document.getElementById("addGuestForm").reset();
    
    // Configurar los campos visibles según el evento actual
    configurarCamposModal('new', eventData.configuracion);
    
    // Mostrar el modal
    $('#addGuestModal').modal('show');
};

// Agregar eventos para botón del modal
document.addEventListener("DOMContentLoaded", function() {
    // Botón para abrir el modal de nuevo invitado
    document.querySelectorAll('.open-add-guest-btn').forEach(btn => {
        btn.addEventListener('click', openAddGuestModal);
    });
});