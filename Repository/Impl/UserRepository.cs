using choosing.Context;
using choosing.Domain;
using choosing.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace choosing.Repository.Impl;

public class UserRepository : IUserRepository
{
    private readonly DbHotelContext _context;

    public UserRepository(DbHotelContext context)
    {
        _context = context;
    }

    public async Task<List<User>> GetAllAsync()
    {
        return await _context.Users
            .Where(u => u.Activo)
            .OrderByDescending(u => u.FechaRegistro)
            .ToListAsync();
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Username == username);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User> AddAsync(User newUser)
    {
        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();
        return newUser;
    }

    public async Task UpdateAsync(User updatedUser)
    {
        _context.Users.Update(updatedUser);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var user = await GetByIdAsync(id);
        if (user != null)
        {
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsByUsernameAsync(string username)
    {
        return await _context.Users
            .AnyAsync(u => u.Username == username);
    }

    public async Task<bool> ExistsByEmailAsync(string email)
    {
        return await _context.Users
            .AnyAsync(u => u.Email == email);
    }

    public async Task<bool> ExistsByUsernameExceptIdAsync(string username, int userId)
    {
        return await _context.Users
            .AnyAsync(u => u.Username == username && u.Id != userId);
    }

    public async Task<bool> ExistsByEmailExceptIdAsync(string email, int userId)
    {
        return await _context.Users
            .AnyAsync(u => u.Email == email && u.Id != userId);
    }
}
