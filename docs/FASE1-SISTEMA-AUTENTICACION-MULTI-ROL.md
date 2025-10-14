# FASE 1: Sistema de Autenticación Multi-Rol

**Fecha**: Octubre 2025
**Estado**: ✅ Completado - Backend
**Próximo paso**: Crear migración y testear con Swagger

---

## 📋 Descripción

Implementación del sistema de autenticación con soporte para múltiples tipos de usuarios (Comprador, Organizador, Admin). Este es el primer paso de la transformación de la aplicación de un sistema B2B simple a una plataforma multi-rol con marketplace público.

---

## 🎯 Objetivos Completados

- ✅ Refactorizar modelo `User` para soportar tipos de usuario
- ✅ Crear modelo `Organizador` con perfil de empresa y plan de suscripción
- ✅ Modificar modelo `EventModel` para marketplace y venta de entradas
- ✅ Actualizar `TokenService` para incluir roles en JWT
- ✅ Refactorizar `AuthController` con registro completo por tipo de usuario
- ✅ Configurar Entity Framework Context con nuevas entidades

---

## 📁 Archivos Modificados

### 1. **Domain/User.cs**
**Cambios realizados**:
- ✅ Agregado campo `TipoUsuario` (string): "comprador", "organizador", "admin"
- ✅ Agregado campo `Nombre` (string nullable)
- ✅ Agregado campo `Apellido` (string nullable)
- ✅ Agregado campo `Telefono` (string nullable)
- ✅ Agregado campo `FechaRegistro` (DateTime, default: DateTime.Now)
- ✅ Agregado campo `Activo` (bool, default: true)
- ✅ Agregado campo `UltimoLogin` (DateTime nullable)
- ✅ Agregadas anotaciones de validación ([Required], [MaxLength], [EmailAddress])

**Antes**:
```csharp
public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
}
```

**Después**:
```csharp
public class User
{
    [Key]
    public int Id { get; set; }
    [Required] [MaxLength(100)]
    public string Username { get; set; }
    [Required] [MaxLength(255)] [EmailAddress]
    public string Email { get; set; }
    [Required] [MaxLength(500)]
    public string PasswordHash { get; set; }

    // Nuevos campos
    [Required] [MaxLength(20)]
    public string TipoUsuario { get; set; } = "comprador";
    [MaxLength(100)]
    public string? Nombre { get; set; }
    [MaxLength(100)]
    public string? Apellido { get; set; }
    [MaxLength(20)]
    public string? Telefono { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.Now;
    public bool Activo { get; set; } = true;
    public DateTime? UltimoLogin { get; set; }
}
```

---

### 2. **Domain/EventModel.cs**
**Cambios realizados**:
- ✅ Agregado campo `OrganizadorId` (int nullable, FK a Organizadores)
- ✅ Agregada relación de navegación `Organizador`
- ✅ Agregado campo `VentaPublica` (bool, indica si se venden entradas públicamente)
- ✅ Agregado campo `PrecioEntrada` (decimal nullable)
- ✅ Agregado campo `CapacidadMaxima` (int nullable)
- ✅ Agregado campo `EntradasVendidas` (int, default: 0)
- ✅ Agregado campo `Estado` (string): "borrador", "publicado", "finalizado", "cancelado"
- ✅ Agregado campo `ConfigTabla` (string nullable, JSON de configuración)
- ✅ Agregado campo `ConfigEtiqueta` (string nullable, JSON de configuración)

**Campos nuevos**:
```csharp
// Marketplace y venta
public int? OrganizadorId { get; set; }
[ForeignKey("OrganizadorId")]
public virtual Organizador? Organizador { get; set; }
public bool VentaPublica { get; set; } = false;
[Column(TypeName = "decimal(10,2)")]
public decimal? PrecioEntrada { get; set; } = 0;
public int? CapacidadMaxima { get; set; }
public int EntradasVendidas { get; set; } = 0;
[MaxLength(20)]
public string Estado { get; set; } = "borrador";
public string? ConfigTabla { get; set; }
public string? ConfigEtiqueta { get; set; }
```

