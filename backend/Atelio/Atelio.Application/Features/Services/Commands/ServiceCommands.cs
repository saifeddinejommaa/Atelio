using Atelio.Application.Common;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;
using System.Globalization;
using System.Text;

namespace Atelio.Application.Features.Services.Commands;

// ============================================================
// PRESTATIONS (nom, description, prix « à partir de » TTC, durée, type d'intervention)
// ============================================================

public class ServiceInput
{
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    // Prix « à partir de » TTC, avant promotion.
    public decimal Price { get; set; }

    // Durée estimée : sert au placement des rendez-vous.
    public int DurationMinutes { get; set; }

    // Type d'intervention : donne le taux horaire de main-d'œuvre.
    public long? CategoryId { get; set; }

    // Durée incertaine (ex. « Autre ») : à placer de préférence le matin.
    public bool UncertainDuration { get; set; }
}

public class ServiceInputValidator : AbstractValidator<ServiceInput>
{
    public ServiceInputValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Indiquez le nom de la prestation.").MaximumLength(150);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).WithMessage("Le prix ne peut pas être négatif.");
        RuleFor(x => x.DurationMinutes).GreaterThan(0).WithMessage("Indiquez une durée supérieure à 0.").LessThanOrEqualTo(24 * 60);
    }
}

/// <summary>Nouvelle prestation, active et proposée dans tous les garages de la marque.</summary>
public class CreateServiceCommand : ServiceInput, IRequest<long>
{
}

public class CreateServiceCommandValidator : AbstractValidator<CreateServiceCommand>
{
    public CreateServiceCommandValidator()
    {
        Include(new ServiceInputValidator());
    }
}

public class CreateServiceCommandHandler : IRequestHandler<CreateServiceCommand, long>
{
    private readonly IServiceRepository _services;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public CreateServiceCommandHandler(IServiceRepository services, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _services = services;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<long> Handle(CreateServiceCommand request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        await ServiceRules.EnsureNameFreeAsync(_services, name, null, cancellationToken);

        var now = _clock.GetUtcNow().UtcDateTime;
        var service = new Service
        {
            Code = await ServiceRules.NewCodeAsync(_services, name, cancellationToken),
            IsActive = true,
            CreatedAt = now,
        };
        ServiceRules.Apply(service, request, now);

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            await _services.AddAsync(service, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            await _services.AddToAllGaragesAsync(service.Id, ct);
            await _unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return service.Id;
    }
}

/// <summary>Modifie une prestation : les rendez-vous et interventions déjà enregistrés gardent leur prix.</summary>
public class UpdateServiceCommand : ServiceInput, IRequest<Unit>
{
    public long ServiceId { get; set; }
}

public class UpdateServiceCommandValidator : AbstractValidator<UpdateServiceCommand>
{
    public UpdateServiceCommandValidator()
    {
        Include(new ServiceInputValidator());
    }
}

public class UpdateServiceCommandHandler : IRequestHandler<UpdateServiceCommand, Unit>
{
    private readonly IServiceRepository _services;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public UpdateServiceCommandHandler(IServiceRepository services, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _services = services;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(UpdateServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await ServiceRules.GetAsync(_services, request.ServiceId, cancellationToken);
        await ServiceRules.EnsureNameFreeAsync(_services, request.Name.Trim(), service.Id, cancellationToken);

        ServiceRules.Apply(service, request, _clock.GetUtcNow().UtcDateTime);
        _services.Update(service);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

/// <summary>Désactivée : la prestation n'est plus proposée sur le site ni à la prise de rendez-vous.</summary>
public class SetServiceActiveCommand : IRequest<Unit>
{
    public long ServiceId { get; set; }

    public bool IsActive { get; set; }
}

public class SetServiceActiveCommandHandler : IRequestHandler<SetServiceActiveCommand, Unit>
{
    private readonly IServiceRepository _services;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public SetServiceActiveCommandHandler(IServiceRepository services, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _services = services;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(SetServiceActiveCommand request, CancellationToken cancellationToken)
    {
        var service = await ServiceRules.GetAsync(_services, request.ServiceId, cancellationToken);

        service.IsActive = request.IsActive;
        service.UpdatedAt = _clock.GetUtcNow().UtcDateTime;
        _services.Update(service);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

/// <summary>Supprime une prestation jamais utilisée (sinon il faut la désactiver).</summary>
public class DeleteServiceCommand : IRequest<Unit>
{
    public long ServiceId { get; set; }
}

public class DeleteServiceCommandHandler : IRequestHandler<DeleteServiceCommand, Unit>
{
    private readonly IServiceRepository _services;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteServiceCommandHandler(IServiceRepository services, IUnitOfWork unitOfWork)
    {
        _services = services;
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(DeleteServiceCommand request, CancellationToken cancellationToken)
    {
        var service = await ServiceRules.GetAsync(_services, request.ServiceId, cancellationToken);
        if (await _services.IsUsedAsync(service.Id, cancellationToken))
        {
            throw new BusinessException(
                $"« {service.Name} » est déjà utilisée (rendez-vous, interventions ou promotions) : désactivez-la plutôt.");
        }

        // Garages et kits de pièces de la prestation : supprimés avec elle (cascade en base).
        _services.Remove(service);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

internal static class ServiceRules
{
    public static async Task<Service> GetAsync(IServiceRepository services, long serviceId, CancellationToken cancellationToken) =>
        await services.GetByIdAsync(serviceId, cancellationToken)
            ?? throw new NotFoundException($"Prestation {serviceId} introuvable.");

    public static async Task EnsureNameFreeAsync(IServiceRepository services, string name, long? exceptId, CancellationToken cancellationToken)
    {
        if (await services.NameExistsAsync(name, exceptId, cancellationToken))
        {
            throw new BusinessException($"Une prestation « {name} » existe déjà.");
        }
    }

    public static void Apply(Service service, ServiceInput input, DateTime nowUtc)
    {
        service.Name = input.Name.Trim();
        service.Description = TextRules.Clean(input.Description);
        service.Price = input.Price;
        service.DurationMinutes = input.DurationMinutes;
        service.CategoryId = input.CategoryId;
        service.UncertainDuration = input.UncertainDuration;
        service.UpdatedAt = nowUtc;
    }

    /// <summary>Code de l'URL du site, tiré du nom (ex. « Géométrie / parallélisme » => geometrie-parallelisme), unique.</summary>
    public static async Task<string> NewCodeAsync(IServiceRepository services, string name, CancellationToken cancellationToken)
    {
        var baseCode = Slug(name);
        var code = baseCode;
        for (var i = 2; await services.CodeExistsAsync(code, cancellationToken); i++)
        {
            code = $"{baseCode}-{i}";
        }

        return code;
    }

    private static string Slug(string text)
    {
        var slug = new StringBuilder();
        foreach (var c in text.Normalize(NormalizationForm.FormD).ToLowerInvariant())
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsAsciiLetterOrDigit(c))
            {
                slug.Append(c);
            }
            else if (slug.Length > 0 && slug[^1] != '-')
            {
                slug.Append('-');
            }
        }

        var code = slug.ToString().Trim('-');
        // Les codes sont limités à 50 caractères en base (marge pour un suffixe « -2 »).
        code = code.Length > 45 ? code[..45].TrimEnd('-') : code;
        return code.Length == 0 ? "prestation" : code;
    }
}
