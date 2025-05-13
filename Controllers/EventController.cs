using choosing.Domain;
using choosing.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace choosing.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventController(IEventService eventService)
        {
            _eventService = eventService;
        }

        // Obtener todos los eventos
        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllEvents()
        {
            var events = await _eventService.GetAllEventsAsync();
            return Ok(events);
        }

        // Obtener un evento por ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetEventById(int id)
        {
            var eventModel = await _eventService.GetEventByIdAsync(id);
            if (eventModel == null)
                return NotFound($"No se encontró un evento con el ID {id}");
            return Ok(eventModel);
        }

        // Crear un nuevo evento
        [HttpPost("create")]
        public async Task<IActionResult> CreateEvent([FromBody] EventModel newEvent)
        {
            if (newEvent == null)
                return BadRequest("Datos de evento inválidos");

            try
            {
                await _eventService.CreateEventAsync(newEvent);
                return CreatedAtAction(nameof(GetEventById), new { id = newEvent.Id }, newEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al crear evento: {ex.Message}");
            }
        }

        // Actualizar un evento
        [HttpPut("update/{id}")]
        public async Task<IActionResult> UpdateEvent(int id, [FromBody] EventModel updatedEvent)
        {
            if (updatedEvent == null)
                return BadRequest("Datos de evento inválidos");

            try
            {
                var existingEvent = await _eventService.GetEventByIdAsync(id);
                if (existingEvent == null)
                    return NotFound($"No se encontró un evento con el ID {id}");

                updatedEvent.Id = id; // Asegurar que el ID sea correcto
                await _eventService.UpdateEventAsync(updatedEvent);
                return Ok(updatedEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al actualizar evento: {ex.Message}");
            }
        }

        // Eliminar un evento
        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            try
            {
                var existingEvent = await _eventService.GetEventByIdAsync(id);
                if (existingEvent == null)
                    return NotFound($"No se encontró un evento con el ID {id}");

                await _eventService.DeleteEventAsync(id);
                return Ok($"Evento con ID {id} eliminado correctamente");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al eliminar evento: {ex.Message}");
            }
        }
        // Actualizar solo la configuración de un evento
        [HttpPut("update-config/{id}")]
        public async Task<IActionResult> UpdateEventConfig(int id, [FromBody] string configuracionJson)
        {
            try
            {
                var existingEvent = await _eventService.GetEventByIdAsync(id);
                if (existingEvent == null)
                    return NotFound($"No se encontró un evento con el ID {id}");

                // Actualizar solo el campo de configuración
                existingEvent.ConfiguracionJson = configuracionJson;
                await _eventService.UpdateEventAsync(existingEvent);

                return Ok(existingEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al actualizar configuración: {ex.Message}");
            }
        }
    }
}
