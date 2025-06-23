using System.ComponentModel.DataAnnotations.Schema;

namespace choosing.Domain
{
    [Table("Usuarios")]

    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string PasswordHash { get; set; }
    }
}
