using choosing.Domain;
using choosing.Repository.Interfaces;
using choosing.Services.Interfaces;

namespace choosing.Services.Impl
{
    public class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackRepository _feedbackRepository;
        private readonly IEventRepository _eventRepository;

        public FeedbackService(IFeedbackRepository feedbackRepository, IEventRepository eventRepository)
        {
            _feedbackRepository = feedbackRepository;
            _eventRepository = eventRepository;
        }

        public async Task<FeedbackModel> SubmitFeedbackAsync(int eventoId, FeedbackRequest request)
        {
            // Verificar que el evento existe
            var evento = await _eventRepository.GetByIdAsync(eventoId);
            if (evento == null)
            {
                throw new Exception($"No se encontró un evento con el ID {eventoId}");
            }

            var feedback = new FeedbackModel
            {
                EventoId = eventoId,
                Rating = request.Rating
            };

            return await _feedbackRepository.AddAsync(feedback);
        }

        public async Task<FeedbackStatsDto> GetFeedbackStatsAsync(int eventoId)
        {
            return await _feedbackRepository.GetStatsAsync(eventoId);
        }

        public async Task<List<FeedbackModel>> GetAllFeedbacksAsync(int eventoId)
        {
            return await _feedbackRepository.GetByEventIdAsync(eventoId);
        }

        public async Task<FeedbackConfigDto> SetActiveEventAsync(int eventoId)
        {
            // Verificar que el evento existe
            var evento = await _eventRepository.GetByIdAsync(eventoId);
            if (evento == null)
            {
                throw new Exception($"No se encontró un evento con el ID {eventoId}");
            }

            var config = await _feedbackRepository.SetActiveEventAsync(eventoId);
            
            return new FeedbackConfigDto
            {
                EventoId = config.EventoId,
                EventoNombre = evento.Nombre,
                FechaConfiguracion = config.FechaCreacion
            };
        }

        public async Task<FeedbackConfigDto?> GetActiveEventAsync()
        {
            var config = await _feedbackRepository.GetActiveEventAsync();
            if (config == null)
            {
                return null;
            }

            // Obtener el evento por separado
            var evento = await _eventRepository.GetByIdAsync(config.EventoId);
            if (evento == null)
            {
                return null;
            }

            return new FeedbackConfigDto
            {
                EventoId = config.EventoId,
                EventoNombre = evento.Nombre,
                FechaConfiguracion = config.FechaCreacion
            };
        }
    }
}