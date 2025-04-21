using choosing.Context;
using choosing.Domain;
using choosing.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace choosing.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly DbHotelContext _context;
        private readonly ITokenService _tokenService;

        public AuthController(DbHotelContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        [HttpPost("registro")]
        public async Task<IActionResult> Registro(RegistroDTO model)
        {
            // Verificar si el usuario ya existe
            if (await _context.Users.AnyAsync(u => u.Username == model.Username))
            {
                return BadRequest("El nombre de usuario ya existe");
            }

            // Hash de la contraseña
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);

            // Crear nuevo usuario
            var usuario = new User
            {
                Username = model.Username,
                Email = model.Email,
                PasswordHash = passwordHash
            };

            _context.Users.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok("Usuario registrado correctamente");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO model)
        {
            // Buscar usuario
            var usuario = await _context.Users.FirstOrDefaultAsync(u => u.Username == model.Username);
            if (usuario == null)
            {
                return Unauthorized("Credenciales inválidas");
            }

            // Verificar contraseña
            if (!BCrypt.Net.BCrypt.Verify(model.Password, usuario.PasswordHash))
            {
                return Unauthorized("Credenciales inválidas");
            }

            // Generar token
            var token = _tokenService.GenerateToken(usuario);

            return Ok(new
            {
                Token = token,
                User = new
                {
                    Id = usuario.Id,
                    Name = usuario.Username, // El nombre que quieres mostrar

                }
            });
        }
    }
}
