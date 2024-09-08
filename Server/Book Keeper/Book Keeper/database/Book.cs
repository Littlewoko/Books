using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;

namespace Book_Keeper.database;

public class Book
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public string? ISBN { get; set; }

    [Required]
    public string Name { get; set; }

    [Required]
    public string Author { get; set; }
    public string? Genre { get; set; }
    public DateTime? ObtainedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
}
