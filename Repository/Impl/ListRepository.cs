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

        public async Task<List<Guest>> GetByEventIdAsync(int eventId)
        {
            try
            {
                return await _context.Guests
                    .Where(g => g.EventoId == eventId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving guests for event {eventId}", ex);
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

        public async Task<Guest?> GetByDniAndEventIdAsync(int dni, int eventId)
        {
            try
            {
                return await _context.Guests
                    .FirstOrDefaultAsync(g => g.Dni == dni && g.EventoId == eventId);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving guest with DNI {dni} for event {eventId}", ex);
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

        public async Task<List<Guest>> SearchByNameAndEventIdAsync(string query, int eventId)
        {
            try
            {
                return await _context.Guests
                       .Where(i => (i.Apellido.Contains(query) || i.Nombre.Contains(query)) && i.EventoId == eventId)
                       .ToListAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error searching guests by name with query {query} for event {eventId}", ex);
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

        public async Task<List<Guest>> GetAcreditadosByEventIdAsync(int eventId)
        {
            return await _context.Guests
                .Where(g => g.EventoId == eventId && g.Acreditado == 1)
                .ToListAsync();
        }

        public async Task<List<Guest>> GetNotAcreditadosAsync()
        {
            return await _context.Guests
                .Where(g => g.Acreditado == 0)
                .ToListAsync();
        }

        public async Task<List<Guest>> GetNotAcreditadosByEventIdAsync(int eventId)
        {
            return await _context.Guests
                .Where(g => g.EventoId == eventId && g.Acreditado == 0)
                .ToListAsync();
        }

        public async Task<List<Guest>> GetInvitadosNuevosAsync()
        {
            return await _context.Guests
                .Where(g => g.EsNuevo == true)
                .ToListAsync();
        }

        public async Task<List<Guest>> GetInvitadosNuevosByEventIdAsync(int eventId)
        {
            return await _context.Guests
                .Where(g => g.EventoId == eventId && g.EsNuevo == true)
                .ToListAsync();
        }

        public async Task<Guest?> GetByIdAsync(int id)
        {
            try
            {
                return await _context.Guests.FindAsync(id);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving guest with ID {id}", ex);
            }
        }

        public async Task<Guest?> GetByIdAndEventIdAsync(int id, int eventId)
        {
            try
            {
                return await _context.Guests
                    .FirstOrDefaultAsync(g => g.Id == id && g.EventoId == eventId);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving guest with ID {id} for event {eventId}", ex);
            }
        }

        public async Task DeleteByIdAsync(int id)
        {
            try
            {
                var guest = await _context.Guests.FindAsync(id);
                if (guest != null)
                {
                    _context.Guests.Remove(guest);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting guest with ID {id}", ex);
            }
        }

        public async Task<Guest?> GetByIdCodeAsync(string idCode)
        {
            try
            {
                return await _context.Guests
                    .FirstOrDefaultAsync(g => g.IdCode == idCode);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving guest with IdCode {idCode}", ex);
            }
        }

        public async Task<Guest?> GetByIdCodeAndEventIdAsync(string idCode, int eventId)
        {
            try
            {
                return await _context.Guests
                    .FirstOrDefaultAsync(g => g.IdCode == idCode && g.EventoId == eventId);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving guest with IdCode {idCode} for event {eventId}", ex);
            }
        }
        

        public async Task<(List<Guest> guests, int totalCount, int filteredCount)> GetPaginatedByEventIdAsync(
            int eventId, 
            int start, 
            int length, 
            string search = "", 
            string orderColumn = "Id", 
            string orderDirection = "asc")
        {
            try
            {
                // Query base: SOLO invitados de este evento
                var query = _context.Guests.Where(g => g.EventoId == eventId);
                
                // Total sin filtros para este evento
                var totalCount = await _context.Guests.CountAsync(g => g.EventoId == eventId);
                
                // BÚSQUEDA GLOBAL en todos los campos (SOLO de este evento)
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(g => 
                        g.Nombre.Contains(search) ||
                        (g.Apellido != null && g.Apellido.Contains(search)) ||
                        g.Dni.ToString().Contains(search) ||
                        (g.Mail != null && g.Mail.Contains(search)) ||  // Tu campo se llama Mail, no Email
                        (g.Telefono != null && g.Telefono.Contains(search)) ||
                        (g.Empresa != null && g.Empresa.Contains(search)) ||
                        (g.cargo != null && g.cargo.Contains(search)) ||
                        (g.IdCode != null && g.IdCode.Contains(search)) ||
                        (g.Categoria != null && g.Categoria.Contains(search)) ||
                        (g.profesion != null && g.profesion.Contains(search)) ||
                        (g.RedSocial != null && g.RedSocial.Contains(search))
                    );
                }
                
                var filteredCount = await query.CountAsync();
                
                // ORDENAMIENTO DINÁMICO
                switch (orderColumn.ToLower())
                {
                    case "nombre":
                        query = orderDirection == "asc" ? 
                            query.OrderBy(g => g.Nombre) : 
                            query.OrderByDescending(g => g.Nombre);
                        break;
                    case "dni":
                        query = orderDirection == "asc" ? 
                            query.OrderBy(g => g.Dni) : 
                            query.OrderByDescending(g => g.Dni);
                        break;
                    case "apellido":
                        query = orderDirection == "asc" ? 
                            query.OrderBy(g => g.Apellido) : 
                            query.OrderByDescending(g => g.Apellido);
                        break;
                    default:
                        query = orderDirection == "asc" ? 
                            query.OrderBy(g => g.Id) : 
                            query.OrderByDescending(g => g.Id);
                        break;
                }
                
                // PAGINACIÓN EFICIENTE
                var guests = await query
                    .Skip(start)
                    .Take(length)
                    .AsNoTracking() // IMPORTANTE para performance
                    .ToListAsync();
                
                return (guests, totalCount, filteredCount);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error getting paginated guests for event {eventId}", ex);
            }
        }

        public async Task<(int total, int acreditados, int nuevos)> GetCountersByEventIdAsync(int eventId)
        {
            try
            {
                // Total de invitados para este evento
                var total = await _context.Guests
                    .CountAsync(g => g.EventoId == eventId);
                    
                // Acreditados para este evento
                var acreditados = await _context.Guests
                    .CountAsync(g => g.EventoId == eventId && g.Acreditado > 0);
                    
                // Nuevos (usando tu campo EsNuevo)
                var nuevos = await _context.Guests
                    .CountAsync(g => g.EventoId == eventId && g.EsNuevo == true);
                
                return (total, acreditados, nuevos);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error getting counters for event {eventId}", ex);
            }
        }

    }
}
