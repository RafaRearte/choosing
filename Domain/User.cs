using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace choosing.Domain
{
    [Table("Usuarios")]
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; }

        [Required]
        [MaxLength(255)]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [MaxLength(500)]
        public string PasswordHash { get; set; }

        // Nuevos campos para el sistema multi-rol
        [Required]
        [MaxLength(20)]
        public string TipoUsuario { get; set; } = "comprador"; // 'organizador', 'comprador', 'admin'

        [MaxLength(100)]
        public string? Nombre { get; set; }

        [MaxLength(100)]
        public string? Apellido { get; set; }

        [MaxLength(20)]
        public string? Telefono { get; set; }

        public DateTime FechaRegistro { get; set; } = DateTime.Now;

        public bool Activo { get; set; } = true;

        public DateTime? UltimoLogin { get; set; }

        // FASE 1.1: Campos adicionales de perfil (para auto-completar datos al comprar)
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

        // ============================================
        // CAMPOS ADICIONALES PARA ORGANIZADORES
        // ============================================
        [MaxLength(200)]
        public string? NombreEmpresa { get; set; }

        [MaxLength(20)]
        public string? CuitCuil { get; set; }

        [MaxLength(20)]
        public string? PlanSuscripcion { get; set; } // "free", "basic", "premium"

        public int? EventosPermitidos { get; set; } // Límite según plan

        public DateTime? FechaInicioPlan { get; set; }

        // ============================================
        // CAMPOS ADICIONALES PARA COMPRADORES (datos de facturación)
        // ============================================
        [MaxLength(100)]
        public string? RazonSocial { get; set; } // Si compra como empresa

        [MaxLength(20)]
        public string? TipoDocumento { get; set; } // DNI, CUIT, Pasaporte

        [MaxLength(20)]
        public string? NumeroDocumento { get; set; }

        [MaxLength(50)]
        public string? Pais { get; set; } = "Argentina";

        [MaxLength(20)]
        public string? TelefonoAlternativo { get; set; }

        public bool RecibirPromociones { get; set; } = true;
        public bool RecibirNotificaciones { get; set; } = true;

        // Relaciones inversas
        public virtual ICollection<Compra>? Compras { get; set; }
    }
}
