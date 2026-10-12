namespace Atelio.Application.Features.CustomerAuth.Responses;

/// <summary>
/// Résultat d'un code vérifié : jeton de session (client connu),
/// ou jeton d'inscription (e-mail inconnu : le compte reste à créer).
/// </summary>
public class CustomerLoginResponse
{
    public string? Token { get; set; }

    // UTC.
    public DateTime? ExpiresAt { get; set; }

    public string? SignupToken { get; set; }

    public static CustomerLoginResponse Session((string Token, DateTime ExpiresAt) session) =>
        new() { Token = session.Token, ExpiresAt = session.ExpiresAt };

    public static CustomerLoginResponse Signup(string signupToken) => new() { SignupToken = signupToken };
}
