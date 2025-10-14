# Estado Actual del Proyecto - Noviembre 2025

**Fecha**: 11 de Noviembre 2025
**Última actualización**: Post refactor de autenticación y Swagger
**Branch**: `tesis-develop`

---

## 🎯 Resumen Ejecutivo

El proyecto Choosing ha completado exitosamente la **FASE 1** y **FASE 1.1** (backend completo) más la **FASE 2** (sistema de compras backend). Además, se ha corregido y mejorado la configuración de autenticación JWT en Swagger.

**Estado general**: ✅ **BACKEND COMPLETO Y FUNCIONANDO**
**Próximos pasos**: Frontend (marketplace de eventos y checkout)

---

## ✅ Lo Que Está COMPLETADO

### Backend (100%)

#### 1. Sistema Multi-Rol ✅
- **AuthController** refactorizado con registro/login multi-rol
- **UserController** con endpoints CRUD protegidos por roles
- **TokenService** generando JWT con claims de rol
- Roles soportados: `comprador`, `organizador`, `admin`
- Swagger configurado correctamente para JWT (tipo `Http` con scheme `bearer`)

####  2. Modelos de Dominio ✅
```
✅ User (Usuarios)
   - TipoUsuario, Nombre, Apellido, Telefono
   - DNI, Direccion, Ciudad, Provincia, FechaNacimiento
   - Campos organizador: NombreEmpresa, CuitCuil, PlanSuscripcion, EventosPermitidos
   - Campos comprador: RazonSocial, TipoDocumento, Pais

✅ Guest (Invitados)
   - Email, Dni (string), EstaAcreditado, FechaAcreditacion
   - CompradoPorUsuarioId, CompraId (nullable)
   - Confirmado, IdCode, campos opcionales

✅ Compra
   - UsuarioId, EventoId, MontoTotal, CantidadEntradas
   - Estado (pendiente/pagado/cancelado), TransaccionId
   - MetodoPago, FechaPago

✅ EventModel
   - OrganizadorId (FK a User)
   - VentaPublica, PrecioEntrada, CapacidadMaxima
   - EntradasVendidas, Estado, ConfigTabla, ConfigEtiqueta
```

#### 3. Sistema de Compras ✅
**Repository**: `CompraRepository` con métodos:
- `CreateAsync`, `GetByIdAsync`
- `GetByUsuarioIdAsync`, `GetByEventoIdAsync`
- `UpdateAsync`

**Service**: `CompraService` con lógica de negocio:
- Validación de capacidad del evento
- Autocompletado de datos desde User
- Incremento de `EntradasVendidas` solo cuando `Estado = "pagado"`

**Controller**: `CompraController` con 7 endpoints:
```
✅ POST   /api/Compra/crear
✅ POST   /api/Compra/{id}/agregar-invitados
✅ GET    /api/Compra/mis-compras
✅ GET    /api/Compra/{id}
✅ GET    /api/Compra/evento/{eventoId}
✅ PUT    /api/Compra/{id}/estado
✅ POST   /api/Compra/webhook (estructura básica)
```

#### 4. Base de Datos ✅
**Migraciones aplicadas**:
1. `20251010200326_AgregarSistemaMultiRol`
2. `20251010203245_AgregarSistemaComprasYPerfilExtendido`
3. `20251011150923_CompletarConfiguracionUser` ← **NUEVA** (hoy)

**Cambios importantes de última migración**:
- ✅ Tabla `Organizadores` eliminada (consolidada en `Usuarios`)
- ✅ Índices únicos en `Username` y `Email`
- ✅ Renombrados campos Guest: `mail` → `Email`, `acreditado` → `EstaAcreditado`
- ✅ `Dni` cambiado de `int` → `string` para flexibilidad internacional
- ✅ Eliminados campos obsoletos: `day_one`, `day_two`, `day_three`, `cant_entradas`

---

### Frontend (40% - Básico)

#### Archivos Creados ✅
1. **`js/auth.js`** - Módulo de autenticación JWT
   - `Auth.login()`, `Auth.logout()`, `Auth.getToken()`
   - `Auth.decodeToken()` - decodifica JWT sin librerías
   - `Auth.isAuthenticated()`, `Auth.getUser()`
   - `Auth.hasRole(role)` - verificar permisos
   - `Auth.fetch()` - fetch con header Authorization automático
   - `Auth.redirectByRole()` - redirige según tipo de usuario

2. **`sing-up.html`** - Registro con selector de rol
   - Selector visual: Comprador 🎟️ vs Organizador 🎪
   - Campos dinámicos (organizador muestra datos empresa)
   - Validación frontend
   - Auto-login después de registro exitoso
   - Redirección automática según rol

3. **`login.html`** - Modificado
   - Link a `sing-up.html`
   - Incluye `auth.js`
   - Redirección según rol después del login

