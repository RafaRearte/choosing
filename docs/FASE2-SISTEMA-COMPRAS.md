# FASE 2: Sistema de Compras de Entradas

**Fecha**: Octubre 2025
**Objetivo**: Implementar sistema completo de compra de entradas con tracking de transacciones

---

## 🎯 Componentes Implementados

### 1. Repository Layer

**ICompraRepository** + **CompraRepository**:
- ✅ `CreateAsync()` - Crear nueva compra
- ✅ `GetByIdAsync()` - Obtener compra con relaciones (Usuario, Evento, Invitados)
- ✅ `GetByUsuarioIdAsync()` - Historial de compras de un usuario
- ✅ `GetByEventoIdAsync()` - Compras de un evento (para organizador)
- ✅ `UpdateAsync()` - Actualizar estado de compra
- ✅ `DeleteAsync()` - Eliminar compra (solo admin)

---

### 2. Service Layer

**ICompraService** + **CompraService**:

#### CrearCompraAsync()
```csharp
Task<Compra> CrearCompraAsync(CrearCompraDTO dto);
```
**Validaciones**:
- ✅ Evento existe
- ✅ Usuario existe
- ✅ Hay capacidad disponible (si evento tiene límite)

**Crea**:
- Compra con estado = "pendiente"
- Fecha de compra = ahora
- NO incrementa entradas vendidas (solo cuando se paga)

---

#### AgregarInvitadosAsync()
```csharp
Task<Compra> AgregarInvitadosAsync(int compraId, AgregarInvitadosDTO dto);
```
**Validaciones**:
- ✅ Cantidad de invitados = cantidad de entradas compradas
- ✅ Compra existe

**Lógica**:
- Si `UsarDatosUsuario = true` → autocompleta desde perfil User
- Si `UsarDatosUsuario = false` → usa datos ingresados manualmente
- Crea Guests con:
  - CompradoPorUsuarioId = compra.UsuarioId
  - CompraId = id de la compra
  - Confirmado = true

---

#### ActualizarEstadoCompraAsync()
```csharp
Task<Compra> ActualizarEstadoCompraAsync(int compraId, string nuevoEstado, string? transaccionId);
```
**Estados posibles**:
- `pendiente` → estado inicial
- `pagado` → pago confirmado (incrementa evento.EntradasVendidas)
- `cancelado` → compra cancelada
- `reembolsado` → compra reembolsada

**Cuando estado = "pagado"**:
- ✅ FechaPago = DateTime.Now
- ✅ TransaccionId = ID de MercadoPago
- ✅ evento.EntradasVendidas += compra.CantidadEntradas

---

### 3. Controller Layer

**CompraController** (`/api/Compra`)

#### POST /api/Compra/crear
**Autenticación**: Requiere rol `comprador`

**Request**:
```json
{
  "usuarioId": 1,
  "eventoId": 5,
  "cantidadEntradas": 3,
  "montoTotal": 15000
}
```

**Response**:
```json
{
  "message": "Compra creada exitosamente",
  "compraId": 1,
  "compra": {
    "id": 1,
    "usuarioId": 1,
    "eventoId": 5,
    "cantidadEntradas": 3,
    "montoTotal": 15000,
    "estado": "pendiente",
    "fechaCompra": "2025-10-10T20:30:00"
  }
}
```

---

#### POST /api/Compra/{compraId}/agregar-invitados
**Autenticación**: Requiere rol `comprador`

**Request**:
```json
{
  "invitados": [
    {
      "nombre": "",
      "apellido": "",
      "dni": null,
      "mail": "",
      "telefono": "",
      "usarDatosUsuario": true
    },
    {
      "nombre": "María",
      "apellido": "López",
      "dni": 23456789,
      "mail": "maria@example.com",
      "telefono": "+54911222333",
      "usarDatosUsuario": false
    },
    {
      "nombre": "Carlos",
      "apellido": "Gómez",
      "dni": 34567890,
      "mail": "carlos@example.com",
      "telefono": "+54911333444",
      "usarDatosUsuario": false
    }
  ]
}
```

