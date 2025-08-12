using choosing.Domain;

namespace choosing.Services.Interfaces
{
    public interface IListService
    {
        Task<List<Guest>> GetAllInvitadosAsync();
        Task<List<Guest>> GetInvitadosByEventIdAsync(int eventId);
        Task<List<Guest>> SearchInvitadoAsync(string query);
        Task<List<Guest>> SearchInvitadoByEventIdAsync(string query, int eventId);
        Task<Guest?> GetInvitadoByDniAsync(int dni);
        Task<Guest?> GetInvitadoByDniAndEventIdAsync(int dni, int eventId);
        Task<List<Guest>> GetInvitadosAcreditadosAsync();
        Task<List<Guest>> GetInvitadosAcreditadosByEventIdAsync(int eventId);
        Task<List<Guest>> GetInvitadosNoAcreditadosAsync();
        Task<List<Guest>> GetInvitadosNoAcreditadosByEventIdAsync(int eventId);
        Task<List<Guest>> GetInvitadosNuevosAsync();
        Task<List<Guest>> GetInvitadosNuevosByEventIdAsync(int eventId);
        Task AcreditarInvitadoAsync(Guest guest);
        Task<Guest> CreateInvitadoAsync(Guest newGuest); // New method
        Task UpdateInvitadoAsync(int originalDni, Guest updatedGuest); // Nuevo método
        Task UpdateAccreditStatusAsync(Guest invitado); // Nuevo método
        Task DeleteInvitadoAsync(int dni); // Nuevo método
        Task<Guest?> GetInvitadoByIdAsync(int id);
        Task<Guest?> GetInvitadoByIdAndEventIdAsync(int id, int eventId);
        Task DeleteInvitadoByIdAsync(int id);
        Task UpdateInvitadoByIdAsync(int id, Guest updatedGuest);
        Task<Guest?> GetInvitadoByIdCodeAsync(string idCode);
        Task<Guest?> GetInvitadoByIdCodeAndEventIdAsync(string idCode, int eventId);
        Task<(List<Guest> guests, int totalCount, int filteredCount)> GetPaginatedGuestsAsync(
            int eventId, 
            int start, 
            int length, 
            string search = "",
            string filter = "", 
            string orderColumn = "id",
            string orderDirection = "asc");

        Task<(int total, int acreditados, int nuevos)> GetEventCountersAsync(int eventId);
    }
}
