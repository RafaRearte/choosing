# Script SQL - Migración FASE 1: Sistema Multi-Rol

**Fecha**: Octubre 2025
**Migración EF Core**: `AgregarSistemaMultiRol`
**Base de datos**: SQL Server
**Objetivo**: Transformar sistema B2B simple a plataforma multi-rol

---

## ⚠️ IMPORTANTE - ANTES DE EJECUTAR

1. **Hacer backup completo de la base de datos**:
   ```sql
   BACKUP DATABASE [db_hotel]
   TO DISK = 'C:\Backups\db_hotel_backup_antes_fase1.bak'
   WITH FORMAT, INIT, NAME = 'Backup antes FASE 1';
   ```

2. **Verificar que no hay conexiones activas**:
   ```sql
   USE master;
   GO
   ALTER DATABASE [db_hotel] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
   ALTER DATABASE [db_hotel] SET MULTI_USER;
   GO
   ```

3. **Ejecutar scripts en orden**

---

## 📋 SCRIPT 1: Modificar Tabla `Usuarios` (Users)

### Agregar columnas nuevas

```sql
USE [db_hotel];
GO

-- Agregar campo TipoUsuario (obligatorio)
ALTER TABLE [dbo].[Usuarios]
ADD [TipoUsuario] NVARCHAR(20) NOT NULL DEFAULT 'comprador'
    CONSTRAINT CK_Usuarios_TipoUsuario CHECK ([TipoUsuario] IN ('comprador', 'organizador', 'admin'));

-- Agregar campos de información personal (opcionales)
ALTER TABLE [dbo].[Usuarios]
ADD [Nombre] NVARCHAR(100) NULL;

ALTER TABLE [dbo].[Usuarios]
ADD [Apellido] NVARCHAR(100) NULL;

ALTER TABLE [dbo].[Usuarios]
ADD [Telefono] NVARCHAR(20) NULL;

-- Agregar campos de auditoría
ALTER TABLE [dbo].[Usuarios]
ADD [FechaRegistro] DATETIME NOT NULL DEFAULT GETDATE();

ALTER TABLE [dbo].[Usuarios]
ADD [Activo] BIT NOT NULL DEFAULT 1;

ALTER TABLE [dbo].[Usuarios]
ADD [UltimoLogin] DATETIME NULL;

GO
```

### Crear índices

```sql
-- Índice en TipoUsuario para filtros rápidos
CREATE NONCLUSTERED INDEX [IX_Usuarios_TipoUsuario]
ON [dbo].[Usuarios] ([TipoUsuario] ASC);

-- Índice en Email para búsquedas rápidas
CREATE NONCLUSTERED INDEX [IX_Usuarios_Email]
ON [dbo].[Usuarios] ([Email] ASC);

-- Índice en FechaRegistro para reportes
CREATE NONCLUSTERED INDEX [IX_Usuarios_FechaRegistro]
ON [dbo].[Usuarios] ([FechaRegistro] DESC);

GO
```

### Actualizar datos existentes (opcional)

```sql
-- Marcar usuarios existentes como 'organizador' si ya tienen eventos
UPDATE [dbo].[Usuarios]
SET [TipoUsuario] = 'organizador'
WHERE [Id] IN (
    SELECT DISTINCT [OrganizadorId]
    FROM [dbo].[Eventos]
    WHERE [OrganizadorId] IS NOT NULL
);

-- Marcar el primer usuario como admin
UPDATE [dbo].[Usuarios]
SET [TipoUsuario] = 'admin'
WHERE [Id] = 1;

GO
```

---

## 📋 SCRIPT 2: Crear Tabla `Organizadores`

