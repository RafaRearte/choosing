using choosing.Domain;

namespace choosing.Services.Interfaces
{
    public interface IFeedbackService
    {
        Task<FeedbackModel> SubmitFeedbackAsync(int eventoId, FeedbackRequest request);
        Task<FeedbackStatsDto> GetFeedbackStatsAsync(int eventoId);
        Task<List<FeedbackModel>> GetAllFeedbacksAsync(int eventoId);
        Task<FeedbackConfigDto> SetActiveEventAsync(int eventoId);
        Task<FeedbackConfigDto?> GetActiveEventAsync();
    }
}