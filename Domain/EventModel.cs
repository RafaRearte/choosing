using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace choosing.Domain
{
    [Table("Eventos")]
    public class EventModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Nombre { get; set; }

        [MaxLength(500)]
        public string? Descripcion { get; set; }

        [Required]
        public DateTime FechaInicio { get; set; }

        [Required]
        public DateTime FechaFin { get; set; }

        [MaxLength(255)]
        public string? Ubicacion { get; set; }

        public bool Activo { get; set; } = true;

        [Column("ConfiguracionJson")]
        public string? ConfiguracionJson { get; set; }

        // CÓDIGOS DE ACCESO
        [MaxLength(100)]
        public string CodigoAcceso { get; set; } = "";

        [MaxLength(100)]
        public string? CodigoAdmin { get; set; } = "";

        [MaxLength(100)]
        public string? CodigoStats { get; set; } = "";

        public bool PermitirAccesoPostEvento { get; set; } = false;

        // NUEVOS CAMPOS PARA MARKETPLACE Y VENTA DE ENTRADAS
        // OrganizadorId apunta directamente a User (tipo organizador)
        public int? OrganizadorId { get; set; }

        [ForeignKey("OrganizadorId")]
        public virtual User? Organizador { get; set; }

        public bool VentaPublica { get; set; } = false;

        [Column(TypeName = "decimal(10,2)")]
        public decimal? PrecioEntrada { get; set; } = 0;

        public int? CapacidadMaxima { get; set; }

        public int EntradasVendidas { get; set; } = 0;

        [MaxLength(20)]
        public string Estado { get; set; } = "borrador"; // borrador, publicado, finalizado, cancelado

        // Configuraciones JSON para tabla y etiquetas
        public string? ConfigTabla { get; set; }

        public string? ConfigEtiqueta { get; set; }
    }
}