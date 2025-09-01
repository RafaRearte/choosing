const VERSION = '1.0.6';
const CACHE_NAME = `choosing-v${VERSION}`;
const STATIC_CACHE = `choosing-static-v${VERSION}`;
const API_CACHE = `choosing-api-v${VERSION}`;

// ✅ SOLO ARCHIVOS QUE SÍ EXISTEN (basado en tu ls -la)
const STATIC_FILES = [
  // HTML Pages ✅ CONFIRMADOS
  '/',
  '/Index.html',                    // ✅ Existe
  '/acreditacion-offline.html',     // ✅ Existe
  '/admin-panel.html',              // ✅ Existe
  '/etiqueta.html',                 // ✅ Existe
  '/event-selection.html',          // ✅ Existe
  '/login.html',                    // ✅ Existe
  '/offline.html',                  // ✅ Existe
  '/print-labels.html',             // ✅ Existe
  '/stats.html',                    // ✅ Existe
  
  // JS Files ✅ CONFIRMADOS (js/ folder)
  '/js/actions.js',                 // ✅ Existe
  '/js/core.js',                    // ✅ Existe
  '/js/data.js',                    // ✅ Existe
  '/js/main.js',                    // ✅ Existe
  '/js/modals.js',                  // ✅ Existe
  '/js/print.js',                   // ✅ Existe
  '/js/pwa.js',                     // ✅ Existe
  '/js/scanner.js',                 // ✅ Existe
  '/js/table.js',                   // ✅ Existe
  
  // Images ✅ CONFIRMADOS
  '/images/icon.png',               // ✅ Existe
  // ❌ REMOVIDOS: icon-512.png, icon-180.png (no existen)
  
  // Manifest
  '/manifest.json',
  
  // External CDN Resources (críticos)
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css',
  'https://cdn.datatables.net/1.13.5/css/jquery.dataTables.min.css',
  'https://code.jquery.com/jquery-3.6.0.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js',
  'https://cdn.datatables.net/1.13.5/js/jquery.dataTables.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/print-js/1.6.0/print.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/print-js/1.6.0/print.min.js',
  'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'
];

// ❌ REMOVIDOS todos los archivos que NO EXISTEN:
// '/script-admin.js', '/script-event-selection.js', '/script-login.js', 
// '/script-stats.js', '/script-registro.js', '/script-offline.js',
// '/scriptindex.js', '/registro-evento.html', '/images/icon-512.png', 
// '/images/icon-180.png'

// 🎯 APIs DE TU SISTEMA CHOOSING
const API_PATTERNS = [
  '/api/List/GetAll',
  '/api/List/GetPaginated', 
  '/api/List/GetCounters',
  '/api/List/GetAcreditados',
  '/api/List/GetNoAcreditados',
  '/api/List/GetNuevos',
  '/api/Event/GetAll',
  '/api/Event/GetActive'
];

// 📱 INSTALACIÓN DEL SERVICE WORKER
self.addEventListener('install', event => {
  console.log('🚀 SW: Instalando Choosing PWA...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 SW: Cacheando archivos estáticos...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ SW: Choosing PWA instalada correctamente');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ SW: Error instalando Choosing PWA:', error);
      })
  );
});

// ⚡ ACTIVACIÓN
self.addEventListener('activate', event => {
  console.log('⚡ SW: Activando Choosing PWA...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('🗑️ SW: Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('🎯 SW: Choosing PWA activada y lista');
      return self.clients.claim();
    })
  );
});

// 🌐 INTERCEPTAR REQUESTS
self.addEventListener('fetch', event => {
  const request = event.request;
  
  // 🎯 ESTRATEGIA 1: ARCHIVOS ESTÁTICOS (Cache First)
  if (isStaticFile(request)) {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request)
            .then(response => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(STATIC_CACHE)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
              return response;
            })
            .catch(() => {
              if (request.destination === 'document') {
                return caches.match('/offline.html');
              }
            });
        })
    );
    return;
  }

  // 🎯 ESTRATEGIA 2: APIs DE CHOOSING (Network First)
  if (isChoosingAPI(request)) {
    if (request.method === 'GET') {
      event.respondWith(
        fetch(request)
          .then(response => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(API_CACHE)
                .then(cache => {
                  cache.put(request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            return caches.match(request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                return new Response(
                  JSON.stringify({ 
                    error: 'Sin conexión',
                    offline: true
                  }),
                  { status: 503, headers: { 'Content-Type': 'application/json' } }
                );
              });
          })
      );
      return;
    }
    
    // POST/PUT/DELETE: Solo Network
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ 
            error: 'Acción requiere conexión',
            offline: true
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // 🎯 ESTRATEGIA 3: TODO LO DEMÁS (Network Only)
  event.respondWith(fetch(request));
});

