# FASE 1.1: Arquitectura User - Guest - Compra

**Fecha**: Octubre 2025
**Objetivo**: Separar correctamente las entidades de autenticación (User), asistencia a eventos (Guest) y transacciones (Compra)

---

## 🎯 Problema que Resuelve

### Situación Anterior
- **User** mezclaba autenticación con asistencia a eventos
- **Guest** (Invitado) no tenía relación con quien compró la entrada
- No había registro de transacciones/compras
- Un comprador no podía comprar entradas para otras personas

### Situación Nueva
- **User**: Solo autenticación + perfil completo
- **Guest**: Asistente a un evento (puede o no estar asociado a un User)
- **Compra**: Transacción que vincula User + Evento + múltiples Guests

---

## 📐 Arquitectura de Entidades

```
┌─────────────────┐
│      User       │  (Autenticación + Perfil)
│  (Usuarios)     │
├─────────────────┤
│ Id              │
│ Username        │
│ Email           │
│ PasswordHash    │
│ TipoUsuario     │◄──── "comprador", "organizador", "admin"
│ Nombre          │
│ Apellido        │
│ Telefono        │
│ Dni             │  ◄─┐
│ Direccion       │    │ FASE 1.1: Campos adicionales
│ Ciudad          │    │ para auto-completar al comprar
│ Provincia       │    │
│ CodigoPostal    │    │
│ FechaNacimiento │  ◄─┘
│ FechaRegistro   │
│ Activo          │
│ UltimoLogin     │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│     Compra      │  (Transacción de compra)
│   (Compras)     │
├─────────────────┤
│ Id              │
│ UsuarioId       │──► FK a User (quien compra)
│ EventoId        │──► FK a Evento
│ FechaCompra     │
│ CantidadEntradas│
│ MontoTotal      │
│ Estado          │ (pendiente, pagado, cancelado)
│ MetodoPago      │
│ TransaccionId   │  (ID MercadoPago)
│ FechaPago       │
│ NotasInternas   │
└────────┬────────┘
         │
         │ 1:N
         │
┌────────▼────────┐
│      Guest      │  (Asistente a evento)
│   (invitados)   │
├─────────────────┤
│ Id              │
│ EventoId        │──► FK a Evento
│ Nombre          │
│ Apellido        │
│ Dni             │
│ Mail            │
│ Telefono        │
│ Categoria       │
│ Empresa         │
│ ...             │
│                 │
│ CompradoPorUsuarioId │──► FK a User (nullable)
│ CompraId        │──► FK a Compra (nullable)
│ FechaCreacion   │
│ Confirmado      │
└─────────────────┘

┌─────────────────┐
│  Organizador    │
│ (Organizadores) │
├─────────────────┤
│ Id              │
│ UsuarioId       │──► FK a User (1:1)
│ NombreEmpresa   │
│ CuitCuil        │
│ Direccion       │
│ Provincia       │
│ Ciudad          │
│ CodigoPostal    │
│ PlanSuscripcion │
│ EventosPermitidos│
└─────────────────┘
```

---

## 🔄 Flujos de Uso

### Flujo 1: Comprador registra y compra entradas para sí mismo

```
1. Usuario se registra como "comprador"
   → Se crea User con TipoUsuario = "comprador"
   → Se completan datos de perfil (nombre, apellido, DNI, etc.)

2. Usuario compra 1 entrada para el Evento X
   → Se crea Compra:
     - UsuarioId = 1
     - EventoId = X
     - CantidadEntradas = 1
     - MontoTotal = $5000
     - Estado = "pendiente"

3. Sistema autocompleta datos del invitado desde User
   → Se crea Guest (invitado):
     - EventoId = X
     - Nombre = "Juan" (desde User.Nombre)
     - Apellido = "Pérez" (desde User.Apellido)
     - Dni = "12345678" (desde User.Dni)
     - CompradoPorUsuarioId = 1
     - CompraId = 1
     - Confirmado = true

4. Usuario paga con MercadoPago
   → Se actualiza Compra:
     - Estado = "pagado"
     - MetodoPago = "mercadopago"
     - TransaccionId = "MP-123456"
     - FechaPago = "2025-10-10 15:30:00"
```

