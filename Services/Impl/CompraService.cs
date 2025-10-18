using choosing.Context;
using choosing.Domain;
using choosing.Domain.Dtos;
using choosing.Repository.Interfaces;
using choosing.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace choosing.Services.Impl
{
    public class CompraService : ICompraService
    {
        private readonly ICompraRepository _compraRepository;
        private readonly DbChoosingContext _choosingContext;
        private readonly IEmailService _emailService;

        public CompraService(ICompraRepository compraRepository, DbChoosingContext choosingContext, IEmailService emailService)
        {
            _compraRepository = compraRepository;
            _choosingContext = choosingContext;
            _emailService = emailService;
        }

        public async Task<Compra> CrearCompraAsync(CrearCompraDTO dto)
        {
            // Validar que el evento exista
            var evento = await _choosingContext.Events.FindAsync(dto.EventoId);
            if (evento == null)
                throw new Exception("Evento no encontrado");

            // Validar que el usuario exista
            var usuario = await _choosingContext.Users.FindAsync(dto.UsuarioId);
            if (usuario == null)
                throw new Exception("Usuario no encontrado");

            // Validar capacidad del evento (si aplica)
            if (evento.CapacidadMaxima.HasValue)
            {
                var entradasDisponibles = evento.CapacidadMaxima.Value - evento.EntradasVendidas;
                if (dto.CantidadEntradas > entradasDisponibles)
                    throw new Exception($"Solo quedan {entradasDisponibles} entradas disponibles");
            }

            // Crear compra (HARDCODEADO: auto-aprobada para MVP)
            var compra = new Compra
            {
                UsuarioId = dto.UsuarioId,
                EventoId = dto.EventoId,
                CantidadEntradas = dto.CantidadEntradas,
                MontoTotal = dto.MontoTotal,
                FechaCompra = DateTime.Now,
                Estado = "pagado", // 🔥 HARDCODEADO para MVP
                MetodoPago = "hardcoded_mvp",
                TransaccionId = $"MVP-{Guid.NewGuid().ToString("N")[..12].ToUpper()}",
                FechaPago = DateTime.Now
            };

            var compraCreada = await _compraRepository.CreateAsync(compra);

            // Incrementar entradas vendidas del evento
            evento.EntradasVendidas += dto.CantidadEntradas;
            _choosingContext.Events.Update(evento);
            await _choosingContext.SaveChangesAsync();

            // Si vienen invitados, guardarlos automáticamente
            if (dto.Invitados != null && dto.Invitados.Count > 0)
            {
                // Validar cantidad
                if (dto.Invitados.Count != dto.CantidadEntradas)
                    throw new Exception($"Debe proporcionar exactamente {dto.CantidadEntradas} invitados");

                foreach (var invitadoDto in dto.Invitados)
                {
                    var guest = new Guest
                    {
                        EventoId = compraCreada.EventoId,
                        CompraId = compraCreada.Id,
                        CompradoPorUsuarioId = compraCreada.UsuarioId,
                        FechaCreacion = DateTime.Now,
                        Confirmado = true,
                        EsNuevo = true,
                        EstaAcreditado = false,
                        IdCode = Guid.NewGuid().ToString("N")[..12].ToUpper() // Código QR de 12 caracteres
                    };

                    // Si UsarDatosUsuario = true, autocompletar desde User
                    if (invitadoDto.UsarDatosUsuario)
                    {
                        guest.Nombre = usuario.Nombre ?? "Sin nombre";
                        guest.Apellido = usuario.Apellido ?? "Sin apellido";
                        guest.Dni = usuario.Dni;
                        guest.Email = usuario.Email;
                        guest.Telefono = usuario.Telefono;
                    }
                    else
                    {
                        guest.Nombre = invitadoDto.Nombre;
                        guest.Apellido = invitadoDto.Apellido;
                        guest.Dni = invitadoDto.Dni;
                        guest.Email = invitadoDto.Email;
                        guest.Telefono = invitadoDto.Telefono;
                    }

                    _choosingContext.Guests.Add(guest);
                }

                await _choosingContext.SaveChangesAsync();

                // Enviar emails con QR a cada invitado
                foreach (var invitadoDto in dto.Invitados)
                {
                    var guestCreado = await _choosingContext.Guests
                        .FirstOrDefaultAsync(g => g.CompraId == compraCreada.Id && g.Email == invitadoDto.Email);

                    if (guestCreado != null)
                    {
                        try
                        {
                            await _emailService.SendInvitationEmailAsync(guestCreado, evento);
                        }
                        catch (Exception ex)
                        {
                            // Log error pero no fallar la compra
                            Console.WriteLine($"Error enviando email a {guestCreado.Email}: {ex.Message}");
                        }
                    }
                }
            }

            return compraCreada;
        }

        public async Task<Compra?> ObtenerCompraPorIdAsync(int id)
        {
            return await _compraRepository.GetByIdAsync(id);
        }

        public async Task<List<Compra>> ObtenerComprasPorUsuarioAsync(int usuarioId)
        {
            return await _compraRepository.GetByUsuarioIdAsync(usuarioId);
        }

        public async Task<List<Compra>> ObtenerComprasPorEventoAsync(int eventoId)
        {
            return await _compraRepository.GetByEventoIdAsync(eventoId);
        }

        public async Task<Compra> AgregarInvitadosAsync(int compraId, AgregarInvitadosDTO dto)
        {
            var compra = await _compraRepository.GetByIdAsync(compraId);
            if (compra == null)
                throw new Exception("Compra no encontrada");

            var usuario = await _choosingContext.Users.FindAsync(compra.UsuarioId);
            if (usuario == null)
                throw new Exception("Usuario no encontrado");

            // Validar cantidad de invitados
            if (dto.Invitados.Count != compra.CantidadEntradas)
                throw new Exception($"Debe agregar exactamente {compra.CantidadEntradas} invitados");

            foreach (var invitadoDto in dto.Invitados)
            {
                var guest = new Guest
                {
                    EventoId = compra.EventoId,
                    CompraId = compra.Id,
                    CompradoPorUsuarioId = compra.UsuarioId,
                    FechaCreacion = DateTime.Now,
                    Confirmado = true
                };

                // Si UsarDatosUsuario = true, autocompletar desde User
                if (invitadoDto.UsarDatosUsuario)
                {
                    guest.Nombre = usuario.Nombre ?? "";
                    guest.Apellido = usuario.Apellido ?? "";
                    guest.Dni = usuario.Dni;
                    guest.Email = usuario.Email;
                    guest.Telefono = usuario.Telefono;
                }
                else
                {
                    guest.Nombre = invitadoDto.Nombre;
                    guest.Apellido = invitadoDto.Apellido;
                    guest.Dni = invitadoDto.Dni;
                    guest.Email = invitadoDto.Email;
                    guest.Telefono = invitadoDto.Telefono;
                }

                _choosingContext.Guests.Add(guest);
            }

            await _choosingContext.SaveChangesAsync();

            return await _compraRepository.GetByIdAsync(compraId) ?? compra;
        }

        public async Task<Compra> ActualizarEstadoCompraAsync(int compraId, string nuevoEstado, string? transaccionId = null)
        {
            var compra = await _compraRepository.GetByIdAsync(compraId);
            if (compra == null)
                throw new Exception("Compra no encontrada");

            compra.Estado = nuevoEstado;

            if (nuevoEstado == "pagado")
            {
                compra.FechaPago = DateTime.Now;
                compra.TransaccionId = transaccionId;

                // Incrementar entradas vendidas del evento
                var evento = await _choosingContext.Events.FindAsync(compra.EventoId);
                if (evento != null)
                {
                    evento.EntradasVendidas += compra.CantidadEntradas;
                    _choosingContext.Events.Update(evento);
                }
            }

            await _compraRepository.UpdateAsync(compra);
            await _choosingContext.SaveChangesAsync();

            return compra;
        }

        public async Task<List<Guest>> ObtenerInvitadosPorCompraIdAsync(int compraId)
        {
            return await _choosingContext.Guests
                .Where(g => g.CompraId == compraId)
                .ToListAsync();
        }
    }
}