```sql
USE [db_hotel];
GO

CREATE TABLE [dbo].[Organizadores] (
    [Id] INT IDENTITY(1,1) NOT NULL,
    [UsuarioId] INT NOT NULL,

    -- Datos de empresa
    [NombreEmpresa] NVARCHAR(200) NULL,
    [CuitCuil] NVARCHAR(20) NULL,
    [Direccion] NVARCHAR(MAX) NULL,
    [Provincia] NVARCHAR(100) NULL,
    [Ciudad] NVARCHAR(100) NULL,
    [CodigoPostal] NVARCHAR(10) NULL,

    -- Plan de suscripción
    [PlanSuscripcion] NVARCHAR(20) NOT NULL DEFAULT 'free'
        CONSTRAINT CK_Organizadores_PlanSuscripcion
        CHECK ([PlanSuscripcion] IN ('free', 'pro', 'enterprise')),
    [FechaInicioPlan] DATETIME NULL,
    [FechaFinPlan] DATETIME NULL,
    [EventosPermitidos] INT NOT NULL DEFAULT 1,
    [Activo] BIT NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT [PK_Organizadores] PRIMARY KEY CLUSTERED ([Id] ASC),
    CONSTRAINT [FK_Organizadores_Usuarios]
        FOREIGN KEY ([UsuarioId]) REFERENCES [dbo].[Usuarios]([Id])
        ON DELETE CASCADE,
    CONSTRAINT [UQ_Organizadores_UsuarioId] UNIQUE ([UsuarioId])
);

GO
```

### Crear índices en Organizadores

```sql
-- Índice en UsuarioId (ya cubierto por UNIQUE constraint)
CREATE NONCLUSTERED INDEX [IX_Organizadores_UsuarioId]
ON [dbo].[Organizadores] ([UsuarioId] ASC);

-- Índice en PlanSuscripcion para reportes
CREATE NONCLUSTERED INDEX [IX_Organizadores_PlanSuscripcion]
ON [dbo].[Organizadores] ([PlanSuscripcion] ASC);

-- Índice en Activo para filtros
CREATE NONCLUSTERED INDEX [IX_Organizadores_Activo]
ON [dbo].[Organizadores] ([Activo] ASC);

GO
```

### Migrar datos existentes a Organizadores (opcional)

```sql
-- Crear registros de organizadores para usuarios existentes tipo 'organizador'
INSERT INTO [dbo].[Organizadores]
    ([UsuarioId], [PlanSuscripcion], [FechaInicioPlan], [EventosPermitidos], [Activo])
SELECT
    u.[Id] AS [UsuarioId],
    'free' AS [PlanSuscripcion],
    u.[FechaRegistro] AS [FechaInicioPlan],
    CASE
        WHEN COUNT(e.[Id]) > 5 THEN 999 -- Ilimitado para usuarios con muchos eventos
        WHEN COUNT(e.[Id]) > 1 THEN 5   -- Plan Pro
        ELSE 1                           -- Plan Free
    END AS [EventosPermitidos],
    1 AS [Activo]
FROM [dbo].[Usuarios] u
LEFT JOIN [dbo].[Eventos] e ON e.[OrganizadorId] = u.[Id]
WHERE u.[TipoUsuario] = 'organizador'
GROUP BY u.[Id], u.[FechaRegistro];

GO
```

---

## 📋 SCRIPT 3: Modificar Tabla `Eventos` (Events)

### Agregar columnas nuevas

```sql
USE [db_hotel];
GO

-- Columna OrganizadorId (relación con tabla Organizadores)
ALTER TABLE [dbo].[Eventos]
ADD [OrganizadorId] INT NULL;

-- Columnas para marketplace y venta de entradas
ALTER TABLE [dbo].[Eventos]
ADD [VentaPublica] BIT NOT NULL DEFAULT 0;

ALTER TABLE [dbo].[Eventos]
ADD [PrecioEntrada] DECIMAL(10,2) NULL DEFAULT 0.00;

ALTER TABLE [dbo].[Eventos]
ADD [CapacidadMaxima] INT NULL;

ALTER TABLE [dbo].[Eventos]
ADD [EntradasVendidas] INT NOT NULL DEFAULT 0;

ALTER TABLE [dbo].[Eventos]
ADD [Estado] NVARCHAR(20) NOT NULL DEFAULT 'borrador'
    CONSTRAINT CK_Eventos_Estado
    CHECK ([Estado] IN ('borrador', 'publicado', 'finalizado', 'cancelado'));

-- Columnas de configuración JSON
ALTER TABLE [dbo].[Eventos]
ADD [ConfigTabla] NVARCHAR(MAX) NULL;

ALTER TABLE [dbo].[Eventos]
ADD [ConfigEtiqueta] NVARCHAR(MAX) NULL;

GO
```

