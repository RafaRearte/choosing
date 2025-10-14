using System.ComponentModel.DataAnnotations;

namespace choosing.Domain
{
    public class RegistroDTO
    {
        [Required(ErrorMessage = "El nombre de usuario es requerido")]
        public string Username { get; set; }

        [Required(ErrorMessage = "El email es requerido")]
        [EmailAddress(ErrorMessage = "El email no es válido")]
        public string Email { get; set; }

        [Required(ErrorMessage = "La contraseña es requerida")]
        [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
        public string Password { get; set; }

        [Required(ErrorMessage = "El tipo de usuario es requerido")]
        public string TipoUsuario { get; set; } // "comprador" o "organizador"

        // Campos opcionales
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? Telefono { get; set; }

        // Campos adicionales si es organizador
        public string? NombreEmpresa { get; set; }
        public string? CuitCuil { get; set; }
        public string? Direccion { get; set; }
        public string? Provincia { get; set; }
        public string? Ciudad { get; set; }
        public string? CodigoPostal { get; set; }
    }
}
