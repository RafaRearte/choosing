# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🔐 Sistema de Autenticación Unificado (15 Oct 2025)

### Problema Resuelto

**Síntoma**: Los usuarios con rol `admin` u `organizador` eran redirigidos al login inmediatamente después de autenticarse exitosamente. Las páginas antiguas (`Index.html`, `event-selection.html`) también expulsaban usuarios autenticados.

**Causa raíz**: Inconsistencia en las claves de `localStorage` usadas para guardar el JWT:
- **Auth.js (módulo nuevo)** guardaba como: `choosing_token`
- **Código legacy** (admin-panel.html, event-selection.html, core.js) buscaba: `authToken`
- Resultado: Las páginas no encontraban el token → redirigían a login

### Solución Implementada

Se estandarizó el uso de `auth.js` como **módulo único de autenticación** en todo el frontend:

#### Archivos Modificados

| Archivo | Cambios Aplicados |
|---------|-------------------|
| `FrontEnd/js/auth.js` | ✅ Línea 112: Corregido redirect organizador → `/organizador-dashboard.html` |
| `FrontEnd/admin-panel.html` | ✅ Migrado a Auth.js: `authenticatedFetch()`, `logout()`, `requireRole(['admin'])` |
| `FrontEnd/event-selection.html` | ✅ Migrado a Auth.js: `authenticatedFetch()`, `logout()`, auth check |
| `FrontEnd/js/core.js` | ✅ Agregado soporte dual: Auth.js + fallback legacy para compatibilidad |
| `FrontEnd/Index.html` | ✅ Agregado `<script src="js/auth.js">` antes de `core.js` |

#### Patrón de Migración

**ANTES** (código legacy):
```javascript
// ❌ Acceso directo a localStorage con clave incorrecta
const token = localStorage.getItem('authToken');
if (!token) {
    window.location.href = 'login.html';
}

const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
};
```

**DESPUÉS** (usando Auth.js):
```javascript
// ✅ Uso del módulo Auth.js estandarizado
if (!Auth.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
}

const headers = {
    ...options.headers,
    ...Auth.getAuthHeaders()
};
```

#### Patrón de Fallback (core.js)

Para mantener compatibilidad con código que aún no migró:

```javascript
const authenticatedFetch = async (url, options = {}) => {
    // Si Auth.js está disponible, usarlo
    if (typeof Auth !== 'undefined') {
        if (!Auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return null;
        }
        const headers = {
            ...options.headers,
            ...Auth.getAuthHeaders()
        };
        // ... continuar con fetch
    } else {
        // Fallback para código legacy
        const token = localStorage.getItem('choosing_token');
        if (!token) {
            window.location.href = 'login.html';
            return null;
        }
        // ... continuar con fetch
    }
};
```

### Validación y Testing

**Usuarios de prueba creados**:
```bash
# Admin
Username: superadmin
Password: Admin123
ID: 3003

# Organizador
Username: org_test
Password: Org123
ID: 3004
```

**Flujos validados**:
1. ✅ Login admin → redirige a `/admin-panel.html` → NO expulsa
2. ✅ Login organizador → redirige a `/organizador-dashboard.html` → NO expulsa
3. ✅ Navegación a `Index.html` → verifica auth → NO expulsa
4. ✅ Navegación a `event-selection.html` → verifica auth → NO expulsa
5. ✅ Token expirado → redirige a login con mensaje

### Clave de localStorage Estándar

**IMPORTANTE**: A partir de ahora, SIEMPRE usar estas claves:

```javascript
// ✅ CORRECTO - Definido en auth.js
TOKEN_KEY: 'choosing_token'
USER_KEY: 'choosing_user'

// ❌ INCORRECTO - No usar
'authToken'
'token'
'jwt'
```

### Próximos Pasos

- [ ] Migrar páginas restantes a Auth.js (`stats.html`, `feedback.html`, `print-labels.html`)
- [ ] Eliminar código de fallback en `core.js` una vez completada la migración
- [ ] Agregar tests E2E para flujos de autenticación
- [ ] Implementar refresh token (actualmente solo access token con expiración 1h)

---

## 🎨 Rediseño Visual y UX del Frontend Público (18 Oct 2025)

### Objetivo

