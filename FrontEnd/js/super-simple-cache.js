/**
 * IndexedDB Cache súper simple para invitados
 */

class SuperSimpleCache {
    constructor() {
        this.dbName = 'ChoosingCache';
        this.version = 1;
        this.storeName = 'guests';
        this.db = null;
        console.log('🔧 SuperSimpleCache inicializada');
    }

    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Error opening IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializada');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear object store si no existe
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'eventId' });
                    store.createIndex('eventId', 'eventId', { unique: true });
                    console.log('📦 Object store creado');
                }
            };

            // Timeout de seguridad
            setTimeout(() => {
                reject(new Error('IndexedDB timeout'));
            }, 5000);
        });
    }

    async save(eventId, guests) {
        try {
            await this.init();
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const data = {
                eventId: eventId,
                guests: guests,
                timestamp: Date.now()
            };
            
            store.put(data);
            
            console.log(`💾 Cache guardado: ${guests.length} invitados`);
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    }

    async load(eventId) {
        try {
            await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readonly');
                const store = transaction.objectStore(this.storeName);
                const request = store.get(eventId);
                
                request.onsuccess = () => {
                    if (request.result) {
                        const age = Date.now() - request.result.timestamp;
                        const maxAge = 5 * 60 * 1000; // 5 minutos
                        
                        if (age < maxAge) {
                            console.log(`📦 Cache cargado: ${request.result.guests.length} invitados`);
                            resolve(request.result.guests);
                        } else {
                            console.log('🕒 Cache expirado');
                            resolve(null);
                        }
                    } else {
                        resolve(null);
                    }
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
                
                // Timeout
                setTimeout(() => {
                    resolve(null);
                }, 2000);
            });
        } catch (error) {
            console.error('Error loading cache:', error);
            return null;
        }
    }

    async clear(eventId) {
        try {
            await this.init();
            
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            if (eventId) {
                store.delete(eventId);
                console.log(`🗑️ Cache eliminado para evento ${eventId}`);
            } else {
                store.clear();
                console.log('🗑️ Cache completamente eliminado');
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

// Instancia global
const superSimpleCache = new SuperSimpleCache();

window.superSimpleCache = superSimpleCache;