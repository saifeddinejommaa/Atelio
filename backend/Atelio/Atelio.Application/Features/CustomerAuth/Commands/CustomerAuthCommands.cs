using Atelio.Application.Common;
using Atelio.Application.Features.CustomerAuth.Responses;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Repositories;
using FluentValidation;
using MediatR;
using System.Security.Cryptography;
using System.Text;

namespace Atelio.Application.Features.CustomerAuth.Commands;

// ============================================================
// CONNEXION DES CLIENTS (site b2c) : code à 6 chiffres envoyé par e-mail
// ============================================================

internal static class LoginCodeRules
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(10);

    public const int MaxAttempts = 5;

    // Limites d'envoi par e-mail.
    public const int MaxPerMinute = 1;

    public const int MaxPerHour = 5;

    public static string Normalize(string email) => email.Trim().ToLowerInvariant();
}

// ------------------------------------------------------------
// DEMANDER UN CODE
// ------------------------------------------------------------

/// <summary>Envoie un code à l'e-mail. Même réponse que le client existe ou non.</summary>
public class RequestCustomerLoginCodeCommand : IRequest<Unit>
{
    public string Email { get; set; } = null!;
}

public class RequestCustomerLoginCodeCommandValidator : AbstractValidator<RequestCustomerLoginCodeCommand>
{
    public RequestCustomerLoginCodeCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("Indiquez votre adresse e-mail.")
            .EmailAddress().WithMessage("Adresse e-mail invalide.")
            .MaximumLength(255);
    }
}

public class RequestCustomerLoginCodeCommandHandler : IRequestHandler<RequestCustomerLoginCodeCommand, Unit>
{
    private readonly ICustomerLoginCodeRepository _codes;
    private readonly ICustomerTokenService _tokens;
    private readonly IEmailSender _email;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public RequestCustomerLoginCodeCommandHandler(
        ICustomerLoginCodeRepository codes,
        ICustomerTokenService tokens,
        IEmailSender email,
        IUnitOfWork unitOfWork,
        TimeProvider clock)
    {
        _codes = codes;
        _tokens = tokens;
        _email = email;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<Unit> Handle(RequestCustomerLoginCodeCommand request, CancellationToken cancellationToken)
    {
        var email = LoginCodeRules.Normalize(request.Email);
        var now = _clock.GetUtcNow().UtcDateTime;

        if (await _codes.CountSinceAsync(email, now.AddMinutes(-1), cancellationToken) >= LoginCodeRules.MaxPerMinute)
        {
            throw new BusinessException("Un code vient de vous être envoyé : patientez une minute avant d'en demander un autre.");
        }

        if (await _codes.CountSinceAsync(email, now.AddHours(-1), cancellationToken) >= LoginCodeRules.MaxPerHour)
        {
            throw new BusinessException("Trop de codes demandés : réessayez dans une heure.");
        }

        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        await _codes.AddAsync(new CustomerLoginCode
        {
            Email = email,
            CodeHash = _tokens.HashLoginCode(email, code),
            ExpiresAt = now.Add(LoginCodeRules.Lifetime),
            CreatedAt = now,
        }, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        await _email.SendAsync(
            email,
            $"Votre code de connexion : {code}",
            $"Votre code de connexion est {code}.\nIl est valable {LoginCodeRules.Lifetime.TotalMinutes} minutes.\n"
                + "Si vous n'avez rien demandé, ignorez ce message.",
            cancellationToken);

        return Unit.Value;
    }
}

// ------------------------------------------------------------
// VÉRIFIER LE CODE
// ------------------------------------------------------------

/// <summary>Vérifie le code : session si le client existe, sinon jeton d'inscription.</summary>
public class VerifyCustomerLoginCodeCommand : IRequest<CustomerLoginResponse>
{
    public string Email { get; set; } = null!;

    public string Code { get; set; } = null!;
}

public class VerifyCustomerLoginCodeCommandValidator : AbstractValidator<VerifyCustomerLoginCodeCommand>
{
    public VerifyCustomerLoginCodeCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("Indiquez votre adresse e-mail.");
        RuleFor(x => x.Code).Matches(@"^\d{6}$").WithMessage("Le code contient 6 chiffres.");
    }
}

public class VerifyCustomerLoginCodeCommandHandler : IRequestHandler<VerifyCustomerLoginCodeCommand, CustomerLoginResponse>
{
    private readonly ICustomerLoginCodeRepository _codes;
    private readonly ICustomerRepository _customers;
    private readonly ICustomerTokenService _tokens;
    private readonly ITenantContext _tenant;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public VerifyCustomerLoginCodeCommandHandler(
        ICustomerLoginCodeRepository codes,
        ICustomerRepository customers,
        ICustomerTokenService tokens,
        ITenantContext tenant,
        IUnitOfWork unitOfWork,
        TimeProvider clock)
    {
        _codes = codes;
        _customers = customers;
        _tokens = tokens;
        _tenant = tenant;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<CustomerLoginResponse> Handle(VerifyCustomerLoginCodeCommand request, CancellationToken cancellationToken)
    {
        var email = LoginCodeRules.Normalize(request.Email);
        var now = _clock.GetUtcNow().UtcDateTime;

        var login = await _codes.GetLatestUnusedAsync(email, cancellationToken);
        if (login is null || login.ExpiresAt <= now || login.Attempts >= LoginCodeRules.MaxAttempts)
        {
            throw new BusinessException("Ce code a expiré : demandez-en un nouveau.");
        }

        var expected = Encoding.ASCII.GetBytes(login.CodeHash);
        var actual = Encoding.ASCII.GetBytes(_tokens.HashLoginCode(email, request.Code.Trim()));
        if (!CryptographicOperations.FixedTimeEquals(expected, actual))
        {
            login.Attempts++;
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            var left = LoginCodeRules.MaxAttempts - login.Attempts;
            throw new BusinessException(left > 0
                ? $"Code incorrect ({left} essai{(left > 1 ? "s" : "")} restant{(left > 1 ? "s" : "")})."
                : "Code incorrect : demandez-en un nouveau.");
        }

        login.ConsumedAt = now;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var customer = await _customers.GetByEmailAsync(email, cancellationToken);
        if (customer is null)
        {
            return CustomerLoginResponse.Signup(_tokens.CreateSignupToken(email, _tenant.Slug));
        }

        if (!customer.IsActive)
        {
            throw new BusinessException("Ce compte est désactivé : contactez le garage.");
        }

        return CustomerLoginResponse.Session(_tokens.CreateSessionToken(customer.Id, _tenant.Slug));
    }
}

// ------------------------------------------------------------
// CRÉER LE COMPTE (après un code vérifié pour un e-mail inconnu)
// ------------------------------------------------------------

public class RegisterCustomerCommand : IRequest<CustomerLoginResponse>
{
    public string SignupToken { get; set; } = null!;

