using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace choosing.Domain
{
    [Table("Invitados")]
    public class Guest
    {
        [Key]
        public int Id { get; set; }

        // Datos personales del invitado
        [Required]
        [MaxLength(100)]
        public string Nombre { get; set; }

        [Required]
        [MaxLength(100)]
        public string Apellido { get; set; }

        [Required]
        [MaxLength(255)]
        [EmailAddress]
        public string Email { get; set; }

        [MaxLength(20)]
        public string? Dni { get; set; }

        [MaxLength(50)]
        public string? Telefono { get; set; }

        // Datos adicionales
        [MaxLength(255)]
        public string? InfoAdicional { get; set; }

        [MaxLength(255)]
        public string? Profesion { get; set; }

        [MaxLength(255)]
        public string? Cargo { get; set; }

        [MaxLength(255)]
        public string? Empresa { get; set; }

        [MaxLength(255)]
        public string? Lugar { get; set; }

        [MaxLength(100)]
        public string? Categoria { get; set; }

        [MaxLength(100)]
        public string? IdCode { get; set; }

        [MaxLength(255)]
        public string? RedSocial { get; set; }

        // Relación con el evento
        [Required]
        public int EventoId { get; set; }
        [ForeignKey("EventoId")]
        public virtual EventModel? Evento { get; set; }

        // Relación con User comprador (nullable - puede ser invitado manual)
        public int? CompradoPorUsuarioId { get; set; }
        [ForeignKey("CompradoPorUsuarioId")]
        public virtual User? CompradoPor { get; set; }

        // Relación con la compra (nullable - puede ser invitado manual)
        public int? CompraId { get; set; }
        [ForeignKey("CompraId")]
        public virtual Compra? Compra { get; set; }

        // Estado del invitado
        public bool Confirmado { get; set; } = false;
        public bool EstaAcreditado { get; set; } = false;
        public DateTime? FechaAcreditacion { get; set; }
        public bool EsNuevo { get; set; } = false;

        // Metadata
        public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
}