### Agregar foreign key a Organizadores

```sql
ALTER TABLE [dbo].[Eventos]
ADD CONSTRAINT [FK_Eventos_Organizadores]
    FOREIGN KEY ([OrganizadorId])
    REFERENCES [dbo].[Organizadores]([Id])
    ON DELETE SET NULL; -- Si se elimina organizador, eventos quedan huérfanos

GO
```

### Crear índices en Eventos

```sql
-- Índice en OrganizadorId para filtrar eventos por organizador
CREATE NONCLUSTERED INDEX [IX_Eventos_OrganizadorId]
ON [dbo].[Eventos] ([OrganizadorId] ASC);

-- Índice en VentaPublica para marketplace
CREATE NONCLUSTERED INDEX [IX_Eventos_VentaPublica]
ON [dbo].[Eventos] ([VentaPublica] ASC);

-- Índice en Estado para filtros
CREATE NONCLUSTERED INDEX [IX_Eventos_Estado]
ON [dbo].[Eventos] ([Estado] ASC);

-- Índice compuesto para eventos públicos activos
CREATE NONCLUSTERED INDEX [IX_Eventos_PublicosActivos]
ON [dbo].[Eventos] ([VentaPublica] ASC, [Activo] ASC, [FechaInicio] ASC);

GO
```

### Actualizar eventos existentes (opcional)

```sql
-- Asignar organizador a eventos existentes basándose en alguna lógica
-- (Ejemplo: si hay un campo CreatedBy o similar)

-- Marcar eventos con fecha pasada como 'finalizado'
UPDATE [dbo].[Eventos]
SET [Estado] = 'finalizado'
WHERE [FechaFin] < GETDATE();

-- Marcar eventos actuales como 'publicado'
UPDATE [dbo].[Eventos]
SET [Estado] = 'publicado'
WHERE [FechaInicio] <= GETDATE()
  AND [FechaFin] >= GETDATE()
  AND [Activo] = 1;

GO
```

---

## 📋 SCRIPT 4: Verificación Post-Migración

### Verificar estructura de tablas

```sql
-- Verificar columnas de Usuarios
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Usuarios'
ORDER BY ORDINAL_POSITION;

-- Verificar tabla Organizadores
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Organizadores'
ORDER BY ORDINAL_POSITION;

-- Verificar columnas nuevas en Eventos
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Eventos'
  AND COLUMN_NAME IN ('OrganizadorId', 'VentaPublica', 'PrecioEntrada',
                      'CapacidadMaxima', 'EntradasVendidas', 'Estado',
                      'ConfigTabla', 'ConfigEtiqueta')
ORDER BY ORDINAL_POSITION;

GO
```

### Verificar constraints y foreign keys