**Response**:
```json
{
  "message": "Invitados agregados exitosamente",
  "compra": {
    "id": 1,
    "invitados": [
      {
        "id": 10,
        "nombre": "Juan",
        "apellido": "Pérez",
        "dni": 12345678,
        "compradoPorUsuarioId": 1,
        "compraId": 1
      },
      ...
    ]
  }
}
```

---

#### GET /api/Compra/mis-compras?usuarioId={id}
**Autenticación**: Requiere rol `comprador`

**Response**:
```json
[
  {
    "id": 1,
    "eventoId": 5,
    "evento": {
      "id": 5,
      "nombre": "Conferencia Tech 2025",
      "fechaInicio": "2025-11-15T09:00:00"
    },
    "cantidadEntradas": 3,
    "montoTotal": 15000,
    "estado": "pagado",
    "fechaCompra": "2025-10-10T20:30:00",
    "fechaPago": "2025-10-10T20:35:00",
    "invitados": [...]
  }
]
```

---

#### GET /api/Compra/{id}
**Autenticación**: Requiere autenticación (cualquier rol)

**Response**: Compra completa con Usuario, Evento, Invitados

---

#### GET /api/Compra/evento/{eventoId}
**Autenticación**: Requiere rol `organizador` o `admin`

**Response**: Lista de compras del evento (para organizador ver ventas)

---

#### PUT /api/Compra/{compraId}/estado
**Autenticación**: Requiere rol `admin` (solo testing)

**Request**:
```json
{
  "nuevoEstado": "pagado",
  "transaccionId": "MP-123456789"
}
```

**Uso**: Para testing. En producción el estado se actualiza vía webhook de MercadoPago.

---

#### POST /api/Compra/webhook
**Autenticación**: Sin autenticación (público para MercadoPago)

**Uso**: Recibe notificaciones de MercadoPago cuando el pago se confirma.

**Estado**: ⚠️ Implementación básica (TODO: integración real MP)

---

## 🔄 Flujo Completo de Compra

```
1. Usuario ve evento público → click "Comprar Entrada"

2. Frontend: POST /api/Compra/crear
   {
     "usuarioId": 1,
     "eventoId": 5,
     "cantidadEntradas": 3,
     "montoTotal": 15000
   }
   ← compraId: 1

3. Frontend: Página "¿Quiénes van a asistir?"
   - Checkbox "Yo voy a asistir" → UsarDatosUsuario = true
   - Campos para otros 2 invitados

4. Frontend: POST /api/Compra/1/agregar-invitados
   { "invitados": [...] }
   ← Invitados creados exitosamente

5. Frontend: Redirige a MercadoPago (TODO FASE 2.1)
   - Crea preferencia de pago
   - Usuario paga

6. MercadoPago: POST /api/Compra/webhook
   - Actualiza estado a "pagado"
   - Incrementa entradas vendidas
   - Envía email confirmación (TODO)

7. Usuario ve entrada en "Mis Entradas" con QR (TODO Frontend)
```

---

## 📊 Reglas de Negocio

### Validación de Capacidad
```csharp
if (evento.CapacidadMaxima.HasValue)
{
    var entradasDisponibles = evento.CapacidadMaxima.Value - evento.EntradasVendidas;
    if (dto.CantidadEntradas > entradasDisponibles)
        throw new Exception($"Solo quedan {entradasDisponibles} entradas disponibles");
}
```

### Incremento de Entradas Vendidas
**SOLO cuando estado = "pagado"**:
```csharp
if (nuevoEstado == "pagado")
{
    var evento = await _context.Events.FindAsync(compra.EventoId);
    evento.EntradasVendidas += compra.CantidadEntradas;
}
```

### Relación Compra → Guests
```
1 Compra con CantidadEntradas = 3
  ↓
Debe crear exactamente 3 Guests:
  - Guest 1: Juan (comprador, UsarDatosUsuario = true)
  - Guest 2: María (invitada)
  - Guest 3: Carlos (invitado)

Todos tienen:
  - CompradoPorUsuarioId = 1
  - CompraId = 1
```

---

## ✅ Testing en Swagger

