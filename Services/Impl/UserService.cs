using choosing.Domain;
using choosing.Domain.Dtos;
using choosing.Repository.Interfaces;
using choosing.Services.Interfaces;

namespace choosing.Services.Impl;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly ITokenService _tokenService;

    public UserService(
        IUserRepository userRepository,
        ITokenService tokenService)
    {
        _userRepository = userRepository;
        _tokenService = tokenService;
    }

    public async Task<AuthResponseDTO> RegisterAsync(RegistroDTO model)
    {
        // Validar tipo de usuario
        var tiposValidos = new[] { "comprador", "organizador", "admin" };
        if (!tiposValidos.Contains(model.TipoUsuario.ToLower()))
        {
            throw new ArgumentException("Tipo de usuario inválido. Debe ser 'comprador', 'organizador' o 'admin'");
        }

        // Verificar si el usuario ya existe
        if (await _userRepository.ExistsByUsernameAsync(model.Username))
        {
            throw new ArgumentException("El nombre de usuario ya existe");
        }

        // Verificar si el email ya existe
        if (await _userRepository.ExistsByEmailAsync(model.Email))
        {
            throw new ArgumentException("El email ya está registrado");
        }

        // Hash de la contraseña
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);

        // Crear nuevo usuario
        var usuario = new User
        {
            Username = model.Username,
            Email = model.Email,
            PasswordHash = passwordHash,
            TipoUsuario = model.TipoUsuario.ToLower(),
            Nombre = model.Nombre,
            Apellido = model.Apellido,
            Telefono = model.Telefono,
            Direccion = model.Direccion,
            Provincia = model.Provincia,
            Ciudad = model.Ciudad,
            CodigoPostal = model.CodigoPostal,
            FechaRegistro = DateTime.Now,
            Activo = true
        };

        // Si es organizador, agregar campos específicos de organizador
        if (model.TipoUsuario.ToLower() == "organizador")
        {
            usuario.NombreEmpresa = model.NombreEmpresa ?? "Sin nombre";
            usuario.CuitCuil = model.CuitCuil;
            usuario.PlanSuscripcion = "free";
            usuario.FechaInicioPlan = DateTime.Now;
            usuario.EventosPermitidos = 1;
        }

        usuario = await _userRepository.AddAsync(usuario);

        // Generar token JWT
        var token = _tokenService.GenerateToken(usuario);

        return new AuthResponseDTO
        {
            Token = token,
            User = MapToUserResponseDTO(usuario),
            Message = "Usuario registrado correctamente"
        };
    }

    public async Task<AuthResponseDTO> LoginAsync(LoginDTO model)
    {
        // Buscar usuario
        var usuario = await _userRepository.GetByUsernameAsync(model.Username);
        if (usuario == null)
        {
            throw new UnauthorizedAccessException("Credenciales inválidas");
        }

        // Verificar si el usuario está activo
        if (!usuario.Activo)
        {
            throw new UnauthorizedAccessException("Usuario inactivo. Contacte al administrador");
        }

        // Verificar contraseña
        if (!BCrypt.Net.BCrypt.Verify(model.Password, usuario.PasswordHash))
        {
            throw new UnauthorizedAccessException("Credenciales inválidas");
        }

        // Actualizar último login
        usuario.UltimoLogin = DateTime.Now;
        await _userRepository.UpdateAsync(usuario);

        // Generar token
        var token = _tokenService.GenerateToken(usuario);

        return new AuthResponseDTO
        {
            Token = token,
            User = MapToUserResponseDTO(usuario)
        };
    }

    public async Task<List<UserResponseDTO>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(MapToUserResponseDTO).ToList();
    }

    public async Task<UserResponseDTO?> GetUserByIdAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user != null ? MapToUserResponseDTO(user) : null;
    }

    public async Task<UserResponseDTO> UpdateUserAsync(int id, UpdateUserDTO model)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            throw new KeyNotFoundException($"Usuario con ID {id} no encontrado");
        }

        // Verificar username único (excluyendo el usuario actual)
        if (await _userRepository.ExistsByUsernameExceptIdAsync(model.Username, id))
        {
            throw new ArgumentException("El nombre de usuario ya existe");
        }

        // Verificar email único (excluyendo el usuario actual)
        if (await _userRepository.ExistsByEmailExceptIdAsync(model.Email, id))
        {
            throw new ArgumentException("El email ya está registrado");
        }

        // Actualizar campos
        user.Username = model.Username;
        user.Email = model.Email;

        // Solo actualizar password si se proporciona uno nuevo
        if (!string.IsNullOrEmpty(model.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);
        }

        await _userRepository.UpdateAsync(user);

        return MapToUserResponseDTO(user);
    }

    public async Task DeleteUserAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
            throw new KeyNotFoundException($"Usuario con ID {id} no encontrado");
        }

        await _userRepository.DeleteAsync(id);
    }

    // Helper para mapear User → UserResponseDTO
    private UserResponseDTO MapToUserResponseDTO(User user)
    {
        return new UserResponseDTO
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            TipoUsuario = user.TipoUsuario,
            Nombre = user.Nombre,
            Apellido = user.Apellido,
            Telefono = user.Telefono,
            FechaRegistro = user.FechaRegistro,
            UltimoLogin = user.UltimoLogin
        };
    }
}