// 🔧 FUNCIONES AUXILIARES
function isStaticFile(request) {
  const url = request.url;
  
  // Archivos estáticos explícitos
  if (STATIC_FILES.some(file => url.includes(file))) return true;
  
  // Por extensión/tipo
  if (request.destination === 'document' || 
      request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'image' ||
      request.destination === 'font') return true;
      
  // CDN resources
  if (url.includes('cdn.jsdelivr.net') || 
      url.includes('cdnjs.cloudflare.com') ||
      url.includes('code.jquery.com')) return true;
      
  return false;
}

function isChoosingAPI(request) {
  const url = request.url;
  return API_PATTERNS.some(pattern => url.includes(pattern));
}

// 📨 MANEJO DE MENSAJES DESDE LA APP
self.addEventListener('message', event => {
  console.log('📧 SW: Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ status: 'cache_cleared' });
    });
  }
});

// 🔄 BACKGROUND SYNC (para cuando vuelva la conexión)
self.addEventListener('sync', event => {
  console.log('🔄 SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-choosing') {
    event.waitUntil(syncOfflineData());
  }
});

// 🔄 SINCRONIZACIÓN DE DATOS OFFLINE
async function syncOfflineData() {
  try {
    console.log('🔄 SW: Sincronizando datos offline de Choosing...');
    
    // Aquí puedes implementar la lógica para sincronizar
    // acreditaciones que se hicieron offline
    const offlineData = await getOfflineAccreditations();
    
    if (offlineData.length > 0) {
      for (const accreditation of offlineData) {
        try {
          const response = await fetch('/api/List/Acreditar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accreditation)
          });
          
          if (response.ok) {
            await removeFromOfflineQueue(accreditation.id);
            console.log('✅ SW: Acreditación sincronizada:', accreditation.id);
          }
        } catch (error) {
          console.error('❌ SW: Error sincronizando acreditación:', error);
        }
      }
    }
    
    console.log('✅ SW: Sincronización completada');
  } catch (error) {
    console.error('❌ SW: Error en sincronización:', error);
  }
}

// 📱 PUSH NOTIFICATIONS (para updates del evento)
self.addEventListener('push', event => {
  console.log('📱 SW: Push notification recibida');
  
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'Nueva actualización en el evento',
    icon: '/images/icon.png',
    badge: '/images/icon.png',
    vibrate: [200, 100, 200],
    tag: 'choosing-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open_app',
        title: 'Abrir App',
        icon: '/images/icon.png'
      },
      {
        action: 'dismiss',
        title: 'Cerrar'
      }
    ],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    }
  };

  event.waitUntil(
    self.registration.showNotification('Sistema Choosing', options)
  );
});

// 📱 CLICKS EN NOTIFICACIONES
self.addEventListener('notificationclick', event => {
  console.log('📱 SW: Click en notificación:', event.action);
  event.notification.close();

  if (event.action === 'open_app') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clients => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clients) {
          if (client.url.includes(location.origin)) {
            return client.focus();
          }
        }
        // Si no, abrir nueva ventana
        return clients.openWindow(event.notification.data.url || '/');
      })
    );
  }
});

// 🔧 FUNCIONES AUXILIARES PARA OFFLINE DATA
async function getOfflineAccreditations() {
  // Implementar según tu estrategia de storage offline
  // Puede usar IndexedDB, localStorage, etc.
  return [];
}

async function removeFromOfflineQueue(id) {
  // Implementar limpieza de queue offline
  console.log('🗑️ SW: Removiendo de queue offline:', id);
}