#### Archivos Pendientes ⚠️
```
⚠️ eventos-publicos.html - Marketplace de eventos
⚠️ evento-detalle.html - Detalle + comprar entradas
⚠️ checkout.html - Flujo de compra con MercadoPago
⚠️ mis-entradas.html - Historial del comprador
⚠️ organizador-dashboard.html - Home del organizador
⚠️ organizador-eventos.html - Lista de mis eventos
```

---

## 🔧 Arreglos Recientes (11 Nov 2025)

### 1. Login y Autenticación ✅
**Problema**: Login dejó de funcionar después de refactor
**Causa**: Faltaba configuración de `User` en `DbContext.OnModelCreating`
**Solución**:
- Agregada configuración completa de User en `DbHotelContext.cs:128-178`
- Creada migración `CompletarConfiguracionUser`
- Aplicada a base de datos exitosamente

**Tests ejecutados**:
```bash
✅ POST /api/Auth/login (comprador) → 200 OK
✅ POST /api/Auth/login (organizador) → 200 OK
✅ POST /api/Auth/login (admin) → 200 OK
✅ POST /api/Auth/login (password incorrecta) → 401 Unauthorized
✅ POST /api/Auth/registro (nuevo comprador) → 200 OK
```

### 2. Swagger JWT ✅
**Problema**: Token no funcionaba en Swagger (requería escribir "Bearer " manualmente)
**Causa**: Configuración incorrecta en `Program.cs` (tipo `ApiKey` en vez de `Http`)
**Solución**:
- Cambiado `Type = SecuritySchemeType.ApiKey` → `SecuritySchemeType.Http`
- Agregado `Scheme = "bearer"`
- Ahora Swagger agrega automáticamente el prefijo "Bearer "

**Cómo usar ahora**:
1. Login en `/api/Auth/login` → copiar `token`
2. Click en "Authorize" 🔒
3. Pegar SOLO el token (sin "Bearer ")
4. Swagger agrega el prefijo automáticamente

---

## 📊 Arquitectura Actual

### Flujo de Autenticación
```
Frontend (sing-up.html)
  ↓ POST /api/Auth/registro
AuthController.Registro()
  ↓
UserService.RegisterAsync()
  ↓ BCrypt.HashPassword()
  ↓ UserRepository.AddAsync()
  ↓ TokenService.GenerateToken()
  ↓ return { token, user }
Frontend
  ↓ Auth.login(token, user)
  ↓ localStorage.setItem('token')
  ↓ Auth.redirectByRole()
```

### Flujo de Compra (Diseñado, no implementado en frontend)
```
Frontend (checkout.html)
  ↓ POST /api/Compra/crear
CompraController.CrearCompra()
  ↓
CompraService.CrearCompraAsync()
  ↓ Validar evento, usuario, capacidad
  ↓ CompraRepository.CreateAsync()
  ↓ return Compra { Id, Estado: "pendiente" }

Frontend
  ↓ POST /api/Compra/{id}/agregar-invitados
CompraController.AgregarInvitados()
  ↓
CompraService.AgregarInvitadosAsync()
  ↓ Validar cantidad === cantidadEntradas
  ↓ Autocompletar si UsarDatosUsuario = true
  ↓ Crear N Guests con CompraId
  ↓ return Compra + Guests

[Futuro: MercadoPago]
  ↓ Webhook cambia Estado → "pagado"
  ↓ Incrementa evento.EntradasVendidas
  ↓ Envía email con QR
```

---

## 📁 Estructura de Archivos

