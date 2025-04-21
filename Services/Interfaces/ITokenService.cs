using choosing.Domain;

namespace choosing.Services.Interfaces
{
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
}
