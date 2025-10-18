$('#exportCsvBtn').on('click', function() {
    const url = `${apiUrl}/ExportCsv?eventId=${currentEventId}`;
    window.open(url, '_blank');
});


    // Variables para el modo escaneo
let scanModalInstance = null;
let scanTimeout = null;

// Guardar nuevo invitado (continuación)
const saveNewGuest = async () => {
        if (!puedeHacerAccion('editar')) {
        toast.warning('No tiene permisos para crear invitados');
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
    const infoAdicional = document.getElementById("newGuestInfoAdicional").value;

    // Validación básica
    if (!nombre || !apellido) {
        toast.warning("Por favor, complete los campos obligatorios: Nombre y Apellido.");
        return;
    }

    // Crear objeto con los datos del nuevo invitado
    const newGuest = {
        dni: dni || null,  // DNI ahora es string
        nombre,
        apellido,
        email: email,
        empresa,
        categoria,
        profesion,
        cargo,
        lugar,
        telefono,
        redSocial,
        infoAdicional,
        estaAcreditado: false,  // Ahora es booleano
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
            toast.success("Invitado agregado con éxito");
            $("#addGuestModal").modal("hide");
            document.getElementById("addGuestForm").reset();
            // ✅ OPTIMIZACIÓN: Solo recargar si es necesario (nuevo invitado requiere el ID del servidor)
            fetchGuests(); // Mantener por ahora para nuevos invitados
        } else {
            const errorText = await response.text();
            toast.error(`Error al crear invitado: ${errorText}`);
        }
    } catch (error) {
        console.error("Error al crear invitado:", error);
        toast.error("Hubo un error al intentar crear el invitado");
    }
};
// Función para eliminar un invitado
const deleteGuest = async () => {
        if (!puedeHacerAccion('editar')) {
        toast.warning('No tiene permisos para eliminar invitados');
        return;
    }
    // Obtener el ID del invitado a eliminar
    const id = document.getElementById('editGuestId').value;
    
    // Confirmar la eliminación
    const confirmDelete = await showDeleteConfirm('¿Está seguro que desea eliminar este invitado? Esta acción no se puede deshacer.');
    if (!confirmDelete) return;
    
    try {
        const response = await authenticatedFetch(`${apiUrl}/deleteById/${id}?eventId=${currentEventId}`, {
            method: 'DELETE'
        });
        
        if (!response) return; // Si hay redirección por token inválido
        
        if (response.ok) {
            toast.success('Invitado eliminado con éxito');
            $('#editGuestModal').modal('hide');
            fetchGuests(); // Recargar lista de invitados
        } else {
            const errorText = await response.text();
            toast.error(`Error al eliminar invitado: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al eliminar invitado:', error);
        toast.error('Ha ocurrido un error al intentar eliminar el invitado');
    }
};
// Función para cambiar el estado de acreditación (toggle)
const toggleAccreditStatus = async (id, currentStatus) => {
    if (!puedeHacerAccion('acreditar')) {
        toast.warning('No tiene permisos para acreditar invitados');
        return;
    }
        // Verificar fechas del evento
    const eventAccess = JSON.parse(localStorage.getItem('currentEventAccess') || '{}');
    if (!eventAccess.eventoEnFechas && eventAccess.tipoAcceso !== 'Admin') {
        toast.warning('El evento no está en fechas válidas para acreditación');
        return;
    }
    try {
        // Convertir el estado actual a un valor booleano
        const isCurrentlyAccredited = currentStatus === 'true' || currentStatus === true;

        // Llamar al endpoint con el nuevo estado (opuesto al actual)
        const newStatus = !isCurrentlyAccredited;

        const response = await authenticatedFetch(`${apiUrl}/updateAccreditStatusById/${id}?eventId=${currentEventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estaAcreditado: newStatus })
        });
        
        if (!response) return; // Si hay redirección por token inválido
        
        if (response.ok) {
            // ✅ OPTIMIZACIÓN: Actualizar solo localmente, NO recargar toda la tabla
            updateGuestLocallyAndTable(id, newStatus);
        } else {
            const errorText = await response.text();
            toast.error(`Error al cambiar estado de acreditación: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al cambiar estado de acreditación:', error);
        toast.error('Ha ocurrido un error al intentar cambiar el estado de acreditación');
    }
};
//scanner



// 🆕 NUEVA FUNCIÓN PARA BUSCAR POR IdCode
const searchGuestByIdCode = async (idCode) => {
    try {
        
        const response = await authenticatedFetch(`${apiUrl}/searchByIdCode?idCode=${encodeURIComponent(idCode)}&eventId=${currentEventId}`);
        
        if (!response || !response.ok) {
            showScanError(`No se encontró invitado con el código: ${idCode}`);
            return;
        }
        
        const guest = await response.json();
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
            toast.success('Invitado acreditado exitosamente');
            // ✅ OPTIMIZACIÓN: Actualizar solo localmente
            // Necesitamos obtener el ID del invitado desde la respuesta
            const result = await response.json();
            updateGuestLocallyAndTable(result.id || result.guestId, true); // true = acreditado
            closeScanModal();
        } else {
            toast.error('Error al acreditar invitado');
        }
    } catch (error) {
        console.error('Error:', error);
        toast.error('Error al acreditar invitado');
    }
};

// Función para guardar los cambios del invitado editado
const saveEditedGuest = async () => {
    if (!puedeHacerAccion('editar')) {
        toast.warning('No tiene permisos para editar invitados');
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
    const infoAdicional = document.getElementById('editGuestInfoAdicional').value;
    const estaAcreditado = document.getElementById('editGuestAcreditado').checked;

    // Validación básica
    if (!nombre || !apellido) {
        toast.warning('Por favor complete los campos obligatorios: Nombre y Apellido');
        return;
    }

    // Crear objeto con los datos actualizados
    const updatedGuest = {
        id: parseInt(id),
        dni: dni || null,  // DNI ahora es string
        nombre: nombre,
        apellido: apellido,
        email: email,
        empresa: empresa,
        categoria: categoria,
        profesion: profesion,
        cargo: cargo,
        lugar: lugar,
        telefono: telefono,
        redSocial: redSocial,
        infoAdicional: infoAdicional,
        estaAcreditado: estaAcreditado,  // Ahora es booleano
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
            toast.success('Invitado actualizado con éxito');
            $('#editGuestModal').modal('hide');
            // ✅ OPTIMIZACIÓN: Actualizar localmente en lugar de recargar todo
            updateGuestDataLocally(parseInt(id), updatedGuest);
        } else {
            const errorText = await response.text();
            toast.error(`Error al actualizar invitado: ${errorText}`);
        }
    } catch (error) {
        console.error('Error al actualizar invitado:', error);
        toast.error('Ha ocurrido un error al intentar actualizar el invitado');
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



// Acreditación rápida
const quickAccredit = async (guestId) => {
    try {
        const response = await authenticatedFetch(`${apiUrl}/acreditarById/${guestId}?eventId=${currentEventId}`, {
            method: 'PUT'
        });
        
        if (response && response.ok) {
            // ✅ OPTIMIZACIÓN: Actualizar solo localmente
            updateGuestLocallyAndTable(guestId, true); // true = acreditado
            closeScanModal();
        } else {
            toast.error('Error al acreditar invitado');
        }
    } catch (error) {
        console.error('Error:', error);
        toast.error('Error al acreditar invitado');
    }
};




// ✅ FUNCIÓN DE OPTIMIZACIÓN: Actualizar invitado localmente sin recargar tabla
const updateGuestLocallyAndTable = (guestId, newStatus) => {
    try {
        const id = parseInt(guestId);
        
        // 1. Actualizar en cache local allGuests
        const guest = allGuests.find(g => g.id === id);
        if (guest) {
            guest.estaAcreditado = newStatus;
            guest.fechaAcreditacion = newStatus ? new Date().toISOString() : null;
            
            // 2. Actualizar localStorage
            localStorage.setItem(`allGuests_${currentEventId}`, JSON.stringify(allGuests));
            
            // 3. Actualizar SOLO esa fila en la tabla
            const table = $('#invitadosTable').DataTable();
            const rowNode = table.rows().nodes().to$().find(`button[data-id="${id}"]`).closest('tr');
            
            if (rowNode.length) {
                const rowData = table.row(rowNode).data();
                rowData.estaAcreditado = newStatus;
                rowData.fechaAcreditacion = guest.fechaAcreditacion;
                table.row(rowNode).data(rowData).draw(false);
            }
            
            // 4. Actualizar contadores (instantáneo)
            updateCountersFromCache();
        }
    } catch (error) {
        console.error('Error actualizando localmente:', error);
        // Fallback: recargar todo si hay error
        fetchGuests();
    }
};

// Función para actualizar contadores desde cache local
const updateCountersFromCache = () => {
    if (!allGuests || allGuests.length === 0) return;
    
    const totalGuests = allGuests.length;
    const accreditedGuests = allGuests.filter(guest => guest.estaAcreditado > 0).length;
    const notAccreditedGuests = totalGuests - accreditedGuests;
    
    document.getElementById("totalGuests").textContent = `Invitados: ${totalGuests}`;
    document.getElementById("accredited").textContent = `Acreditados: ${accreditedGuests}`;
    document.getElementById("notAccredited").textContent = `No acreditados: ${notAccreditedGuests}`;
    
    // El contador de nuevos se mantiene igual (requiere endpoint específico)
};

// Función para actualizar datos completos de un invitado localmente
const updateGuestDataLocally = (guestId, updatedGuestData) => {
    try {
        // 1. Actualizar en cache local
        const guestIndex = allGuests.findIndex(g => g.id === guestId);
        if (guestIndex !== -1) {
            allGuests[guestIndex] = { ...allGuests[guestIndex], ...updatedGuestData };
            
            // 2. Actualizar localStorage
            localStorage.setItem(`allGuests_${currentEventId}`, JSON.stringify(allGuests));
            
            // 3. Actualizar fila en tabla
            const table = $('#invitadosTable').DataTable();
            const rowNode = table.rows().nodes().to$().find(`button[data-id="${guestId}"]`).closest('tr');
            
            if (rowNode.length) {
                table.row(rowNode).data(allGuests[guestIndex]).draw(false);
            }
            
            // 4. Actualizar contadores
            updateCountersFromCache();
        }
    } catch (error) {
        console.error('Error actualizando datos localmente:', error);
        // Fallback: recargar todo
        fetchGuests();
    }
};

// Agregar eventos para botón del modal
document.addEventListener("DOMContentLoaded", function() {
    // Botón para abrir el modal de nuevo invitado
    document.querySelectorAll('.open-add-guest-btn').forEach(btn => {
        btn.addEventListener('click', openAddGuestModal);
    });

    // Ya no verificamos eventAccess aquí
    // Los organizadores/admins tienen acceso automático vía Auth.js
    const currentEventId = localStorage.getItem('currentEventId');
    const eventAccess = localStorage.getItem('currentEventAccess');
    
    // Configurar permisos en la UI
    configurarElementosSegunPermisos();
    
    // Mostrar tipo de acceso en algún lugar (opcional)
    const accessInfo = JSON.parse(eventAccess || '{}');
    if (accessInfo.tipoAcceso) {
        // Opcional: mostrar en la UI el tipo de acceso
        // document.querySelector('.navbar-brand').innerHTML += ` <small class="badge bg-secondary">${accessInfo.tipoAcceso}</small>`;
    }
    });