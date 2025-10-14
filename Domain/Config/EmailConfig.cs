namespace choosing.Domain
{
    public class EmailConfig
    {
        public string SmtpHost { get; set; } = "";
        public int SmtpPort { get; set; }
        public string SenderEmail { get; set; } = "";
        public string SenderName { get; set; } = "";
        public string Password { get; set; } = "";
    }
}