using System.Text;
using choosing.Domain;
using choosing.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace choosing.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ListController : ControllerBase
    {
        private readonly IListService _listService;
        private readonly IEventService _eventService;
        private readonly IEmailService _emailService;

        public ListController(IListService listService, IEventService eventService, IEmailService emailService)
        {
            _listService = listService;
            _eventService = eventService;
            _emailService = emailService;
        }

        // ✅ ENDPOINT PÚBLICO PARA REGISTRO DE INVITADOS
        [HttpPost("register-public")]
        [AllowAnonymous] // Sin autenticación para registro público
        public async Task<IActionResult> RegisterPublicGuest([FromBody] PublicGuestRegistration request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                // 1. Validar que el evento existe y está activo
                var evento = await _eventService.GetEventByIdAsync(request.EventId);
                if (evento == null)
                    return BadRequest("El evento especificado no existe");
                
                if (!evento.Activo)
                    return BadRequest("Este evento no está disponible para registro público");

                // 2. Validar que no existe un invitado con el mismo email en este evento
                var existingGuests = await _listService.GetInvitadosByEventIdAsync(request.EventId);
                if (existingGuests.Any(g => g.Mail?.ToLower() == request.Email.ToLower()))
                    return Conflict("Ya existe un registro con este email para este evento");

                // 3. Si tiene DNI, validar que no exista
                if (request.Dni.HasValue)
                {
                    var existingByDni = await _listService.GetInvitadoByDniAndEventIdAsync(request.Dni.Value, request.EventId);
                    if (existingByDni != null)
                        return Conflict("Ya existe un registro con este DNI para este evento");
                }

                // 4. Crear el invitado
                var guest = new Guest
                {
                    Nombre = request.Nombre.Trim(),
                    Apellido = request.Apellido.Trim(),
                    Mail = request.Email.Trim().ToLower(),
                    Dni = request.Dni,
                    Empresa = request.Empresa?.Trim(),
                    Cargo = request.Cargo?.Trim(),
                    Telefono = request.Telefono?.Trim(),
                    Categoria = request.Categoria?.Trim(),
                    Profesion = request.Profesion?.Trim(),
                    Lugar = request.Lugar?.Trim(),
                    RedSocial = request.RedSocial?.Trim(),
                    InfoAdicional = request.InfoAdicional?.Trim(),
                    EventoId = request.EventId,
                    EsNuevo = true,
                    Acreditado = 0,
                    IdCode = Guid.NewGuid().ToString("N")[..12].ToUpper() // Código único para QR
                };

                var createdGuest = await _listService.CreateInvitadoAsync(guest);

                // 5. Enviar email con invitación y QR
                await _emailService.SendInvitationEmailAsync(createdGuest, evento);

                return Ok(new 
                { 
                    mensaje = "¡Registro exitoso! Revisa tu email para obtener tu código QR de acceso.",
                    invitadoId = createdGuest.Id,
                    codigoQR = createdGuest.IdCode
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al procesar el registro: {ex.Message}");
            }
        }

        // Obtener todos los invitados
        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllInvitados([FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var guests = await _listService.GetInvitadosByEventIdAsync(eventId);
            return Ok(guests);
        }

        // ENDPOINT SÚPER RÁPIDO CON STORED PROCEDURE
        [HttpGet("GetAllFast")]
        public async Task<IActionResult> GetAllInvitadosFast([FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            try
            {
                var guests = await _listService.GetAllByEventIdViaSPAsync(eventId);
                return Ok(new { 
                    data = guests,
                    count = guests.Count,
                    message = $"Retrieved {guests.Count} guests using optimized stored procedure"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving guests: {ex.Message}");
            }
        }

        // Para invitados acreditados
        [HttpGet("GetAcreditados")]
        public async Task<IActionResult> GetInvitadosAcreditados([FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var acreditados = await _listService.GetInvitadosAcreditadosByEventIdAsync(eventId);
            return Ok(acreditados);
        }

        [HttpGet("GetNoAcreditados")]
        public async Task<IActionResult> GetInvitadosNoAcreditados([FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var noAcreditados = await _listService.GetInvitadosNoAcreditadosByEventIdAsync(eventId);
            return Ok(noAcreditados);
        }

        // Para invitados nuevos
        [HttpGet("GetNuevos")]
        public async Task<IActionResult> GetInvitadosNuevos([FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var nuevos = await _listService.GetInvitadosNuevosByEventIdAsync(eventId);
            return Ok(nuevos);
        }

        // Buscar por apellido o nombre
        [HttpGet("searchByName")]
        public async Task<IActionResult> SearchInvitado([FromQuery] string query, [FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var invitados = await _listService.SearchInvitadoByEventIdAsync(query, eventId);
            return Ok(invitados);
        }

        [HttpGet("searchByDni")]
        public async Task<IActionResult> GetInvitadoByDni([FromQuery] int dni, [FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var invitado = await _listService.GetInvitadoByDniAndEventIdAsync(dni, eventId);
            if (invitado == null)
                return NotFound($"No se encontró un invitado con el DNI {dni} en el evento especificado");

            return Ok(invitado);
        }

        // Acreditar un invitado
        [HttpPut("acreditar/{dni}")]
        public async Task<IActionResult> AcreditarInvitado(int dni, [FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var invitado = await _listService.GetInvitadoByDniAndEventIdAsync(dni, eventId);
            if (invitado == null)
                return NotFound($"No se encontró un invitado con el DNI {dni} en el evento especificado");

            await _listService.AcreditarInvitadoAsync(invitado);
            return Ok(invitado);
        }
        [HttpDelete("delete/{dni}")]
        public async Task<IActionResult> DeleteInvitado(int dni, [FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var invitado = await _listService.GetInvitadoByDniAndEventIdAsync(dni, eventId);
            if (invitado == null)
                return NotFound($"No se encontró un invitado con el DNI {dni} en el evento especificado");

            await _listService.DeleteInvitadoAsync(dni);
            return Ok(invitado);
        }
        // Eliminar invitado por ID
        [HttpDelete("deleteById/{id}")]
        public async Task<IActionResult> DeleteInvitadoById(int id, [FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var invitado = await _listService.GetInvitadoByIdAndEventIdAsync(id, eventId);
            if (invitado == null)
                return NotFound($"No se encontró un invitado con el ID {id} en el evento especificado");

            await _listService.DeleteInvitadoByIdAsync(id);
            return Ok(invitado);
        }
        // Obtener invitado por ID
        [HttpGet("GetById/{id}")]
        public async Task<IActionResult> GetInvitadoById(int id, [FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var invitado = await _listService.GetInvitadoByIdAndEventIdAsync(id, eventId);
            if (invitado == null)
                return NotFound($"No se encontró un invitado con el ID {id} en el evento especificado");

            return Ok(invitado);
        }
        // Agregar un nuevo invitado
        [HttpPost("create")]
        public async Task<IActionResult> CreateInvitado([FromBody] Guest newGuest)
        {
            if (newGuest == null)
                return BadRequest("Datos de invitado inválidos");

            // Validar el ID del evento (debe ser no-nulo y mayor que 0)
            if (newGuest.EventoId == null || newGuest.EventoId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            // Ahora que sabemos que EventoId tiene un valor válido, podemos convertirlo a int
            int eventoId = newGuest.EventoId.Value;

            try
            {
                // Si se proporcionó un DNI, validar que no exista ya en este evento
                if (newGuest.Dni.HasValue)
                {
                    var existingGuest = await _listService.GetInvitadoByDniAndEventIdAsync(newGuest.Dni.Value, eventoId);
                    if (existingGuest != null)
                        return Conflict($"Ya existe un invitado con el DNI {newGuest.Dni} en este evento");
                }

                // Inicializar campos para un nuevo invitado
                newGuest.Acreditado = 0; // No acreditado inicialmente
                newGuest.EsNuevo = true; // Nuevo invitado

                var createdGuest = await _listService.CreateInvitadoAsync(newGuest);
                // Devolver el ID generado en la respuesta
                return CreatedAtAction(nameof(GetInvitadoById), new { id = createdGuest.Id, eventId = eventoId }, createdGuest);
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(500, $"Error interno al crear invitado: {ex.Message}");
            }
        }

        // Actualizar un invitado
        [HttpPut("update/{originalDni}")]
        public async Task<IActionResult> UpdateInvitado(int originalDni, [FromBody] Guest updatedGuest, [FromQuery] int eventId)
        {
            if (updatedGuest == null)
                return BadRequest("Datos de invitado inválidos");

            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            // Asegurar que el EventoId del invitado coincide con el proporcionado
            updatedGuest.EventoId = eventId;

            try
            {
                // Obtener el invitado original
                var existingGuest = await _listService.GetInvitadoByDniAndEventIdAsync(originalDni, eventId);
                if (existingGuest == null)
                    return NotFound($"No se encontró un invitado con el DNI {originalDni} en el evento especificado");

                // Si el DNI cambió, verificar que el nuevo DNI no exista en este evento
                if (updatedGuest.Dni.HasValue && originalDni != updatedGuest.Dni.Value)
                {
                    var existingWithNewDni = await _listService.GetInvitadoByDniAndEventIdAsync(updatedGuest.Dni.Value, eventId);
                    if (existingWithNewDni != null && existingWithNewDni.Id != existingGuest.Id)
                        return Conflict($"Ya existe otro invitado con el DNI {updatedGuest.Dni.Value} en este evento");
                }

                // Actualizar el invitado usando su ID
                await _listService.UpdateInvitadoByIdAsync(existingGuest.Id, updatedGuest);
                return Ok(updatedGuest);
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(500, $"Error interno al actualizar invitado: {ex.Message}");
            }
        }

        // Actualizar solo el estado de acreditación (endpoint específico para el toggle)
        [HttpPut("updateAccreditStatus/{dni}")]
        public async Task<IActionResult> UpdateAccreditStatus(int dni, [FromBody] AccreditStatusDto status, [FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            try
            {
                var invitado = await _listService.GetInvitadoByDniAndEventIdAsync(dni, eventId);
                if (invitado == null)
                    return NotFound($"No se encontró un invitado con el DNI {dni} en el evento especificado");

                // Actualizar solo el estado de acreditación
                invitado.Acreditado = status.Acreditado;
                // Si está siendo acreditado, guardar la hora actual
                if (status.Acreditado > 0)
                {
                    invitado.HoraAcreditacion = DateTime.Now;
                }

                await _listService.UpdateAccreditStatusAsync(invitado);
                return Ok(invitado);
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(500, $"Error interno al actualizar estado de acreditación: {ex.Message}");
            }
        }
        // Controllers/ListController.cs - Añadir estos endpoints

        // Actualizar invitado por ID
        [HttpPut("updateById/{id}")]
        public async Task<IActionResult> UpdateInvitadoById(int id, [FromBody] Guest updatedGuest, [FromQuery] int eventId)
        {
            if (updatedGuest == null)
                return BadRequest("Datos de invitado inválidos");

            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            // Asegurar que el EventoId del invitado coincide con el proporcionado
            updatedGuest.EventoId = eventId;

            try
            {
                // Verificar que el invitado existe
                var existingGuest = await _listService.GetInvitadoByIdAndEventIdAsync(id, eventId);
                if (existingGuest == null)
                    return NotFound($"No se encontró un invitado con el ID {id} en el evento especificado");

                // Si el DNI cambió, verificar que el nuevo DNI no exista en este evento
                if (updatedGuest.Dni.HasValue && existingGuest.Dni != updatedGuest.Dni)
                {
                    var existingWithNewDni = await _listService.GetInvitadoByDniAndEventIdAsync(updatedGuest.Dni.Value, eventId);
                    if (existingWithNewDni != null && existingWithNewDni.Id != id)
                        return Conflict($"Ya existe otro invitado con el DNI {updatedGuest.Dni} en este evento");
                }

                // Actualizar el invitado
                await _listService.UpdateInvitadoByIdAsync(id, updatedGuest);
                return Ok(updatedGuest);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al actualizar invitado: {ex.Message}");
            }
        }
        // Acreditar invitado por ID
        [HttpPut("acreditarById/{id}")]
        public async Task<IActionResult> AcreditarInvitadoById(int id, [FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var invitado = await _listService.GetInvitadoByIdAndEventIdAsync(id, eventId);
            if (invitado == null)
                return NotFound($"No se encontró un invitado con el ID {id} en el evento especificado");

            await _listService.AcreditarInvitadoAsync(invitado);
            return Ok(invitado);
        }

        // Actualizar estado de acreditación por ID
        [HttpPut("updateAccreditStatusById/{id}")]
        public async Task<IActionResult> UpdateAccreditStatusById(int id, [FromBody] AccreditStatusDto status, [FromQuery] int eventId)
        {
            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            try
            {
                var invitado = await _listService.GetInvitadoByIdAndEventIdAsync(id, eventId);
                if (invitado == null)
                    return NotFound($"No se encontró un invitado con el ID {id} en el evento especificado");

                // Actualizar solo el estado de acreditación
                invitado.Acreditado = status.Acreditado;
                // Si está siendo acreditado, guardar la hora actual
                if (status.Acreditado > 0)
                {
                    invitado.HoraAcreditacion = DateTime.Now;
                }

                await _listService.UpdateAccreditStatusAsync(invitado);
                return Ok(invitado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al actualizar estado de acreditación: {ex.Message}");
            }
        }
        [HttpGet("searchByIdCode")]
        public async Task<IActionResult> GetInvitadoByIdCode([FromQuery] string idCode, [FromQuery] int eventId)
        {
            if (string.IsNullOrWhiteSpace(idCode))
                return BadRequest("Se requiere un código válido");

            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var invitado = await _listService.GetInvitadoByIdCodeAndEventIdAsync(idCode, eventId);
            if (invitado == null)
                return NotFound($"No se encontró un invitado con el código {idCode} en el evento especificado");

            return Ok(invitado);
        }

        // Acreditar por IdCode
        [HttpPut("acreditarByIdCode/{idCode}")]
        public async Task<IActionResult> AcreditarInvitadoByIdCode(string idCode, [FromQuery] int eventId)
        {
            if (string.IsNullOrWhiteSpace(idCode))
                return BadRequest("Se requiere un código válido");

            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            var invitado = await _listService.GetInvitadoByIdCodeAndEventIdAsync(idCode, eventId);
            if (invitado == null)
                return NotFound($"No se encontró un invitado con el código {idCode} en el evento especificado");

            await _listService.AcreditarInvitadoAsync(invitado);
            return Ok(invitado);
        }

        // Actualizar estado de acreditación por IdCode
        [HttpPut("updateAccreditStatusByIdCode/{idCode}")]
        public async Task<IActionResult> UpdateAccreditStatusByIdCode(string idCode, [FromBody] AccreditStatusDto status, [FromQuery] int eventId)
        {
            if (string.IsNullOrWhiteSpace(idCode))
                return BadRequest("Se requiere un código válido");

            if (eventId <= 0)
                return BadRequest("Se requiere un ID de evento válido");

            try
            {
                var invitado = await _listService.GetInvitadoByIdCodeAndEventIdAsync(idCode, eventId);
                if (invitado == null)
                    return NotFound($"No se encontró un invitado con el código {idCode} en el evento especificado");

                // Actualizar solo el estado de acreditación
                invitado.Acreditado = status.Acreditado;
                // Si está siendo acreditado, guardar la hora actual
                if (status.Acreditado > 0)
                {
                    invitado.HoraAcreditacion = DateTime.Now;
                }

                await _listService.UpdateAccreditStatusAsync(invitado);
                return Ok(invitado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al actualizar estado de acreditación: {ex.Message}");
            }
        }
        
        [HttpGet("GetPaginated")]
        public async Task<IActionResult> GetPaginatedGuests(
            int eventId, 
            int draw = 1,
            int start = 0, 
            int length = 100,
            string search = "",
            string filter = "",
            string orderColumn = "id",
            string orderDirection = "asc")
        {
            try 
            {
                var result = await _listService.GetPaginatedGuestsAsync(eventId, start, length, search, filter, orderColumn, orderDirection);
                
                // RESPUESTA EN FORMATO DATATABLES
                var response = new
                {
                    draw = draw,
                    recordsTotal = result.totalCount,
                    recordsFiltered = result.filteredCount,
                    data = result.guests.Select(g => new {
                        id = g.Id,
                        nombre = g.Nombre,
                        apellido = g.Apellido,
                        dni = g.Dni,
                        mail = g.Mail,
                        telefono = g.Telefono,
                        empresa = g.Empresa,
                        cargo = g.Cargo,
                        categoria = g.Categoria,
                        profesion = g.Profesion,
                        lugar = g.Lugar,
                        redSocial = g.RedSocial,
                        dayOne = g.DayOne,
                        dayTwo = g.DayTwo,
                        dayThree = g.DayThree,
                        infoAdicional = g.InfoAdicional,
                        acreditado = g.Acreditado,
                        horaAcreditacion = g.HoraAcreditacion,
                        idCode = g.IdCode,
                        esNuevo = g.EsNuevo 
                    })
                };
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
        
        [HttpGet("GetCounters")]
        public async Task<IActionResult> GetEventCounters(int eventId)
        {
            try
            {
                var counters = await _listService.GetEventCountersAsync(eventId);
                
                return Ok(new {
                    total = counters.total,
                    acreditados = counters.acreditados,
                    ausentes = counters.total - counters.acreditados,
                    nuevos = counters.nuevos
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }

[HttpGet("ExportCsv")]
public async Task<IActionResult> ExportCsv(int eventId)
{
    // ¡FALTABA EL AWAIT! Esta era la línea con el error
    var guests = await _listService.ExportCsvAsync(eventId);
    
    // Armar el CSV con todos los campos relevantes
    var sb = new StringBuilder();
    
    // Header del CSV con todos los campos - USANDO PUNTO Y COMA para Excel en español
    sb.AppendLine("ID;Nombre;Apellido;DNI;Mail;Telefono;Empresa;Cargo;Profesion;Categoria;Lugar;Red Social;Info Adicional;Cant Entradas;Day One;Day Two;Day Three;Estado;Hora Acreditacion;Tipo de Registro");

    foreach (var g in guests)
    {
        // Estado basado en acreditado
        string estado = g.Acreditado > 0 ? "Asistio" : "No asistio";
        
        // Formatear hora de acreditación
        string horaAcreditacion = "";
        if (g.HoraAcreditacion.HasValue)
        {
            var fecha = g.HoraAcreditacion.Value;
            string diaSemana = fecha.ToString("dddd", new System.Globalization.CultureInfo("es-ES"));
            horaAcreditacion = $"{diaSemana} {fecha:dd/MM/yyyy HH:mm}";
        }
        
        // Tipo de registro
        string tipoRegistro = g.EsNuevo ? "Invitado Nuevo" : "Invitado Pre-registrado";
        
        // Escapar comillas dobles en los strings y manejar nulls - SIN comillas externas porque usamos ;
        string EscapeForCsv(string? value) => value == null ? "" : value.Replace("\"", "\"\"").Replace(";", ",");
        
        sb.AppendLine($"{g.Id};" +
                     $"{EscapeForCsv(g.Nombre)};" +
                     $"{EscapeForCsv(g.Apellido)};" +
                     $"{g.Dni};" +
                     $"{EscapeForCsv(g.Mail)};" +
                     $"{EscapeForCsv(g.Telefono)};" +
                     $"{EscapeForCsv(g.Empresa)};" +
                     $"{EscapeForCsv(g.Cargo)};" +
                     $"{EscapeForCsv(g.Profesion)};" +
                     $"{EscapeForCsv(g.Categoria)};" +
                     $"{EscapeForCsv(g.Lugar)};" +
                     $"{EscapeForCsv(g.RedSocial)};" +
                     $"{EscapeForCsv(g.InfoAdicional)};" +
                     $"{g.CantEntradas};" +
                     $"{EscapeForCsv(g.DayOne)};" +
                     $"{EscapeForCsv(g.DayTwo)};" +
                     $"{EscapeForCsv(g.DayThree)};" +
                     $"{EscapeForCsv(estado)};" +
                     $"{EscapeForCsv(horaAcreditacion)};" +
                     $"{EscapeForCsv(tipoRegistro)}");
    }

    // Devolver como archivo CSV con BOM para que Excel lo abra bien con tildes
    var csvBytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    return File(csvBytes, "text/csv", $"invitados_evento_{eventId}.csv");
}
    }
}
