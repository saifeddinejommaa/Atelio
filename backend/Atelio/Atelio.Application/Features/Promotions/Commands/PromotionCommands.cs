using Atelio.Application.Common;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Promotions.Commands;

// ============================================================
// PROMOTIONS (remise en % sur une prestation, affichée sur le site pendant sa période)
// ============================================================

public class PromotionInput
{
    public long ServiceId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    // Ex. 20 pour -20 %.
    public decimal DiscountPercent { get; set; }

    public DateOnly StartsOn { get; set; }

    // Facultative : sans fin.
    public DateOnly? EndsOn { get; set; }

    public string? Conditions { get; set; }
}

public class PromotionInputValidator : AbstractValidator<PromotionInput>
{
    public PromotionInputValidator()
    {
        RuleFor(x => x.ServiceId).GreaterThan(0).WithMessage("Choisissez la prestation.");
        RuleFor(x => x.Title).NotEmpty().WithMessage("Indiquez le titre de la promotion.").MaximumLength(150);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Conditions).MaximumLength(1000);
        RuleFor(x => x.DiscountPercent).GreaterThan(0).LessThanOrEqualTo(100).WithMessage("La remise doit être comprise entre 0 et 100 %.");
        RuleFor(x => x.EndsOn)
            .GreaterThanOrEqualTo(x => x.StartsOn).WithMessage("La date de fin doit être après la date de début.")
            .When(x => x.EndsOn.HasValue);
    }
}

public class CreatePromotionCommand : PromotionInput, IRequest<long>
{
}

public class CreatePromotionCommandValidator : AbstractValidator<CreatePromotionCommand>
{
    public CreatePromotionCommandValidator()
    {
        Include(new PromotionInputValidator());
    }
}

public class CreatePromotionCommandHandler : IRequestHandler<CreatePromotionCommand, long>
{
    private readonly IPromotionRepository _promotions;
    private readonly IServiceRepository _services;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public CreatePromotionCommandHandler(IPromotionRepository promotions, IServiceRepository services, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _promotions = promotions;
        _services = services;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<long> Handle(CreatePromotionCommand request, CancellationToken cancellationToken)
    {
        await PromotionRules.EnsureServiceAsync(_services, request.ServiceId, cancellationToken);

        var now = _clock.GetUtcNow().UtcDateTime;
        var promotion = new Promotion { IsActive = true, CreatedAt = now };
        PromotionRules.Apply(promotion, request, now);

        await _promotions.AddAsync(promotion, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return promotion.Id;
    }
}

public class UpdatePromotionCommand : PromotionInput, IRequest<Unit>
{
    public long PromotionId { get; set; }
}

public class UpdatePromotionCommandValidator : AbstractValidator<UpdatePromotionCommand>
{
    public UpdatePromotionCommandValidator()
    {
        Include(new PromotionInputValidator());
    }
}

public class UpdatePromotionCommandHandler : IRequestHandler<UpdatePromotionCommand, Unit>
{
    private readonly IPromotionRepository _promotions;
    private readonly IServiceRepository _services;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public UpdatePromotionCommandHandler(IPromotionRepository promotions, IServiceRepository services, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _promotions = promotions;
        _services = services;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(UpdatePromotionCommand request, CancellationToken cancellationToken)
    {
        var promotion = await PromotionRules.GetAsync(_promotions, request.PromotionId, cancellationToken);
        await PromotionRules.EnsureServiceAsync(_services, request.ServiceId, cancellationToken);

        PromotionRules.Apply(promotion, request, _clock.GetUtcNow().UtcDateTime);
        _promotions.Update(promotion);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

/// <summary>Désactivée : la promotion n'est plus affichée sur le site, même pendant sa période.</summary>
public class SetPromotionActiveCommand : IRequest<Unit>
{
    public long PromotionId { get; set; }

    public bool IsActive { get; set; }
}

public class SetPromotionActiveCommandHandler : IRequestHandler<SetPromotionActiveCommand, Unit>
{
    private readonly IPromotionRepository _promotions;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public SetPromotionActiveCommandHandler(IPromotionRepository promotions, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _promotions = promotions;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(SetPromotionActiveCommand request, CancellationToken cancellationToken)
    {
        var promotion = await PromotionRules.GetAsync(_promotions, request.PromotionId, cancellationToken);

        promotion.IsActive = request.IsActive;
        promotion.UpdatedAt = _clock.GetUtcNow().UtcDateTime;
        _promotions.Update(promotion);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

internal static class PromotionRules
{
    public static async Task<Promotion> GetAsync(IPromotionRepository promotions, long id, CancellationToken cancellationToken) =>
        await promotions.GetByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Promotion {id} introuvable.");

    public static async Task EnsureServiceAsync(IServiceRepository services, long serviceId, CancellationToken cancellationToken)
    {
        var found = await services.GetActiveByIdsAsync([serviceId], cancellationToken);
        if (found.Count == 0)
        {
            throw new BusinessException("Cette prestation n'existe pas ou n'est plus proposée.");
        }
    }

    public static void Apply(Promotion promotion, PromotionInput input, DateTime nowUtc)
    {
        promotion.ServiceId = input.ServiceId;
        promotion.Title = input.Title.Trim();
        promotion.Description = TextRules.Clean(input.Description);
        promotion.DiscountPercent = input.DiscountPercent;
        promotion.StartsOn = input.StartsOn;
        promotion.EndsOn = input.EndsOn;
        promotion.Conditions = TextRules.Clean(input.Conditions);
        promotion.UpdatedAt = nowUtc;
    }
}
