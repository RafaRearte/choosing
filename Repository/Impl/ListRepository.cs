using choosing.Context;
using choosing.Domain;
using choosing.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace choosing.Repository.Impl
{
    public class ListRepository : IListRepository
    {
        private readonly DbHotelContext _context;
        public ListRepository(DbHotelContext context)
        {
            _context = context;
        }


        public async Task<List<Guest>> GetAllAsync()
        {
            try
            {
                return await _context.Guests.ToListAsync();
            }
            catch (Exception ex)
            {
                // Log the exception (use a logging framework)
                throw new Exception("Error retrieving all guests", ex);
            }
        }

        public async Task<Guest?> GetByDNIAsync(int Dni)
        {
            try
            {
                return await _context.Guests.FindAsync(Dni);
            }
            catch (Exception ex)
            {
                // Log the exception (use a logging framework)
                throw new Exception($"Error retrieving guest with DNI {Dni}", ex);
            }
        }

        public async Task<List<Guest>> SearchByNameAsync(string query)
        {
            try
            {
                return await _context.Guests
                       .Where(i => i.Apellido.Contains(query) || i.Nombre.Contains(query))
                       .ToListAsync();
            }
            catch (Exception ex)
            {
                // Log the exception (use a logging framework)
                throw new Exception($"Error searching guests by name with query {query}", ex);
            }
        }

        public async Task UpdateAsync(Guest guest)
        {
            try
            {
                _context.Guests.Update(guest);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log the exception (use a logging framework)
                throw new Exception("Error updating guest", ex);
            }
        }
        public async Task<Guest> AddAsync(Guest guest)
        {
            try
            {
                await _context.Guests.AddAsync(guest);
                await _context.SaveChangesAsync();
                return guest;
            }
            catch (Exception ex)
            {
                // Log the exception (use a logging framework)
                throw new Exception("Error adding new guest", ex);
            }
        }
        public async Task DeleteAsync(int dni)
        {
            try
            {
                var guest = await _context.Guests.FindAsync(dni);
                if (guest != null)
                {
                    _context.Guests.Remove(guest);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                // Log the exception (use a logging framework)
                throw new Exception($"Error deleting guest with DNI {dni}", ex);
            }
        }

        public async Task<List<Guest>> GetAcreditadosAsync()
        {
            return await _context.Guests
                .Where(g => g.Acreditado == 1)
                .ToListAsync();
        }

        public async Task<List<Guest>> GetNotAcreditadosAsync()
        {
            return await _context.Guests
            .Where(g => g.Acreditado == 0)
            .ToListAsync();
        }

        public async Task<List<Guest>> GetInvitadosNuevosAsync()
        {
            return await _context.Guests
                .Where(g => g.EsNuevo == true)
                .ToListAsync();
        }
    }
}
