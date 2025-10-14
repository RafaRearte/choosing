using choosing.Domain;
using choosing.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace choosing.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;

        public AuthController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Registrar un nuevo usuario (comprador, organizador o admin)
        /// </summary>
        [HttpPost("registro")]
        public async Task<IActionResult> Registro(RegistroDTO model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _userService.RegisterAsync(model);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error interno del servidor", details = ex.Message });
            }
        }

        /// <summary>
        /// Iniciar sesión
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _userService.LoginAsync(model);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Error interno del servidor", details = ex.Message });
            }
        }
        
    }
}
