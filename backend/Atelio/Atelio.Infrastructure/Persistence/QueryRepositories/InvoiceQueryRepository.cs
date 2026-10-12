using Atelio.Application.Common;
using Atelio.Application.Features.Invoices.Repositories;
using Atelio.Application.Features.Invoices.Requests;
using Atelio.Application.Features.Invoices.Responses;
using Atelio.Domain.Enums;
using Dapper;
using System.Data;
using System.Text;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class InvoiceQueryRepository : IInvoiceQueryRepository
{
    private readonly IDbConnection _connection;
    private readonly ITenantContext _tenant;

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
            l.description AS {nameof(InvoiceLineResponse.Description)},
            l.quantity AS {nameof(InvoiceLineResponse.Quantity)},
            l.unit_price AS {nameof(InvoiceLineResponse.UnitPrice)},
            l.total AS {nameof(InvoiceLineResponse.Total)}

        FROM invoice_line l

        WHERE l.invoice_id = @Id

        ORDER BY l.sort_order, l.id
        """;

    // Liste : client, véhicule, statut (filtres et pagination ajoutés à la suite).
    private const string SummaryColumns = $"""
        SELECT
            inv.id AS {nameof(InvoiceSummaryResponse.Id)},
            inv.number AS {nameof(InvoiceSummaryResponse.Number)},
            inv.issued_at AS {nameof(InvoiceSummaryResponse.IssuedAt)},
            inv.total_ht AS {nameof(InvoiceSummaryResponse.TotalHt)},
            inv.total_ttc AS {nameof(InvoiceSummaryResponse.TotalTtc)},
            inv.status_id AS {nameof(InvoiceSummaryResponse.StatusId)},
            ist.label AS {nameof(InvoiceSummaryResponse.StatusLabel)},
            i.id AS {nameof(InvoiceSummaryResponse.InterventionId)},
            c.id AS {nameof(InvoiceSummaryResponse.CustomerId)},
            c.first_name AS {nameof(InvoiceSummaryResponse.CustomerFirstName)},
            c.last_name AS {nameof(InvoiceSummaryResponse.CustomerLastName)},
            v.plate AS {nameof(InvoiceSummaryResponse.VehiclePlate)},
            v.make AS {nameof(InvoiceSummaryResponse.VehicleMake)},
            v.model AS {nameof(InvoiceSummaryResponse.VehicleModel)}
        """;

    private const string SummaryFrom = """

        FROM invoice inv
        INNER JOIN invoice_status ist ON ist.id = inv.status_id
        INNER JOIN intervention i ON i.id = inv.intervention_id
        INNER JOIN customer c ON c.id = i.customer_id
        INNER JOIN vehicle v ON v.id = i.vehicle_id
        """;

    public InvoiceQueryRepository(IDbConnection connection, ITenantContext tenant)
    {
        _connection = connection;
        _tenant = tenant;
    }

    public async Task<InvoicesPageResponse> GetInvoicesAsync(InvoicesRequestFilter filter, CancellationToken cancellationToken = default)
    {
        var where = new StringBuilder("""

            WHERE 1 = 1
            """);
        var parameters = new DynamicParameters();

        if (filter.GarageId.HasValue)
        {
            where.Append(" AND i.garage_id = @GarageId");
            parameters.Add("GarageId", filter.GarageId.Value);
        }

        // Période : jours locaux du garage, bornes incluses => [du 00:00, lendemain du « au » 00:00[ en UTC.
        if (filter.From is DateOnly from)
        {
            where.Append(" AND inv.issued_at >= @FromUtc");
            parameters.Add("FromUtc", ToUtc(from));
        }

        if (filter.To is DateOnly to)
        {
            where.Append(" AND inv.issued_at < @ToUtc");
            parameters.Add("ToUtc", ToUtc(to.AddDays(1)));
        }

        // Client : « Dupont », « Jean Dupont » ou « Dupont Jean ».
        if (!string.IsNullOrWhiteSpace(filter.Customer))
        {
            where.Append("""

                AND (
                    (c.first_name || ' ' || c.last_name) ILIKE @Customer ESCAPE '\'
                    OR (c.last_name || ' ' || c.first_name) ILIKE @Customer ESCAPE '\'
                )
                """);
            parameters.Add("Customer", $"%{EscapeLike(filter.Customer.Trim())}%");
        }

        // Immatriculation : « AB-123 », « ab123 » ou « AB 123 » trouvent AB-123-CD.
        var plate = (filter.Plate ?? string.Empty).ToUpperInvariant().Replace("-", "").Replace(" ", "");
        if (plate.Length > 0)
        {
            where.Append(" AND replace(replace(upper(v.plate), '-', ''), ' ', '') LIKE @Plate ESCAPE '\\'");
            parameters.Add("Plate", $"%{EscapeLike(plate)}%");
        }

        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, InvoicesRequestFilter.MaxPageSize);
        parameters.Add("Limit", pageSize);
        parameters.Add("Offset", (page - 1) * pageSize);

        var totals = await _connection.QuerySingleAsync<(int Count, decimal SumHt, decimal SumTtc)>(
            new CommandDefinition(
                $"SELECT count(*)::int, coalesce(sum(inv.total_ht), 0), coalesce(sum(inv.total_ttc), 0){SummaryFrom}{where}",
                parameters,
                cancellationToken: cancellationToken));

        var items = await _connection.QueryAsync<InvoiceSummaryResponse>(
            new CommandDefinition(
                $"""
                {SummaryColumns}{SummaryFrom}{where}

                ORDER BY inv.issued_at DESC, inv.id DESC
                LIMIT @Limit OFFSET @Offset
                """,
                parameters,
                cancellationToken: cancellationToken));

        return new InvoicesPageResponse
        {
            Items = items.ToList(),
            Total = totals.Count,
            Page = page,
            PageSize = pageSize,
            SumHt = totals.SumHt,
            SumTtc = totals.SumTtc,
        };
    }

    private DateTime ToUtc(DateOnly localDay) =>
        TimeZoneInfo.ConvertTimeToUtc(localDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified), _tenant.TimeZone);

    /// <summary>Caractères spéciaux de LIKE pris au pied de la lettre.</summary>
    private static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    private const string PaymentsSelect = $"""
        SELECT
            p.paid_at AS {nameof(InvoicePaymentResponse.PaidAt)},
            p.method AS {nameof(InvoicePaymentResponse.Method)},
            p.amount AS {nameof(InvoicePaymentResponse.Amount)}

        FROM payment p

        WHERE p.invoice_id = @Id AND p.status_id = @PaymentSucceeded

        ORDER BY p.paid_at, p.id
        """;

    private const string DocumentsSelect = $"""
        SELECT
            d.version AS {nameof(InvoiceDocumentResponse.Version)},
            d.created_at AS {nameof(InvoiceDocumentResponse.CreatedAt)}

        FROM invoice_document d

        WHERE d.invoice_id = @Id

        ORDER BY d.version DESC
        """;

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

        invoice.Payments = (await _connection.QueryAsync<InvoicePaymentResponse>(
            new CommandDefinition(PaymentsSelect, new { Id = id, PaymentSucceeded = (int)PaymentStatus.Succeeded }, cancellationToken: cancellationToken))).ToList();
        invoice.AmountPaid = invoice.Payments.Sum(p => p.Amount);
        invoice.Remaining = Math.Max(0, invoice.TotalTtc - invoice.AmountPaid);

        invoice.Documents = (await _connection.QueryAsync<InvoiceDocumentResponse>(
            new CommandDefinition(DocumentsSelect, new { Id = id }, cancellationToken: cancellationToken))).ToList();

        return invoice;
    }
}
