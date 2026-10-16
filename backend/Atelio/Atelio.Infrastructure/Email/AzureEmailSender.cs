using Atelio.Application.Common;
using Azure;
using Azure.Communication.Email;
using Azure.Identity;

namespace Atelio.Infrastructure.Email;

/// <summary>Configuration (appsettings « Email ») de l'envoi d'e-mails par Azure Communication Services.</summary>
public class EmailOptions
{
    public const string SectionName = "Email";

    /// <summary>
    /// Développement : chaîne de connexion de la ressource Communication Services (endpoint=...;accesskey=...).
    /// Production : vide, on utilise Endpoint et l'identité managée de l'application.
    /// </summary>
    public string? ConnectionString { get; set; }

    /// <summary>Ex. https://acs-atelio-prod.france.communication.azure.com</summary>
    public string? Endpoint { get; set; }

    /// <summary>Ni l'un ni l'autre : les e-mails s'affichent dans les logs (ConsoleEmailSender).</summary>
    public bool IsConfigured => !string.IsNullOrWhiteSpace(ConnectionString) || !string.IsNullOrWhiteSpace(Endpoint);

    public EmailClient CreateClient() =>
        !string.IsNullOrWhiteSpace(ConnectionString)
            ? new EmailClient(ConnectionString)
            : new EmailClient(new Uri(Endpoint!), new DefaultAzureCredential());
}

/// <summary>
/// Envoi réel des e-mails par Azure Communication Services, depuis l'adresse de la marque blanche
/// de la requête (ex. DoNotReply@gmg-78.com, domaine vérifié dans Azure).
/// </summary>
public class AzureEmailSender : IEmailSender
{
    private readonly EmailClient _client;
    private readonly ITenantContext _tenant;

    public AzureEmailSender(EmailClient client, ITenantContext tenant)
    {
        _client = client;
        _tenant = tenant;
    }

    public async Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken = default)
    {
        var message = new EmailMessage(_tenant.EmailSenderAddress, to, new EmailContent(subject) { PlainText = body });

        // Started : Azure a accepté le message (adresse, expéditeur valides) ; la livraison se poursuit sans attendre.
        await _client.SendAsync(WaitUntil.Started, message, cancellationToken);
    }
}