Unificar la estética visual de todas las páginas públicas (landing, eventos-publicos, evento-detalle) siguiendo el diseño de la landing page con:
- **Paleta de colores consistente**: Gradiente azul (#1e3c72 → #2a5298) reemplazando morado/violeta
- **Detección de autenticación**: Mostrar información del usuario cuando está logeado
- **Bootstrap Icons**: Uso de iconos vectoriales en lugar de emojis
- **Experiencia fluida**: Navegación coherente entre todas las páginas

### Páginas Rediseñadas

#### 1. `FrontEnd/eventos-publicos.html`

**Cambios aplicados**:
- ✅ **Paleta de colores**: Cambio completo de morado (#667eea, #764ba2) a azul (#1e3c72, #2a5298)
- ✅ **CSS Variables**: Implementadas `:root { --primary: #1e3c72; --secondary: #2a5298; }`
- ✅ **Background gradient**: `linear-gradient(135deg, #1e3c72 0%, #2a5298 60%, #7e8ba3 100%)`
- ✅ **Tarjetas de eventos modernizadas**:
  - Sombras suaves: `box-shadow: 0 10px 30px rgba(0,0,0,0.1)`
  - Hover effect: `transform: translateY(-10px)` con sombra aumentada
  - Bordes redondeados: `border-radius: 20px`
  - Bootstrap Icons: Reemplazados emojis por `<i class="bi bi-calendar-event"></i>`
- ✅ **Navbar dinámica con detección de usuario**:
  ```javascript
  if (Auth.isAuthenticated()) {
      const user = Auth.getUser();
      // Mostrar dropdown con nombre, badge de rol, link a dashboard, logout
  } else {
      // Mostrar "Iniciar Sesión"
  }
  ```
- ✅ **Badges de rol con colores**:
  - Admin: `bg-danger` (rojo)
  - Organizador: `bg-primary` (azul)
  - Comprador: `bg-success` (verde)
- ✅ **Barra de búsqueda rediseñada**: Estilo pill con sombra y foco mejorado
- ✅ **Info de eventos con iconos**: `bi-geo-alt-fill`, `bi-ticket-perforated-fill`

**Código clave agregado** (líneas 360-414):
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const authButtonsContainer = document.getElementById('authButtons');

    if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
        const user = Auth.getUser();
        const userName = user.nombre || user.username || 'Usuario';
        const tipoUsuario = user.tipoUsuario || 'usuario';

        // Determinar badge y dashboard según rol
        let badgeClass = 'bg-secondary';
        let dashboardUrl = '/landing.html';

        if (tipoUsuario === 'admin') {
            badgeClass = 'bg-danger';
            dashboardUrl = '/admin-panel.html';
        } else if (tipoUsuario === 'organizador') {
            badgeClass = 'bg-primary';
            dashboardUrl = '/organizador-dashboard.html';
        } else if (tipoUsuario === 'comprador') {
            badgeClass = 'bg-success';
        }

        // Renderizar dropdown con info de usuario
        authButtonsContainer.innerHTML = `
            <div class="dropdown">
                <a class="nav-link dropdown-toggle" href="#" ...>
                    <i class="bi bi-person-circle"></i> ${userName}
                    <span class="badge ${badgeClass} ms-1">${tipoUsuario}</span>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="${dashboardUrl}">
                        <i class="bi bi-speedometer2"></i> Dashboard
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()">
                        <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                    </a></li>
                </ul>
            </div>
        `;
    } else {
        authButtonsContainer.innerHTML = `
            <a class="nav-link" href="/login.html">
                <i class="bi bi-box-arrow-in-right"></i> Iniciar Sesión
            </a>
        `;
    }
});
```

#### 2. `FrontEnd/evento-detalle.html`

**Cambios aplicados**:
- ✅ **Misma paleta azul** que eventos-publicos.html
- ✅ **Bootstrap Icons agregado**: `<link rel="stylesheet" href="https://cdn.../bootstrap-icons@1.11.1/font/bootstrap-icons.css">`
- ✅ **Header del evento**: Icono `bi-calendar-event-fill` en lugar de emoji 🎭
- ✅ **Iconos en info cards**:
  - Fecha: `bi-calendar3`
  - Ubicación: `bi-geo-alt-fill`
  - Capacidad: `bi-people-fill`
  - Duración: `bi-clock-fill`
- ✅ **Info icons con gradiente**: `background: linear-gradient(135deg, var(--primary), var(--secondary))`
- ✅ **Tarjeta de compra rediseñada**:
  - Gradiente azul en lugar de verde
  - Sombra mejorada: `box-shadow: 0 10px 30px rgba(30, 60, 114, 0.3)`
  - Botón blanco con hover effect: `transform: translateY(-2px)`
- ✅ **Barra de progreso de capacidad dinámica**:
  ```javascript
  if (porcentajeDisponible > 50) {
      progressBar.style.background = 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)';
  } else if (porcentajeDisponible > 20) {
      progressBar.style.background = '#ffc107'; // Amarillo
  } else {
      progressBar.style.background = '#dc3545'; // Rojo
  }
  ```
- ✅ **Navbar con logo Choosing**: Link a `/landing.html` + botón "Volver a Eventos"
- ✅ **Mismo sistema de detección de usuario** que eventos-publicos.html
- ✅ **Botón de compra mejorado**: `<i class="bi bi-cart-fill me-2"></i>Comprar Entradas`

#### 3. `FrontEnd/landing.html` (completado en sesión anterior)

**Funcionalidad agregada**:
- ✅ Detección de usuario logeado en navbar
- ✅ Dropdown con nombre y dashboard según rol
- ✅ Botón "Iniciar Sesión" si no está logeado

### Patrón de Navbar Dinámica

Este patrón se repite en **eventos-publicos.html** y **evento-detalle.html**:

**HTML**:
```html
<nav class="navbar navbar-expand-lg navbar-light bg-light">
    <div class="container">
        <a class="navbar-brand" href="/landing.html">
            <i class="bi bi-star-fill me-2"></i>Choosing
        </a>
        <!-- ... -->
        <ul class="navbar-nav ms-auto">
            <li class="nav-item" id="authButtons">
                <!-- Dinamically populated by JS -->
            </li>
        </ul>
    </div>
