using choosing.Domain;
using choosing.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace choosing.Controllers;

[Route("api/[controller]")]
[ApiController]

public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Obtener todos los usuarios (solo admin)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Error interno del servidor", details = ex.Message });
        }
    }

    /// <summary>
    /// Obtener un usuario por ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetUser(int id)
    {
        try
        {
            var user = await _userService.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { error = $"Usuario con ID {id} no encontrado" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Error interno del servidor", details = ex.Message });
        }
    }

    /// <summary>
    /// Actualizar un usuario
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserDTO model)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updatedUser = await _userService.UpdateUserAsync(id, model);
            return Ok(new
            {
                user = updatedUser,
                message = "Usuario actualizado correctamente"
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
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
    /// Eliminar un usuario (solo admin)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            await _userService.DeleteUserAsync(id);
            return Ok(new { message = $"Usuario con ID {id} eliminado correctamente" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Error interno del servidor", details = ex.Message });
        }
    }
}
