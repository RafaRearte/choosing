using System.ComponentModel.DataAnnotations.Schema;

namespace choosing.Domain
{
    [Table("Invitados")]
    public partial class Guest
    {
        public int Dni { get; set; }

        public string? InfoAdicional { get; set; }

        public string? Nombre { get; set; }

        public string? Apellido { get; set; }

        public string? Mail { get; set; }

        public string? DayOne { get; set; }

        public string? DayTwo { get; set; }

        public int? CantEntradas { get; set; }

        public int? Acreditado { get; set; }

        public bool EsNuevo { get; set; } // Campo nuevo
        public DateTime? horaAcreditacion { get; set; }

        public string? profesion { get; set; }
        public string? cargo { get; set; }
    }
}

//hola
