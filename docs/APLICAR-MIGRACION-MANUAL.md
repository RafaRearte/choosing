# Aplicación Manual de Migración - FASE 1

**Fecha**: Octubre 2025
**Problema**: La migración automática de EF Core falló porque las tablas ya existen
**Solución**: Aplicar cambios manualmente vía SQL

---

## ⚠️ Situación Actual

La migración `AgregarSistemaMultiRol` fue creada exitosamente, pero al intentar aplicarla con `dotnet ef database update` falló con:

```
Microsoft.Data.SqlClient.SqlException: There is already an object named 'Usuarios' in the database.
```

**Razón**: EF Core generó un script que intenta crear las tablas desde cero (CREATE TABLE), pero las tablas `Usuarios`, `Eventos` e `invitados` ya existen en la base de datos.

---

## 🔧 Solución: Aplicación Manual

Vamos a aplicar los cambios SQL manualmente usando el script documentado en `MIGRACION-SQL-FASE1.md`.

### Paso 1: Conectar a la base de datos

```bash
# Opción A: Azure Data Studio / SQL Server Management Studio
# Conectar a: localhost,1433 (Docker SQL Server)
# Database: db_hotel
# User: sa

# Opción B: sqlcmd desde terminal
sqlcmd -S localhost,1433 -U sa -P YourPassword -d db_hotel
```

---

### Paso 2: Aplicar Script 1 - Modificar tabla Usuarios

```sql
USE [db_hotel];
GO

-- Agregar columnas nuevas
ALTER TABLE [dbo].[Usuarios]
ADD [TipoUsuario] NVARCHAR(20) NOT NULL DEFAULT 'comprador';

ALTER TABLE [dbo].[Usuarios]
ADD [Nombre] NVARCHAR(100) NULL;

ALTER TABLE [dbo].[Usuarios]
ADD [Apellido] NVARCHAR(100) NULL;

ALTER TABLE [dbo].[Usuarios]
ADD [Telefono] NVARCHAR(20) NULL;

ALTER TABLE [dbo].[Usuarios]
ADD [FechaRegistro] DATETIME NOT NULL DEFAULT GETDATE();

ALTER TABLE [dbo].[Usuarios]
ADD [Activo] BIT NOT NULL DEFAULT 1;

ALTER TABLE [dbo].[Usuarios]
ADD [UltimoLogin] DATETIME NULL;

-- Crear índices
CREATE NONCLUSTERED INDEX [IX_Usuarios_TipoUsuario]
ON [dbo].[Usuarios] ([TipoUsuario] ASC);

CREATE NONCLUSTERED INDEX [IX_Usuarios_Email]
ON [dbo].[Usuarios] ([Email] ASC);

GO

-- Verificar
SELECT TOP 5 * FROM [dbo].[Usuarios];
```

**Resultado esperado**: Columnas agregadas exitosamente.

---

### Paso 3: Aplicar Script 2 - Crear tabla Organizadores

```sql
USE [db_hotel];
GO

CREATE TABLE [dbo].[Organizadores] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [UsuarioId] INT NOT NULL,
    [NombreEmpresa] NVARCHAR(200) NULL,
    [CuitCuil] NVARCHAR(20) NULL,
    [Direccion] NVARCHAR(MAX) NULL,
    [Provincia] NVARCHAR(100) NULL,
    [Ciudad] NVARCHAR(100) NULL,
    [CodigoPostal] NVARCHAR(10) NULL,
    [PlanSuscripcion] NVARCHAR(20) NOT NULL DEFAULT 'free',
    [FechaInicioPlan] DATETIME NULL,
    [FechaFinPlan] DATETIME NULL,
    [EventosPermitidos] INT NOT NULL DEFAULT 1,
    [Activo] BIT NOT NULL DEFAULT 1,

    CONSTRAINT [PK_Organizadores] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Organizadores_Usuarios]
        FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id])
        ON DELETE CASCADE,
    CONSTRAINT [UQ_Organizadores_UsuarioId] UNIQUE ([UsuarioId])
);

CREATE NONCLUSTERED INDEX [IX_Organizadores_UsuarioId]
ON [dbo].[Organizadores] ([UsuarioId] ASC);

CREATE NONCLUSTERED INDEX [IX_Organizadores_PlanSuscripcion]
ON [dbo].[Organizadores] ([PlanSuscripcion] ASC);

GO

-- Verificar
SELECT * FROM [dbo].[Organizadores];
```

**Resultado esperado**: Tabla creada, 0 filas.

---

### Paso 4: Aplicar Script 3 - Modificar tabla Eventos

