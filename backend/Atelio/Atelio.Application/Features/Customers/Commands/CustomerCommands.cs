using Atelio.Application.Common;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;

namespace Atelio.Application.Features.Customers.Commands;

// ============================================================
// CREATE
// ============================================================

public class CreateCustomerCommand : IRequest<long>
{
    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    // Facultatif (client enregistré par le garage), mais il faut au moins un e-mail ou un téléphone.
    public string? Email { get; set; }

    public string? Phone { get; set; }
}

public class CreateCustomerCommandValidator : AbstractValidator<CreateCustomerCommand>
{
    public CreateCustomerCommandValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("Le prénom est obligatoire.").MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().WithMessage("Le nom est obligatoire.").MaximumLength(100);
        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Adresse e-mail invalide.")
            .MaximumLength(255)
            .When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Phone).MaximumLength(30);
        RuleFor(x => x.Phone)
            .Must(phone => TextRules.PhoneKey(phone) is not null)
            .WithMessage("Numéro de téléphone invalide.")
            .When(x => !string.IsNullOrWhiteSpace(x.Phone));
        RuleFor(x => x)
            .Must(x => !string.IsNullOrWhiteSpace(x.Email) || !string.IsNullOrWhiteSpace(x.Phone))
            .WithMessage("Indiquez un e-mail ou un numéro de téléphone.");
    }
}

public class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, long>
{
    private readonly ICustomerRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public CreateCustomerCommandHandler(ICustomerRepository repository, IUnitOfWork unitOfWork, TimeProvider clock)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<long> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        var email = TextRules.Clean(request.Email);

        if (email is not null && await _repository.ExistsByEmailAsync(email, null, cancellationToken))
        {
            throw new BusinessException("Un compte existe déjà avec cette adresse e-mail.");
        }

        var now = _clock.GetUtcNow().UtcDateTime;
        var customer = new Customer
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            Phone = TextRules.Clean(request.Phone),
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now,
        };

        await _repository.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return customer.Id;
    }
}

// ============================================================
// UPDATE
// ============================================================

public class UpdateCustomerCommand : CreateCustomerCommand
{
    public long Id { get; set; }
}

public class UpdateCustomerCommandValidator : AbstractValidator<UpdateCustomerCommand>
{
    public UpdateCustomerCommandValidator()
    {
        Include(new CreateCustomerCommandValidator());
    }
}

public class UpdateCustomerCommandHandler : IRequestHandler<UpdateCustomerCommand, long>
{
    private readonly ICustomerRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCustomerCommandHandler(ICustomerRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<long> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException($"Client {request.Id} introuvable.");

        var email = TextRules.Clean(request.Email);
        if (email is not null && await _repository.ExistsByEmailAsync(email, customer.Id, cancellationToken))
        {
            throw new BusinessException("Un compte existe déjà avec cette adresse e-mail.");
        }

        customer.FirstName = request.FirstName.Trim();
        customer.LastName = request.LastName.Trim();
        customer.Email = email;
        customer.Phone = TextRules.Clean(request.Phone);

        _repository.Update(customer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return customer.Id;
    }
}
