using choosing.Context;
using choosing.Domain;
using choosing.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace choosing.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventController : ControllerBase
    {
        private readonly IEventService _eventService;
        private readonly DbHotelContext _context;

        public EventController(IEventService eventService, DbHotelContext context)
        {
            _eventService = eventService;
            _context = context;
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

        // GET: api/Event/GetAllWithStats
        [HttpGet("GetAllWithStats")]
        public async Task<IActionResult> GetAllEventsWithStats()
        {
            try
            {
                var events = await _eventService.GetAllEventsAsync();
                var eventsWithStats = new List<object>();

                foreach (var evt in events)
                {
                    var totalGuests = await _context.Guests.CountAsync(g => g.EventoId == evt.Id);
                    var accreditedGuests = await _context.Guests.CountAsync(g => g.EventoId == evt.Id && g.Acreditado > 0);

                    eventsWithStats.Add(new
                    {
                        evt.Id,
                        evt.Nombre,
                        evt.Descripcion,
                        evt.FechaInicio,
                        evt.FechaFin,
                        evt.Ubicacion,
                        evt.Activo,
                        evt.ConfiguracionJson,
                        evt.CodigoAcceso,
                        evt.CodigoAdmin,
                        evt.CodigoStats,
                        evt.PermitirAccesoPostEvento,
                        Stats = new
                        {
                            TotalInvitados = totalGuests,
                            Acreditados = accreditedGuests,
                            NoAcreditados = totalGuests - accreditedGuests
                        }
                    });
                }

                return Ok(eventsWithStats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // PUT: api/Event/toggle-active/{id}
        [HttpPut("toggle-active/{id}")]
        public async Task<IActionResult> ToggleEventActive(int id)
        {
            try
            {
                var existingEvent = await _eventService.GetEventByIdAsync(id);
                if (existingEvent == null)
                    return NotFound($"No se encontró un evento con el ID {id}");

                existingEvent.Activo = !existingEvent.Activo;
                await _eventService.UpdateEventAsync(existingEvent);

                return Ok(new
                {
                    id = existingEvent.Id,
                    activo = existingEvent.Activo,
                    mensaje = $"Evento {(existingEvent.Activo ? "activado" : "desactivado")} correctamente"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // PUT: api/Event/update-codes/{id}
        [HttpPut("update-codes/{id}")]
        public async Task<IActionResult> UpdateEventCodes(int id, UpdateCodesRequest request)
        {
            try
            {
                var existingEvent = await _eventService.GetEventByIdAsync(id);
                if (existingEvent == null)
                    return NotFound($"No se encontró un evento con el ID {id}");

                existingEvent.CodigoAcceso = request.CodigoAcceso;
                existingEvent.CodigoAdmin = request.CodigoAdmin;
                existingEvent.CodigoStats = request.CodigoStats;
                existingEvent.PermitirAccesoPostEvento = request.PermitirAccesoPostEvento;

                await _eventService.UpdateEventAsync(existingEvent);

                return Ok(existingEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // POST: api/Event/duplicate/{id}
        [HttpPost("duplicate/{id}")]
        public async Task<IActionResult> DuplicateEvent(int id, DuplicateEventRequest request)
        {
            try
            {
                var originalEvent = await _eventService.GetEventByIdAsync(id);
                if (originalEvent == null)
                    return NotFound($"No se encontró un evento con el ID {id}");

                var duplicatedEvent = new EventModel
                {
                    Nombre = request.NuevoNombre,
                    Descripcion = originalEvent.Descripcion,
                    FechaInicio = request.NuevaFechaInicio,
                    FechaFin = request.NuevaFechaFin,
                    Ubicacion = originalEvent.Ubicacion,
                    Activo = false,
                    ConfiguracionJson = originalEvent.ConfiguracionJson,
                    CodigoAcceso = GenerateRandomCode(),
                    CodigoAdmin = GenerateRandomCode(),
                    CodigoStats = GenerateRandomCode(),
                    PermitirAccesoPostEvento = false
                };

                var createdEvent = await _eventService.CreateEventAsync(duplicatedEvent);
                return CreatedAtAction(nameof(GetEventById), new { id = createdEvent.Id }, createdEvent);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // POST: api/Event/generate-codes/{id}
        [HttpPost("generate-codes/{id}")]
        public async Task<IActionResult> GenerateNewCodes(int id)
        {
            try
            {
                var existingEvent = await _eventService.GetEventByIdAsync(id);
                if (existingEvent == null)
                    return NotFound($"No se encontró un evento con el ID {id}");

                existingEvent.CodigoAcceso = GenerateRandomCode();
                existingEvent.CodigoAdmin = GenerateRandomCode();
                existingEvent.CodigoStats = GenerateRandomCode();

                await _eventService.UpdateEventAsync(existingEvent);

                return Ok(new
                {
                    mensaje = "Códigos regenerados correctamente",
                    codigoAcceso = existingEvent.CodigoAcceso,
                    codigoAdmin = existingEvent.CodigoAdmin,
                    codigoStats = existingEvent.CodigoStats
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // GET: api/Event/search
        [HttpGet("search")]
        public async Task<IActionResult> SearchEvents([FromQuery] string query)
        {
            try
            {
                var events = await _eventService.GetAllEventsAsync();

                if (string.IsNullOrWhiteSpace(query))
                    return Ok(events);

                var filteredEvents = events.Where(e =>
                    e.Nombre.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                    (e.Descripcion != null && e.Descripcion.Contains(query, StringComparison.OrdinalIgnoreCase)) ||
                    (e.Ubicacion != null && e.Ubicacion.Contains(query, StringComparison.OrdinalIgnoreCase))
                ).ToList();

                return Ok(filteredEvents);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // Método privado para generar códigos aleatorios
        private string GenerateRandomCode()
        {
            return Guid.NewGuid().ToString("N")[0..8].ToUpper();
        }
    }

    // ✅ REQUEST CLASSES (agregar al final del archivo)
    public class UpdateCodesRequest
    {
        public string CodigoAcceso { get; set; } = "";
        public string? CodigoAdmin { get; set; } = "";
        public string? CodigoStats { get; set; } = "";
        public bool PermitirAccesoPostEvento { get; set; } = false;
    }

    public class DuplicateEventRequest
    {
        public string NuevoNombre { get; set; } = "";
        public DateTime NuevaFechaInicio { get; set; }
        public DateTime NuevaFechaFin { get; set; }
    }
}