</nav>
```

**JavaScript**:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const authButtonsContainer = document.getElementById('authButtons');

    if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
        // Mostrar dropdown con usuario
    } else {
        // Mostrar botón "Iniciar Sesión"
    }
});

function logout() {
    Auth.logout();
    window.location.href = '/landing.html';
}
```

### Paleta de Colores Estándar

**IMPORTANTE**: A partir de ahora, SIEMPRE usar estas variables CSS en páginas públicas:

```css
:root {
    --primary: #1e3c72;    /* Azul oscuro */
    --secondary: #2a5298;  /* Azul medio */
}

/* Gradientes */
background: linear-gradient(135deg, #1e3c72 0%, #2a5298 60%, #7e8ba3 100%); /* Fondo principal */
background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); /* Elementos */
```

**❌ NO USAR**:
- Morado/Violeta: `#667eea`, `#764ba2`
- Verde para cards principales (solo para badges de comprador)

### Iconos Bootstrap

**Iconos usados en el diseño**:
- `bi-star-fill`: Logo Choosing
- `bi-calendar-event`, `bi-calendar-event-fill`: Eventos
- `bi-geo-alt-fill`: Ubicación
- `bi-ticket-perforated-fill`, `bi-ticket-detailed`: Entradas
- `bi-people-fill`: Capacidad/Asistentes
- `bi-clock-fill`: Duración/Hora
- `bi-calendar3`: Fecha
- `bi-person-circle`: Usuario
- `bi-speedometer2`: Dashboard
- `bi-box-arrow-right`: Cerrar sesión
- `bi-box-arrow-in-right`: Iniciar sesión
- `bi-cart-fill`: Comprar
- `bi-arrow-left-circle`: Volver

### Consistencia Visual Lograda

| Página | Colores | Navbar Dinámica | Bootstrap Icons | Estado |
|--------|---------|----------------|-----------------|--------|
| `landing.html` | ✅ Azul | ✅ Sí | ✅ Sí | ✅ Completo |
| `eventos-publicos.html` | ✅ Azul | ✅ Sí | ✅ Sí | ✅ Completo |
| `evento-detalle.html` | ✅ Azul | ✅ Sí | ✅ Sí | ✅ Completo |
| `login.html` | ✅ Azul | ➖ N/A | ✅ Sí | ✅ Completo |
| `checkout.html` | ⚠️ Pendiente | ⚠️ Pendiente | ⚠️ Pendiente | 🔴 No existe |
| `mis-entradas.html` | ⚠️ Pendiente | ⚠️ Pendiente | ⚠️ Pendiente | 🔴 No existe |

### Flujo de Usuario Completado

```
Landing Page (landing.html)
    ↓ (Eventos públicos disponibles detectados)
Ver Eventos (eventos-publicos.html)
    ↓ (Click en tarjeta de evento)
Detalle del Evento (evento-detalle.html)
    ↓ (Click "Comprar Entradas")
[Si no está logeado] → Login (login.html) → [Vuelve al detalle]
[Si está logeado] → Checkout (checkout.html) ⚠️ PENDIENTE CREAR
```

### Próximos Pasos

- [ ] Crear `checkout.html` con mismo diseño azul y navbar dinámica
- [ ] Crear `mis-entradas.html` para que compradores vean sus QR codes
- [ ] Unificar diseño de dashboards (organizador, admin) con misma paleta
- [ ] Agregar animaciones de transición entre páginas
- [ ] Implementar modo oscuro (opcional)

---

## ⚡ Refactorizaciones Recientes (Diciembre 2025)

### Cambios Aplicados en Guest Model

**Campos renombrados para mejor semántica**:
- `Mail` → `Email` (string)
- `Acreditado` (int) → `EstaAcreditado` (bool)
- `HoraAcreditacion` → `FechaAcreditacion` (DateTime?)
- `Dni` (int) → `Dni` (string?) - Mayor flexibilidad para formatos internacionales

**Campos eliminados** (no se usaban):
- `DayOne`, `DayTwo`, `DayThree` - Lógica de días múltiples removida
- `CantEntradas` - Redundante, se maneja en tabla Compras

### Estandarización de DTOs

Todos los DTOs ahora usan sufijo `DTO` en **mayúsculas**:
- `AccreditStatusDto` → `AccreditStatusDTO`
- `PublicGuestRegistration` → `PublicGuestRegistrationDTO`

### Controllers Limpiados

- ❌ **Eliminado**: `MiControladorProtegido.cs` (controller de testing/ejemplo)
- ✅ **Mantenidos**: Todos los controllers productivos (Auth, Event, List, User, Compra, Feedback, Ping)

