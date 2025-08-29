using System.ComponentModel.DataAnnotations;

namespace choosing.Domain
{
    public class PublicGuestRegistration
    {
        [Required(ErrorMessage = "El nombre es obligatorio")]
        public string Nombre { get; set; } = "";

        [Required(ErrorMessage = "El apellido es obligatorio")]
        public string Apellido { get; set; } = "";

        [Required(ErrorMessage = "El email es obligatorio")]
        [EmailAddress(ErrorMessage = "Formato de email inválido")]
        public string Email { get; set; } = "";

        public int? Dni { get; set; }
        public string? Empresa { get; set; }
        public string? Cargo { get; set; }
        public string? Telefono { get; set; }

        [Required(ErrorMessage = "Se debe especificar el ID del evento")]
        public int EventId { get; set; }

        // Campos opcionales según el evento
        public string? Categoria { get; set; }
        public string? Profesion { get; set; }
        public string? Lugar { get; set; }
        public string? RedSocial { get; set; }
        public string? InfoAdicional { get; set; }
    }
}