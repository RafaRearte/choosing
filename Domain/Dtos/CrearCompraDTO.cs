namespace choosing.Domain.Dtos;

public class CrearCompraDTO
{
    public int UsuarioId { get; set; }
    public int EventoId { get; set; }
    public int CantidadEntradas { get; set; }
    public decimal MontoTotal { get; set; }
    public List<InvitadoCompraDTO>? Invitados { get; set; } = new(); // Invitados opcionales
}