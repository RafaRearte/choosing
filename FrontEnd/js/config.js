// Configuración centralizada de URLs de la aplicación
const CONFIG = {
    // URLs de las APIs
    API: {
        BASE_URL: "https://api.rafarearte.com/api",
        LIST: "https://api.rafarearte.com/api/List",
        EVENT: "https://api.rafarearte.com/api/Event"
    }
};

// Si necesitas diferentes URLs para desarrollo/producción, usa esto en su lugar:
// const CONFIG = {
//     API: {
//         BASE_URL: window.location.hostname === 'localhost'
//             ? "http://localhost:3000/api"
//             : "https://api.rafarearte.com/api",
//         get LIST() { return `${this.BASE_URL}/List` },
//         get EVENT() { return `${this.BASE_URL}/Event` }
//     }
// };
