using choosing.Domain.Dtos;
using choosing.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace choosing.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CompraController : ControllerBase
    {
        private readonly ICompraService _compraService;

        public CompraController(ICompraService compraService)
        {
            _compraService = compraService;
        }

        /// <summary>
        /// Crear una nueva compra (pre-pago)
        /// </summary>
        [HttpPost("crear")]
        //[Authorize(Roles = "comprador")]
        public async Task<IActionResult> CrearCompra([FromBody] CrearCompraDTO dto)
        {
            try
            {
                // Obtener userId del token JWT (más seguro que confiar en el DTO)
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { error = "Token inválido o sin userId" });
                }

                // Sobrescribir el UsuarioId del DTO con el del token
                dto.UsuarioId = int.Parse(userIdClaim.Value);

                var compra = await _compraService.CrearCompraAsync(dto);
                return Ok(new
                {
                    message = "Compra creada exitosamente",
                    compraId = compra.Id,
                    eventoId = compra.EventoId,
                    usuarioId = compra.UsuarioId,
                    cantidadEntradas = compra.CantidadEntradas,
                    montoTotal = compra.MontoTotal,
                    estado = compra.Estado,
                    fechaCompra = compra.FechaCompra
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Obtener compras del usuario logueado
        /// </summary>
        [HttpGet("mis-compras")]
        //[Authorize(Roles = "comprador")]
        public async Task<IActionResult> ObtenerMisCompras()
        {
            try
            {
                // Obtener userId del token JWT
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { error = "Token inválido o sin userId" });
                }

                int usuarioId = int.Parse(userIdClaim.Value);
                var compras = await _compraService.ObtenerComprasPorUsuarioAsync(usuarioId);
                return Ok(compras);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Obtener compra por ID
        /// </summary>
        [HttpGet("{id}")]
        //[Authorize]
        public async Task<IActionResult> ObtenerCompraPorId(int id)
        {
            try
            {
                var compra = await _compraService.ObtenerCompraPorIdAsync(id);
                if (compra == null)
                    return NotFound(new { error = "Compra no encontrada" });

                return Ok(new
                {
                    id = compra.Id,
                    usuarioId = compra.UsuarioId,
                    eventoId = compra.EventoId,
                    eventoNombre = compra.Evento?.Nombre,
                    cantidadEntradas = compra.CantidadEntradas,
                    montoTotal = compra.MontoTotal,
                    estado = compra.Estado,
                    metodoPago = compra.MetodoPago,
                    transaccionId = compra.TransaccionId,
                    fechaCompra = compra.FechaCompra,
                    fechaPago = compra.FechaPago,
                    notasInternas = compra.NotasInternas
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Obtener compras de un evento (solo para organizador del evento)
        /// </summary>
        [HttpGet("evento/{eventoId}")]
        //[Authorize(Roles = "organizador,admin")]
        public async Task<IActionResult> ObtenerComprasPorEvento(int eventoId)
        {
            try
            {
                var compras = await _compraService.ObtenerComprasPorEventoAsync(eventoId);
                return Ok(compras);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Agregar invitados a una compra
        /// </summary>
        [HttpPost("{compraId}/agregar-invitados")]
        //[Authorize(Roles = "comprador")]
        public async Task<IActionResult> AgregarInvitados(int compraId, [FromBody] AgregarInvitadosDTO dto)
        {
            try
            {
                var compra = await _compraService.AgregarInvitadosAsync(compraId, dto);
                return Ok(new
                {
                    message = "Invitados agregados exitosamente",
                    compra
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Actualizar estado de compra (para testing - en producción solo webhook)
        /// </summary>
        [HttpPut("{compraId}/estado")]
        //[Authorize(Roles = "admin")]
        public async Task<IActionResult> ActualizarEstado(int compraId, [FromBody] ActualizarEstadoDTO dto)
        {
            try
            {
                var compra = await _compraService.ActualizarEstadoCompraAsync(
                    compraId,
                    dto.NuevoEstado,
                    dto.TransaccionId
                );

                return Ok(new
                {
                    message = "Estado actualizado exitosamente",
                    compra
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Webhook de MercadoPago (sin autenticación)
        /// </summary>
        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> WebhookMercadoPago([FromBody] dynamic notificacion)
        {
            try
            {
                // TODO: Implementar lógica de webhook MercadoPago
                // Por ahora solo retornamos 200 OK
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Obtener códigos QR de una compra (devuelve lista de URLs y códigos)
        /// </summary>
        [HttpGet("{compraId}/qr-codes")]
        [Authorize]
        public async Task<IActionResult> ObtenerQRCodesCompra(int compraId)
        {
            try
            {
                // Verificar que la compra existe
                var compra = await _compraService.ObtenerCompraPorIdAsync(compraId);
                if (compra == null)
                    return NotFound(new { error = "Compra no encontrada" });

                // Verificar que el usuario es dueño de la compra (o admin)
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                var userId = userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
                var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

                if (userId != compra.UsuarioId && userRole != "admin")
                {
                    return Forbid();
                }

                // Obtener invitados de esta compra
                var invitados = await _compraService.ObtenerInvitadosPorCompraIdAsync(compraId);

                if (invitados == null || invitados.Count == 0)
                {
                    return NotFound(new { error = "No hay invitados para esta compra" });
                }

                // Devolver array con datos de cada entrada
                var entradas = invitados.Select(inv => new
                {
                    invitadoId = inv.Id,
                    nombreCompleto = $"{inv.Nombre} {inv.Apellido}",
                    idCode = inv.IdCode,
                    qrUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={inv.IdCode}",
                    email = inv.Email,
                    estaAcreditado = inv.EstaAcreditado,
                    fechaAcreditacion = inv.FechaAcreditacion
                }).ToList();

                return Ok(new
                {
                    compraId = compra.Id,
                    eventoId = compra.EventoId,
                    cantidadEntradas = compra.CantidadEntradas,
                    estado = compra.Estado,
                    entradas = entradas
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }

    public class ActualizarEstadoDTO
    {
        public string NuevoEstado { get; set; } = string.Empty;
        public string? TransaccionId { get; set; }
    }
}
