using choosing.Context;
using choosing.Domain;
using choosing.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace choosing.Repository.Impl
{
    public class FeedbackRepository : IFeedbackRepository
    {
        private readonly DbHotelContext _context;

        public FeedbackRepository(DbHotelContext context)
        {
            _context = context;
        }

        public async Task<FeedbackModel> AddAsync(FeedbackModel feedback)
        {
            try
            {
                await _context.Feedbacks.AddAsync(feedback);
                await _context.SaveChangesAsync();
                return feedback;
            }
            catch (Exception ex)
            {
                throw new Exception("Error adding feedback", ex);
            }
        }

        public async Task<List<FeedbackModel>> GetByEventIdAsync(int eventoId)
        {
            try
            {
                return await _context.Feedbacks
                    .Where(f => f.EventoId == eventoId)
                    .OrderBy(f => f.Id)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving feedbacks for event {eventoId}", ex);
            }
        }

        public async Task<FeedbackStatsDto> GetStatsAsync(int eventoId)
        {
            try
            {
                var feedbacks = await _context.Feedbacks
                    .Where(f => f.EventoId == eventoId)
                    .GroupBy(f => f.Rating)
                    .Select(g => new { Rating = g.Key, Count = g.Count() })
                    .ToListAsync();

                var stats = new FeedbackStatsDto
                {
                    Total = feedbacks.Sum(f => f.Count)
                };

                foreach (var item in feedbacks)
                {
                    stats.RatingCounts[item.Rating] = item.Count;
                }

                return stats;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving feedback stats for event {eventoId}", ex);
            }
        }

        public async Task<FeedbackConfigModel> SetActiveEventAsync(int eventoId)
        {
            try
            {
                // Eliminar cualquier configuración anterior (solo puede haber una activa)
                var existingConfigs = await _context.FeedbackConfig.ToListAsync();
                if (existingConfigs.Any())
                {
                    _context.FeedbackConfig.RemoveRange(existingConfigs);
                    await _context.SaveChangesAsync(); // Guardar eliminación primero
                }

                // Crear nueva configuración
                var newConfig = new FeedbackConfigModel
                {
                    EventoId = eventoId,
                    FechaCreacion = DateTime.UtcNow,
                    FechaActualizacion = DateTime.UtcNow
                };

                await _context.FeedbackConfig.AddAsync(newConfig);
                await _context.SaveChangesAsync();

                return newConfig;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error setting active event for feedback: {eventoId}. Inner: {ex.InnerException?.Message}", ex);
            }
        }

        public async Task<FeedbackConfigModel?> GetActiveEventAsync()
        {
            try
            {
                // Usar SQL directo para debuggear
                var result = await _context.Database.SqlQueryRaw<FeedbackConfigModel>(
                    "SELECT Id, EventoId, FechaCreacion, FechaActualizacion FROM FeedbackConfig"
                ).FirstOrDefaultAsync();
                
                return result;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving active feedback event. Inner: {ex.InnerException?.Message}", ex);
            }
        }
    }
}