### Impacto en el Código

Los siguientes archivos fueron actualizados para reflejar estos cambios:
- `ListService.cs`, `ListRepository.cs` - Referencias a campos Guest
- `CompraService.cs` - Asignación de Email y Dni
- `EmailService.cs` - Uso de Email en lugar de Mail
- `ListController.cs` - Todos los endpoints con Guest
- `EventController.cs` - Contador de acreditados (línea 133)
- Todos los DTOs en `Domain/Dtos/`

**⚠️ IMPORTANTE**: Al trabajar con Guest, usar siempre `Email`, `EstaAcreditado` y `FechaAcreditacion` (no los nombres antiguos).

## Descripción del Proyecto

**Choosing** es una plataforma completa de gestión de eventos que permite a organizadores crear y gestionar eventos, acreditar asistentes mediante QR, y vender entradas. Los compradores pueden explorar eventos públicos, comprar entradas y ver sus códigos QR de acceso.

### Estado Actual del Proyecto

El proyecto está en **transición**:
- **ESTADO ACTUAL**: Sistema B2B básico (solo para organizadores con login directo)
- **ESTADO OBJETIVO**: Plataforma multi-rol con marketplace público de eventos

### Roles del Sistema

1. **🟨 PÚBLICO** (sin cuenta): Ver landing, explorar eventos públicos
2. **🔴 COMPRADOR/ESPECTADOR** (registro gratuito): Comprar entradas, ver QR, gestionar perfil
3. **🔵 ORGANIZADOR** (suscripción paga): Crear eventos, acreditar invitados, vender entradas, ver estadísticas
4. **🟢 ADMIN** (super usuario): Gestión completa del sistema

## Stack Tecnológico

- **Backend**: .NET 8 (ASP.NET Core Web API)
- **Base de Datos**: SQL Server
- **ORM**: Entity Framework Core 9.0.2
- **Autenticación**: JWT Bearer tokens con BCrypt + roles (`organizador`, `comprador`, `admin`)
- **Pagos**: MercadoPago (integración pendiente)
- **Email**: MailKit para invitaciones con QR
- **Frontend**: JavaScript Vanilla, Bootstrap 5, DataTables, Chart.js
- **PWA**: Service Worker para funcionalidad offline
- **Despliegue**: IIS en Windows Server VPS

## Comandos de Desarrollo

### Build y Ejecución
```bash
# Compilar el proyecto
dotnet build

# Ejecutar la aplicación (entorno Development)
dotnet run

# Restaurar paquetes NuGet
dotnet restore
```

### Gestión de Base de Datos
```bash
# Crear una nueva migración
dotnet ef migrations add <NombreMigracion>

# Aplicar migraciones a la base de datos
dotnet ef database update

# Revertir a una migración específica
dotnet ef database update <NombreMigracion>

# Eliminar la última migración (si no fue aplicada)
dotnet ef migrations remove

# Generar script SQL de las migraciones
dotnet ef migrations script
```

### Cadenas de Conexión
- `DefaultConnectionLocalMac`: Desarrollo local en macOS (Docker SQL Server puerto 1433)
- `DefaultConnectionLocalVps`: Conexión local al VPS
- `DefaultConnectionMacToVps`: Conexión remota al VPS

**⚠️ IMPORTANTE**: La cadena de conexión está hardcodeada en `DbHotelContext.cs:28`. Cambiar a DI en producción.

## Arquitectura

### Estructura del Backend

**Patrón arquitectónico**: Repository → Service → Controller (Clean Architecture)

```
/Controllers
  ├─ AuthController.cs ............ ✅ Login, registro (MODIFICAR: agregar tipos de usuario)
  ├─ EventController.cs ........... ✅ CRUD eventos (MODIFICAR: filtrar por organizador)
  ├─ ListController.cs ............ ✅ Gestión invitados/acreditación
  ├─ FeedbackController.cs ........ ✅ Feedback de eventos
  ├─ EntradasController.cs ........ ⚠️ CREAR (compra, webhook MercadoPago, validación QR)
  └─ OrganizadoresController.cs ... ⚠️ CREAR (perfil, plan, upgrade)

/Services
  ├─ Interfaces/
  │   ├─ IEventService.cs
  │   ├─ IListService.cs
  │   ├─ IEmailService.cs
  │   ├─ ITokenService.cs ......... (MODIFICAR: agregar claims de rol)
  │   ├─ IFeedbackService.cs
  │   ├─ IEntradaService.cs ....... ⚠️ CREAR
  │   └─ IOrganizadorService.cs ... ⚠️ CREAR
  │
  └─ Impl/ (implementaciones)

/Repository
  ├─ Interfaces/
  │   ├─ IEventRepository.cs
  │   ├─ IListRepository.cs
  │   ├─ IFeedbackRepository.cs
  │   ├─ IEntradaRepository.cs .... ⚠️ CREAR
  │   └─ IOrganizadorRepository.cs  ⚠️ CREAR
  │
  └─ Impl/ (implementaciones)

/Domain
  ├─ User.cs ...................... ✅ COMPLETADO FASE 1.1 (tipo_usuario, perfil completo, DNI, dirección)
  ├─ EventModel.cs ................ ✅ COMPLETADO FASE 1 (organizador_id, venta_publica, precio)
  ├─ Guest.cs ..................... ✅ COMPLETADO FASE 1.1 (CompradoPorUsuarioId, CompraId)
  ├─ Feedback.cs
  ├─ Organizador.cs ............... ✅ COMPLETADO FASE 1 (perfil empresa, plan, límites)
  ├─ Compra.cs .................... ✅ COMPLETADO FASE 1.1 (tracking transacciones, MercadoPago)
  ├─ ImagenEvento.cs .............. ⚠️ PENDIENTE (galería fotos evento)
  └─ LogActividad.cs .............. ⚠️ PENDIENTE (auditoría)
```

