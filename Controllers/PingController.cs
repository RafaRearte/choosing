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

        [HttpGet("server-time")]
        public IActionResult GetServerTime()
        {
            var serverTime = DateTime.Now;
            var utcTime = DateTime.UtcNow;

            return Ok(new
            {
                ServerLocalTime = serverTime.ToString("yyyy-MM-dd HH:mm:ss"),
                ServerUTCTime = utcTime.ToString("yyyy-MM-dd HH:mm:ss"),
                TimeZone = TimeZoneInfo.Local.DisplayName,
                TimeZoneId = TimeZoneInfo.Local.Id
            });
        }
    }
}
