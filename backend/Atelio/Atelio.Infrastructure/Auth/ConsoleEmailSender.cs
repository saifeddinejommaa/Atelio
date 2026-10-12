using Atelio.Application.Common;
using Microsoft.Extensions.Logging;

namespace Atelio.Infrastructure.Auth;

/// <summary>
/// Envoi d'e-mails de développement : le message s'affiche dans les logs de l'API.
/// À remplacer par un vrai fournisseur (ex. Azure Communication Services) avant la production.
/// </summary>
public class ConsoleEmailSender : IEmailSender
{
    private readonly ILogger<ConsoleEmailSender> _logger;

    public ConsoleEmailSender(ILogger<ConsoleEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("E-MAIL (non envoyé) à {To} — {Subject}\n{Body}", to, subject, body);
        return Task.CompletedTask;
    }
}
