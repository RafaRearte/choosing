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
        optionalColumns.push({ data: 'dni', title: 'DNI' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }});
    }
    
    // Si el evento tiene email configurado, mostramos la columna
    if (config.mostrarEmail !== false) {
        optionalColumns.push({ data: 'mail', title: 'Email' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }});
    }
    
    // Si el evento tiene empresa configurada, mostramos la columna
    if (config.mostrarEmpresa !== false) {
        optionalColumns.push({ data: 'empresa', title: 'Empresa' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }});
    }
    
    // Si el evento tiene categoría configurada, mostramos la columna
    if (config.mostrarCategoria !== false) {
        optionalColumns.push({ data: 'categoria', title: 'Categoría' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }});
    }
    
    // Si el evento tiene profesión configurada, mostramos la columna
    if (config.mostrarProfesion !== false) {
        optionalColumns.push({ data: 'profesion', title: 'Profesión' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }});
    }
    
    // Si el evento tiene cargo configurado, mostramos la columna
    if (config.mostrarCargo !== false) {
        optionalColumns.push({ data: 'cargo', title: 'Cargo' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }});
    }
    // Si el evento tiene lugar configurado, mostramos la columna
    if (config.mostrarLugar !== false) {
        optionalColumns.push({ data: 'lugar', title: 'Lugar' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }});
    }
    // Después de mostrarLugar
    if (config.mostrarTelefono !== false) {
        optionalColumns.push({ data: 'telefono', title: 'Teléfono' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }});
    }
    // 🆕 NUEVA COLUMNA RED SOCIAL
    if (config.mostrarRedSocial !== false) {
        optionalColumns.push({ data: 'redSocial', title: 'Red Social' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }});
    }
    // Si el evento tiene días específicos configurados, mostramos las columnas
    if (config.mostrarDias !== false) {
        optionalColumns.push(
            { data: 'dayOne', title: 'Día 1' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }},
            { data: 'dayTwo', title: 'Día 2' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }},
            { data: 'dayThree', title: 'Día 3' ,
        defaultContent: '', // 🔥 AGREGAR ESTO
        render: function(data, type, row) {
            return data || ''; // 🔥 MANEJAR NULLS
        }}
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
            actions += `<button type="button" class="btn btn-secondary btn-sm" onclick="printLabelById(${data.id})">Etiqueta</button>`;
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
    processing: false,          // ← CAMBIAR a false
    serverSide: false,          // ← CAMBIAR a false
    data: allGuests,            // ← AGREGAR esta línea (reemplaza todo el bloque ajax)
    pageLength: 25,
        scrollY: "60vh",  // 🔥 ALTURA FIJA PARA SCROLL
        scrollCollapse: true,  // 🔥 PERMITIR COLAPSAR SCROLL
        scrollX: true,  // 🔥 PERMITIR SCROLL HORIZONTAL
        lengthMenu: [25, 50, 100, 200],  // 🔥 OPCIONES DE PAGINACIÓN
        paging: true,  // 🔥 HABILITAR PAGINACIÓN
        pagingType: "simple_numbers",  // 🔥 NAVEGACIÓN COMPLETA
        language: {
            paginate: {
                    previous: "<",
                    next: ">"
                },
                infoFiltered: "(filtrado de _MAX_)",
                lengthMenu: "Mostrar _MENU_",
                search: "Buscar: ",
                info: "Mostrando _START_ a _END_ de _TOTAL_"
                    },
        dom: 
"<'row mb-3'<'col-12 d-flex justify-content-center'f>>" + // búsqueda centrada y arriba
"<'row'<'col-12'tr>>" + // tabla
"<'row mt-3'<'col-md-4'l><'col-md-4 text-center'i><'col-md-4 d-flex justify-content-center flex-wrap'p>>",
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