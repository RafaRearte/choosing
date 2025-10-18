using System.ComponentModel.DataAnnotations;

namespace choosing.Domain.Dtos;

/// <summary>
/// DTO para crear un nuevo evento
/// No incluye campos autogenerados ni navegaciones
/// </summary>
public class CrearEventoDTO
{
    [Required(ErrorMessage = "El nombre del evento es obligatorio")]
    [MaxLength(255)]
    public string Nombre { get; set; }

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    [Required(ErrorMessage = "La fecha de inicio es obligatoria")]
    public DateTime FechaInicio { get; set; }

    [Required(ErrorMessage = "La fecha de fin es obligatoria")]
    public DateTime FechaFin { get; set; }

    [MaxLength(255)]
    public string? Ubicacion { get; set; }

    public bool Activo { get; set; } = true;

    public bool PermitirAccesoPostEvento { get; set; } = false;

    // Campos para marketplace y venta
    public bool VentaPublica { get; set; } = false;

    public decimal? PrecioEntrada { get; set; } = 0;

    public int? CapacidadMaxima { get; set; }

    // Configuraciones
    public string? ConfigTabla { get; set; }

    public string? ConfigEtiqueta { get; set; }
}
