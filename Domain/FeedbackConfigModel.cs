using System.ComponentModel.DataAnnotations;

namespace choosing.Domain
{
    public class FeedbackConfigModel
    {
        public int Id { get; set; }
        
        [Required]
        public int EventoId { get; set; }
        
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        
        public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;
        
        // Navegación comentada temporalmente
        // public virtual EventModel? Evento { get; set; }
    }
    
    public class SetFeedbackEventRequest
    {
        [Required]
        public int EventoId { get; set; }
    }
    
    public class FeedbackConfigDto
    {
        public int EventoId { get; set; }
        public string EventoNombre { get; set; } = string.Empty;
        public DateTime FechaConfiguracion { get; set; }
    }
}