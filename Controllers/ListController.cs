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

        public ListController(IListService listService)
        {
            _listService = listService;
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
                if (originalDni != updatedGuest.Dni)
                {
                    var existingWithNewDni = await _listService.GetInvitadoByDniAndEventIdAsync(updatedGuest.Dni, eventId);
                    if (existingWithNewDni != null && existingWithNewDni.Dni != originalDni)
                        return Conflict($"Ya existe otro invitado con el DNI {updatedGuest.Dni} en este evento");
                }

                // Actualizar el invitado
                await _listService.UpdateInvitadoAsync(originalDni, updatedGuest);
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
                    invitado.horaAcreditacion = DateTime.Now;
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
                    invitado.horaAcreditacion = DateTime.Now;
                }

                await _listService.UpdateAccreditStatusAsync(invitado);
                return Ok(invitado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno al actualizar estado de acreditación: {ex.Message}");
            }
        }
    }
}
