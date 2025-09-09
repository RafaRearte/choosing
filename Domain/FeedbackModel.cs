using System.ComponentModel.DataAnnotations;

namespace choosing.Domain
{
    public class FeedbackModel
    {
        public int Id { get; set; }
        
        [Required]
        public int EventoId { get; set; }
        
        [Required]
        public int Rating { get; set; } // 1-10 o 1-5, flexible según lo que configures
    }
    
    public class FeedbackStatsDto
    {
        public int Total { get; set; }
        public Dictionary<int, int> RatingCounts { get; set; } = new Dictionary<int, int>();
    }
    
    public class FeedbackRequest
    {
        [Required]
        [Range(1, 10)]
        public int Rating { get; set; }
    }
}