### Test 1: Crear Compra

**Request**:
```bash
POST http://localhost:5260/api/Compra/crear
Authorization: Bearer {token_comprador}
Content-Type: application/json

{
  "usuarioId": 1,
  "eventoId": 1,
  "cantidadEntradas": 2,
  "montoTotal": 10000
}
```

**Verificar**:
- ✅ Status 200
- ✅ compraId devuelto
- ✅ estado = "pendiente"

---

### Test 2: Agregar Invitados

**Request**:
```bash
POST http://localhost:5260/api/Compra/1/agregar-invitados
Authorization: Bearer {token_comprador}
Content-Type: application/json

{
  "invitados": [
    { "usarDatosUsuario": true },
    {
      "nombre": "María",
      "apellido": "López",
      "dni": 23456789,
      "mail": "maria@example.com"
    }
  ]
}
```

**Verificar**:
- ✅ Status 200
- ✅ 2 invitados creados
- ✅ Primer invitado tiene datos de juan_comprador
- ✅ Ambos tienen CompraId = 1

---

### Test 3: Obtener Mis Compras

**Request**:
```bash
GET http://localhost:5260/api/Compra/mis-compras?usuarioId=1
Authorization: Bearer {token_comprador}
```

**Verificar**:
- ✅ Status 200
- ✅ Lista de compras del usuario
- ✅ Include Evento e Invitados

---

### Test 4: Actualizar Estado (Admin)

**Request**:
```bash
PUT http://localhost:5260/api/Compra/1/estado
Authorization: Bearer {token_admin}
Content-Type: application/json

{
  "nuevoEstado": "pagado",
  "transaccionId": "MP-TEST-123"
}
```

**Verificar**:
- ✅ Status 200
- ✅ estado = "pagado"
- ✅ FechaPago != null
- ✅ evento.EntradasVendidas incrementado

---

## 🚀 Servicios Registrados en DI

**Program.cs**:
```csharp
builder.Services.AddScoped<ICompraRepository, CompraRepository>();
builder.Services.AddScoped<ICompraService, CompraService>();
```

---

## 📝 Próximos Pasos (FASE 2.1)

### Integración MercadoPago

1. **Instalar SDK**:
```bash
dotnet add package MercadoPago.SDK
```

2. **Configurar appsettings.json**:
```json
{
  "MercadoPago": {
    "AccessToken": "APP_USR-...",
    "PublicKey": "APP_USR-..."
  }
}
```

3. **Crear IMercadoPagoService**:
```csharp
public interface IMercadoPagoService
{
    Task<string> CrearPreferenciaAsync(Compra compra);
    Task<bool> ValidarWebhookAsync(dynamic notificacion);
}
```

4. **Endpoint POST /api/Compra/{id}/mercadopago**:
```csharp
[HttpPost("{compraId}/mercadopago")]
public async Task<IActionResult> CrearPreferenciaPago(int compraId)
{
    var compra = await _compraService.ObtenerCompraPorIdAsync(compraId);
    var preferenciaUrl = await _mercadoPagoService.CrearPreferenciaAsync(compra);
    return Ok(new { url = preferenciaUrl });
}
```

5. **Implementar Webhook real**:
```csharp
[HttpPost("webhook")]
public async Task<IActionResult> WebhookMercadoPago([FromBody] dynamic notificacion)
{
    var esValido = await _mercadoPagoService.ValidarWebhookAsync(notificacion);
    if (!esValido) return Unauthorized();

    var compraId = notificacion.external_reference;
    var estado = notificacion.status == "approved" ? "pagado" : "cancelado";

    await _compraService.ActualizarEstadoCompraAsync(compraId, estado, notificacion.id);
    return Ok();
}
```

---

## 📚 Documentación Relacionada

- **FASE1.1-ARQUITECTURA-USER-GUEST-COMPRA.md** - Arquitectura de entidades
- **CLAUDE.md** - Arquitectura general actualizada

---

**Documentado por**: Claude Code
**Fecha**: Octubre 2025
**Estado**: ✅ FASE 2 Backend completada - Pendiente integración MercadoPago
