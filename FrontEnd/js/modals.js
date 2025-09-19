
// Función para abrir el modal de nuevo invitado con configuración adecuada
const openAddGuestModal = () => {
    // Restablecer el formulario
    document.getElementById("addGuestForm").reset();
    
    // Configurar los campos visibles según el evento actual
    configurarCamposModal('new', eventData.configuracionJson ? JSON.parse(eventData.configuracionJson) : {});
    
    // Mostrar el modal
    $('#addGuestModal').modal('show');
};