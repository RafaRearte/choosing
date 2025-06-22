using choosing.Context;
using choosing.Domain;
using choosing.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
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

        // GET: api/Auth/users (solo para admin)
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _context.Users
                    .Select(u => new {
                        u.Id,
                        u.Username,
                        u.Email
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // GET: api/Auth/users/{id}
        [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound($"Usuario con ID {id} no encontrado");

                var result = new
                {
                    user.Id,
                    user.Username,
                    user.Email
                };
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // PUT: api/Auth/users/{id}
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserDTO model)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound($"Usuario con ID {id} no encontrado");

                // Verificar username único (excluyendo el usuario actual)
                if (await _context.Users.AnyAsync(u => u.Username == model.Username && u.Id != id))
                    return BadRequest("El nombre de usuario ya existe");

                // Verificar email único (excluyendo el usuario actual)
                if (await _context.Users.AnyAsync(u => u.Email == model.Email && u.Id != id))
                    return BadRequest("El email ya está registrado");

                // Actualizar campos
                user.Username = model.Username;
                user.Email = model.Email;

                // Solo actualizar password si se proporciona uno nuevo
                if (!string.IsNullOrEmpty(model.Password))
                {
                    user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    message = "Usuario actualizado correctamente"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }

        // DELETE: api/Auth/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null)
                    return NotFound($"Usuario con ID {id} no encontrado");

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();

                return Ok($"Usuario {user.Username} eliminado correctamente");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno: {ex.Message}");
            }
        }
    }
}
