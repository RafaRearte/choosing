using choosing.Domain;

namespace choosing.Services.Interfaces
{
    public class CrearCompraDTO
    {
        public int UsuarioId { get; set; }
        public int EventoId { get; set; }
        public int CantidadEntradas { get; set; }
        public decimal MontoTotal { get; set; }
        public List<InvitadoCompraDTO>? Invitados { get; set; } = new(); // Invitados opcionales
    }

    public class AgregarInvitadosDTO
    {
        public List<InvitadoCompraDTO> Invitados { get; set; } = new();
    }

    public class InvitadoCompraDTO
    {
        public string Nombre { get; set; } = string.Empty;
        public string Apellido { get; set; } = string.Empty;
        public string? Dni { get; set; }
        public string? Email { get; set; }
        public string? Telefono { get; set; }
        public bool UsarDatosUsuario { get; set; } = false; // Para autocompletar
    }

    public interface ICompraService
    {
        Task<Compra> CrearCompraAsync(CrearCompraDTO dto);
        Task<Compra?> ObtenerCompraPorIdAsync(int id);
        Task<List<Compra>> ObtenerComprasPorUsuarioAsync(int usuarioId);
        Task<List<Compra>> ObtenerComprasPorEventoAsync(int eventoId);
        Task<Compra> AgregarInvitadosAsync(int compraId, AgregarInvitadosDTO dto);
        Task<Compra> ActualizarEstadoCompraAsync(int compraId, string nuevoEstado, string? transaccionId = null);
        Task<List<Guest>> ObtenerInvitadosPorCompraIdAsync(int compraId);
    }
}