```sql
-- Ver constraints en Usuarios
SELECT
    tc.CONSTRAINT_NAME,
    tc.CONSTRAINT_TYPE,
    cc.CHECK_CLAUSE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
LEFT JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
    ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
WHERE tc.TABLE_NAME = 'Usuarios'
  AND tc.CONSTRAINT_TYPE IN ('CHECK', 'FOREIGN KEY');

-- Ver constraints en Organizadores
SELECT
    tc.CONSTRAINT_NAME,
    tc.CONSTRAINT_TYPE,
    kcu.COLUMN_NAME,
    rc.DELETE_RULE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
    ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
    ON tc.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
WHERE tc.TABLE_NAME = 'Organizadores';

-- Ver foreign keys en Eventos
SELECT
    fk.name AS FK_Name,
    tp.name AS Parent_Table,
    cp.name AS Parent_Column,
    tr.name AS Referenced_Table,
    cr.name AS Referenced_Column,
    fk.delete_referential_action_desc AS Delete_Action
FROM sys.foreign_keys fk
INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
INNER JOIN sys.columns cp ON fkc.parent_column_id = cp.column_id AND fkc.parent_object_id = cp.object_id
INNER JOIN sys.columns cr ON fkc.referenced_column_id = cr.column_id AND fkc.referenced_object_id = cr.object_id
WHERE tp.name = 'Eventos';

GO
```

### Verificar índices

```sql
-- Índices en Usuarios
SELECT
    i.name AS IndexName,
    i.type_desc AS IndexType,
    c.name AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('dbo.Usuarios')
ORDER BY i.name, ic.index_column_id;

-- Índices en Organizadores
SELECT
    i.name AS IndexName,
    i.type_desc AS IndexType,
    c.name AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('dbo.Organizadores')
ORDER BY i.name, ic.index_column_id;

-- Índices en Eventos
SELECT
    i.name AS IndexName,
    i.type_desc AS IndexType,
    c.name AS ColumnName
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('dbo.Eventos')
  AND i.name LIKE '%Organizador%' OR i.name LIKE '%Venta%' OR i.name LIKE '%Estado%'
ORDER BY i.name, ic.index_column_id;

GO
```

### Consultas de verificación de datos

```sql
-- Contar usuarios por tipo
SELECT
    [TipoUsuario],
    COUNT(*) AS Total,
    SUM(CASE WHEN [Activo] = 1 THEN 1 ELSE 0 END) AS Activos
FROM [dbo].[Usuarios]
GROUP BY [TipoUsuario];

-- Contar organizadores por plan
SELECT
    [PlanSuscripcion],
    COUNT(*) AS Total,
    AVG([EventosPermitidos]) AS PromedioEventosPermitidos
FROM [dbo].[Organizadores]
GROUP BY [PlanSuscripcion];

-- Eventos por estado
SELECT
    [Estado],
    COUNT(*) AS Total,
    SUM(CASE WHEN [VentaPublica] = 1 THEN 1 ELSE 0 END) AS ConVentaPublica
FROM [dbo].[Eventos]
GROUP BY [Estado];

-- Verificar relaciones
SELECT
    u.[Username],
    u.[TipoUsuario],
    o.[NombreEmpresa],
    o.[PlanSuscripcion],
    COUNT(e.[Id]) AS TotalEventos
FROM [dbo].[Usuarios] u
LEFT JOIN [dbo].[Organizadores] o ON u.[Id] = o.[UsuarioId]
LEFT JOIN [dbo].[Eventos] e ON o.[Id] = e.[OrganizadorId]
WHERE u.[TipoUsuario] = 'organizador'
GROUP BY u.[Username], u.[TipoUsuario], o.[NombreEmpresa], o.[PlanSuscripcion];

GO
```

---

## 📋 SCRIPT 5: Rollback (En caso de emergencia)

⚠️ **SOLO USAR SI ALGO SALE MAL**

