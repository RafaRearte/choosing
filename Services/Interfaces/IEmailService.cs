using choosing.Domain;

namespace choosing.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendInvitationEmailAsync(Guest guest, EventModel evento);
        Task SendEmailAsync(string toEmail, string subject, string body);
    }
}