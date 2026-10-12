namespace Atelio.Application.Features.Customers.Requests;

public class CustomersRequestFilter
{
    public const int MaxPageSize = 100;

    // Nom, prénom, e-mail, téléphone ou immatriculation (recherche partielle).
    public string? Search { get; set; }

    // Page demandée, à partir de 1.
    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 20;
}
