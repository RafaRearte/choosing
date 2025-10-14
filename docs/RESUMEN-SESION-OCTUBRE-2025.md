# Resumen de Sesión - Octubre 2025

**Fecha**: 10 de Octubre 2025
**Duración**: Sesión completa
**Objetivo**: Implementar sistema multi-rol + compras + frontend básico

---

## 🎯 Lo que Implementamos

### ✅ FASE 1: Sistema Multi-Rol (COMPLETADO)

**Backend**:
- ✅ Modelo `User` extendido con `TipoUsuario`, perfil completo
- ✅ Modelo `Organizador` para empresas con plan de suscripción
- ✅ Modelo `EventModel` con campos de marketplace (precio, capacidad, estado)
- ✅ `TokenService` con claims de rol en JWT
- ✅ `AuthController` refactorizado con registro multi-rol
- ✅ Migración aplicada: `20251010200326_AgregarSistemaMultiRol`

**Base de Datos**:
- ✅ Tabla `Usuarios` con TipoUsuario (comprador/organizador/admin)
- ✅ Tabla `Organizadores` (1:1 con Usuarios)
- ✅ Tabla `Eventos` con OrganizadorId, VentaPublica, PrecioEntrada

---

### ✅ FASE 1.1: Arquitectura User-Guest-Compra (COMPLETADO)

**Problema resuelto**: Separar autenticación, asistencia y transacciones

**Cambios**:
- ✅ `User` extendido con DNI, Dirección, FechaNacimiento (autocompletar compras)
- ✅ `Guest` con `CompradoPorUsuarioId` y `CompraId` (nullable)
- ✅ `Compra` (NUEVO) - tracking completo de transacciones
- ✅ Migración: `20251010203245_AgregarSistemaComprasYPerfilExtendido`

**Flujos soportados**:
1. ✅ Usuario compra entrada para sí mismo → autocompleta datos
2. ✅ Usuario compra múltiples entradas → 1 Compra → N Guests
3. ✅ Organizador agrega invitados manualmente → Guest sin CompradoPorUsuarioId

---

### ✅ FASE 2: Sistema de Compras (COMPLETADO - Backend)

**Repository + Service + Controller**:
- ✅ `ICompraRepository` + `CompraRepository`
- ✅ `ICompraService` + `CompraService`
- ✅ `CompraController` con 7 endpoints

**Endpoints creados**:
```
POST   /api/Compra/crear
POST   /api/Compra/{id}/agregar-invitados
GET    /api/Compra/mis-compras
GET    /api/Compra/{id}
GET    /api/Compra/evento/{eventoId}
PUT    /api/Compra/{id}/estado
POST   /api/Compra/webhook  (básico)
```

**Validaciones**:
- ✅ Capacidad del evento
- ✅ Cantidad de invitados = cantidad de entradas
- ✅ Incremento de entradas vendidas solo cuando estado = "pagado"

---

### ✅ Frontend Básico (INICIADO)

**Archivos creados**:
1. ✅ `FrontEnd/js/auth.js` - Módulo de autenticación JWT
   - Guardar/leer token de localStorage
   - Decodificar JWT
   - Verificar roles
   - Fetch con auth automática
   - Redirigir según rol

2. ✅ `FrontEnd/sing-up.html` - Registro con selector de rol
   - Selector visual comprador vs organizador
   - Campos dinámicos (organizador muestra datos empresa)
   - Integración con Auth.js
   - Auto-login después de registro

3. ✅ `FrontEnd/login.html` - Modificado
   - Link a sing-up.html
   - Incluye auth.js

---

## 📚 Documentación Creada

| Archivo | Descripción |
|---------|-------------|
| `CLAUDE.md` | Arquitectura general actualizada con FASE 1.1 |
| `docs/FASE1-SISTEMA-AUTENTICACION-MULTI-ROL.md` | Backend multi-rol completo |
| `docs/FASE1.1-ARQUITECTURA-USER-GUEST-COMPRA.md` | Separación User/Guest/Compra con diagramas |
| `docs/MIGRACION-SQL-FASE1.md` | Scripts SQL para producción |
| `docs/FASE2-SISTEMA-COMPRAS.md` | Sistema de compras backend |
| `docs/TEST-SWAGGER-FASE1.md` | Tests ejecutados |
| `docs/RESUMEN-SESION-OCTUBRE-2025.md` | Este archivo |

---

## 🗂️ Estructura de Archivos

