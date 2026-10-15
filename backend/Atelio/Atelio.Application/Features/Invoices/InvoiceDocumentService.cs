using Atelio.Application.Common;
using Atelio.Application.Features.Invoices.Commands;
using Atelio.Domain;
using Atelio.Domain.Entities;
using Atelio.Domain.Enums;
using Atelio.Domain.Repositories;
using System.Security.Cryptography;

namespace Atelio.Application.Features.Invoices;

public interface IInvoiceDocumentService
{
    /// <summary>
    /// Génère la version suivante du PDF de la facture (lignes, totaux, règlements à ce jour),
    /// l'enregistre dans le stockage et ajoute son InvoiceDocument (sauvegardé par l'appelant).
    /// </summary>
    Task<InvoiceDocument> GenerateAsync(Invoice invoice, IReadOnlyList<Payment> payments, CancellationToken cancellationToken = default);
}

public class InvoiceDocumentService : IInvoiceDocumentService
{
    private static readonly Dictionary<PaymentMethod, string> MethodLabels = new()
    {
        [PaymentMethod.Card] = "Carte bancaire",
        [PaymentMethod.Cash] = "Espèces",
        [PaymentMethod.Transfer] = "Virement",
        [PaymentMethod.Check] = "Chèque",
        [PaymentMethod.Online] = "Paiement en ligne",
    };

    private readonly IInterventionRepository _interventions;
    private readonly ICustomerRepository _customers;
    private readonly IVehicleRepository _vehicles;
    private readonly IGarageRepository _garages;
    private readonly IInvoiceDocumentRepository _documents;
    private readonly IInvoicePdfRenderer _renderer;
    private readonly IDocumentStorage _storage;
    private readonly ITenantContext _tenant;
    private readonly TimeProvider _clock;

    public InvoiceDocumentService(
        IInterventionRepository interventions,
        ICustomerRepository customers,
        IVehicleRepository vehicles,
        IGarageRepository garages,
        IInvoiceDocumentRepository documents,
        IInvoicePdfRenderer renderer,
        IDocumentStorage storage,
        ITenantContext tenant,
        TimeProvider clock)
    {
        _interventions = interventions;
        _customers = customers;
        _vehicles = vehicles;
        _garages = garages;
        _documents = documents;
        _renderer = renderer;
        _storage = storage;
        _tenant = tenant;
        _clock = clock;
    }

    public async Task<InvoiceDocument> GenerateAsync(Invoice invoice, IReadOnlyList<Payment> payments, CancellationToken cancellationToken = default)
    {
        var intervention = await _interventions.GetByIdAsync(invoice.InterventionId, cancellationToken)
            ?? throw new NotFoundException($"Intervention {invoice.InterventionId} introuvable.");
        var customer = await _customers.GetByIdAsync(intervention.CustomerId, cancellationToken)
            ?? throw new NotFoundException($"Client {intervention.CustomerId} introuvable.");
        var vehicle = await _vehicles.GetByIdAsync(intervention.VehicleId, cancellationToken)
            ?? throw new NotFoundException($"Véhicule {intervention.VehicleId} introuvable.");
        var garage = await _garages.GetByIdAsync(intervention.GarageId, cancellationToken)
            ?? throw new NotFoundException($"Garage {intervention.GarageId} introuvable.");

        var previous = await _documents.GetByInvoiceAsync(invoice.Id, cancellationToken);
        var version = (short)((previous.FirstOrDefault()?.Version ?? 0) + 1);
        var local = (DateTime utc) => TimeZoneInfo.ConvertTimeFromUtc(utc, _tenant.TimeZone);

        var paid = payments.Sum(p => p.Amount);
        var model = new InvoicePdfModel(
            Legal: _tenant.Legal,
            Number: invoice.Number,
            IssuedAtLocal: local(invoice.IssuedAt),
            DueDate: invoice.DueDate,
            Version: version,
            GarageName: garage.Name,
            GarageAddress: $"{garage.AddressLine}, {garage.PostalCode} {garage.City}",
            GaragePhone: garage.Phone,
            CustomerName: $"{customer.FirstName} {customer.LastName}",
            CustomerPhone: customer.Phone,
            CustomerEmail: customer.Email,
            VehiclePlate: vehicle.Plate,
            VehicleDescription: TextRules.Clean(string.Join(' ', new[] { vehicle.Make, vehicle.Model, vehicle.Version }.Where(s => !string.IsNullOrWhiteSpace(s)))),
            Mileage: intervention.Mileage,
            PricesExcludingVat: invoice.Lines.Any(l => l.Kind == InvoiceLineKind.Article),
            Lines: invoice.Lines
                .OrderBy(l => l.SortOrder)
                .ThenBy(l => l.Id)
                .Select(l => new InvoicePdfLine(l.Label, l.Description, l.Quantity, l.UnitPrice, l.DiscountLabel, l.DiscountPercent, l.Total))
                .ToList(),
            TotalHt: invoice.TotalHt,
            TotalVat: invoice.TotalVat,
            TotalTtc: invoice.TotalTtc,
            VatRate: InvoiceRules.VatRate,
            Payments: payments
                .Select(p => new InvoicePdfPayment(local(p.PaidAt), MethodLabels.GetValueOrDefault(p.Method, p.Method.ToString()), p.Amount))
                .ToList(),
            AmountPaid: paid,
            Remaining: Math.Max(0, invoice.TotalTtc - paid));

        var pdf = _renderer.Render(model);
        // Conteneur de la marque (ex. gmg), dossier invoices/année.
        var path = $"invoices/{invoice.IssuedAt.Year}/{invoice.Number}-v{version}.pdf";
        await _storage.UploadAsync(DocumentContainers.For(_tenant), path, pdf, "application/pdf", cancellationToken);

        var document = new InvoiceDocument
        {
            InvoiceId = invoice.Id,
            Version = version,
            BlobPath = path,
            Sha256 = Convert.ToHexStringLower(SHA256.HashData(pdf)),
            SizeBytes = pdf.Length,
            CreatedAt = _clock.GetUtcNow().UtcDateTime,
        };
        await _documents.AddAsync(document, cancellationToken);

        return document;
    }
}
