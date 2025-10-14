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
        public string Estado { get; set; } = "pendiente"; // pendiente, pagado, cancelado, reembolsado

        // Datos de pago
        [MaxLength(100)]
        public string? MetodoPago { get; set; } // mercadopago, transferencia, efectivo

        [MaxLength(200)]
        public string? TransaccionId { get; set; } // ID de MercadoPago o referencia externa

        public DateTime? FechaPago { get; set; }

        // Relación inversa
        public virtual ICollection<Guest>? Invitados { get; set; }

        // Metadata
        public string? NotasInternas { get; set; }
    }
}