---

### Flujo 2: Comprador compra múltiples entradas

```
1. Usuario logueado (Juan, UsuarioId = 1) compra 3 entradas

2. Se crea Compra:
   - UsuarioId = 1
   - EventoId = X
   - CantidadEntradas = 3
   - MontoTotal = $15000
   - Estado = "pendiente"

3. Sistema pregunta: ¿Quiénes van a asistir?

4. Se crean 3 Guests:

   Guest #1 (Juan - comprador):
   - Nombre = "Juan"
   - Apellido = "Pérez"
   - Dni = "12345678" (autocompletado desde User)
   - CompradoPorUsuarioId = 1
   - CompraId = 1

   Guest #2 (Novia de Juan):
   - Nombre = "María"
   - Apellido = "López"
   - Dni = "23456789" (ingresado manualmente)
   - CompradoPorUsuarioId = 1
   - CompraId = 1

   Guest #3 (Amigo de Juan):
   - Nombre = "Carlos"
   - Apellido = "Gómez"
   - Dni = "34567890" (ingresado manualmente)
   - CompradoPorUsuarioId = 1
   - CompraId = 1
```

---

### Flujo 3: Organizador agrega invitados manualmente

```
1. Organizador (María, UsuarioId = 2, TipoUsuario = "organizador")
   crea Evento Y

2. Organizador decide invitar a 5 VIPs sin que paguen

3. Se crean 5 Guests:
   - EventoId = Y
   - Nombre, Apellido, DNI (ingresados manualmente)
   - CompradoPorUsuarioId = NULL  ◄── No hay User comprador
   - CompraId = NULL              ◄── No hay compra
   - Confirmado = false (hasta que confirmen asistencia)
```

---

## 💾 Cambios en Base de Datos

### Tabla: Usuarios (modificada)

**Nuevas columnas agregadas**:
```sql
ALTER TABLE [Usuarios] ADD [Dni] NVARCHAR(20) NULL;
ALTER TABLE [Usuarios] ADD [Direccion] NVARCHAR(200) NULL;
ALTER TABLE [Usuarios] ADD [Ciudad] NVARCHAR(100) NULL;
ALTER TABLE [Usuarios] ADD [Provincia] NVARCHAR(100) NULL;
ALTER TABLE [Usuarios] ADD [CodigoPostal] NVARCHAR(10) NULL;
ALTER TABLE [Usuarios] ADD [FechaNacimiento] DATETIME2 NULL;
```

**Propósito**: Permitir al comprador completar su perfil una sola vez y autocompletar datos al comprar entradas.

---

### Tabla: Compras (nueva)

```sql
CREATE TABLE [Compras] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [UsuarioId] INT NOT NULL,
    [EventoId] INT NOT NULL,
    [FechaCompra] DATETIME2 NOT NULL DEFAULT GETDATE(),
    [CantidadEntradas] INT NOT NULL,
    [MontoTotal] DECIMAL(10,2) NOT NULL,
    [Estado] NVARCHAR(50) NOT NULL DEFAULT 'pendiente',
    [MetodoPago] NVARCHAR(100) NULL,
    [TransaccionId] NVARCHAR(200) NULL,
    [FechaPago] DATETIME2 NULL,
    [NotasInternas] NVARCHAR(MAX) NULL,

    CONSTRAINT [PK_Compras] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Compras_Usuarios_UsuarioId]
        FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios]([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Compras_Eventos_EventoId]
        FOREIGN KEY ([EventoId]) REFERENCES [Eventos]([Id]) ON DELETE NO ACTION
);

CREATE INDEX [IX_Compras_UsuarioId] ON [Compras]([UsuarioId]);
CREATE INDEX [IX_Compras_EventoId] ON [Compras]([EventoId]);
CREATE INDEX [IX_Compras_Estado] ON [Compras]([Estado]);
CREATE INDEX [IX_Compras_FechaCompra] ON [Compras]([FechaCompra]);
```