### Arquitectura de Entidades (Estado Actual - FASE 1.1)

**📐 Separación clara de responsabilidades**:

```
User (Usuarios)
├─ Autenticación: Username, Email, PasswordHash
├─ Perfil: Nombre, Apellido, DNI, Telefono, Dirección, FechaNacimiento
├─ Tipo: TipoUsuario (comprador/organizador/admin)
└─ Relaciones: 1:N Compras, 1:1 Organizador (si es organizador)

Organizador (Organizadores)
├─ UsuarioId → FK a User (1:1)
├─ Empresa: NombreEmpresa, CUIT, Dirección
├─ Plan: PlanSuscripcion (free/pro/enterprise), EventosPermitidos
└─ Relaciones: 1:N Eventos

Compra (Compras)  ◄── NUEVO EN FASE 1.1
├─ UsuarioId → FK a User (quien compra)
├─ EventoId → FK a Evento
├─ Transacción: MontoTotal, CantidadEntradas, FechaCompra
├─ Pago: Estado, MetodoPago, TransaccionId (MercadoPago), FechaPago
└─ Relaciones: 1:N Guests (invitados de esta compra)

Guest (invitados)
├─ EventoId → FK a Evento
├─ Datos personales: Nombre, Apellido, DNI (string), Email, Telefono
├─ CompradoPorUsuarioId → FK a User (nullable - NULL si invitado manual)
├─ CompraId → FK a Compra (nullable - NULL si invitado manual)
├─ Acreditación: EstaAcreditado (bool), FechaAcreditacion (DateTime?)
├─ Tracking: EsNuevo (bool), IdCode (string - para QR)
└─ Opcionales: Empresa, Cargo, Profesion, Categoria, Lugar, RedSocial, InfoAdicional
```

**Flujos soportados**:
1. ✅ User compra entrada para sí mismo → autocompleta datos desde perfil
2. ✅ User compra múltiples entradas → 1 Compra → N Guests
3. ✅ Organizador agrega invitados manualmente → Guest sin CompradoPorUsuarioId

### Cambios en Base de Datos

#### ✅ Tablas COMPLETADAS (FASE 1 + 1.1)

1. **`Usuarios`** (User):
   - ✅ TipoUsuario, Nombre, Apellido, Telefono, FechaRegistro, Activo, UltimoLogin (FASE 1)
   - ✅ Dni, Direccion, Ciudad, Provincia, CodigoPostal, FechaNacimiento (FASE 1.1)

2. **`Organizadores`** (FASE 1):
   - ✅ UsuarioId, NombreEmpresa, CuitCuil, Direccion, Provincia, Ciudad, CodigoPostal
   - ✅ PlanSuscripcion, EventosPermitidos, Activo

3. **`Eventos`** (FASE 1):
   - ✅ OrganizadorId, VentaPublica, PrecioEntrada, CapacidadMaxima
   - ✅ EntradasVendidas, Estado, ConfigTabla, ConfigEtiqueta

4. **`Compras`** (FASE 1.1 - NUEVO):
   - ✅ UsuarioId, EventoId, FechaCompra, CantidadEntradas, MontoTotal
   - ✅ Estado, MetodoPago, TransaccionId, FechaPago, NotasInternas

5. **`invitados`** (Guest - FASE 1.1):
   - ✅ CompradoPorUsuarioId, CompraId, FechaCreacion, Confirmado

#### ⚠️ Tablas PENDIENTES (FASES FUTURAS)

- **`imagenes_evento`**: Galería de fotos por evento
- **`logs_actividad`**: Auditoría de acciones (usuario, evento, acción, timestamp)

### Estructura del Frontend

**Ubicación**: `FrontEnd/` - archivos estáticos servidos por ASP.NET Core

#### 🟨 Páginas PÚBLICAS (sin autenticación)

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `landing.html` | ✅ EXISTE | Landing principal con hero, features, pricing, testimonios |
| `login.html` | ✅ EXISTE | Login unificado (agregar link a registro) |
| `sing-up.html` | ⚠️ CREAR | Registro con selector: Comprador (gratis) / Organizador (paga) |
| `eventos-publicos.html` | ⚠️ CREAR | Marketplace de eventos con filtros (fecha, ciudad, categoría) |
| `evento-detalle.html` | ⚠️ CREAR | Detalle del evento + botón comprar entrada |

