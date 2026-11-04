using Atelio.Application.Common;
using Atelio.Application.Features.Vehicles.Commands;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.QuoteRequests.Commands;

// ============================================================
// DEMANDER UN DEVIS (client connecté du site b2c)
// ============================================================

public class CreateQuoteRequestCommand : IRequest<long>
{
    // Vient du jeton de session, jamais de la requête.
    public long CustomerId { get; set; }

    public string Plate { get; set; } = null!;

    public List<long> ServiceIds { get; set; } = [];

    public string? Message { get; set; }
}

public class CreateQuoteRequestCommandValidator : AbstractValidator<CreateQuoteRequestCommand>
{
    public CreateQuoteRequestCommandValidator()
    {
        RuleFor(x => x.Plate).Must(TextRules.IsValidPlate).WithMessage("Immatriculation invalide (format AB-123-CD).");
        RuleFor(x => x.ServiceIds).NotEmpty().WithMessage("Choisissez au moins une prestation.");
        RuleFor(x => x.Message).MaximumLength(1000);
    }
}

public class CreateQuoteRequestCommandHandler : IRequestHandler<CreateQuoteRequestCommand, long>
{
    private readonly IQuoteRequestRepository _requests;
    private readonly IVehicleRepository _vehicles;
    private readonly IServiceRepository _services;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public CreateQuoteRequestCommandHandler(
        IQuoteRequestRepository requests,
        IVehicleRepository vehicles,
        IServiceRepository services,
        IUnitOfWork unitOfWork,
        TimeProvider clock)
    {
        _requests = requests;
        _vehicles = vehicles;
        _services = services;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<long> Handle(CreateQuoteRequestCommand request, CancellationToken cancellationToken)
    {
        var serviceIds = request.ServiceIds.Distinct().ToList();
        var services = await _services.GetActiveByIdsAsync(serviceIds, cancellationToken);
        if (services.Count != serviceIds.Count)
        {
            throw new BusinessException("Une prestation demandée n'est plus proposée.");
        }

        var now = _clock.GetUtcNow().UtcDateTime;
        QuoteRequest quoteRequest = null!;
        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            // Véhicule du client, créé au besoin : le garage le retrouve pour établir le devis.
            var vehicle = await VehicleRules.SaveAsync(
                _vehicles,
                new SaveVehicleCommand { CustomerId = request.CustomerId, Plate = request.Plate },
                now,
                ct);
            await _unitOfWork.SaveChangesAsync(ct);

            quoteRequest = new QuoteRequest
            {
                CustomerId = request.CustomerId,
                VehicleId = vehicle.Id,
                Message = TextRules.Clean(request.Message),
                CreatedAt = now,
                Services = serviceIds.Select(id => new QuoteRequestService { ServiceId = id }).ToList(),
            };
            await _requests.AddAsync(quoteRequest, ct);
        }, cancellationToken);

        return quoteRequest.Id;
    }
}
