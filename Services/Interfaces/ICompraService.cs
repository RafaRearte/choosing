using choosing.Domain;
using choosing.Domain.Dtos;

namespace choosing.Services.Interfaces
{
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
