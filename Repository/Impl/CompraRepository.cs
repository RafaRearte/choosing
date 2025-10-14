using choosing.Context;
using choosing.Domain;
using choosing.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace choosing.Repository.Impl
{
    public class CompraRepository : ICompraRepository
    {
        private readonly DbHotelContext _context;

        public CompraRepository(DbHotelContext context)
        {
            _context = context;
        }

        public async Task<Compra> CreateAsync(Compra compra)
        {
            _context.Compras.Add(compra);
            await _context.SaveChangesAsync();
            return compra;
        }

        public async Task<Compra?> GetByIdAsync(int id)
        {
            return await _context.Compras
                .Include(c => c.Usuario)
                .Include(c => c.Evento)
                .Include(c => c.Invitados)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<List<Compra>> GetByUsuarioIdAsync(int usuarioId)
        {
            return await _context.Compras
                .Include(c => c.Evento)
                .Include(c => c.Invitados)
                .Where(c => c.UsuarioId == usuarioId)
                .OrderByDescending(c => c.FechaCompra)
                .ToListAsync();
        }

        public async Task<List<Compra>> GetByEventoIdAsync(int eventoId)
        {
            return await _context.Compras
                .Include(c => c.Usuario)
                .Include(c => c.Invitados)
                .Where(c => c.EventoId == eventoId)
                .OrderByDescending(c => c.FechaCompra)
                .ToListAsync();
        }

        public async Task<Compra> UpdateAsync(Compra compra)
        {
            _context.Compras.Update(compra);
            await _context.SaveChangesAsync();
            return compra;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var compra = await _context.Compras.FindAsync(id);
            if (compra == null) return false;

            _context.Compras.Remove(compra);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
