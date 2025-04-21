using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace choosing.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MiControladorProtegido : ControllerBase
    {
        [HttpGet]
        [Authorize] // Este endpoint requiere autenticación
        public IActionResult Get()
        {
            // Puedes obtener el ID del usuario del token
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return Ok(new { mensaje = "Endpoint protegido", userId });
        }
    }
}