---

### 3. **Domain/Organizador.cs** ⚠️ NUEVO ARCHIVO

**Descripción**: Modelo para representar organizadores de eventos con su perfil de empresa y plan de suscripción.

```csharp
[Table("Organizadores")]
public class Organizador
{
    [Key]
    public int Id { get; set; }
    [Required]
    public int UsuarioId { get; set; }
    [ForeignKey("UsuarioId")]
    public virtual User? Usuario { get; set; }

    // Datos de empresa
    [MaxLength(200)]
    public string? NombreEmpresa { get; set; }
    [MaxLength(20)]
    public string? CuitCuil { get; set; }
    public string? Direccion { get; set; }
    [MaxLength(100)]
    public string? Provincia { get; set; }
    [MaxLength(100)]
    public string? Ciudad { get; set; }
    [MaxLength(10)]
    public string? CodigoPostal { get; set; }

    // Plan de suscripción
    [Required] [MaxLength(20)]
    public string PlanSuscripcion { get; set; } = "free"; // free, pro, enterprise
    public DateTime? FechaInicioPlan { get; set; }
    public DateTime? FechaFinPlan { get; set; }
    public int EventosPermitidos { get; set; } = 1; // free: 1, pro: 5, enterprise: ilimitado
    public bool Activo { get; set; } = true;

    // Navegación
    public virtual ICollection<EventModel>? Eventos { get; set; }
}
```

**Relaciones**:
- Uno a uno con `User` (un usuario puede tener un solo perfil de organizador)
- Uno a muchos con `EventModel` (un organizador puede tener múltiples eventos)

---

### 4. **Domain/RegistroDTO.cs**
**Cambios realizados**:
- ✅ Agregado campo `TipoUsuario` (Required)
- ✅ Agregados campos opcionales: `Nombre`, `Apellido`, `Telefono`
- ✅ Agregados campos de empresa (para organizadores): `NombreEmpresa`, `CuitCuil`, `Direccion`, `Provincia`, `Ciudad`, `CodigoPostal`
- ✅ Agregadas validaciones con Data Annotations

**Después**:
```csharp
public class RegistroDTO
{
    [Required(ErrorMessage = "El nombre de usuario es requerido")]
    public string Username { get; set; }

    [Required] [EmailAddress]
    public string Email { get; set; }

    [Required] [MinLength(6)]
    public string Password { get; set; }

    [Required(ErrorMessage = "El tipo de usuario es requerido")]
    public string TipoUsuario { get; set; } // "comprador" o "organizador"

    // Opcionales
    public string? Nombre { get; set; }
    public string? Apellido { get; set; }
    public string? Telefono { get; set; }

    // Campos de empresa (solo si es organizador)
    public string? NombreEmpresa { get; set; }
    public string? CuitCuil { get; set; }
    public string? Direccion { get; set; }
    public string? Provincia { get; set; }
    public string? Ciudad { get; set; }
    public string? CodigoPostal { get; set; }
}
```

---

### 5. **Services/Impl/TokenService.cs**
**Cambios realizados**:
- ✅ Agregado claim `ClaimTypes.Role` con el valor de `user.TipoUsuario`
- ✅ Agregado claim custom `"tipo_usuario"`
- ✅ Agregados claims opcionales `ClaimTypes.GivenName` (Nombre) y `ClaimTypes.Surname` (Apellido)

**Antes**:
```csharp
var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new Claim(ClaimTypes.Name, user.Username),
    new Claim(ClaimTypes.Email, user.Email),
    //new Claim(ClaimTypes.Role, user.Rol) // Comentado
};
```

