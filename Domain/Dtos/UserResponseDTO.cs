namespace choosing.Domain.Dtos
{
    public class UserResponseDTO
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string TipoUsuario { get; set; }
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? Telefono { get; set; }
        public DateTime FechaRegistro { get; set; }
        public DateTime? UltimoLogin { get; set; }
    }
}