```sql
USE [db_hotel];
GO

-- Agregar columnas nuevas
ALTER TABLE [dbo].[Eventos]
ADD [OrganizadorId] INT NULL;

ALTER TABLE [dbo].[Eventos]
ADD [VentaPublica] BIT NOT NULL DEFAULT 0;

ALTER TABLE [dbo].[Eventos]
ADD [PrecioEntrada] DECIMAL(10,2) NULL DEFAULT 0.00;

ALTER TABLE [dbo].[Eventos]
ADD [CapacidadMaxima] INT NULL;

ALTER TABLE [dbo].[Eventos]
ADD [EntradasVendidas] INT NOT NULL DEFAULT 0;

ALTER TABLE [dbo].[Eventos]
ADD [Estado] NVARCHAR(20) NOT NULL DEFAULT 'borrador';

ALTER TABLE [dbo].[Eventos]
ADD [ConfigTabla] NVARCHAR(MAX) NULL;

ALTER TABLE [dbo].[Eventos]
ADD [ConfigEtiqueta] NVARCHAR(MAX) NULL;

-- Agregar foreign key
ALTER TABLE [dbo].[Eventos]
ADD CONSTRAINT [FK_Eventos_Organizadores]
    FOREIGN KEY ([OrganizadorId])
    REFERENCES [dbo].[Organizadores]([Id])
    ON DELETE SET NULL;

-- Crear índices
CREATE NONCLUSTERED INDEX [IX_Eventos_OrganizadorId]
ON [dbo].[Eventos] ([OrganizadorId] ASC);

CREATE NONCLUSTERED INDEX [IX_Eventos_VentaPublica]
ON [dbo].[Eventos] ([VentaPublica] ASC);

CREATE NONCLUSTERED INDEX [IX_Eventos_Estado]
ON [dbo].[Eventos] ([Estado] ASC);

GO

-- Verificar
SELECT TOP 5
    [Id], [Nombre], [OrganizadorId], [VentaPublica],
    [PrecioEntrada], [Estado]
FROM [dbo].[Eventos];
```

**Resultado esperado**: Columnas agregadas exitosamente.

---

### Paso 5: Registrar migración en EF Core

Necesitamos decirle a EF Core que la migración ya fue aplicada manualmente:

```sql
USE [db_hotel];
GO

-- Verificar si la tabla __EFMigrationsHistory existe
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[__EFMigrationsHistory]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[__EFMigrationsHistory] (
        [MigrationId] NVARCHAR(150) NOT NULL,
        [ProductVersion] NVARCHAR(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END
GO

-- Insertar registro de la migración
INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES ('20251010200326_AgregarSistemaMultiRol', '9.0.2');

GO

-- Verificar
SELECT * FROM [dbo].[__EFMigrationsHistory];
```

**Resultado esperado**: Migración registrada.

---

### Paso 6: Verificación Final

```sql
-- 1. Verificar columnas de Usuarios
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Usuarios'
  AND COLUMN_NAME IN ('TipoUsuario', 'Nombre', 'Apellido', 'Telefono', 'FechaRegistro', 'Activo', 'UltimoLogin');

-- 2. Verificar tabla Organizadores existe
SELECT COUNT(*) AS TotalOrganizadores FROM [dbo].[Organizadores];

-- 3. Verificar columnas de Eventos
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Eventos'
  AND COLUMN_NAME IN ('OrganizadorId', 'VentaPublica', 'PrecioEntrada', 'CapacidadMaxima', 'EntradasVendidas', 'Estado');

-- 4. Verificar foreign keys
SELECT
    fk.name AS FK_Name,
    tp.name AS Parent_Table,
    tr.name AS Referenced_Table
FROM sys.foreign_keys fk
INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
WHERE tp.name IN ('Organizadores', 'Eventos')
  AND tr.name IN ('Usuarios', 'Organizadores');
```

**Resultado esperado**:
- ✅ 7 columnas nuevas en Usuarios
- ✅ Tabla Organizadores con 0 filas
- ✅ 8 columnas nuevas en Eventos
- ✅ 2 foreign keys: `FK_Organizadores_Usuarios`, `FK_Eventos_Organizadores`

---

## ✅ Checklist Post-Aplicación

- [ ] Script 1 ejecutado sin errores
- [ ] Script 2 ejecutado sin errores
- [ ] Script 3 ejecutado sin errores
- [ ] Migración registrada en `__EFMigrationsHistory`
- [ ] Verificaciones SQL pasadas
- [ ] `dotnet ef database update` no muestra pendientes

---

## 🧪 Prueba Final: Ejecutar aplicación

```bash
cd /Users/rafarearte/Documents/GitHub/choosing
dotnet run
```

**Esperado**: La aplicación inicia sin errores de base de datos.

Luego acceder a Swagger:
```
http://localhost:5000/swagger
```

---

## 📝 Notas

1. **¿Por qué falló la migración automática?**
   - EF Core no detectó que las tablas ya existían
   - Generó CREATE TABLE en lugar de ALTER TABLE
   - Esto es común cuando se agrega EF Core a una base de datos existente

2. **¿Es segura esta solución?**
   - ✅ Sí, es el método correcto para bases de datos existentes
   - ✅ Los scripts SQL son idénticos a lo que EF Core habría generado correctamente
   - ✅ Registramos la migración para que EF Core no la intente aplicar de nuevo

3. **Para producción**:
   - Usar el mismo script SQL en el servidor de producción
   - Hacer backup antes de aplicar
   - Verificar con las queries del Paso 6

---

**Documentado por**: Claude Code
**Fecha**: Octubre 2025
