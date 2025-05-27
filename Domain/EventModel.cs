using System.ComponentModel.DataAnnotations.Schema;

namespace choosing.Domain
{
    [Table("Eventos")]
    public class EventModel  // Cambiado de Event a EventModel para evitar conflicto
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string? Descripcion { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public string? Ubicacion { get; set; }
        public bool Activo { get; set; } = true;
        [Column("ConfiguracionJson")]
        public string? ConfiguracionJson { get; set; }
        // NUEVOS CAMPOS PARA CÓDIGOS
        public string CodigoAcceso { get; set; } = "";
        public string? CodigoAdmin { get; set; } = "";
        public string? CodigoStats { get; set; } = "";
        public bool PermitirAccesoPostEvento { get; set; } = false;
    }
}