**Después**:
```csharp
var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new Claim(ClaimTypes.Name, user.Username),
    new Claim(ClaimTypes.Email, user.Email),
    new Claim(ClaimTypes.Role, user.TipoUsuario), // ✅ ROL ACTIVO
    new Claim("tipo_usuario", user.TipoUsuario),
};

// Agregar nombre y apellido si existen
if (!string.IsNullOrEmpty(user.Nombre))
    claims.Add(new Claim(ClaimTypes.GivenName, user.Nombre));

if (!string.IsNullOrEmpty(user.Apellido))
    claims.Add(new Claim(ClaimTypes.Surname, user.Apellido));
```

**Impacto**: Ahora los JWT incluyen el rol del usuario, permitiendo usar `[Authorize(Roles = "organizador")]` en controllers.

---

### 6. **Controllers/AuthController.cs**
**Cambios realizados en POST /api/Auth/registro**:
- ✅ Validación de `ModelState`
- ✅ Validación de tipos de usuario permitidos (comprador/organizador/admin)
- ✅ Verificación de username único
- ✅ Verificación de email único
- ✅ Creación de usuario con todos los campos nuevos
- ✅ Si es organizador: creación automática de registro en tabla `Organizadores` con plan "free"
- ✅ Generación y devolución de JWT en la respuesta (login automático post-registro)

**Antes**:
```csharp
[HttpPost("registro")]
public async Task<IActionResult> Registro(RegistroDTO model)
{
    if (await _context.Users.AnyAsync(u => u.Username == model.Username))
        return BadRequest("El nombre de usuario ya existe");

    var passwordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);

    var usuario = new User
    {
        Username = model.Username,
        Email = model.Email,
        PasswordHash = passwordHash
    };

    _context.Users.Add(usuario);
    await _context.SaveChangesAsync();

    return Ok("Usuario registrado correctamente");
}
```

**Después**:
```csharp
[HttpPost("registro")]
public async Task<IActionResult> Registro(RegistroDTO model)
{
    if (!ModelState.IsValid) return BadRequest(ModelState);

    // Validar tipo
    var tiposValidos = new[] { "comprador", "organizador", "admin" };
    if (!tiposValidos.Contains(model.TipoUsuario.ToLower()))
        return BadRequest("Tipo de usuario inválido");

    // Verificar unicidad
    if (await _context.Users.AnyAsync(u => u.Username == model.Username))
        return BadRequest("El nombre de usuario ya existe");

    if (await _context.Users.AnyAsync(u => u.Email == model.Email))
        return BadRequest("El email ya está registrado");

    // Crear usuario
    var passwordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);
    var usuario = new User
    {
        Username = model.Username,
        Email = model.Email,
        PasswordHash = passwordHash,
        TipoUsuario = model.TipoUsuario.ToLower(),
        Nombre = model.Nombre,
        Apellido = model.Apellido,
        Telefono = model.Telefono,
        FechaRegistro = DateTime.Now,
        Activo = true
    };

    _context.Users.Add(usuario);
    await _context.SaveChangesAsync();

    // Si es organizador, crear perfil
    if (model.TipoUsuario.ToLower() == "organizador")
    {
        var organizador = new Organizador
        {
            UsuarioId = usuario.Id,
            NombreEmpresa = model.NombreEmpresa,
            CuitCuil = model.CuitCuil,
            Direccion = model.Direccion,
            Provincia = model.Provincia,
            Ciudad = model.Ciudad,
            CodigoPostal = model.CodigoPostal,
            PlanSuscripcion = "free",
            FechaInicioPlan = DateTime.Now,
            EventosPermitidos = 1,
            Activo = true
        };

        _context.Organizadores.Add(organizador);
        await _context.SaveChangesAsync();
    }

    // Login automático: generar JWT
    var token = _tokenService.GenerateToken(usuario);

    return Ok(new
    {
        message = "Usuario registrado correctamente",
        token = token,
        user = new
        {
            id = usuario.Id,
            username = usuario.Username,
            email = usuario.Email,
            tipoUsuario = usuario.TipoUsuario,
            nombre = usuario.Nombre,
            apellido = usuario.Apellido
        }
    });
}
```