### Backend
```
/Domain
  ├─ User.cs ...................... ✅ FASE 1 + 1.1 + refactor
  ├─ Guest.cs ..................... ✅ FASE 1.1 (refactorizado)
  ├─ Compra.cs .................... ✅ FASE 1.1
  ├─ EventModel.cs ................ ✅ FASE 1
  ├─ FeedbackModel.cs
  ├─ Config/
  │   ├─ JwtConfig.cs ............. ✅ Movido
  │   └─ EmailConfig.cs ........... ✅ Movido
  └─ Dtos/
      ├─ LoginDTO.cs
      ├─ RegistroDTO.cs ........... ✅ FASE 1
      ├─ AuthResponseDTO.cs ....... ✅ FASE 1
      ├─ UserResponseDTO.cs ....... ✅ FASE 1
      ├─ UpdateUserDTO.cs
      ├─ PublicGuestRegistrationDTO.cs
      └─ AccreditStatusDTO.cs

/Controllers
  ├─ AuthController.cs ............ ✅ Refactorizado
  ├─ UserController.cs ............ ✅ NUEVO (CRUD usuarios)
  ├─ CompraController.cs .......... ✅ NUEVO (FASE 2)
  ├─ EventController.cs
  ├─ ListController.cs
  └─ FeedbackController.cs

/Services
  ├─ Interfaces/
  │   ├─ IUserService.cs .......... ✅
  │   ├─ ITokenService.cs ......... ✅
  │   ├─ ICompraService.cs ........ ✅ (incluye DTOs)
  │   ├─ IListService.cs
  │   ├─ IEventService.cs
  │   ├─ IEmailService.cs
  │   └─ IFeedbackService.cs
  │
  └─ Impl/
      ├─ UserService.cs ........... ✅
      ├─ TokenService.cs .......... ✅ (con claims de rol)
      ├─ CompraService.cs ......... ✅
      ├─ ListService.cs
      ├─ EventService.cs
      ├─ EmailService.cs
      └─ FeedbackService.cs

/Repository
  ├─ Interfaces/
  │   ├─ IUserRepository.cs ....... ✅
  │   ├─ ICompraRepository.cs ..... ✅
  │   ├─ IListRepository.cs
  │   ├─ IEventRepository.cs
  │   └─ IFeedbackRepository.cs
  │
  └─ Impl/
      ├─ UserRepository.cs ........ ✅
      ├─ CompraRepository.cs ...... ✅
      ├─ ListRepository.cs
      ├─ EventRepository.cs
      └─ FeedbackRepository.cs

/Context
  └─ DbHotelContext.cs ............ ✅ Completado (configuración User agregada)

/Migrations
  ├─ 20251010200326_AgregarSistemaMultiRol.*
  ├─ 20251010203245_AgregarSistemaComprasYPerfilExtendido.*
  └─ 20251011150923_CompletarConfiguracionUser.* ← NUEVO
```

### Frontend
```
/FrontEnd
  ├─ js/
  │   ├─ config.js ............... ✅
  │   ├─ auth.js ................. ✅ NUEVO
  │   ├─ core.js
  │   ├─ actions.js
  │   ├─ data.js
  │   ├─ table.js
  │   ├─ scanner.js
  │   ├─ print.js
  │   └─ pwa.js
  │
  ├─ sing-up.html ................ ✅ NUEVO
  ├─ login.html .................. ✅ Modificado
  ├─ admin-panel.html ............ (organizador-config.html en futuro)
  ├─ event-selection.html ........ (organizador-eventos.html en futuro)
  ├─ stats.html .................. ✅
  ├─ print-labels.html ........... ✅
  │
  └─ [PENDIENTES]
      ├─ eventos-publicos.html ... ⚠️
      ├─ evento-detalle.html ..... ⚠️
      ├─ checkout.html ........... ⚠️
      └─ mis-entradas.html ....... ⚠️
```

---

## 🧪 Tests Realizados

### Autenticación (11 Nov)
| Endpoint | Método | Rol | Resultado |
|----------|--------|-----|-----------|
| `/api/Auth/registro` | POST | - | ✅ 200 OK (comprador) |
| `/api/Auth/registro` | POST | - | ✅ 200 OK (organizador) |
| `/api/Auth/login` | POST | - | ✅ 200 OK + JWT |
| `/api/Auth/login` (bad pwd) | POST | - | ✅ 401 Unauthorized |

### Usuarios
| Endpoint | Método | Rol | Resultado |
|----------|--------|-----|-----------|
| `/api/User` | GET | admin | ✅ 200 OK (lista todos) |
| `/api/User` | GET | comprador | ✅ 403 Forbidden |
| `/api/User/{id}` | GET | cualquier autenticado | ✅ 200 OK |

### Compras (Bruno)
| Endpoint | Método | Rol | Resultado |
|----------|--------|-----|-----------|
| `/api/Compra/crear` | POST | comprador | ✅ Funciona |
| `/api/Compra/mis-compras` | GET | comprador | ✅ Funciona |

---

## ⏭️ Próximos Pasos

### FASE 2.5: Frontend Marketplace (2-3 semanas)

#### 1. Eventos Públicos (3-4 días)
**Archivo**: `eventos-publicos.html`
- Grid de cards con eventos públicos
- Filtros: fecha, ciudad, categoría, precio
- Paginación
- Click → redirige a `evento-detalle.html?id=X`

**API necesaria**:
```javascript
GET /api/Event/publicos?page=1&limit=12&ciudad=&fecha=
```

#### 2. Detalle de Evento (2-3 días)
**Archivo**: `evento-detalle.html`
- Información completa del evento
- Galería de imágenes
- Selector de cantidad de entradas
- Botón "Comprar" → redirige a `checkout.html?eventoId=X&cantidad=Y`

**API necesaria**:
```javascript
GET /api/Event/{id}
```

#### 3. Checkout y Pago (4-5 días)
**Archivo**: `checkout.html`