**Propósito**:
- Trackear transacciones de compra
- Vincular User con Evento
- Registrar estado de pago (pendiente, pagado, cancelado)
- Guardar datos de MercadoPago (TransaccionId)

---

### Tabla: invitados (modificada)

**Nuevas columnas agregadas**:
```sql
ALTER TABLE [invitados] ADD [CompradoPorUsuarioId] INT NULL;
ALTER TABLE [invitados] ADD [CompraId] INT NULL;
ALTER TABLE [invitados] ADD [FechaCreacion] DATETIME2 NULL;
ALTER TABLE [invitados] ADD [Confirmado] BIT NOT NULL DEFAULT 0;

CREATE INDEX [IX_invitados_CompradoPorUsuarioId] ON [invitados]([CompradoPorUsuarioId]);
CREATE INDEX [IX_invitados_CompraId] ON [invitados]([CompraId]);

ALTER TABLE [invitados]
    ADD CONSTRAINT [FK_invitados_Usuarios_CompradoPorUsuarioId]
    FOREIGN KEY ([CompradoPorUsuarioId]) REFERENCES [Usuarios]([Id]);

ALTER TABLE [invitados]
    ADD CONSTRAINT [FK_invitados_Compras_CompraId]
    FOREIGN KEY ([CompraId]) REFERENCES [Compras]([Id]) ON DELETE SET NULL;
```

**Propósito**:
- `CompradoPorUsuarioId`: Saber quién compró esta entrada (nullable para invitados manuales)
- `CompraId`: Agrupar invitados de la misma transacción
- `FechaCreacion`: Timestamp de cuándo se agregó el invitado
- `Confirmado`: Si el invitado confirmó asistencia

---

## 📝 Cambios en Código

### Domain/User.cs

**Agregados**:
```csharp
// Campos adicionales de perfil
[MaxLength(20)]
public string? Dni { get; set; }

[MaxLength(200)]
public string? Direccion { get; set; }

[MaxLength(100)]
public string? Ciudad { get; set; }

[MaxLength(100)]
public string? Provincia { get; set; }

[MaxLength(10)]
public string? CodigoPostal { get; set; }

public DateTime? FechaNacimiento { get; set; }

// Relación inversa
public virtual ICollection<Compra>? Compras { get; set; }
```

---

### Domain/Guest.cs (invitados)

**Agregados**:
```csharp
// Relación con User comprador
public int? CompradoPorUsuarioId { get; set; }
[ForeignKey("CompradoPorUsuarioId")]
public virtual User? CompradoPor { get; set; }

// Relación con Compra
public int? CompraId { get; set; }
[ForeignKey("CompraId")]
public virtual Compra? Compra { get; set; }

public DateTime? FechaCreacion { get; set; }
public bool Confirmado { get; set; } = false;
```

---

### Domain/Compra.cs (NUEVO)

**Archivo completo**:
```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace choosing.Domain
{
    [Table("Compras")]
    public class Compra
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int UsuarioId { get; set; }
        [ForeignKey("UsuarioId")]
        public virtual User? Usuario { get; set; }

        [Required]
        public int EventoId { get; set; }
        [ForeignKey("EventoId")]
        public virtual EventModel? Evento { get; set; }

        [Required]
        public DateTime FechaCompra { get; set; } = DateTime.Now;

        [Required]
        public int CantidadEntradas { get; set; }

        [Required]
        [Column(TypeName = "decimal(10,2)")]
        public decimal MontoTotal { get; set; }

        [MaxLength(50)]
        public string Estado { get; set; } = "pendiente";
        // pendiente, pagado, cancelado, reembolsado

        // Datos de pago
        [MaxLength(100)]
        public string? MetodoPago { get; set; }

        [MaxLength(200)]
        public string? TransaccionId { get; set; }

        public DateTime? FechaPago { get; set; }

        // Relación inversa
        public virtual ICollection<Guest>? Invitados { get; set; }

        public string? NotasInternas { get; set; }
    }
}
```

---

### Context/DbHotelContext.cs

**Agregados**:

1. DbSet:
```csharp
public DbSet<Compra> Compras { get; set; }
```