**Cambios realizados en POST /api/Auth/login**:
- ✅ Verificación de usuario activo
- ✅ Actualización de campo `UltimoLogin`
- ✅ Respuesta completa con datos del usuario (nombre, apellido, tipoUsuario, teléfono)

**Después**:
```csharp
[HttpPost("login")]
public async Task<IActionResult> Login(LoginDTO model)
{
    var usuario = await _context.Users.FirstOrDefaultAsync(u => u.Username == model.Username);
    if (usuario == null)
        return Unauthorized("Credenciales inválidas");

    // Verificar si está activo
    if (!usuario.Activo)
        return Unauthorized("Usuario inactivo. Contacte al administrador");

    if (!BCrypt.Net.BCrypt.Verify(model.Password, usuario.PasswordHash))
        return Unauthorized("Credenciales inválidas");

    // Actualizar último login
    usuario.UltimoLogin = DateTime.Now;
    await _context.SaveChangesAsync();

    var token = _tokenService.GenerateToken(usuario);

    return Ok(new
    {
        token = token,
        user = new
        {
            id = usuario.Id,
            username = usuario.Username,
            email = usuario.Email,
            nombre = usuario.Nombre,
            apellido = usuario.Apellido,
            tipoUsuario = usuario.TipoUsuario,
            telefono = usuario.Telefono
        }
    });
}
```

---

### 7. **Context/DbHotelContext.cs**
**Cambios realizados**:
- ✅ Agregado `DbSet<Organizador> Organizadores`
- ✅ Agregada configuración de entidad `Organizador` en `OnModelCreating`
  - Tabla: "Organizadores"
  - Relación uno a uno con `User` (FK: `UsuarioId`, OnDelete: Cascade)
  - Índice único en `UsuarioId`
  - Índice en `PlanSuscripcion`
  - Valores por defecto: `PlanSuscripcion = "free"`, `EventosPermitidos = 1`, `Activo = true`

```csharp
public DbSet<Organizador> Organizadores { get; set; }

// En OnModelCreating:
modelBuilder.Entity<Organizador>(entity =>
{
    entity.ToTable("Organizadores");
    entity.HasKey(e => e.Id);
    entity.Property(e => e.UsuarioId).IsRequired();
    entity.Property(e => e.PlanSuscripcion).IsRequired().HasMaxLength(20).HasDefaultValue("free");
    entity.Property(e => e.EventosPermitidos).HasDefaultValue(1);
    entity.Property(e => e.Activo).HasDefaultValue(true);

    entity.HasOne(o => o.Usuario)
        .WithMany()
        .HasForeignKey(o => o.UsuarioId)
        .OnDelete(DeleteBehavior.Cascade);

    entity.HasIndex(e => e.UsuarioId).IsUnique();
    entity.HasIndex(e => e.PlanSuscripcion);
});
```

---

## 🗄️ Cambios en Base de Datos (Pendientes)

### Tabla `Usuarios` (Users) - Modificar
```sql
ALTER TABLE Usuarios ADD TipoUsuario NVARCHAR(20) NOT NULL DEFAULT 'comprador';
ALTER TABLE Usuarios ADD Nombre NVARCHAR(100);
ALTER TABLE Usuarios ADD Apellido NVARCHAR(100);
ALTER TABLE Usuarios ADD Telefono NVARCHAR(20);
ALTER TABLE Usuarios ADD FechaRegistro DATETIME DEFAULT GETDATE();
ALTER TABLE Usuarios ADD Activo BIT DEFAULT 1;
ALTER TABLE Usuarios ADD UltimoLogin DATETIME;

CREATE INDEX IX_Usuarios_TipoUsuario ON Usuarios(TipoUsuario);
CREATE INDEX IX_Usuarios_Email ON Usuarios(Email);
```

