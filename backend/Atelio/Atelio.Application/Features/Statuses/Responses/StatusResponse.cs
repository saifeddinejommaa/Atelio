using Atelio.Domain.Entities;

namespace Atelio.Application.Features.Statuses.Responses;

public class StatusResponse
{
    public int Id { get; set; }

    public string Label { get; set; } = null!;

    // Inactif : ne peut plus être attribué, mais reste affiché sur les anciens enregistrements.
    public bool IsActive { get; set; }

    public static StatusResponse From(StatusLookup status) => new()
    {
        Id = status.Id,
        Label = status.Label,
        IsActive = status.IsActive,
    };
}