#### 🔴 Páginas COMPRADOR (rol: comprador)

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `mis-entradas.html` | ⚠️ CREAR | Lista de entradas compradas con QR (modal ver QR, descargar PDF) |
| `comprador-perfil.html` | ⚠️ CREAR | Datos personales + historial de compras |
| `checkout.html` (o modal) | ⚠️ CREAR | Proceso de pago con MercadoPago |

#### 🔵 Páginas ORGANIZADOR (rol: organizador)

**Páginas EXISTENTES a modificar/renombrar:**

| Archivo Actual | Nuevo Nombre | Cambios Requeridos |
|----------------|--------------|-------------------|
| `Index.html` | `organizador-acreditar.html` | Validar acceso por organizador_id |
| `event-selection.html` | `organizador-eventos.html` | Filtrar solo MIS eventos, agregar botón "Crear Evento" |
| `admin-panel.html` | `organizador-config.html` | Configuración del evento (columnas, etiquetas, códigos) |
| `stats.html` | ✅ Mantener nombre | Agregar navbar organizador, validar acceso |
| `feedback.html` | ✅ Mantener nombre | Validar acceso por evento |
| `print-labels.html` | ✅ Mantener nombre | Validar acceso |

**Páginas NUEVAS a crear:**

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `organizador-dashboard.html` | ⚠️ CREAR | Home con métricas: total eventos, acreditaciones, ingresos |
| `organizador-entradas.html` | ⚠️ CREAR | Gestión de tickets vendidos (si venta_publica = true) |
| `organizador-perfil.html` | ⚠️ CREAR | Datos empresa, CUIT, dirección, teléfono |
| `organizador-plan.html` | ⚠️ CREAR | Plan actual (free/pro/enterprise), botón upgrade, historial pagos |

#### 🟢 Páginas ADMIN (rol: admin)

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `admin-panel.html` | ✅ EXISTE | Panel gestión actual (revisar y adaptar) |
| `admin-dashboard.html` | ⚠️ CREAR | Métricas globales: usuarios, organizadores, eventos, ingresos |
| `admin-usuarios.html` | ⚠️ CREAR | CRUD completo de usuarios |
| `admin-organizadores.html` | ⚠️ CREAR | Gestión de organizadores + planes |
| `admin-eventos.html` | ⚠️ CREAR | Ver todos los eventos del sistema |
| `admin-reportes.html` | ⚠️ CREAR | Exportar datos, métricas, logs |

#### 🟡 Páginas ESPECIALES

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `registro/` | ✅ EXISTE | Registro público sin login para anotarse como invitado |
| `offline.html` | ✅ EXISTE | Página PWA offline |

#### 🗑️ Archivos a ELIMINAR

- `etiqueta.html` (fusionar con print-labels)
- `acreditacion-offline.html` (redundante)

#### Módulos JavaScript (`FrontEnd/js/`)

| Archivo | Descripción |
|---------|-------------|
| `config.js` | Configuración centralizada de URLs API |
| `core.js` | Utilidades core y funciones cliente de API |
| `actions.js` | Acciones admin (agregar/editar/eliminar invitados) |
| `data.js` | Fetching de datos y gestión de estado |
| `table.js` | Integración DataTables con paginación server-side |
| `scanner.js` | Funcionalidad escaneo QR |
| `print.js` | Generación etiquetas impresora térmica |
| `pwa.js` | Funcionalidad Progressive Web App |
| `sw.js` | Service worker para offline |
| `super-simple-cache.js` | Mecanismo caché simple |

**⚠️ Agregar nuevos módulos JS:**
- `auth.js`: Gestión login/registro/logout, guardar JWT en localStorage
- `entradas.js`: Lógica compra entradas, checkout MercadoPago
- `organizador.js`: Lógica dashboard organizador, crear eventos
- `qr-generator.js`: Generación QR codes para entradas

### Nuevos Endpoints API Requeridos

#### EntradasController (⚠️ CREAR)

```
POST   /api/Entradas/crear-orden          - Crear orden compra (pre-pago)
POST   /api/Entradas/webhook               - Webhook MercadoPago (post-pago)
GET    /api/Entradas/mis-entradas          - Entradas del comprador logueado
POST   /api/Entradas/validar-qr            - Validar entrada por QR (organizador)
GET    /api/Entradas/evento/{eventoId}     - Todas las entradas de un evento
```

#### OrganizadoresController (⚠️ CREAR)

```
GET    /api/Organizadores/perfil           - Perfil del organizador logueado
PUT    /api/Organizadores/perfil           - Actualizar datos empresa
GET    /api/Organizadores/plan             - Plan actual y límites
POST   /api/Organizadores/upgrade          - Cambiar plan (genera pago MP)
```

