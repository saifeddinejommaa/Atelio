using Atelio.Application.Features.Invoices.Repositories;
using Atelio.Application.Features.Invoices.Responses;
using Atelio.Domain.Enums;
using Dapper;
using System.Data;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class InvoiceQueryRepository : IInvoiceQueryRepository
{
    private readonly IDbConnection _connection;

    // Facture avec le garage, le client, le véhicule et le dernier paiement réussi.
    private const string InvoiceSelect = $"""
        SELECT
            inv.id AS {nameof(InvoiceResponse.Id)},
            inv.number AS {nameof(InvoiceResponse.Number)},
            inv.issued_at AS {nameof(InvoiceResponse.IssuedAt)},
            to_char(inv.due_date, 'YYYY-MM-DD') AS {nameof(InvoiceResponse.DueDate)},
            inv.total_ht AS {nameof(InvoiceResponse.TotalHt)},
            inv.total_vat AS {nameof(InvoiceResponse.TotalVat)},
            inv.total_ttc AS {nameof(InvoiceResponse.TotalTtc)},
            inv.status_id AS {nameof(InvoiceResponse.StatusId)},
            ist.label AS {nameof(InvoiceResponse.StatusLabel)},
            i.id AS {nameof(InvoiceResponse.InterventionId)},
            a.reference AS {nameof(InvoiceResponse.AppointmentReference)},
            g.name AS {nameof(InvoiceResponse.GarageName)},
            g.address_line || ', ' || g.postal_code || ' ' || g.city AS {nameof(InvoiceResponse.GarageAddress)},
            g.phone AS {nameof(InvoiceResponse.GaragePhone)},
            c.first_name AS {nameof(InvoiceResponse.CustomerFirstName)},
            c.last_name AS {nameof(InvoiceResponse.CustomerLastName)},
            c.email AS {nameof(InvoiceResponse.CustomerEmail)},
            c.phone AS {nameof(InvoiceResponse.CustomerPhone)},
            v.plate AS {nameof(InvoiceResponse.VehiclePlate)},
            v.make AS {nameof(InvoiceResponse.VehicleMake)},
            v.model AS {nameof(InvoiceResponse.VehicleModel)},
            i.mileage AS {nameof(InvoiceResponse.Mileage)},
            pay.method AS {nameof(InvoiceResponse.PaymentMethod)},
            pay.paid_at AS {nameof(InvoiceResponse.PaidAt)}

        FROM invoice inv
        INNER JOIN invoice_status ist ON ist.id = inv.status_id
        INNER JOIN intervention i ON i.id = inv.intervention_id
        INNER JOIN garage g ON g.id = i.garage_id
        INNER JOIN customer c ON c.id = i.customer_id
        INNER JOIN vehicle v ON v.id = i.vehicle_id
        LEFT JOIN appointment a ON a.id = i.appointment_id
        LEFT JOIN LATERAL (
            SELECT p.method, p.paid_at FROM payment p
            WHERE p.invoice_id = inv.id AND p.status_id = @PaymentSucceeded
            ORDER BY p.paid_at DESC
            LIMIT 1
        ) pay ON TRUE

        WHERE inv.id = @Id
        """;

    private const string LinesSelect = $"""
        SELECT
            l.kind AS {nameof(InvoiceLineResponse.Kind)},
            l.label AS {nameof(InvoiceLineResponse.Label)},
            l.reference AS {nameof(InvoiceLineResponse.Reference)},
            l.quantity AS {nameof(InvoiceLineResponse.Quantity)},
            l.unit_price AS {nameof(InvoiceLineResponse.UnitPrice)},
            l.total AS {nameof(InvoiceLineResponse.Total)}

        FROM invoice_line l

        WHERE l.invoice_id = @Id

        ORDER BY l.sort_order, l.id
        """;

    public InvoiceQueryRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<InvoiceResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var invoice = await _connection.QuerySingleOrDefaultAsync<InvoiceResponse>(
            new CommandDefinition(InvoiceSelect, new { Id = id, PaymentSucceeded = (int)PaymentStatus.Succeeded }, cancellationToken: cancellationToken));

        if (invoice is null)
        {
            return null;
        }

        invoice.Lines = (await _connection.QueryAsync<InvoiceLineResponse>(
            new CommandDefinition(LinesSelect, new { Id = id }, cancellationToken: cancellationToken))).ToList();

        return invoice;
    }
}
