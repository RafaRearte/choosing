using choosing.Domain;

namespace choosing.Repository.Interfaces
{
    public interface IListRepository
    {
        Task<List<Guest>> GetAllAsync();

        Task<Guest?> GetByDNIAsync(int Dni);

        // Buscar por nombre (si planeas implementar búsqueda)
        Task<List<Guest>> SearchByNameAsync(string query);

        // Actualizar información del invitado (como acreditarlo)
        Task UpdateAsync(Guest guest);

        Task<Guest> AddAsync(Guest guest); // New method

        Task DeleteAsync(int dni); // Nuevo método

        Task<List<Guest>> GetAcreditadosAsync();
        Task<List<Guest>> GetNotAcreditadosAsync();
        Task<List<Guest>> GetInvitadosNuevosAsync();
    }
}