#### AuthController (✏️ MODIFICAR)

```
POST   /api/Auth/registro                  - Registro con tipo_usuario (comprador/organizador)
POST   /api/Auth/login                     - Login (devolver rol en JWT)
```

#### EventController (✏️ MODIFICAR)

```
GET    /api/Event/mis-eventos              - Solo eventos del organizador logueado
GET    /api/Event/publicos                 - Solo eventos con venta_publica = true
POST   /api/Event/create                   - Validar organizador_id y eventos_permitidos
```

### Multi-tenancy mediante Eventos

- Todos los endpoints requieren `eventId` query parameter
- Los eventos tienen `organizador_id` (FK a organizadores)
- Validar acceso: el organizador solo puede ver/editar SUS eventos
- Códigos de acceso por evento:
  - `CodigoAcceso`: Registro público de invitados
  - `CodigoAdmin`: Acceso al panel de configuración
  - `CodigoStats`: Acceso a estadísticas
- `PermitirAccesoPostEvento`: Permite acceso después de la fecha de fin

### Autenticación y Autorización

**JWT con Roles**:
- Claim `tipo_usuario`: `organizador`, `comprador`, o `admin`
- Claim `userId`: ID del usuario
- Claim `organizadorId`: ID del organizador (si aplica)

**Decoradores de autorización**:
```csharp
[Authorize(Roles = "organizador")]
[Authorize(Roles = "comprador")]
[Authorize(Roles = "admin")]
[Authorize(Roles = "organizador,admin")] // múltiples roles
```

**Validación de acceso a eventos**:
```csharp
// Verificar que el organizador logueado sea dueño del evento
public async Task<bool> VerificarAccesoEvento(int usuarioId, int eventoId)
{
    var organizador = await _context.Organizadores
        .FirstOrDefaultAsync(o => o.UsuarioId == usuarioId);

    var evento = await _context.Eventos
        .FirstOrDefaultAsync(e => e.Id == eventoId);

    return evento.OrganizadorId == organizador.Id;
}
```

### Integración MercadoPago

**Configuración** (`appsettings.json`):
```json
{
  "MercadoPago": {
    "AccessToken": "TU_ACCESS_TOKEN",
    "PublicKey": "TU_PUBLIC_KEY"
  }
}
```

**Flujo de compra**:
1. Usuario click "Comprar Entrada" → POST `/api/Entradas/crear-orden`
2. Backend crea registro entrada con `estado_pago = 'pendiente'`
3. Backend crea preferencia en MercadoPago
4. Frontend redirige a checkout MercadoPago
5. Usuario paga
6. MercadoPago llama webhook → POST `/api/Entradas/webhook`
7. Backend actualiza entrada: `estado_pago = 'pagado'`, genera QR, envía email
8. Usuario recibe email con QR
9. Usuario ve entrada en `mis-entradas.html`

**Webhook de MercadoPago**:
- Validar firma del webhook
- Actualizar estado de entrada
- Incrementar `evento.entradas_vendidas`
- Enviar email con QR usando `EmailService`

### Sistema de Email

- Configurado para Gmail SMTP en `appsettings.json` → `EmailConfig`
- Usa MailKit
- **Nuevos templates**:
  - Email de bienvenida (registro)
  - Email con entrada y QR (post-compra)
  - Email de invitación a evento (registro público)

## Notas Importantes

### Priorización de Desarrollo (MVP)

**FASE 1 (2-3 semanas) - Base 🔴 CRÍTICO**:
- Crear migraciones SQL (tablas nuevas)
- Refactorizar `AuthController` con tipos de usuario
- Crear `OrganizadoresController`
- Frontend: `landing.html`, `sing-up.html`, modificar `login.html`

**FASE 2 (3 semanas) - Marketplace 🟠 ALTO**:
- `EventController`: eventos públicos
- `EntradasController`: crear-orden, webhook, mis-entradas
- Integración MercadoPago
- Frontend: `eventos-publicos.html`, `evento-detalle.html`, `checkout.html`, `mis-entradas.html`

**FASE 3 (2-3 semanas) - Dashboard Organizador 🟡 MEDIO**:
- Validar acceso por organizador_id en todos los endpoints
- Renombrar páginas organizador
- Frontend: `organizador-dashboard.html`, `organizador-entradas.html`, `organizador-perfil.html`

**FASE 4 (1-2 semanas) - Admin & Extras 🟢 BAJO**:
- `AdminController`
- Logs de actividad
- Frontend admin completo

### Migraciones de Base de Datos

**⚠️ IMPORTANTE**:
- No existe directorio de migraciones actualmente
- El schema está definido en `DbHotelContext.cs:30-150`
- Antes de crear migraciones nuevas:
  1. Crear modelos de dominio en `Domain/`
  2. Actualizar `DbHotelContext.OnModelCreating`
  3. Ejecutar `dotnet ef migrations add <Nombre>`
  4. Revisar migración generada
  5. Aplicar con `dotnet ef database update`

### Identificación de Invitados vs Compras (ACTUALIZADO FASE 1.1)