2. Configuración en OnModelCreating:
```csharp
modelBuilder.Entity<Compra>(entity =>
{
    entity.ToTable("Compras");
    entity.HasKey(e => e.Id);
    entity.Property(e => e.UsuarioId).IsRequired();
    entity.Property(e => e.EventoId).IsRequired();
    entity.Property(e => e.FechaCompra).IsRequired().HasDefaultValueSql("GETDATE()");
    entity.Property(e => e.CantidadEntradas).IsRequired();
    entity.Property(e => e.MontoTotal).IsRequired().HasColumnType("decimal(10,2)");
    entity.Property(e => e.Estado).IsRequired().HasMaxLength(50).HasDefaultValue("pendiente");
    entity.Property(e => e.MetodoPago).HasMaxLength(100);
    entity.Property(e => e.TransaccionId).HasMaxLength(200);

    // Relación con User
    entity.HasOne(c => c.Usuario)
        .WithMany(u => u.Compras)
        .HasForeignKey(c => c.UsuarioId)
        .OnDelete(DeleteBehavior.Restrict);

    // Relación con Evento
    entity.HasOne(c => c.Evento)
        .WithMany()
        .HasForeignKey(c => c.EventoId)
        .OnDelete(DeleteBehavior.Restrict);

    // Relación inversa con Invitados
    entity.HasMany(c => c.Invitados)
        .WithOne(g => g.Compra)
        .HasForeignKey(g => g.CompraId)
        .OnDelete(DeleteBehavior.SetNull);

    // Índices
    entity.HasIndex(e => e.UsuarioId);
    entity.HasIndex(e => e.EventoId);
    entity.HasIndex(e => e.Estado);
    entity.HasIndex(e => e.FechaCompra);
});
```

---

## ✅ Beneficios de esta Arquitectura

### 1. Separación de Responsabilidades
- **User**: Solo autenticación y perfil
- **Guest**: Solo asistencia a eventos
- **Compra**: Solo transacciones

### 2. Flexibilidad
- ✅ Un comprador puede comprar para sí mismo
- ✅ Un comprador puede comprar para otras personas
- ✅ Un organizador puede invitar sin compra
- ✅ Se puede trackear quién pagó cada entrada

### 3. UX Mejorada
- Usuario completa perfil **una sola vez**
- Sistema autocompleta datos al comprar
- No es necesario re-ingresar nombre/DNI cada vez

### 4. Trazabilidad
- Historial completo de compras por usuario
- Seguimiento de estado de pago
- Vinculación con MercadoPago (TransaccionId)

### 5. Escalabilidad
- Fácil agregar descuentos/cupones a Compra
- Fácil implementar reembolsos (cambiar Estado)
- Fácil generar reportes de ventas

---

## 🔮 Próximos Pasos (FASE 2)

1. **Crear endpoint POST `/api/Compra/crear`**
   - Recibe: UsuarioId, EventoId, CantidadEntradas
   - Devuelve: CompraId y link de pago MercadoPago

2. **Crear endpoint POST `/api/Compra/{compraId}/invitados`**
   - Recibe: Array de invitados
   - Autocompleta primer invitado con datos de User
   - Permite agregar invitados adicionales

3. **Webhook MercadoPago**
   - Actualiza Estado de Compra cuando pago se confirma
   - Envía email de confirmación con QR de entradas

4. **Frontend: Checkout Flow**
   - Página de selección de cantidad de entradas
   - Página de datos de invitados (autocompletado)
   - Redirección a MercadoPago
   - Página de confirmación

---

## 📊 Diagrama de Relaciones Final

```
User (Usuarios)
  │
  ├─► 1:N Compras
  │       │
  │       └─► 1:N Guests (invitados comprados)
  │
  └─► 1:1 Organizador (solo si TipoUsuario = "organizador")
          │
          └─► 1:N Eventos
                  │
                  └─► 1:N Guests (invitados manuales del organizador)
```

---

**Documentado por**: Claude Code
**Fecha**: Octubre 2025
**Migración**: `20251010203245_AgregarSistemaComprasYPerfilExtendido`
