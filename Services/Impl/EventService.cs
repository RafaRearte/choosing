using choosing.Domain;
using choosing.Repository.Interfaces;
using choosing.Services.Interfaces;

namespace choosing.Services.Impl
{
    public class EventService : IEventService
    {
        private readonly IEventRepository _eventRepository;

        public EventService(IEventRepository eventRepository)
        {
            _eventRepository = eventRepository;
        }

        public async Task<List<EventModel>> GetAllEventsAsync()
        {
            return await _eventRepository.GetAllAsync();
        }

        public async Task<EventModel> GetEventByIdAsync(int id)
        {
            return await _eventRepository.GetByIdAsync(id);
        }

        public async Task<EventModel> CreateEventAsync(EventModel newEvent)
        {
            return await _eventRepository.AddAsync(newEvent);
        }

        public async Task UpdateEventAsync(EventModel updatedEvent)
        {
            await _eventRepository.UpdateAsync(updatedEvent);
        }

        public async Task DeleteEventAsync(int id)
        {
            await _eventRepository.DeleteAsync(id);
        }

        // Obtener eventos de un organizador (llama al repository)
        public async Task<List<EventModel>> GetEventsByOrganizadorIdAsync(int organizadorId)
        {
            return await _eventRepository.GetByOrganizadorIdAsync(organizadorId);
        }

        // Validar si un usuario puede modificar un evento
        // Reglas:
        // - Admin siempre puede
        // - Organizador solo si es SU evento (OrganizadorId = usuarioId)
        // - Si OrganizadorId es null, solo admin puede editar
        public async Task<bool> CanUserModifyEventAsync(int eventoId, int usuarioId, string userRole)
        {
            // Admin siempre puede
            if (userRole == "admin")
                return true;

            // Si no es admin, debe ser organizador
            if (userRole != "organizador")
                return false;

            var evento = await _eventRepository.GetByIdAsync(eventoId);
            if (evento == null)
                return false;

            // Si el evento no tiene organizador asignado, solo admin puede editarlo
            if (evento.OrganizadorId == null)
                return false;

            // Organizador solo puede editar su propio evento
            return evento.OrganizadorId == usuarioId;
        }
    }
}
