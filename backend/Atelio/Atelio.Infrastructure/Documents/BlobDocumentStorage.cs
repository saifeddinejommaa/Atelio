using Atelio.Application.Common;
using Azure;
using Azure.Identity;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;

namespace Atelio.Infrastructure.Documents;

/// <summary>Configuration (appsettings « DocumentStorage ») du stockage des documents.</summary>
public class DocumentStorageOptions
{
    public const string SectionName = "DocumentStorage";

    /// <summary>
    /// Développement : chaîne de connexion (ex. Azurite « UseDevelopmentStorage=true »).
    /// Production : vide, on utilise ServiceUri et l'identité managée de l'application.
    /// </summary>
    public string? ConnectionString { get; set; }

    /// <summary>Ex. https://statelioprod.blob.core.windows.net</summary>
    public string? ServiceUri { get; set; }
}

/// <summary>
/// Documents dans Azure Blob Storage : un conteneur privé par marque blanche (créé au premier document),
/// jamais d'URL publique.
/// </summary>
public class BlobDocumentStorage : IDocumentStorage
{
    private readonly BlobServiceClient _service;

    // Conteneurs déjà vérifiés depuis le démarrage (évite un appel à chaque document).
    private readonly ConcurrentDictionary<string, BlobContainerClient> _containers = new();

    public BlobDocumentStorage(IOptions<DocumentStorageOptions> options)
    {
        var settings = options.Value;
        _service = !string.IsNullOrWhiteSpace(settings.ConnectionString)
            ? new BlobServiceClient(settings.ConnectionString)
            : new BlobServiceClient(
                new Uri(settings.ServiceUri ?? throw new InvalidOperationException("DocumentStorage : ConnectionString ou ServiceUri requis.")),
                new DefaultAzureCredential());
    }

    public async Task UploadAsync(string container, string path, byte[] content, string contentType, CancellationToken cancellationToken = default)
    {
        var client = await GetContainerAsync(container, cancellationToken);

        try
        {
            // If-None-Match: * : refuse d'écraser un document déjà émis.
            await client.GetBlobClient(path).UploadAsync(
                new BinaryData(content),
                new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders { ContentType = contentType },
                    Conditions = new BlobRequestConditions { IfNoneMatch = ETag.All },
                },
                cancellationToken);
        }
        catch (RequestFailedException ex) when (ex.Status == 409)
        {
            throw new InvalidOperationException($"Le document {container}/{path} existe déjà : il ne peut pas être remplacé.", ex);
        }
    }

    public async Task<Stream?> OpenAsync(string container, string path, CancellationToken cancellationToken = default)
    {
        var blob = _service.GetBlobContainerClient(container).GetBlobClient(path);
        try
        {
            return (await blob.DownloadStreamingAsync(cancellationToken: cancellationToken)).Value.Content;
        }
        catch (RequestFailedException ex) when (ex.Status == 404)
        {
            return null;
        }
    }

    private async Task<BlobContainerClient> GetContainerAsync(string name, CancellationToken cancellationToken)
    {
        if (_containers.TryGetValue(name, out var cached))
        {
            return cached;
        }

        var client = _service.GetBlobContainerClient(name);
        await client.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);
        return _containers.GetOrAdd(name, client);
    }
}
