using choosing.Domain;
using choosing.Domain.Dtos;

namespace choosing.Services.Interfaces;

public interface IUserService
{
    // Auth
    Task<AuthResponseDTO> RegisterAsync(RegistroDTO model);
    Task<AuthResponseDTO> LoginAsync(LoginDTO model);

    // CRUD
    Task<List<UserResponseDTO>> GetAllUsersAsync();
    Task<UserResponseDTO?> GetUserByIdAsync(int id);
    Task<UserResponseDTO> UpdateUserAsync(int id, UpdateUserDTO model);
    Task DeleteUserAsync(int id);
}
