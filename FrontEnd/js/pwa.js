
/**
 * 🚀 PWA MANAGER COMPLETO
 */

// Variables globales PWA
let deferredPrompt;
let isInstalled = false;
let swRegistration = null;

// Detectar si ya está instalada como app
if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
  isInstalled = true;
  document.body.classList.add('pwa-installed');
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js');
      
      // Manejo de actualizaciones
      swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateAvailable();
          }
        });
      });
      
    } catch (error) {
      console.error('❌ SW: Error registrando Service Worker:', error);
    }
  });
}

// Capturar evento de instalación PWA
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  if (!isInstalled) {
    showInstallPrompt();
  }
});

// Detectar instalación exitosa
window.addEventListener('appinstalled', (evt) => {
  isInstalled = true;
  hideInstallPrompt();
  showNotification(
    '¡App instalada!', 
    'La app se instaló correctamente en tu dispositivo', 
    'success'
  );
});

// Mostrar prompt de instalación
function showInstallPrompt() {
  if (isInstalled || !deferredPrompt) return;
  
  if (!document.getElementById('pwa-install-banner')) {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'alert alert-primary position-fixed';
    banner.style.cssText = `
      top: 0; 
      left: 0; 
      right: 0; 
      z-index: 1060;
      border-radius: 0;
      margin: 0;
      background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%);
      border: none;
      color: white;
    `;
    
    banner.innerHTML = `
      <div class="container d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          <i class="bi bi-download me-2"></i>
          <span><strong>¿Instalar como app?</strong> Funciona offline y acceso rápido</span>
        </div>
        <div>
          <button type="button" class="btn btn-light btn-sm me-2" onclick="installPWA()">
            Instalar
          </button>
          <button type="button" class="btn-close btn-close-white" onclick="hideInstallPrompt()"></button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Auto-hide después de 10 segundos
    setTimeout(hideInstallPrompt, 10000);
  }
}

// Instalar PWA
async function installPWA() {
  if (!deferredPrompt) {
    showNotification('Error', 'No se puede instalar en este momento', 'warning');
    return;
  }
  
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
  
    
    deferredPrompt = null;
    hideInstallPrompt();
    
  } catch (error) {
    console.error('❌ PWA: Error durante instalación:', error);
  }
}

// Ocultar prompt de instalación
function hideInstallPrompt() {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.style.animation = 'slideUp 0.3s ease-in forwards';
    setTimeout(() => {
      if (banner.parentNode) banner.remove();
    }, 300);
  }
}

// Mostrar aviso de actualización
function showUpdateAvailable() {
  const updateBanner = document.createElement('div');
  updateBanner.className = 'alert alert-info position-fixed';
  updateBanner.style.cssText = `
    bottom: 20px; 
    right: 20px; 
    z-index: 1050;
    max-width: 350px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  updateBanner.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi bi-arrow-clockwise me-2"></i>
      <div class="flex-grow-1">
        <strong>¡Nueva versión!</strong><br>
        <small>Hay mejoras disponibles</small>
      </div>
    </div>
    <div class="mt-2">
      <button class="btn btn-sm btn-primary me-2" onclick="updateApp()">
        Actualizar
      </button>
      <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;
  
  document.body.appendChild(updateBanner);
  
  setTimeout(() => {
    if (updateBanner.parentNode) updateBanner.remove();
  }, 15000);
}

// Actualizar app
async function updateApp() {
  if (!swRegistration || !swRegistration.waiting) {
    window.location.reload(true);
    return;
  }
  
  try {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      showNotification('Actualizando...', 'La app se está actualizando', 'info');
      setTimeout(() => window.location.reload(), 1000);
    });
    
  } catch (error) {
    console.error('❌ PWA: Error actualizando:', error);
    window.location.reload(true);
  }
}

// Manejo de conexión
window.addEventListener('online', () => {
  showNotification('Conexión restaurada', 'Sincronizando datos...', 'success');
  
  // Trigger background sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
      return registration.sync.register('background-sync-choosing');
    });
  }
  
  // Recargar datos si existe la función
  if (typeof loadCounters === 'function') {
    setTimeout(loadCounters, 1000);
  }
});

window.addEventListener('offline', () => {
  showNotification(
    'Sin conexión', 
    'La app funciona offline. Los cambios se sincronizarán automáticamente.', 
    'warning'
  );
});

// Sistema de notificaciones
function showNotification(title, message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${getBootstrapColorClass(type)} position-fixed`;
  toast.style.cssText = `
    top: 20px; 
    right: 20px; 
    z-index: 1060; 
    min-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  
  const iconClass = getNotificationIcon(type);
  
  toast.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi ${iconClass} me-2"></i>
      <div class="flex-grow-1">
        <strong>${title}</strong><br>
        <small>${message}</small>
      </div>
      <button type="button" class="btn-close ms-2" onclick="this.parentElement.parentElement.remove()"></button>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 5000);
}

// Helpers para notificaciones
function getBootstrapColorClass(type) {
  const colors = {
    'success': 'success',
    'error': 'danger', 
    'warning': 'warning',
    'info': 'info'
  };
  return colors[type] || 'info';
}

function getNotificationIcon(type) {
  const icons = {
    'success': 'bi-check-circle-fill',
    'error': 'bi-exclamation-triangle-fill',
    'warning': 'bi-exclamation-triangle-fill', 
    'info': 'bi-info-circle-fill'
  };
  return icons[type] || 'bi-info-circle-fill';
}

// Shortcuts de teclado
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + I para instalar
  if ((e.ctrlKey || e.metaKey) && e.key === 'i' && deferredPrompt && !isInstalled) {
    e.preventDefault();
    installPWA();
  }
  
  // Ctrl/Cmd + Shift + R para force refresh
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      }).then(() => {
        window.location.reload(true);
      });
    }
  }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('pwa-enabled');
  
  if (isInstalled) {
    const installButtons = document.querySelectorAll('[data-pwa-hide-when-installed]');
    installButtons.forEach(btn => btn.style.display = 'none');
  }
});

// API global para usar desde tu app
window.AppPWA = {
  clearCache: async function() {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      showNotification('Cache limpiado', 'El cache se limpió correctamente', 'success');
      return true;
    }
    return false;
  },
  
  forceUpdate: function() {
    updateApp();
  },
  
  isInstalled: function() {
    return isInstalled;
  },
  
  requestInstall: function() {
    if (deferredPrompt && !isInstalled) {
      installPWA();
    } else {
      showNotification('No disponible', 'La app ya está instalada o no es posible', 'info');
    }
  }
};