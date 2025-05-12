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
    }
}
