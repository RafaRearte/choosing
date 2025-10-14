using choosing.Domain;

namespace choosing.Repository.Interfaces
{
    public interface ICompraRepository
    {
        Task<Compra> CreateAsync(Compra compra);
        Task<Compra?> GetByIdAsync(int id);
        Task<List<Compra>> GetByUsuarioIdAsync(int usuarioId);
        Task<List<Compra>> GetByEventoIdAsync(int eventoId);
        Task<Compra> UpdateAsync(Compra compra);
        Task<bool> DeleteAsync(int id);
    }
}