**Invitados (Guest)**: Personas que asisten a un evento
- Búsqueda por: `Id`, `Dni`, `IdCode`, `EventoId`
- Pueden venir de 2 fuentes:
  1. **Compra** (CompradoPorUsuarioId != NULL, CompraId != NULL)
     - Usuario compró entrada y la compra generó este Guest
     - Datos autocompletados desde perfil User
  2. **Invitación manual** (CompradoPorUsuarioId = NULL, CompraId = NULL)
     - Organizador agregó manualmente vía formulario público o panel admin
- Estado: `Confirmado` (true/false)
- Uso típico: TODOS los asistentes, independientemente de cómo llegaron

**Compras (Compra)**: Transacciones de venta de entradas
- Búsqueda por: `Id`, `UsuarioId`, `EventoId`, `TransaccionId` (MercadoPago)
- Pagan a través de MercadoPago
- Estado: `pendiente` → `pagado` → `cancelado` / `reembolsado`
- Cada Compra tiene 1:N Guests asociados
- Uso típico: tracking de pagos, historial de compras, reportes de venta

### Seguridad

**Validaciones críticas**:
- Verificar `organizador.eventos_permitidos` al crear evento
- Verificar `evento.capacidad_maxima` al vender entrada
- Verificar `entrada.usada = false` al escanear QR
- Verificar `evento.organizador_id = organizadorLogueado.id` en todos los endpoints

**CORS**: Actualmente permite todos los orígenes (`AllowAll`) - **RESTRINGIR EN PRODUCCIÓN**

**HTTPS**: JWT requiere validación deshabilitada (`RequireHttpsMetadata = false`) - **HABILITAR EN PRODUCCIÓN**

### Performance

- `ListRepository.GetAllByEventIdViaSPAsync()`: Stored procedure para carga rápida de invitados
- `ListController.GetPaginated`: Paginación server-side con DataTables
- Índices en: `usuarios.email`, `eventos.organizador_id`, `entradas.codigo_qr`, `entradas.evento_id`

### Testing

**No existen tests actualmente** - Implementar:
- Tests unitarios para lógica de negocio (Services)
- Tests de integración para Controllers
- Tests E2E para flujos críticos (compra entrada, acreditación)

### Despliegue

**Estructura IIS**:
```
C:\inetpub\wwwroot\choosing\
├── backend\           (ASP.NET Core API)
│   ├── choosing.dll
│   ├── appsettings.json
│   └── web.config
└── frontend\          (HTML, CSS, JS)
    ├── landing.html
    ├── login.html
    └── pages\
```

**Sitios IIS**:
- `rafarearte.com` → Frontend estático
- `api.rafarearte.com` → Backend API (.NET Core App Pool)

## Flujo de Desarrollo

### Agregar una nueva funcionalidad

1. Crear modelo de dominio en `Domain/`
2. Crear interfaz de repository en `Repository/Interfaces/`
3. Implementar repository en `Repository/Impl/`
4. Crear interfaz de service en `Services/Interfaces/`
5. Implementar service en `Services/Impl/`
6. Registrar service en `Program.cs` DI container
7. Crear controller en `Controllers/`
8. Si hay cambios en DB: actualizar `DbHotelContext`, crear migración
9. Crear/modificar páginas HTML en `FrontEnd/`
10. Actualizar `config.js` si hay nuevos endpoints

### Modificar la base de datos

1. Actualizar modelos en `Domain/`
2. Actualizar `DbHotelContext.OnModelCreating`
3. Ejecutar `dotnet ef migrations add <Nombre>`
4. Revisar archivo de migración generado
5. Ejecutar `dotnet ef database update`
6. Actualizar seeders si es necesario

### Cambios en el frontend

- Los archivos estáticos se sirven directamente (no hay proceso de build)
- Editar archivos HTML/JS en `FrontEnd/`
- Refrescar navegador (no hay hot reload)
- Actualizar `config.js` si cambian endpoints
- Actualizar `sw.js` si se agregan páginas nuevas (para caché PWA)

## Convenciones de Código

**Nombres de archivos**:
- HTML: `kebab-case` (evento-detalle.html)
- CSS: `kebab-case` (organizador-dashboard.css)
- JS: `camelCase` (eventService.js)
- C#: `PascalCase` (EventController.cs)

**Git commits**:
```
feat: agregar página mis-entradas
fix: corregir validación QR duplicado
refactor: mejorar estructura organizador
docs: actualizar CLAUDE.md con nuevos endpoints
```

## Recursos Adicionales

**Documentación externa**:
- MercadoPago API: https://www.mercadopago.com.ar/developers/es/docs
- DataTables: https://datatables.net/
- Chart.js: https://www.chartjs.org/
- QR Code Generator: https://github.com/kazuhikoarase/qrcode-generator

**Swagger API**: Habilitado en Development y Production (ver `Program.cs:74`)

---

**Última actualización**: Octubre 2025
**Versión**: 2.0 - Transformación a plataforma multi-rol