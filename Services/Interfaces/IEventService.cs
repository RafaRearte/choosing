using choosing.Domain;

namespace choosing.Services.Interfaces
{
    public interface IEventService
    {
        Task<List<EventModel>> GetAllEventsAsync();
        Task<EventModel> GetEventByIdAsync(int id);
        Task<EventModel> CreateEventAsync(EventModel newEvent);
        Task UpdateEventAsync(EventModel updatedEvent);
        Task DeleteEventAsync(int id);

        // Nuevos métodos para multi-tenancy
        Task<List<EventModel>> GetEventsByOrganizadorIdAsync(int organizadorId);
        Task<bool> CanUserModifyEventAsync(int eventoId, int usuarioId, string userRole);
    }
}