**Flujo**:
1. Mostrar resumen: evento, cantidad, precio total
2. POST `/api/Compra/crear` → obtener `compraId`
3. Formulario "¿Quiénes asisten?"
   - Checkbox "Yo voy a asistir" (autocompleta desde User)
   - Formularios para invitados adicionales
4. POST `/api/Compra/{id}/agregar-invitados`
5. [Futuro] Botón MercadoPago → redirige a pago
6. Mostrar QR codes (por ahora)

#### 4. Mis Entradas (2-3 días)
**Archivo**: `mis-entradas.html`
- Lista de compras del usuario
- Estado de cada compra (pendiente/pagado)
- Ver invitados por compra
- Botón "Ver QR" (modal)
- Botón "Descargar PDF" (futuro)

**API necesaria**:
```javascript
GET /api/Compra/mis-compras?usuarioId={userId}
```

---

### FASE 3: Dashboard Organizador (2 semanas)

#### 5. Dashboard Principal (3 días)
**Archivo**: `organizador-dashboard.html`
- Métricas: total eventos, acreditaciones, ingresos
- Gráficos con Chart.js
- Links rápidos a crear evento, ver ventas

#### 6. Gestión de Eventos (3 días)
**Archivo**: `organizador-eventos.html` (renombrar `event-selection.html`)
- Lista de MIS eventos (filtrar por `organizadorId`)
- Botón "Crear Evento"
- Ver ventas por evento
- Validar límite de eventos según plan

**API necesaria**:
```javascript
GET /api/Event/mis-eventos?organizadorId={userId}
```

---

### FASE 4: Integración MercadoPago (1 semana)

#### 7. Backend MercadoPago
- Instalar SDK: `dotnet add package MercadoPago.SDK`
- Configurar `appsettings.json`
- `IMercadoPagoService` + `MercadoPagoService`
- Endpoint `/api/Compra/{id}/mercadopago` → crear preferencia
- Webhook real con validación de firma

#### 8. Frontend MercadoPago
- Botón "Pagar con MercadoPago" en `checkout.html`
- Redirigir a URL de pago
- Página de confirmación
- Email con QR (usar `EmailService` existente)

---

## 📚 Documentación

| Archivo | Contenido |
|---------|-----------|
| `CLAUDE.md` | Arquitectura general (ACTUALIZAR) |
| `docs/FASE1-SISTEMA-AUTENTICACION-MULTI-ROL.md` | Backend multi-rol |
| `docs/FASE1.1-ARQUITECTURA-USER-GUEST-COMPRA.md` | Separación User/Guest/Compra |
| `docs/FASE2-SISTEMA-COMPRAS.md` | Sistema de compras backend |
| `docs/MIGRACION-SQL-FASE1.md` | Scripts SQL para producción |
| `docs/RESUMEN-SESION-OCTUBRE-2025.md` | Resumen de sesión anterior |
| `docs/ESTADO-ACTUAL-NOVIEMBRE-2025.md` | **ESTE ARCHIVO** |

---

## 🚀 Comandos Útiles

```bash
# Compilar
dotnet build

# Correr la aplicación
dotnet run

# Ver Swagger
open http://localhost:5260/swagger

# Ver app
open http://localhost:5260/sing-up.html

# Crear migración
dotnet ef migrations add NombreMigracion

# Aplicar migraciones
dotnet ef database update

# Ver status de git
git status

# Commit cambios
git add .
git commit -m "feat: mensaje descriptivo"
```

---

## 🐛 Issues Conocidos

1. ⚠️ **Pendiente**: Crear DTO específico para `AccreditStatusDTO` (actualmente no se usa)
2. ⚠️ **Pendiente**: Mover DTOs de `ICompraService.cs` a archivos separados en `Domain/Dtos/`
3. ⚠️ **Pendiente**: Implementar webhook real de MercadoPago (actualmente es básico)
4. ⚠️ **Pendiente**: Generar QR codes por invitado
5. ⚠️ **Pendiente**: Enviar emails después de compra

---

## 💡 Lecciones Aprendidas

1. **Configuración de Swagger JWT**: Usar `Type = Http` con `Scheme = "bearer"` para que agregue automáticamente "Bearer "
2. **Entity Framework**: SIEMPRE configurar entidades en `OnModelCreating`, no confiar solo en Data Annotations
3. **Migraciones**: Revisar SIEMPRE la migración generada antes de aplicar (línea 154 de `CompraService.cs`)
4. **DTOs inline**: Evitar definir DTOs dentro de interfaces, mejor en archivos separados
5. **Testing incremental**: Probar cada endpoint después de crearlo, no esperar al final

---

**Estado**: ✅ **LISTO PARA CONTINUAR CON FRONTEND**

**Siguiente tarea**: Implementar `eventos-publicos.html` y `evento-detalle.html`

**Aplicación corriendo**: `http://localhost:5260`
**Swagger**: `http://localhost:5260/swagger`
