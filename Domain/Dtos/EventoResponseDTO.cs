namespace choosing.Domain.Dtos;

/// <summary>
/// DTO para devolver eventos al frontend
/// Evita referencias circulares al no incluir navegación a Organizador completo
/// Solo incluye info básica del organizador si es necesaria
/// </summary>
public class EventoResponseDTO
{
    public int Id { get; set; }
    public string Nombre { get; set; }
    public string? Descripcion { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public string? Ubicacion { get; set; }
    public bool Activo { get; set; }
    public string? ConfiguracionJson { get; set; }
    public bool PermitirAccesoPostEvento { get; set; }

    // Organizador - solo ID, no objeto completo
    public int? OrganizadorId { get; set; }

    // Opcionalmente puedes incluir nombre del organizador si lo necesitas
    public string? OrganizadorNombre { get; set; }

    // Campos de venta
    public bool VentaPublica { get; set; }
    public decimal? PrecioEntrada { get; set; }
    public int? CapacidadMaxima { get; set; }
    public int EntradasVendidas { get; set; }
    public string Estado { get; set; }

    // Códigos de acceso
    public string? CodigoAcceso { get; set; }
    public string? CodigoAdmin { get; set; }
    public string? CodigoStats { get; set; }

    // Configuraciones
    public string? ConfigTabla { get; set; }
    public string? ConfigEtiqueta { get; set; }
}