```
/Domain
  ├─ User.cs .................... ✅ FASE 1 + 1.1
  ├─ Organizador.cs ............. ✅ FASE 1
  ├─ Guest.cs ................... ✅ FASE 1.1
  ├─ Compra.cs .................. ✅ FASE 1.1 (NUEVO)
  └─ EventModel.cs .............. ✅ FASE 1

/Repository
  ├─ Interfaces/
  │   ├─ ICompraRepository.cs ... ✅ FASE 2
  │   └─ ...
  └─ Impl/
      ├─ CompraRepository.cs .... ✅ FASE 2
      └─ ...

/Services
  ├─ Interfaces/
  │   ├─ ICompraService.cs ...... ✅ FASE 2
  │   └─ ...
  └─ Impl/
      ├─ CompraService.cs ....... ✅ FASE 2
      └─ ...

/Controllers
  ├─ AuthController.cs .......... ✅ FASE 1 (refactorizado)
  └─ CompraController.cs ........ ✅ FASE 2 (NUEVO)

/FrontEnd
  ├─ js/
  │   └─ auth.js ................ ✅ Frontend (NUEVO)
  ├─ login.html ................. ✅ Modificado
  └─ sing-up.html ............... ✅ Frontend (NUEVO)
```

---

## 🧪 Estado de Testing

### Backend FASE 1
- ✅ POST `/api/Auth/registro` (Comprador) → 200 OK
- ✅ POST `/api/Auth/registro` (Organizador) → 200 OK
- ✅ POST `/api/Auth/login` → 200 OK
- ✅ JWT decodificado contiene role claims

### Backend FASE 2
- ⚠️ Endpoints creados pero **no testeados completamente**
- ✅ Compila sin errores
- ✅ Aplicación corriendo en http://localhost:5260

### Frontend
- ⚠️ **No testeado en navegador todavía**
- Archivos creados y sintaxis correcta

---

## 🗄️ Base de Datos

**Database**: `choosing_db` (local Mac)

**Tablas**:
```
Usuarios (User)
  - TipoUsuario, Nombre, Apellido, Telefono, Dni, Direccion, etc.

Organizadores (Organizador)
  - UsuarioId, NombreEmpresa, CUIT, PlanSuscripcion, EventosPermitidos

Eventos (EventModel)
  - OrganizadorId, VentaPublica, PrecioEntrada, CapacidadMaxima, EntradasVendidas, Estado

Compras (Compra)  ← NUEVA
  - UsuarioId, EventoId, MontoTotal, Estado, TransaccionId, FechaPago

invitados (Guest)
  - CompradoPorUsuarioId, CompraId, Confirmado

Feedbacks
FeedbackConfig
```

**Migraciones aplicadas**:
1. `20251010200326_AgregarSistemaMultiRol`
2. `20251010203245_AgregarSistemaComprasYPerfilExtendido`

---

## ⏭️ Próximos Pasos

### Frontend Pendiente

1. **eventos-publicos.html** - Marketplace de eventos
   - Grid de cards con eventos
   - Filtros (fecha, ciudad, categoría)
   - Click → redirige a evento-detalle.html

2. **evento-detalle.html** - Ver evento + comprar
   - Info del evento
   - Botón "Comprar Entrada"
   - Selector de cantidad

3. **checkout.html** - Flujo de compra
   - POST /api/Compra/crear
   - Formulario "¿Quiénes van a asistir?"
   - POST /api/Compra/{id}/agregar-invitados
   - [Futuro] Integración MercadoPago

4. **mis-entradas.html** - Historial del comprador
   - GET /api/Compra/mis-compras
   - Lista de compras con estado
   - Ver invitados de cada compra

5. **organizador-eventos.html** - Dashboard organizador
   - Listar MIS eventos
   - Botón crear evento
   - Ver ventas por evento

---

### Backend Pendiente (FASE 2.1)

6. **Integración MercadoPago**
   - Instalar SDK: `dotnet add package MercadoPago.SDK`
   - Configurar appsettings.json con AccessToken
   - `IMercadoPagoService` + `MercadoPagoService`
   - Endpoint POST /api/Compra/{id}/mercadopago
   - Webhook real con validación de firma

7. **Email Service**
   - Template HTML de confirmación de compra
   - Generar QR code por invitado
   - Enviar email después de pago confirmado

---

## 🎓 Conceptos Clave para Aprender

### 1. JWT (JSON Web Token)
**Lo que hicimos**:
- Backend genera token después de login/registro
- Token contiene claims: userId, username, email, **role**
- Frontend guarda token en localStorage
- Frontend envía token en header `Authorization: Bearer {token}`

