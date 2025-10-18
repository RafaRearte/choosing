using choosing.Context;
using choosing.Domain;
using choosing.Domain.Dtos;
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
        private readonly DbChoosingContext _choosingContext;

        public EventController(IEventService eventService, DbChoosingContext choosingContext)
        {
            _eventService = eventService;
            _choosingContext = choosingContext;
        }

        // Obtener todos los eventos
        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllEvents()
        {
            var events = await _eventService.GetAllEventsAsync();
            return Ok(events);
        }

        // Obtener MIS eventos (del organizador logueado)
        [HttpGet("mis-eventos")]
        public async Task<IActionResult> GetMyEvents()
        {
            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                    return Unauthorized(new { error = "Token inválido o no autenticado" });

                int usuarioId = int.Parse(userIdClaim.Value);
                var myEvents = await _eventService.GetEventsByOrganizadorIdAsync(usuarioId);

                // Mapear a DTO para evitar referencias circulares
                var eventosDTO = myEvents.Select(e => new EventoResponseDTO
                {
                    Id = e.Id,
                    Nombre = e.Nombre,
                    Descripcion = e.Descripcion,
                    FechaInicio = e.FechaInicio,
                    FechaFin = e.FechaFin,
                    Ubicacion = e.Ubicacion,
                    Activo = e.Activo,
                    ConfiguracionJson = e.ConfiguracionJson,
                    PermitirAccesoPostEvento = e.PermitirAccesoPostEvento,
                    OrganizadorId = e.OrganizadorId,
                    VentaPublica = e.VentaPublica,
                    PrecioEntrada = e.PrecioEntrada,
                    CapacidadMaxima = e.CapacidadMaxima,
                    EntradasVendidas = e.EntradasVendidas,
                    Estado = e.Estado,
                    ConfigTabla = e.ConfigTabla,
                    ConfigEtiqueta = e.ConfigEtiqueta
                }).ToList();

                return Ok(eventosDTO);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
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
        public async Task<IActionResult> CreateEvent([FromBody] CrearEventoDTO eventoDTO)
        {
            if (eventoDTO == null)
                return BadRequest("Datos de evento inválidos");

            try
            {
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role);

                if (userIdClaim == null || roleClaim == null)
                    return Unauthorized(new { error = "Debe estar autenticado para crear eventos" });

                int usuarioId = int.Parse(userIdClaim.Value);
                string userRole = roleClaim.Value;

                // Solo organizadores y admins pueden crear eventos
                if (userRole != "organizador" && userRole != "admin")
                    return Forbid();

                // Mapear DTO a EventModel
                var newEvent = new EventModel
                {
                    Nombre = eventoDTO.Nombre,
                    Descripcion = eventoDTO.Descripcion,
                    FechaInicio = eventoDTO.FechaInicio,
                    FechaFin = eventoDTO.FechaFin,
                    Ubicacion = eventoDTO.Ubicacion,
                    Activo = eventoDTO.Activo,
                    PermitirAccesoPostEvento = eventoDTO.PermitirAccesoPostEvento,
                    VentaPublica = eventoDTO.VentaPublica,
                    PrecioEntrada = eventoDTO.PrecioEntrada,
                    CapacidadMaxima = eventoDTO.CapacidadMaxima,
                    ConfigTabla = eventoDTO.ConfigTabla,
                    ConfigEtiqueta = eventoDTO.ConfigEtiqueta
                };

                // Si es organizador, validar límite de eventos y auto-asignar OrganizadorId
                if (userRole == "organizador")
                {
                    var usuario = await _choosingContext.Users.FindAsync(usuarioId);
                    if (usuario == null)
                        return NotFound("Usuario no encontrado");

                    // Contar eventos del organizador
                    var eventosActuales = await _choosingContext.Events.CountAsync(e => e.OrganizadorId == usuarioId);

                    // Validar límite según plan
                    if (usuario.EventosPermitidos.HasValue && eventosActuales >= usuario.EventosPermitidos.Value)
                    {
                        return BadRequest(new
                        {
                            error = $"Has alcanzado el límite de {usuario.EventosPermitidos} eventos de tu plan '{usuario.PlanSuscripcion}'",
                            eventosActuales = eventosActuales,
                            limite = usuario.EventosPermitidos,
                            plan = usuario.PlanSuscripcion
                        });
                    }

                    // Auto-asignar OrganizadorId
                    newEvent.OrganizadorId = usuarioId;
                }

                await _eventService.CreateEventAsync(newEvent);

                // Devolver DTO en lugar del modelo completo
                var responseDTO = new EventoResponseDTO
                {
                    Id = newEvent.Id,
                    Nombre = newEvent.Nombre,
                    Descripcion = newEvent.Descripcion,
                    FechaInicio = newEvent.FechaInicio,
                    FechaFin = newEvent.FechaFin,
                    Ubicacion = newEvent.Ubicacion,
                    Activo = newEvent.Activo,
                    ConfiguracionJson = newEvent.ConfiguracionJson,
                    PermitirAccesoPostEvento = newEvent.PermitirAccesoPostEvento,
                    OrganizadorId = newEvent.OrganizadorId,
                    VentaPublica = newEvent.VentaPublica,
                    PrecioEntrada = newEvent.PrecioEntrada,
                    CapacidadMaxima = newEvent.CapacidadMaxima,
                    EntradasVendidas = newEvent.EntradasVendidas,
                    Estado = newEvent.Estado,
                    ConfigTabla = newEvent.ConfigTabla,
                    ConfigEtiqueta = newEvent.ConfigEtiqueta
                };

                return CreatedAtAction(nameof(GetEventById), new { id = newEvent.Id }, responseDTO);
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

                // Validar acceso: solo organizador dueño o admin pueden editar
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role);

                if (userIdClaim != null && roleClaim != null)
                {
                    int usuarioId = int.Parse(userIdClaim.Value);
                    string userRole = roleClaim.Value;

                    bool canModify = await _eventService.CanUserModifyEventAsync(id, usuarioId, userRole);
                    if (!canModify)
                        return Forbid(); // 403 si no tiene permiso
                }

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

                // Validar acceso
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var roleClaim = User.FindFirst(System.Security.Claims.ClaimTypes.Role);

                if (userIdClaim != null && roleClaim != null)
                {
                    int usuarioId = int.Parse(userIdClaim.Value);
                    string userRole = roleClaim.Value;

                    bool canModify = await _eventService.CanUserModifyEventAsync(id, usuarioId, userRole);
                    if (!canModify)
                        return Forbid();
                }

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
                    var totalGuests = await _choosingContext.Guests.CountAsync(g => g.EventoId == evt.Id);
                    var accreditedGuests = await _choosingContext.Guests.CountAsync(g => g.EventoId == evt.Id && g.EstaAcreditado);

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
        
        

        // GET: api/Event/publicos - Eventos con venta pública habilitada
        [HttpGet("publicos")]
        public async Task<IActionResult> GetPublicEvents()
        {
            try
            {
                var events = await _choosingContext.Events
                    .Where(e => e.VentaPublica && e.Activo)
                    .OrderBy(e => e.FechaInicio)
                    .ToListAsync();

                return Ok(events);
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

}

