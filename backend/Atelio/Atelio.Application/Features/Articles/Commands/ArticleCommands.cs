using Atelio.Application.Common;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Articles.Commands;

// ============================================================
// CATALOGUE D'ARTICLES (nom, description des opérations, prix HT)
// ============================================================

public class ArticleInput
{
    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    // Prix unitaire HT.
    public decimal UnitPriceHt { get; set; }
}

public class ArticleInputValidator : AbstractValidator<ArticleInput>
{
    public ArticleInputValidator()
    {
        RuleFor(x => x.Name).NotEmpty().WithMessage("Indiquez le nom de l'article.").MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.UnitPriceHt).GreaterThanOrEqualTo(0).WithMessage("Le prix ne peut pas être négatif.");
    }
}

public class CreateArticleCommand : ArticleInput, IRequest<long>
{
}

public class CreateArticleCommandValidator : AbstractValidator<CreateArticleCommand>
{
    public CreateArticleCommandValidator()
    {
        Include(new ArticleInputValidator());
    }
}

public class CreateArticleCommandHandler : IRequestHandler<CreateArticleCommand, long>
{
    private readonly IArticleRepository _articles;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public CreateArticleCommandHandler(IArticleRepository articles, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _articles = articles;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<long> Handle(CreateArticleCommand request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        await ArticleRules.EnsureNameFreeAsync(_articles, name, null, cancellationToken);

        var now = _clock.GetUtcNow().UtcDateTime;
        var article = new Article
        {
            Name = name,
            Description = TextRules.Clean(request.Description),
            UnitPriceHt = request.UnitPriceHt,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };

        await _articles.AddAsync(article, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return article.Id;
    }
}

/// <summary>Modification du catalogue : les interventions déjà renseignées gardent leur copie.</summary>
public class UpdateArticleCommand : ArticleInput, IRequest<Unit>
{
    public long ArticleId { get; set; }
}

public class UpdateArticleCommandValidator : AbstractValidator<UpdateArticleCommand>
{
    public UpdateArticleCommandValidator()
    {
        Include(new ArticleInputValidator());
    }
}

public class UpdateArticleCommandHandler : IRequestHandler<UpdateArticleCommand, Unit>
{
    private readonly IArticleRepository _articles;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public UpdateArticleCommandHandler(IArticleRepository articles, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _articles = articles;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(UpdateArticleCommand request, CancellationToken cancellationToken)
    {
        var article = await ArticleRules.GetAsync(_articles, request.ArticleId, cancellationToken);
        var name = request.Name.Trim();
        await ArticleRules.EnsureNameFreeAsync(_articles, name, article.Id, cancellationToken);

        article.Name = name;
        article.Description = TextRules.Clean(request.Description);
        article.UnitPriceHt = request.UnitPriceHt;
        article.UpdatedAt = _clock.GetUtcNow().UtcDateTime;
        _articles.Update(article);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

/// <summary>Désactivé : l'article ne se propose plus sur les interventions (jamais supprimé).</summary>
public class SetArticleActiveCommand : IRequest<Unit>
{
    public long ArticleId { get; set; }

    public bool IsActive { get; set; }
}

public class SetArticleActiveCommandHandler : IRequestHandler<SetArticleActiveCommand, Unit>
{
    private readonly IArticleRepository _articles;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public SetArticleActiveCommandHandler(IArticleRepository articles, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _articles = articles;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(SetArticleActiveCommand request, CancellationToken cancellationToken)
    {
        var article = await ArticleRules.GetAsync(_articles, request.ArticleId, cancellationToken);

        article.IsActive = request.IsActive;
        article.UpdatedAt = _clock.GetUtcNow().UtcDateTime;
        _articles.Update(article);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

internal static class ArticleRules
{
    public static async Task<Article> GetAsync(IArticleRepository articles, long articleId, CancellationToken cancellationToken) =>
        await articles.GetByIdAsync(articleId, cancellationToken)
            ?? throw new NotFoundException($"Article {articleId} introuvable.");

    public static async Task EnsureNameFreeAsync(IArticleRepository articles, string name, long? exceptId, CancellationToken cancellationToken)
    {
        if (await articles.NameExistsAsync(name, exceptId, cancellationToken))
        {
            throw new BusinessException($"Un article « {name} » existe déjà.");
        }
    }
}