**Código ejemplo** (auth.js):
```javascript
// Guardar token
Auth.login(token, user);

// Leer token
const token = Auth.getToken();

// Decodificar token (ver contenido)
const payload = Auth.decodeToken(token);
console.log(payload.role); // "comprador", "organizador", "admin"

// Fetch con auth
await Auth.fetch('/api/Compra/crear', {
    method: 'POST',
    body: JSON.stringify(data)
});
```

---

### 2. Arquitectura Repository-Service-Controller

**Flujo de una request**:
```
Frontend
  ↓ POST /api/Compra/crear
CompraController
  ↓ llama a
CompraService (lógica de negocio)
  ↓ llama a
CompraRepository (acceso a BD)
  ↓ usa
DbContext → SQL Server
```

**Ejemplo**: Crear una compra
1. **Controller** recibe request, valida datos
2. **Service** valida negocio (capacidad evento, usuario existe)
3. **Repository** hace INSERT en tabla Compras
4. **Service** devuelve Compra al Controller
5. **Controller** devuelve JSON al Frontend

---

### 3. Relaciones de Base de Datos

**1:N (One-to-Many)**:
```
User → Compras
  1 usuario puede tener muchas compras
```

**1:1 (One-to-One)**:
```
User → Organizador
  1 usuario organizador tiene 1 perfil de organizador
```

**Nullable Foreign Keys**:
```
Guest.CompradoPorUsuarioId = NULL
  → Invitado agregado manualmente (no comprado)

Guest.CompradoPorUsuarioId = 5
  → Invitado de una compra del usuario #5
```

---

### 4. Estados de Compra (State Machine)

```
pendiente → pagado → (fin)
    ↓
cancelado
    ↓
reembolsado
```

**Solo cuando pasa a "pagado"**:
- Se incrementa `evento.EntradasVendidas`
- Se guarda `FechaPago`
- Se guarda `TransaccionId` de MercadoPago
- (Futuro) Se envía email con QR

---

### 5. Autocompletado de Datos

**Problema**: Usuario compra 3 entradas, una para él y dos para amigos.

**Solución**:
```javascript
// Primera entrada: "Yo voy a asistir" (checkbox)
{
  "usarDatosUsuario": true,
  "nombre": "",  // Se completa desde User.Nombre
  "apellido": "", // Se completa desde User.Apellido
  "dni": null    // Se completa desde User.Dni
}

// Segunda y tercera entrada: datos manuales
{
  "usarDatosUsuario": false,
  "nombre": "María",
  "apellido": "López",
  "dni": 23456789
}
```

---

## 📊 Métricas de Sesión

- **Archivos creados**: 12
- **Archivos modificados**: 5
- **Líneas de código**: ~2500
- **Migraciones aplicadas**: 2
- **Endpoints creados**: 7
- **Tests ejecutados**: 10
- **Documentación generada**: 7 archivos

---

## 🐛 Errores Encontrados y Resueltos

### Error 1: Migración falló (tablas ya existen)
**Solución**: Crear nueva base de datos `choosing_db`

### Error 2: Puerto 5260 ocupado
**Solución**: `lsof -ti:5260 | xargs kill -9`

### Error 3: Confusión User vs Guest vs Entrada
**Solución**: Crear entidad `Compra` separada (FASE 1.1)

---

## 💡 Lecciones Aprendidas

1. **Separación de responsabilidades**: User para auth, Guest para asistencia, Compra para transacciones
2. **Nullable FKs**: Permiten flexibilidad (invitados manuales vs comprados)
3. **JWT con roles**: Habilita `[Authorize(Roles = "comprador")]` en backend
4. **Auto-login después de registro**: Mejor UX
5. **Documentar mientras se desarrolla**: No esperar al final

---

## 🔗 Recursos para Seguir Aprendiendo

### JWT
- https://jwt.io - Decodificar tokens
- https://docs.microsoft.com/en-us/aspnet/core/security/authentication/jwt-authn

### Entity Framework
- https://learn.microsoft.com/en-us/ef/core/
- Migraciones: https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/

### Bootstrap 5
- https://getbootstrap.com/docs/5.3/getting-started/introduction/

### Fetch API (JavaScript)
- https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch

---

**Sesión cerrada**: La aplicación está corriendo y lista para seguir desarrollando.
**Siguiente sesión**: Completar frontend (eventos-publicos, checkout, mis-entradas)

---

**Comandos útiles**:
```bash
# Correr la app
dotnet run

# Ver Swagger
open http://localhost:5260/swagger

# Ver app
open http://localhost:5260/sing-up.html
```

Toda la documentación está en `/docs`.
Todo el código está commiteado (pendiente).
