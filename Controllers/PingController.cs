using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace choosing.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PingController : ControllerBase
    {
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok("Pong");
        }
    }
}
