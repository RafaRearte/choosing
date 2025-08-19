let allGuests = []; // Cache local de todos los invitados
let offlineQueue = []; // Queue de acreditaciones pendientes
let isOnline = navigator.onLine;
let useOfflineMode = false; // Flag para controlar modo


$('#exportCsvBtn').on('click', function() {
    const url = `${apiUrl}/ExportCsv?eventId=${currentEventId}`;
    window.open(url, '_blank');
});

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
// Agregar evento al botón de cerrar sesión
document.getElementById('logoutButton').addEventListener('click', logout);
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

    let complexity = estimateQRComplexity(vcard);
    if (complexity.size !== 'xlarge') {
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

    
    complexity = estimateQRComplexity(vcard);
    if (complexity.size !== 'xlarge') {
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

    
    complexity = estimateQRComplexity(vcard);
    
    return { vcard, version: 'básico', estimatedSize: complexity.size };
};

// 🏷️ FUNCIÓN CON MÁRGENES VERTICALES ARREGLADOS
const generateAndPrintLabel = (vcard, nombreCompleto, empresa, cargo, version) => {
    try {
        // Generar QR con nivel de corrección apropiado
        const qr = qrcode(0, version === 'mínimo-forzado' ? 'L' : 'M');
        qr.addData(vcard);
        qr.make();
        
        // QR de tamaño normal
        const qrSvg = qr.createSvgTag(1.8, 1);
        
        // 🏷️ ETIQUETA CON MÁRGENES VERTICALES SEGUROS
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
    <!-- Contenedor del texto CENTRADO COMPLETAMENTE -->
    <div style="
        width: 60mm;
        max-width: 60mm;
        height: 22mm;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding-right: 3mm;
        flex-shrink: 0;
        text-align: center;
    ">
        <div style="
            font-weight: bold; 
            font-size: 16pt; 
            margin-bottom: 1mm; 
            line-height: 1.1;
            width: 100%;
        ">
            ${nombreCompleto}
        </div>
        
        ${empresa ? `<div style="
            font-size: 12pt; 
            margin-bottom: 0.5mm; 
            line-height: 1.1;
            color: #333;
            width: 100%;
        ">
            ${empresa.length > 35 ? empresa.substring(0, 35) + '...' : empresa}
        </div>` : ''}
        
        ${cargo ? `<div style="
            font-size: 11pt; 
            line-height: 1.1;
            color: #555;
            width: 100%;
        ">
            ${cargo.length > 25 ? cargo.substring(0, 25) + '...' : cargo}
        </div>` : ''}
    </div>
    
    <!-- Contenedor del QR FIJO CON LÍMITES ESTRICTOS -->
<div style="
    width: 25mm;
    min-width: 25mm;
    max-width: 25mm;
    height: 22mm;
    min-height: 22mm;
    max-height: 22mm;
    display: flex; 
    align-items: center; 
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
    margin-left: auto;
    margin-top: 2mm;
">
    <div style="
        width: 16mm;
        height: 16mm;
        max-width: 16mm;
        max-height: 16mm;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
    ">
        ${qrSvg}
    </div>
</div>
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

// Función para abrir el modal de nuevo invitado con configuración adecuada
const openAddGuestModal = () => {
    // Restablecer el formulario
    document.getElementById("addGuestForm").reset();
    
    // Configurar los campos visibles según el evento actual
    configurarCamposModal('new', eventData.configuracionJson ? JSON.parse(eventData.configuracionJson) : {});
    
    // Mostrar el modal
    $('#addGuestModal').modal('show');
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

    // Variables para el modo escaneo
let scanModalInstance = null;
let scanTimeout = null;
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