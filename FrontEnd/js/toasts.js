/**
 * 🎯 SISTEMA DE TOASTS MODERNO
 * Reemplazo elegante para alert() toscos
 */

// Configuración de tipos de toast
const TOAST_TYPES = {
    success: {
        icon: 'bi-check-circle-fill',
        bgClass: 'bg-success',
        textClass: 'text-white'
    },
    error: {
        icon: 'bi-exclamation-triangle-fill',
        bgClass: 'bg-danger',
        textClass: 'text-white'
    },
    warning: {
        icon: 'bi-exclamation-triangle-fill',
        bgClass: 'bg-warning',
        textClass: 'text-dark'
    },
    info: {
        icon: 'bi-info-circle-fill',
        bgClass: 'bg-info',
        textClass: 'text-white'
    },
    loading: {
        icon: 'bi-arrow-clockwise',
        bgClass: 'bg-primary',
        textClass: 'text-white'
    }
};

// Contador para IDs únicos
let toastCounter = 0;

/**
 * Mostrar toast/notificación
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info', 'loading'
 * @param {number} duration - Duración en ms (0 = no auto-cerrar)
 * @param {string} title - Título opcional
 * @returns {string} ID del toast para poder cerrarlo manualmente
 */
function showToast(message, type = 'info', duration = 5000, title = null) {
    const toastId = `toast-${++toastCounter}`;
    const config = TOAST_TYPES[type] || TOAST_TYPES.info;
    
    // Crear elemento toast
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center ${config.bgClass} ${config.textClass} border-0 mb-2" 
             role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center">
                    <i class="bi ${config.icon} me-2 ${type === 'loading' ? 'toast-spin' : ''}"></i>
                    <div>
                        ${title ? `<strong>${title}</strong><br>` : ''}
                        ${message}
                    </div>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                        data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    // Agregar al contenedor
    document.getElementById('toast-container').insertAdjacentHTML('beforeend', toastHTML);
    
    // Inicializar Bootstrap Toast
    const toastElement = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastElement, {
        autohide: duration > 0,
        delay: duration
    });
    
    // Mostrar toast
    bsToast.show();
    
    // Auto-remover del DOM después de cerrarse
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
    
    return toastId;
}

/**
 * Cerrar toast específico
 * @param {string} toastId - ID del toast a cerrar
 */
function hideToast(toastId) {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        const bsToast = bootstrap.Toast.getInstance(toastElement);
        if (bsToast) {
            bsToast.hide();
        }
    }
}

/**
 * Cerrar todos los toasts
 */
function hideAllToasts() {
    const toasts = document.querySelectorAll('#toast-container .toast');
    toasts.forEach(toast => {
        const bsToast = bootstrap.Toast.getInstance(toast);
        if (bsToast) {
            bsToast.hide();
        }
    });
}

/**
 * Shortcuts para tipos comunes
 */
const toast = {
    success: (message, duration = 4000) => showToast(message, 'success', duration),
    error: (message, duration = 6000) => showToast(message, 'error', duration),
    warning: (message, duration = 5000) => showToast(message, 'warning', duration),
    info: (message, duration = 4000) => showToast(message, 'info', duration),
    loading: (message) => showToast(message, 'loading', 0), // No auto-cerrar
};

/**
 * Funciones de conveniencia para casos específicos
 */
function showLoadingToast(message) {
    return toast.loading(message);
}

function showSuccessToast(message) {
    return toast.success(message);
}

function showErrorToast(message) {
    return toast.error(message);
}

// Agregar CSS personalizado para animación de loading
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        .toast-spin {
            animation: toast-spin 1s linear infinite;
        }
        
        @keyframes toast-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .toast {
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .toast .btn-close-white {
            filter: brightness(0) invert(1);
        }
    `;
    document.head.appendChild(style);
}

/**
 * 🎯 SISTEMA DE CONFIRMACIÓN MODAL ELEGANTE
 * Reemplazo para confirm() tosco
 */

// Contador para IDs únicos de modals
let confirmCounter = 0;

/**
 * Mostrar modal de confirmación elegante
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje de confirmación
 * @param {string} type - Tipo: 'danger', 'warning', 'info'
 * @param {string} confirmText - Texto del botón confirmar (default: "Confirmar")
 * @param {string} cancelText - Texto del botón cancelar (default: "Cancelar")
 * @returns {Promise<boolean>} true si confirma, false si cancela
 */
function showConfirm(title, message, type = 'warning', confirmText = 'Confirmar', cancelText = 'Cancelar') {
    return new Promise((resolve) => {
        const confirmId = `confirm-modal-${++confirmCounter}`;
        
        const typeConfig = {
            danger: { headerClass: 'bg-danger text-white', buttonClass: 'btn-danger', icon: 'bi-exclamation-triangle-fill' },
            warning: { headerClass: 'bg-warning text-dark', buttonClass: 'btn-warning', icon: 'bi-exclamation-triangle-fill' },
            info: { headerClass: 'bg-info text-white', buttonClass: 'btn-info', icon: 'bi-info-circle-fill' }
        };
        
        const config = typeConfig[type] || typeConfig.warning;
        
        // Crear modal HTML
        const modalHTML = `
            <div class="modal fade" id="${confirmId}" tabindex="-1" aria-labelledby="${confirmId}Label" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header ${config.headerClass}">
                            <h5 class="modal-title d-flex align-items-center" id="${confirmId}Label">
                                <i class="bi ${config.icon} me-2"></i>
                                ${title}
                            </h5>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                            <button type="button" class="btn ${config.buttonClass}" id="${confirmId}-confirm">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Inicializar modal Bootstrap
        const modalElement = document.getElementById(confirmId);
        const bsModal = new bootstrap.Modal(modalElement);
        
        // Event listeners
        document.getElementById(`${confirmId}-confirm`).addEventListener('click', () => {
            bsModal.hide();
            resolve(true);
        });
        
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
            resolve(false);
        });
        
        // Mostrar modal
        bsModal.show();
    });
}

/**
 * Shortcuts para tipos comunes
 */
const confirm = {
    delete: (message = '¿Está seguro que desea eliminar este elemento?') => 
        showConfirm('Confirmar eliminación', message, 'danger', 'Eliminar', 'Cancelar'),
    
    action: (title, message) => 
        showConfirm(title, message, 'warning', 'Confirmar', 'Cancelar'),
    
    danger: (title, message) => 
        showConfirm(title, message, 'danger', 'Confirmar', 'Cancelar')
};

/**
 * Función de conveniencia para casos específicos
 */
function showDeleteConfirm(message) {
    return confirm.delete(message);
}

function showActionConfirm(title, message) {
    return confirm.action(title, message);
}