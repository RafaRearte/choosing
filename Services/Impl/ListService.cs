using choosing.Domain;
using choosing.Repository.Interfaces;
using choosing.Services.Interfaces;

namespace choosing.Services.Impl
{
    public class ListService : IListService
    {
        private readonly IListRepository _listRepository;

        public ListService(IListRepository listRepository)
        {
            _listRepository = listRepository;
        }

        public async Task AcreditarInvitadoAsync(Guest guest)
        {
            guest.EstaAcreditado = true;
            guest.FechaAcreditacion = DateTime.Now;
            await _listRepository.UpdateAsync(guest);
        }

        public async Task<List<Guest>> GetAllInvitadosAsync()
        {
            return await _listRepository.GetAllAsync();
        }

        public async Task<List<Guest>> GetInvitadosByEventIdAsync(int eventId)
        {
            return await _listRepository.GetByEventIdAsync(eventId);
        }

        public async Task<Guest?> GetInvitadoByDniAsync(string dni)
        {
            return await _listRepository.GetByDNIAsync(dni);
        }

        public async Task<Guest?> GetInvitadoByDniAndEventIdAsync(string dni, int eventId)
        {
            return await _listRepository.GetByDniAndEventIdAsync(dni, eventId);
        }

        public async Task<List<Guest>> SearchInvitadoAsync(string query)
        {
            return await _listRepository.SearchByNameAsync(query);
        }

        public async Task<List<Guest>> SearchInvitadoByEventIdAsync(string query, int eventId)
        {
            return await _listRepository.SearchByNameAndEventIdAsync(query, eventId);
        }

        public async Task<Guest> CreateInvitadoAsync(Guest newGuest)
        {
            return await _listRepository.AddAsync(newGuest);
        }

        public async Task UpdateInvitadoAsync(string originalDni, Guest updatedGuest)
        {
            // Obtener el invitado original
            var invitado = await _listRepository.GetByDNIAsync(originalDni);
            if (invitado == null)
                throw new Exception($"No se encontró un invitado con el DNI {originalDni}");

            // Si el DNI cambió, necesitamos eliminar el registro anterior y crear uno nuevo
            if (originalDni != updatedGuest.Dni)
            {
                await _listRepository.DeleteAsync(originalDni);
                await _listRepository.AddAsync(updatedGuest);
            }
            else
            {
                // Actualizar todos los campos
                invitado.Nombre = updatedGuest.Nombre;
                invitado.Apellido = updatedGuest.Apellido;
                invitado.Email = updatedGuest.Email;
                invitado.InfoAdicional = updatedGuest.InfoAdicional;
                invitado.EstaAcreditado = updatedGuest.EstaAcreditado;
                invitado.Empresa = updatedGuest.Empresa;
                invitado.Categoria = updatedGuest.Categoria;
                invitado.EventoId = updatedGuest.EventoId;
                invitado.Lugar = updatedGuest.Lugar;
                invitado.Telefono = updatedGuest.Telefono;
                invitado.RedSocial = updatedGuest.RedSocial;
                invitado.Profesion = updatedGuest.Profesion;
                invitado.Cargo = updatedGuest.Cargo;
                invitado.IdCode = updatedGuest.IdCode;
                invitado.EsNuevo = updatedGuest.EsNuevo;

                await _listRepository.UpdateAsync(invitado);
            }
        }

        public async Task UpdateAccreditStatusAsync(Guest invitado)
        {
            await _listRepository.UpdateAsync(invitado);
        }

        public async Task DeleteInvitadoAsync(string dni)
        {
            await _listRepository.DeleteAsync(dni);
        }

        public async Task<List<Guest>> GetInvitadosAcreditadosAsync()
        {
            return await _listRepository.GetAcreditadosAsync();
        }

        public async Task<List<Guest>> GetInvitadosAcreditadosByEventIdAsync(int eventId)
        {
            return await _listRepository.GetAcreditadosByEventIdAsync(eventId);
        }

