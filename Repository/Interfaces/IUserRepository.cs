using choosing.Domain;

namespace choosing.Repository.Interfaces;

public interface IUserRepository
{
    Task<List<User>> GetAllAsync();
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailAsync(string email);
    Task<User> AddAsync(User newUser);
    Task UpdateAsync(User updatedUser);
    Task DeleteAsync(int id);
    Task<bool> ExistsByUsernameAsync(string username);
    Task<bool> ExistsByEmailAsync(string email);
    Task<bool> ExistsByUsernameExceptIdAsync(string username, int userId);
    Task<bool> ExistsByEmailExceptIdAsync(string email, int userId);
}