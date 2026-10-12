namespace Atelio.Application.Features.Articles.Requests;

public class ArticlesRequestFilter
{
    // Partie du nom.
    public string? Search { get; set; }

    // true : actifs (autocomplete de l'intervention), false : désactivés, vide : tous.
    public bool? Active { get; set; }
}
