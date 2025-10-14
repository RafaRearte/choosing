using choosing.Domain;

namespace choosing.Repository.Interfaces
{
    public interface IListRepository
    {
        Task<List<Guest>> GetAllAsync();
        Task<List<Guest>> GetByEventIdAsync(int eventId);
        Task<Guest?> GetByDNIAsync(string Dni);
        Task<Guest?> GetByDniAndEventIdAsync(string dni, int eventId);
        Task<List<Guest>> SearchByNameAsync(string query);
        Task<List<Guest>> SearchByNameAndEventIdAsync(string query, int eventId);
        Task UpdateAsync(Guest guest);
        Task<Guest> AddAsync(Guest guest);
        Task DeleteAsync(string dni);
        Task<List<Guest>> GetAcreditadosAsync();
        Task<List<Guest>> GetAcreditadosByEventIdAsync(int eventId);
        Task<List<Guest>> GetNotAcreditadosAsync();
        Task<List<Guest>> GetNotAcreditadosByEventIdAsync(int eventId);
        Task<List<Guest>> GetInvitadosNuevosAsync();
        Task<List<Guest>> GetInvitadosNuevosByEventIdAsync(int eventId);
        Task<Guest?> GetByIdAsync(int id);
        Task<Guest?> GetByIdAndEventIdAsync(int id, int eventId);
        Task DeleteByIdAsync(int id);
        Task<Guest?> GetByIdCodeAsync(string idCode);
        Task<Guest?> GetByIdCodeAndEventIdAsync(string idCode, int eventId);
        Task<(List<Guest> guests, int totalCount, int filteredCount)> GetPaginatedByEventIdAsync(
            int eventId, 
            int start, 
            int length, 
            string search = "", 
            string filter = "", 
            string orderColumn = "id",
            string orderDirection = "asc");
        Task<(int total, int acreditados, int nuevos)> GetCountersByEventIdAsync(int eventId);
        Task<List<Guest>> ExportCsvAsync(int eventId);
        Task<List<Guest>> GetAllByEventIdViaSPAsync(int eventId);
    }
}
