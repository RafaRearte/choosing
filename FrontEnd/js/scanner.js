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