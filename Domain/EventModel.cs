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
    }
}