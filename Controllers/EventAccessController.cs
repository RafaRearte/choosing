using choosing.Context;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace choosing.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventAccessController : ControllerBase
    {
        private readonly DbHotelContext _context;

        public EventAccessController(DbHotelContext context)
        {
            _context = context;
        }

        [HttpPost("verificar-codigo")]
        public async Task<IActionResult> VerificarCodigo([FromBody] EventAccessRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Codigo))
            {
                return Ok(new { success = false, message = "Debe ingresar un código" });
            }

            var codigo = request.Codigo.Trim().ToLower();

            // Buscar evento que coincida con alguno de los códigos
            var evento = await _context.Events
                .FirstOrDefaultAsync(e =>
                    e.Activo &&
                    (e.CodigoAcceso.ToLower() == codigo ||
                     e.CodigoAdmin.ToLower() == codigo ||
                     e.CodigoStats.ToLower() == codigo));

            if (evento == null)
            {
                return Ok(new { success = false, message = "Código inválido" });
            }

            // Determinar tipo de acceso y permisos
            string tipoAcceso = "Usuario";
            bool puedeAcreditar = true;
            bool puedeEditarInvitados = true;
            bool puedeVerEstadisticas = false;
            bool puedeConfigurar = false;

            if (codigo == evento.CodigoAdmin?.ToLower())
            {
                tipoAcceso = "Admin";
                puedeVerEstadisticas = true;
                puedeConfigurar = true;
            }
            else if (codigo == evento.CodigoStats?.ToLower())
            {
                tipoAcceso = "Stats";
                puedeAcreditar = false;
                puedeEditarInvitados = false;
                puedeVerEstadisticas = true;
            }

            // Verificar fechas del evento
            var ahora = DateTime.Now;
            var eventoEnFechas = ahora >= evento.FechaInicio && ahora <= evento.FechaFin;

            // Si no está en fechas, solo admin con permiso especial puede acreditar
            if (!eventoEnFechas && tipoAcceso != "Admin")
            {
                puedeAcreditar = false;
            }
            //else if (!eventoEnFechas && tipoAcceso == "Admin" && !evento.PermitirAccesoPostEvento)
            //{
            //    puedeAcreditar = false;
            //}

            return Ok(new
            {
                success = true,
                message = "Acceso concedido",
                eventInfo = new
                {
                    eventoId = evento.Id,
                    eventoNombre = evento.Nombre,
                    tipoAcceso = tipoAcceso,
                    puedeAcreditar = puedeAcreditar,
                    puedeEditarInvitados = puedeEditarInvitados,
                    puedeVerEstadisticas = puedeVerEstadisticas,
                    puedeConfigurar = puedeConfigurar,
                    eventoEnFechasValidas = eventoEnFechas
                }
            });
        }
    }

    public class EventAccessRequest
    {
        public string Codigo { get; set; } = "";
    }
}

