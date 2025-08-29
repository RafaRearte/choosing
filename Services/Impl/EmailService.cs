using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Options;
using choosing.Domain;
using choosing.Services.Interfaces;
using System.Text;

namespace choosing.Services.Impl
{
    public class EmailService : IEmailService
    {
        private readonly EmailConfig _emailConfig;

        public EmailService(IOptions<EmailConfig> emailConfig)
        {
            _emailConfig = emailConfig.Value;
        }

        public async Task SendInvitationEmailAsync(Guest guest, EventModel evento)
        {
            var subject = $"Invitación a {evento.Nombre} - Confirmación de Registro";
            
            var body = GenerateInvitationHtml(guest, evento);

            await SendEmailAsync(guest.Mail!, subject, body);
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var message = new MimeMessage();
            
            message.From.Add(new MailboxAddress(_emailConfig.SenderName, _emailConfig.SenderEmail));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = body
            };

            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            
            try
            {
                await client.ConnectAsync(_emailConfig.SmtpHost, _emailConfig.SmtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(_emailConfig.SenderEmail, _emailConfig.Password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Error enviando email: {ex.Message}", ex);
            }
        }

        private string GenerateInvitationHtml(Guest guest, EventModel evento)
        {
            // URL del QR - puedes usar una librería de QR o un servicio online
            var qrUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={guest.IdCode}";
            
            return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Invitación a {evento.Nombre}</title>
</head>
<body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
    <div style='text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px;'>
        <h1>¡Bienvenido/a {guest.Nombre} {guest.Apellido}!</h1>
        <h2>Estás invitado/a a {evento.Nombre}</h2>
    </div>
    
    <div style='padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;'>
        <h3>Detalles del Evento:</h3>
        <p><strong>📅 Fecha:</strong> {evento.FechaInicio:dd/MM/yyyy} - {evento.FechaFin:dd/MM/yyyy}</p>
        <p><strong>📍 Ubicación:</strong> {evento.Ubicacion}</p>
        <p><strong>📝 Descripción:</strong> {evento.Descripcion}</p>
    </div>

    <div style='text-align: center; padding: 30px; background: white; border-radius: 10px; margin-top: 20px; border: 2px solid #e9ecef;'>
        <h3 style='color: #495057;'>Tu Código QR de Acceso</h3>
        <img src='{qrUrl}' alt='Código QR' style='width: 200px; height: 200px; border: 2px solid #dee2e6; border-radius: 10px;'>
        <p style='margin-top: 15px; color: #6c757d; font-size: 14px;'>
            <strong>Código ID:</strong> {guest.IdCode}
        </p>
        <p style='color: #dc3545; font-weight: bold; margin-top: 20px;'>
            ⚠️ Presenta este código QR al ingresar al evento
        </p>
    </div>

    <div style='text-align: center; padding: 20px; color: #6c757d; font-size: 12px; margin-top: 20px;'>
        <p>Sistema de Acreditación Choosing</p>
        <p>Si tienes alguna consulta, ponte en contacto con los organizadores</p>
    </div>
</body>
</html>";
        }
    }
}