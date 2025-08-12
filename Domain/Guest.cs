using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace choosing.Domain
{
    [Table("Invitados")]
    public partial class Guest
    {
        [Key]
        public int Id { get; set; }  
        public int? Dni { get; set; }
        public string? InfoAdicional { get; set; }
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? Mail { get; set; }
        public string? DayOne { get; set; }
        public string? DayTwo { get; set; }
        public string? DayThree { get; set; }
        public int? CantEntradas { get; set; }
        public int? Acreditado { get; set; }
        public bool EsNuevo { get; set; } 
        public DateTime? HoraAcreditacion { get; set; }
        public string? Profesion { get; set; }
        public string? Cargo { get; set; }
        [Required]
        public int? EventoId { get; set; }
        [ForeignKey("EventoId")]
        public string? Categoria { get; set; }
        public string? Empresa { get; set; }
        public string? Lugar { get; set; }
        public string? Telefono { get; set; }
        public string? IdCode { get; set; }
        public string? RedSocial { get; set; }
    }
}

//hola
