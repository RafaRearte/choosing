namespace choosing.Domain.Dtos;

public class InvitadoCompraDTO
{
    public string Nombre { get; set; } = string.Empty;
    public string Apellido { get; set; } = string.Empty;
    public string? Dni { get; set; }
    public string? Email { get; set; }
    public string? Telefono { get; set; }
    public bool UsarDatosUsuario { get; set; } = false; // Para autocompletar
}