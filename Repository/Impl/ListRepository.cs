using System.Text;
using System.Data;
using choosing.Context;
using choosing.Domain;
using choosing.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;

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

        public async Task<Guest?> GetByDNIAsync(string Dni)
        {
            try
            {
                return await _context.Guests.FirstOrDefaultAsync(g => g.Dni == Dni);
            }
            catch (Exception ex)
            {
                // Log the exception (use a logging framework)
                throw new Exception($"Error retrieving guest with DNI {Dni}", ex);
            }
        }

        public async Task<Guest?> GetByDniAndEventIdAsync(string dni, int eventId)
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

        public async Task DeleteAsync(string dni)
        {
            try
            {
                var guest = await _context.Guests.FirstOrDefaultAsync(g => g.Dni == dni);
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
                .Where(g => g.EstaAcreditado == true)
                .ToListAsync();
        }

        public async Task<List<Guest>> GetAcreditadosByEventIdAsync(int eventId)
        {
            return await _context.Guests
                .Where(g => g.EventoId == eventId && g.EstaAcreditado == true)
                .ToListAsync();
        }

        public async Task<List<Guest>> GetNotAcreditadosAsync()
        {
            return await _context.Guests
                .Where(g => g.EstaAcreditado == false)
                .ToListAsync();
        }

        public async Task<List<Guest>> GetNotAcreditadosByEventIdAsync(int eventId)
        {
            return await _context.Guests
                .Where(g => g.EventoId == eventId && g.EstaAcreditado == false)
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
            string filter = "",
            string orderColumn = "id",
            string orderDirection = "asc")
        {
            try
            {
                // Query base: SOLO invitados de este evento
                var query = _context.Guests.Where(g => g.EventoId == eventId);
                
                // Total sin filtros para este evento
                var totalCount = await _context.Guests.CountAsync(g => g.EventoId == eventId);
                
                //Filtro acreditados/noacreditados/nuevos o todos
                if (!string.IsNullOrEmpty(filter))
                {
                    switch (filter)
                    {
                        case "acreditados":
                            query = query.Where(x => x.EstaAcreditado == true);
                            break;
                        case "no-acreditados":
                            query = query.Where(x => x.EstaAcreditado == false);
                            break;
                        case "nuevos":
                            query = query.Where(x => x.EsNuevo == true);
                            break;
                        // case null o "": mostrar todos (no filtrar)
                    }
                }
                
// REEMPLAZAR toda la sección de búsqueda por esta versión más simple:
                if (!string.IsNullOrEmpty(search))
                {
                    var searchLower = search.ToLower().Trim();
    
                    query = query.Where(g => 
                        // Búsqueda en nombre + apellido
                        (g.Nombre + " " + g.Apellido).ToLower().Contains(searchLower) ||
                        (g.Apellido + " " + g.Nombre).ToLower().Contains(searchLower) ||
        
                        // Búsquedas individuales en cada campo
                        (g.Nombre != null && g.Nombre.ToLower().Contains(searchLower)) ||
                        (g.Apellido != null && g.Apellido.ToLower().Contains(searchLower)) ||
                        g.Dni.ToString().Contains(searchLower) ||
                        (g.Telefono != null && g.Telefono.Contains(searchLower)) ||
                        (g.Empresa != null && g.Empresa.ToLower().Contains(searchLower)) ||
                        (g.IdCode != null && g.IdCode.ToLower().Contains(searchLower))
                    );
                }
                
                //  ORDENAMIENTO DINÁMICO PARA TODAS LAS COLUMNAS:
                query = orderColumn.ToLower() switch
                {
                    "id" => orderDirection == "desc" ? query.OrderByDescending(x => x.Id) : query.OrderBy(x => x.Id),
                    "nombre" => orderDirection == "desc" ? query.OrderByDescending(x => x.Nombre) : query.OrderBy(x => x.Nombre),
                    "apellido" => orderDirection == "desc" ? query.OrderByDescending(x => x.Apellido) : query.OrderBy(x => x.Apellido),
                    "dni" => orderDirection == "desc" ? query.OrderByDescending(x => x.Dni) : query.OrderBy(x => x.Dni),
                    "email" => orderDirection == "desc" ? query.OrderByDescending(x => x.Email) : query.OrderBy(x => x.Email),
                    "telefono" => orderDirection == "desc" ? query.OrderByDescending(x => x.Telefono) : query.OrderBy(x => x.Telefono),
                    "empresa" => orderDirection == "desc" ? query.OrderByDescending(x => x.Empresa) : query.OrderBy(x => x.Empresa),
                    "cargo" => orderDirection == "desc" ? query.OrderByDescending(x => x.Cargo) : query.OrderBy(x => x.Cargo),
                    "profesion" => orderDirection == "desc" ? query.OrderByDescending(x => x.Profesion) : query.OrderBy(x => x.Profesion),
                    "categoria" => orderDirection == "desc" ? query.OrderByDescending(x => x.Categoria) : query.OrderBy(x => x.Categoria),
                    "lugar" => orderDirection == "desc" ? query.OrderByDescending(x => x.Lugar) : query.OrderBy(x => x.Lugar),
                    "redsocial" => orderDirection == "desc" ? query.OrderByDescending(x => x.RedSocial) : query.OrderBy(x => x.RedSocial),
                    "infoadicional" => orderDirection == "desc" ? query.OrderByDescending(x => x.InfoAdicional) : query.OrderBy(x => x.InfoAdicional),
                    "estaacreditado" => orderDirection == "desc" ? query.OrderByDescending(x => x.EstaAcreditado) : query.OrderBy(x => x.EstaAcreditado),
                    "fechaacreditacion" => orderDirection == "desc" ? query.OrderByDescending(x => x.FechaAcreditacion) : query.OrderBy(x => x.FechaAcreditacion),
                    _ => query.OrderBy(x => x.Id) // Default
                };
                
                var filteredCount = await query.CountAsync();
                
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
                    .CountAsync(g => g.EventoId == eventId && g.EstaAcreditado == true);
                    
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

        public async Task<List<Guest>> ExportCsvAsync(int eventId)
        {
            var query = _context.Guests.Where(g => g.EventoId == eventId);

            var guests = await query
                .OrderBy(g => g.FechaAcreditacion == null ? 1 : 0)  // NULL al final (los que no se acreditaron)
                .ThenByDescending(g => g.EstaAcreditado)             // Acreditados primero dentro de cada grupo
                .ThenBy(g => g.FechaAcreditacion)                    // Por orden de acreditación (los que llegaron primero)
                .ThenBy(g => g.Apellido)                             // Y después por apellido
                .ThenBy(g => g.Nombre)                               // Y por nombre
                .ToListAsync();

            return guests;
        }

        // MÉTODO SÚPER RÁPIDO CON STORED PROCEDURE
        public async Task<List<Guest>> GetAllByEventIdViaSPAsync(int eventId)
        {
            try
            {
                var parameter = new SqlParameter("@EventoId", eventId);
                var guests = await _context.Guests
                    .FromSqlRaw("EXEC sp_GetAllInvitados @EventoId", parameter)
                    .ToListAsync();
                
                return guests;
            }
            catch (Exception ex)
            {
                throw new Exception("Error executing stored procedure sp_GetAllInvitados", ex);
            }
        }
        
    }
}