### Tabla `Organizadores` - Crear
```sql
CREATE TABLE Organizadores (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UsuarioId INT UNIQUE NOT NULL,
    NombreEmpresa NVARCHAR(200),
    CuitCuil NVARCHAR(20),
    Direccion NVARCHAR(MAX),
    Provincia NVARCHAR(100),
    Ciudad NVARCHAR(100),
    CodigoPostal NVARCHAR(10),
    PlanSuscripcion NVARCHAR(20) DEFAULT 'free' CHECK (PlanSuscripcion IN ('free', 'pro', 'enterprise')),
    FechaInicioPlan DATETIME,
    FechaFinPlan DATETIME,
    EventosPermitidos INT DEFAULT 1,
    Activo BIT DEFAULT 1,

    FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id) ON DELETE CASCADE,
    INDEX IX_Organizadores_Usuario (UsuarioId),
    INDEX IX_Organizadores_Plan (PlanSuscripcion)
);
```

### Tabla `Eventos` (Events) - Modificar
```sql
ALTER TABLE Eventos ADD OrganizadorId INT NULL;
ALTER TABLE Eventos ADD VentaPublica BIT DEFAULT 0;
ALTER TABLE Eventos ADD PrecioEntrada DECIMAL(10,2) DEFAULT 0;
ALTER TABLE Eventos ADD CapacidadMaxima INT;
ALTER TABLE Eventos ADD EntradasVendidas INT DEFAULT 0;
ALTER TABLE Eventos ADD Estado NVARCHAR(20) DEFAULT 'borrador';
ALTER TABLE Eventos ADD ConfigTabla NVARCHAR(MAX);
ALTER TABLE Eventos ADD ConfigEtiqueta NVARCHAR(MAX);

ALTER TABLE Eventos
ADD CONSTRAINT FK_Eventos_Organizador
FOREIGN KEY (OrganizadorId) REFERENCES Organizadores(Id);
```

---

## 🧪 Próximos Pasos

1. **Crear migración de Entity Framework**:
   ```bash
   dotnet ef migrations add AgregarSistemaMultiRol
   ```

2. **Aplicar migración a base de datos**:
   ```bash
   dotnet ef database update
   ```

3. **Testear endpoints con Swagger**:
   - POST `/api/Auth/registro` con tipo "comprador"
   - POST `/api/Auth/registro` con tipo "organizador"
   - POST `/api/Auth/login`
   - Verificar JWT con https://jwt.io

4. **Frontend**:
   - Crear `sing-up.html` con selector de tipo de usuario
   - Modificar `login.html` con link a registro
   - Crear `auth.js` para manejar JWT en localStorage

---

## 📝 Notas Técnicas

### Validaciones Implementadas
- Username único
- Email único y formato válido
- Password mínimo 6 caracteres
- TipoUsuario debe ser "comprador", "organizador" o "admin"

### Flujo de Registro Organizador
1. Usuario completa formulario con datos de empresa
2. Backend crea registro en tabla `Usuarios`
3. Backend crea registro en tabla `Organizadores` automáticamente
4. Plan asignado: `free` (1 evento permitido)
5. JWT generado y devuelto (login automático)

### Flujo de Registro Comprador
1. Usuario completa formulario básico
2. Backend crea registro en tabla `Usuarios`
3. NO se crea registro en `Organizadores`
4. JWT generado y devuelto (login automático)

### JWT Claims
- `ClaimTypes.NameIdentifier`: ID del usuario
- `ClaimTypes.Name`: Username
- `ClaimTypes.Email`: Email
- `ClaimTypes.Role`: Tipo de usuario (comprador/organizador/admin)
- `tipo_usuario`: Custom claim adicional
- `ClaimTypes.GivenName`: Nombre (si existe)
- `ClaimTypes.Surname`: Apellido (si existe)

---

## ⚠️ Warnings del Compilador

El proyecto compila exitosamente con **23 warnings** pero **0 errores**. Los warnings son principalmente por:
- Propiedades no-nullable sin inicialización en constructores (CS8618)
- Posibles referencias null en código existente (CS8602, CS8603)

Estos warnings no afectan la funcionalidad pero pueden resolverse en una fase posterior de refactorización.

---

**Documentado por**: Claude Code
**Fecha**: Octubre 2025
