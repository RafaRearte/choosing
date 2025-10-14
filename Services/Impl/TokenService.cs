using choosing.Domain;
using choosing.Services.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace choosing.Services.Impl
{
    public class TokenService:ITokenService
    {
        private readonly JwtConfig _jwtConfig;

        public TokenService(IOptions<JwtConfig> jwtConfig)
        {
            _jwtConfig = jwtConfig.Value;
        }

        public string GenerateToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_jwtConfig.Secret);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.TipoUsuario), // Agregar rol del usuario
                new Claim("tipo_usuario", user.TipoUsuario), // Claim custom adicional
            };

            // Si tiene nombre y apellido, agregarlos
            if (!string.IsNullOrEmpty(user.Nombre))
            {
                claims.Add(new Claim(ClaimTypes.GivenName, user.Nombre));
            }

            if (!string.IsNullOrEmpty(user.Apellido))
            {
                claims.Add(new Claim(ClaimTypes.Surname, user.Apellido));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(_jwtConfig.ExpirationInMinutes),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature),
                Issuer = _jwtConfig.Issuer,
                Audience = _jwtConfig.Audience
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
