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
//scanner

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
        searchGuestByIdCode(cleanData);

    // 4. Otro formato no reconocido
    } else {
        showScanError(`Código no reconocido. Formato: "${cleanData}". Longitud: ${cleanData.length}`);
    }
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
                        <button class="btn ${isAccredited ? 'btn-outline-primary' : 'btn-primary'} btn-sm" style="min-width:110px;" onclick="printLabelById(${guest.id})">
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

// Función para parsear DNI del código PDF417 argentino
const parseDniFromPdf417 = (data) => {
    try {

        // Buscar todos los números de 7 u 8 dígitos
        const matches = data.match(/\d{7,8}/g);

        if (matches && matches.length >= 2) {
            const dni = matches[1];
            return dni;
        }

        console.warn('No se encontró un DNI válido');
        return null;

    } catch (error) {
        console.error('Error al parsear PDF417:', error);
        return null;
    }
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
        // Opcional: mostrar en la UI el tipo de acceso
        // document.querySelector('.navbar-brand').innerHTML += ` <small class="badge bg-secondary">${accessInfo.tipoAcceso}</small>`;
    }
    });