    public string FirstName { get; set; } = null!;

    public string LastName { get; set; } = null!;

    public string Phone { get; set; } = null!;
}

public class RegisterCustomerCommandValidator : AbstractValidator<RegisterCustomerCommand>
{
    public RegisterCustomerCommandValidator()
    {
        RuleFor(x => x.SignupToken).NotEmpty();
        RuleFor(x => x.FirstName).NotEmpty().WithMessage("Le prénom est obligatoire.").MaximumLength(100);
        RuleFor(x => x.LastName).NotEmpty().WithMessage("Le nom est obligatoire.").MaximumLength(100);
        RuleFor(x => x.Phone).NotEmpty().WithMessage("Le téléphone est obligatoire.").MaximumLength(30)
            .Must(phone => TextRules.PhoneKey(phone) is not null).WithMessage("Numéro de téléphone invalide.");
    }
}

public class RegisterCustomerCommandHandler : IRequestHandler<RegisterCustomerCommand, CustomerLoginResponse>
{
    private readonly ICustomerRepository _customers;
    private readonly ICustomerTokenService _tokens;
    private readonly ITenantContext _tenant;
    private readonly IUnitOfWork _unitOfWork;
    private readonly TimeProvider _clock;

    public RegisterCustomerCommandHandler(
        ICustomerRepository customers,
        ICustomerTokenService tokens,
        ITenantContext tenant,
        IUnitOfWork unitOfWork,
        TimeProvider clock)
    {
        _customers = customers;
        _tokens = tokens;
        _tenant = tenant;
        _unitOfWork = unitOfWork;
        _clock = clock;
    }

    public async Task<CustomerLoginResponse> Handle(RegisterCustomerCommand request, CancellationToken cancellationToken)
    {
        var email = await _tokens.ReadSignupTokenAsync(request.SignupToken, _tenant.Slug)
            ?? throw new BusinessException("La vérification de votre e-mail a expiré : reconnectez-vous.");

        // Compte créé entre-temps (ex. par le garage) : on le connecte simplement.
        var existing = await _customers.GetByEmailAsync(email, cancellationToken);
        if (existing is not null)
        {
            return existing.IsActive
                ? CustomerLoginResponse.Session(_tokens.CreateSessionToken(existing.Id, _tenant.Slug))
                : throw new BusinessException("Ce compte est désactivé : contactez le garage.");
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

        await _customers.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return CustomerLoginResponse.Session(_tokens.CreateSessionToken(customer.Id, _tenant.Slug));
    }
}
