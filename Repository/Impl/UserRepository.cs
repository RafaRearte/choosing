using choosing.Context;
using choosing.Domain;
using choosing.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace choosing.Repository.Impl;

public class UserRepository : IUserRepository
{
    private readonly DbChoosingContext _choosingContext;

    public UserRepository(DbChoosingContext choosingContext)
    {
        _choosingContext = choosingContext;
    }

    public async Task<List<User>> GetAllAsync()
    {
        return await _choosingContext.Users
            .Where(u => u.Activo)
            .OrderByDescending(u => u.FechaRegistro)
            .ToListAsync();
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _choosingContext.Users
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _choosingContext.Users
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _choosingContext.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User> AddAsync(User newUser)
    {
        _choosingContext.Users.Add(newUser);
        await _choosingContext.SaveChangesAsync();
        return newUser;
    }

    public async Task UpdateAsync(User updatedUser)
    {
        _choosingContext.Users.Update(updatedUser);
        await _choosingContext.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var user = await GetByIdAsync(id);
        if (user != null)
        {
            _choosingContext.Users.Remove(user);
            await _choosingContext.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsByUsernameAsync(string username)
    {
        return await _choosingContext.Users
            .AnyAsync(u => u.Username == username);
    }

    public async Task<bool> ExistsByEmailAsync(string email)
    {
        return await _choosingContext.Users
            .AnyAsync(u => u.Email == email);
    }

    public async Task<bool> ExistsByUsernameExceptIdAsync(string username, int userId)
    {
        return await _choosingContext.Users
            .AnyAsync(u => u.Username == username && u.Id != userId);
    }

    public async Task<bool> ExistsByEmailExceptIdAsync(string email, int userId)
    {
        return await _choosingContext.Users
            .AnyAsync(u => u.Email == email && u.Id != userId);
    }
}