        public async Task<List<Guest>> GetInvitadosNoAcreditadosAsync()
        {
            return await _listRepository.GetNotAcreditadosAsync();
        }

        public async Task<List<Guest>> GetInvitadosNoAcreditadosByEventIdAsync(int eventId)
        {
            return await _listRepository.GetNotAcreditadosByEventIdAsync(eventId);
        }

        public async Task<List<Guest>> GetInvitadosNuevosAsync()
        {
            return await _listRepository.GetInvitadosNuevosAsync();
        }

        public async Task<List<Guest>> GetInvitadosNuevosByEventIdAsync(int eventId)
        {
            return await _listRepository.GetInvitadosNuevosByEventIdAsync(eventId);
        }

        public async Task<Guest?> GetInvitadoByIdAsync(int id)
        {
            return await _listRepository.GetByIdAsync(id);
        }

        public async Task<Guest?> GetInvitadoByIdAndEventIdAsync(int id, int eventId)
        {
            return await _listRepository.GetByIdAndEventIdAsync(id, eventId);
        }

        public async Task DeleteInvitadoByIdAsync(int id)
        {
            await _listRepository.DeleteByIdAsync(id);
        }

        // Modificar el método UpdateInvitadoAsync para soportar ID
        public async Task UpdateInvitadoByIdAsync(int id, Guest updatedGuest)
        {
            // Obtener el invitado original
            var invitado = await _listRepository.GetByIdAsync(id);
            if (invitado == null)
                throw new Exception($"No se encontró un invitado con el ID {id}");

            // Actualizar todos los campos
            invitado.Dni = updatedGuest.Dni;
            invitado.Nombre = updatedGuest.Nombre;
            invitado.Apellido = updatedGuest.Apellido;
            invitado.Email = updatedGuest.Email;
            invitado.InfoAdicional = updatedGuest.InfoAdicional;
            invitado.EstaAcreditado = updatedGuest.EstaAcreditado;
            invitado.Empresa = updatedGuest.Empresa;
            invitado.Categoria = updatedGuest.Categoria;
            invitado.EventoId = updatedGuest.EventoId;
            invitado.Lugar = updatedGuest.Lugar;
            invitado.Telefono = updatedGuest.Telefono;
            invitado.RedSocial = updatedGuest.RedSocial;
            invitado.Profesion = updatedGuest.Profesion;
            invitado.Cargo = updatedGuest.Cargo;
            invitado.IdCode = updatedGuest.IdCode;
            invitado.EsNuevo = updatedGuest.EsNuevo;

            await _listRepository.UpdateAsync(invitado);
        }

        public async Task<Guest?> GetInvitadoByIdCodeAsync(string idCode)
        {
            return await _listRepository.GetByIdCodeAsync(idCode);
        }

        public async Task<Guest?> GetInvitadoByIdCodeAndEventIdAsync(string idCode, int eventId)
        {
            return await _listRepository.GetByIdCodeAndEventIdAsync(idCode, eventId);
        }

        public async Task<(List<Guest> guests, int totalCount, int filteredCount)> GetPaginatedGuestsAsync(
            int eventId, 
            int start, 
            int length, 
            string search = "", 
            string filter = "", 
            string orderColumn = "id", 
            string orderDirection = "asc")
        {
            return await _listRepository.GetPaginatedByEventIdAsync(eventId, start, length, search, filter, orderColumn, orderDirection);
        }

        public async Task<(int total, int acreditados, int nuevos)> GetEventCountersAsync(int eventId)
        {
            return await _listRepository.GetCountersByEventIdAsync(eventId);
        }

        public async Task<List<Guest>> ExportCsvAsync(int eventId)
        {
            return await _listRepository.ExportCsvAsync(eventId);
        }

        // MÉTODO SÚPER RÁPIDO CON STORED PROCEDURE
        public async Task<List<Guest>> GetAllByEventIdViaSPAsync(int eventId)
        {
            return await _listRepository.GetAllByEventIdViaSPAsync(eventId);
        }
    }
}
