namespace Atelio.Application.Common;

/// <summary>Une page de résultats et le nombre total d'éléments correspondant aux filtres.</summary>
public class PagedResponse<T>
{
    public IReadOnlyList<T> Items { get; set; } = [];

    public int Total { get; set; }

    // Numéro de page, à partir de 1.
    public int Page { get; set; }

    public int PageSize { get; set; }
}
