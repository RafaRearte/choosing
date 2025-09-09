using choosing.Domain;
using choosing.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace choosing.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbackController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        // POST: api/Feedback/{eventoId}
        [HttpPost("{eventoId}")]
        public async Task<IActionResult> SubmitFeedback(int eventoId, [FromBody] FeedbackRequest request)
        {
            try
            {
                var feedback = await _feedbackService.SubmitFeedbackAsync(eventoId, request);
                return Ok(new { mensaje = "Feedback enviado correctamente", id = feedback.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // GET: api/Feedback/stats/{eventoId}
        [HttpGet("stats/{eventoId}")]
        public async Task<IActionResult> GetFeedbackStats(int eventoId)
        {
            try
            {
                var stats = await _feedbackService.GetFeedbackStatsAsync(eventoId);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // GET: api/Feedback/all/{eventoId} - Solo para administradores
        [HttpGet("all/{eventoId}")]
        public async Task<IActionResult> GetAllFeedbacks(int eventoId)
        {
            try
            {
                var feedbacks = await _feedbackService.GetAllFeedbacksAsync(eventoId);
                return Ok(feedbacks);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // POST: api/Feedback/set-active-event - Configurar evento activo para feedback
        [HttpPost("set-active-event")]
        public async Task<IActionResult> SetActiveEvent([FromBody] SetFeedbackEventRequest request)
        {
            try
            {
                var config = await _feedbackService.SetActiveEventAsync(request.EventoId);
                return Ok(new { mensaje = "Evento configurado para feedback correctamente", config = config });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // GET: api/Feedback/active-event - Obtener evento activo para feedback
        [HttpGet("active-event")]
        public async Task<IActionResult> GetActiveEvent()
        {
            try
            {
                var config = await _feedbackService.GetActiveEventAsync();
                if (config == null)
                {
                    return Ok(new { eventoId = (int?)null, mensaje = "No hay evento configurado para feedback" });
                }
                
                return Ok(config);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }
    }
}