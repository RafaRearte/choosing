// Función para mostrar modal de configuración unificado
function mostrarModalConfiguracion(evento) {
    // Guardar el eventoId en el botón para usarlo después
    document.getElementById('saveConfigBtn').setAttribute('data-event-id', evento.id);
    
    // Cargar configuración usando la nueva función centralizada
    cargarConfiguracionModal(evento.id);
    
    // Mostrar el modal
    const modalInstance = new bootstrap.Modal(document.getElementById('configModal'));
    modalInstance.show();
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