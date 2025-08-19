//FUNCIÓN PRINTLABEL MEJORADA CON VALIDACIÓN DE TAMAÑO QR
const printLabel = async (id, nombre, apellido, telefono, email, dni, profesion, cargo, empresa, redSocial) => {
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
            }
        }
        
        // Normalizar y limpiar datos
        const nombreCompleto = `${nombre || ''} ${apellido || ''}`.trim();
        const emailLimpio = (email || '').trim().substring(0, 50);
        const telefonoLimpio = (telefono || '').toString().replace(/[^\d\+\-\s]/g, '').trim();
        const empresaLimpia = (empresa || '').trim();
        const cargoLimpio = (cargo || '').trim();
        const redSocialLimpia = (redSocial || '').trim();
        
        // Verificar que tenemos al menos un nombre
        if (!nombreCompleto) {
            alert('Error: No se puede generar el código QR sin nombre');
            return;
        }

        // 🔥 VERIFICAR CONFIG DEL QR
        const config = eventData?.configuracionJson ? JSON.parse(eventData.configuracionJson) : {};
        if (config.mostrarQR === false) {

            const nombreCompleto = `${nombre || ''} ${apellido || ''}`.trim();
            const etiquetaSinQR = `
            <div style="width: 90mm; height: 26mm; font-family: Arial, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; margin: 0; padding: 4mm 3mm; box-sizing: border-box;">
                <div style="font-weight: bold; font-size: 18pt; margin-bottom: 2mm; text-align: center;">${nombreCompleto}</div>
                ${empresa ? `<div style="font-size: 14pt; margin-bottom: 1mm; text-align: center;">${empresa.length > 45 ? empresa.substring(0, 45) + '...' : empresa}</div>` : ''}
                ${cargo ? `<div style="font-size: 12pt; text-align: center;">${cargo.length > 35 ? cargo.substring(0, 35) + '...' : cargo}</div>` : ''}
            </div>`;

            const printWindow = window.open('', '', 'width=600,height=400');
            printWindow.document.write(`<!DOCTYPE html><html><head><title>Etiqueta</title><style>@page{size:90mm 26mm;margin:0;}body{margin:0;padding:0;font-family:Arial,sans-serif;}</style></head><body>${etiquetaSinQR}</body></html>`);
            printWindow.document.close();
            printWindow.print();

            // Actualizar contadores y salir
            loadCounters();
            return;
        }
        
        // 🎯 CREAR vCard OPTIMIZADO CON VALIDACIÓN DE TAMAÑO
        const { vcard, version, estimatedSize } = createOptimizedVCard(nombreCompleto, empresaLimpia, emailLimpio, telefonoLimpio, redSocialLimpia, cargoLimpio);
        
        
        // 🚨 VALIDACIÓN CRÍTICA: Si el QR sigue siendo muy grande, usar versión mínima
        if (vcard.length > 300) {
            console.warn('⚠️ QR aún muy grande, forzando versión mínima');
            const minimalVCard = createMinimalVCard(nombreCompleto, telefonoLimpio);
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
// NUEVA FUNCIÓN: Imprimir etiqueta solo con ID
const printLabelById = async (id) => {
    try {
        // 1. Obtener datos del invitado desde la API
        const response = await authenticatedFetch(`${apiUrl}/GetById/${id}?eventId=${currentEventId}`);
        if (!response || !response.ok) {
            throw new Error('No se encontró el invitado');
        }
        
        const guest = await response.json();
        
        // 2. Llamar a la función printLabel original con los datos obtenidos
        await printLabel(
            guest.id,
            guest.nombre || '',
            guest.apellido || '',
            guest.telefono || '',
            guest.mail || '',
            guest.dni || '',
            guest.profesion || '',
            guest.cargo || '',
            guest.empresa || '',
            guest.redSocial || ''
        );
        
    } catch (error) {
        console.error('Error al imprimir etiqueta:', error);
        alert('Error al obtener los datos del invitado');
    }
};
// Nueva función: Guardar invitado editado Y imprimir
const saveEditedGuestAndPrint = async () => {
    if (!puedeHacerAccion('editar')) {
        alert('No tiene permisos para editar invitados');
        return;
    }
    
    // Usar la misma lógica que saveEditedGuest pero sin cerrar modal aún
    const id = document.getElementById('editGuestId').value;
    // ... resto del código igual que saveEditedGuest ...
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedGuest)
        });
        
        if (response?.ok) {
            $('#editGuestModal').modal('hide');
            
            // 🔥 IMPRIMIR DESPUÉS DE GUARDAR
            setTimeout(() => {
                printLabel(
                    id, 
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
            
            dataTable.ajax.reload(null, false);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar invitado');
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