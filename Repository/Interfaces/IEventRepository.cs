using choosing.Domain;

namespace choosing.Repository.Interfaces
{
    public interface IEventRepository
    {
        Task<List<EventModel>> GetAllAsync();
        Task<EventModel> GetByIdAsync(int id);
        Task<EventModel> AddAsync(EventModel newEvent);
        Task UpdateAsync(EventModel updatedEvent);
        Task DeleteAsync(int id);

        // Nuevos métodos para multi-tenancy
        Task<List<EventModel>> GetByOrganizadorIdAsync(int organizadorId);
    }

}