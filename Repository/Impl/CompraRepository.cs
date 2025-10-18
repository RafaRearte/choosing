using choosing.Context;
using choosing.Domain;
using choosing.Repository.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace choosing.Repository.Impl
{
    public class CompraRepository : ICompraRepository
    {
        private readonly DbChoosingContext _choosingContext;

        public CompraRepository(DbChoosingContext choosingContext)
        {
            _choosingContext = choosingContext;
        }

        public async Task<Compra> CreateAsync(Compra compra)
        {
            _choosingContext.Compras.Add(compra);
            await _choosingContext.SaveChangesAsync();
            return compra;
        }

        public async Task<Compra?> GetByIdAsync(int id)
        {
            return await _choosingContext.Compras
                .Include(c => c.Usuario)
                .Include(c => c.Evento)
                .Include(c => c.Invitados)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<List<Compra>> GetByUsuarioIdAsync(int usuarioId)
        {
            return await _choosingContext.Compras
                .Include(c => c.Evento)
                .Include(c => c.Invitados)
                .Where(c => c.UsuarioId == usuarioId)
                .OrderByDescending(c => c.FechaCompra)
                .ToListAsync();
        }

        public async Task<List<Compra>> GetByEventoIdAsync(int eventoId)
        {
            return await _choosingContext.Compras
                .Include(c => c.Usuario)
                .Include(c => c.Invitados)
                .Where(c => c.EventoId == eventoId)
                .OrderByDescending(c => c.FechaCompra)
                .ToListAsync();
        }

        public async Task<Compra> UpdateAsync(Compra compra)
        {
            _choosingContext.Compras.Update(compra);
            await _choosingContext.SaveChangesAsync();
            return compra;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var compra = await _choosingContext.Compras.FindAsync(id);
            if (compra == null) return false;

            _choosingContext.Compras.Remove(compra);
            await _choosingContext.SaveChangesAsync();
            return true;
        }
    }
}
