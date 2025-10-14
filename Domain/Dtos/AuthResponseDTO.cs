namespace choosing.Domain.Dtos
{
    public class AuthResponseDTO
    {
        public string Token { get; set; }
        public UserResponseDTO User { get; set; }
        public string? Message { get; set; }
    }
}
