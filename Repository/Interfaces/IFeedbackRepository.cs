using choosing.Domain;

namespace choosing.Repository.Interfaces
{
    public interface IFeedbackRepository
    {
        Task<FeedbackModel> AddAsync(FeedbackModel feedback);
        Task<List<FeedbackModel>> GetByEventIdAsync(int eventoId);
        Task<FeedbackStatsDto> GetStatsAsync(int eventoId);
        Task<FeedbackConfigModel> SetActiveEventAsync(int eventoId);
        Task<FeedbackConfigModel?> GetActiveEventAsync();
    }
}