```sql
USE [db_hotel];
GO

-- Eliminar foreign keys
ALTER TABLE [dbo].[Eventos] DROP CONSTRAINT [FK_Eventos_Organizadores];
GO

-- Eliminar tabla Organizadores
DROP TABLE IF EXISTS [dbo].[Organizadores];
GO

-- Eliminar columnas nuevas en Eventos
ALTER TABLE [dbo].[Eventos] DROP CONSTRAINT IF EXISTS [CK_Eventos_Estado];
ALTER TABLE [dbo].[Eventos] DROP COLUMN IF EXISTS [OrganizadorId];
ALTER TABLE [dbo].[Eventos] DROP COLUMN IF EXISTS [VentaPublica];
ALTER TABLE [dbo].[Eventos] DROP COLUMN IF EXISTS [PrecioEntrada];
ALTER TABLE [dbo].[Eventos] DROP COLUMN IF EXISTS [CapacidadMaxima];
ALTER TABLE [dbo].[Eventos] DROP COLUMN IF EXISTS [EntradasVendidas];
ALTER TABLE [dbo].[Eventos] DROP COLUMN IF EXISTS [Estado];
ALTER TABLE [dbo].[Eventos] DROP COLUMN IF EXISTS [ConfigTabla];
ALTER TABLE [dbo].[Eventos] DROP COLUMN IF EXISTS [ConfigEtiqueta];
GO

-- Eliminar índices en Usuarios
DROP INDEX IF EXISTS [IX_Usuarios_TipoUsuario] ON [dbo].[Usuarios];
DROP INDEX IF EXISTS [IX_Usuarios_Email] ON [dbo].[Usuarios];
DROP INDEX IF EXISTS [IX_Usuarios_FechaRegistro] ON [dbo].[Usuarios];
GO

-- Eliminar columnas nuevas en Usuarios
ALTER TABLE [dbo].[Usuarios] DROP CONSTRAINT IF EXISTS [CK_Usuarios_TipoUsuario];
ALTER TABLE [dbo].[Usuarios] DROP COLUMN IF EXISTS [TipoUsuario];
ALTER TABLE [dbo].[Usuarios] DROP COLUMN IF EXISTS [Nombre];
ALTER TABLE [dbo].[Usuarios] DROP COLUMN IF EXISTS [Apellido];
ALTER TABLE [dbo].[Usuarios] DROP COLUMN IF EXISTS [Telefono];
ALTER TABLE [dbo].[Usuarios] DROP COLUMN IF EXISTS [FechaRegistro];
ALTER TABLE [dbo].[Usuarios] DROP COLUMN IF EXISTS [Activo];
ALTER TABLE [dbo].[Usuarios] DROP COLUMN IF EXISTS [UltimoLogin];
GO

-- Restaurar desde backup
-- RESTORE DATABASE [db_hotel]
-- FROM DISK = 'C:\Backups\db_hotel_backup_antes_fase1.bak'
-- WITH REPLACE;
```

---

## 📊 Resumen de Cambios

### Tabla `Usuarios`
- ✅ 7 columnas nuevas
- ✅ 3 índices nuevos
- ✅ 1 constraint CHECK

### Tabla `Organizadores`
- ✅ Tabla nueva creada
- ✅ 11 columnas
- ✅ 3 índices
- ✅ 2 constraints (FK + UNIQUE)
- ✅ 2 constraints CHECK

### Tabla `Eventos`
- ✅ 8 columnas nuevas
- ✅ 4 índices nuevos
- ✅ 1 foreign key nueva
- ✅ 1 constraint CHECK

---

## 🔐 Permisos y Seguridad

```sql
-- Otorgar permisos al usuario de la aplicación
GRANT SELECT, INSERT, UPDATE ON [dbo].[Usuarios] TO [choosing_user];
GRANT SELECT, INSERT, UPDATE, DELETE ON [dbo].[Organizadores] TO [choosing_user];
GRANT SELECT, INSERT, UPDATE ON [dbo].[Eventos] TO [choosing_user];
GO
```

---

## 📝 Notas Finales

1. **Ejecutar en orden**: SCRIPT 1 → SCRIPT 2 → SCRIPT 3 → SCRIPT 4
2. **Backup obligatorio** antes de cualquier cambio
3. **Probar en desarrollo** primero
4. **SCRIPT 5 (Rollback)** solo en emergencia
5. **Documentar** cualquier cambio adicional

---

**Creado por**: Claude Code
**Fecha**: Octubre 2025
**Versión**: 1.0
**Relacionado con**: Migración EF Core `AgregarSistemaMultiRol`
