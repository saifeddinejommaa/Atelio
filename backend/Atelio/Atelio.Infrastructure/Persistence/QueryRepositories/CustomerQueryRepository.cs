using Atelio.Application.Common;
using Atelio.Application.Features.Customers.Repositories;
using Atelio.Application.Features.Customers.Requests;
using Atelio.Application.Features.Customers.Responses;
using Dapper;
using System.Data;
using System.Text;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class CustomerQueryRepository : ICustomerQueryRepository
{
    private readonly IDbConnection _connection;

    // Liste : véhicules, dernière intervention et factures agrégés par client (filtres et pagination ajoutés à la suite).
    private const string SummaryColumns = $"""
        SELECT
            c.id AS {nameof(CustomerSummaryResponse.Id)},
            c.first_name AS {nameof(CustomerSummaryResponse.FirstName)},
            c.last_name AS {nameof(CustomerSummaryResponse.LastName)},
            c.email AS {nameof(CustomerSummaryResponse.Email)},
            c.phone AS {nameof(CustomerSummaryResponse.Phone)},
            c.is_active AS {nameof(CustomerSummaryResponse.IsActive)},
            (SELECT string_agg(v.plate, ', ' ORDER BY v.plate) FROM vehicle v
                WHERE v.customer_id = c.id AND v.is_active) AS {nameof(CustomerSummaryResponse.Plates)},
            (SELECT max(i.started_at) FROM intervention i
                WHERE i.customer_id = c.id) AS {nameof(CustomerSummaryResponse.LastVisitAt)},
            (SELECT count(*) FROM invoice inv INNER JOIN intervention i ON i.id = inv.intervention_id
                WHERE i.customer_id = c.id)::int AS {nameof(CustomerSummaryResponse.InvoiceCount)}
        """;

    private const string SummaryFrom = """

        FROM customer c
        """;

    private const string InvoicesSelect = $"""
        SELECT
            inv.id AS {nameof(CustomerInvoiceResponse.Id)},
            inv.number AS {nameof(CustomerInvoiceResponse.Number)},
            inv.issued_at AS {nameof(CustomerInvoiceResponse.IssuedAt)},
            inv.total_ht AS {nameof(CustomerInvoiceResponse.TotalHt)},
            inv.total_ttc AS {nameof(CustomerInvoiceResponse.TotalTtc)},
            inv.status_id AS {nameof(CustomerInvoiceResponse.StatusId)},
            ins.label AS {nameof(CustomerInvoiceResponse.StatusLabel)},
            i.id AS {nameof(CustomerInvoiceResponse.InterventionId)},
            v.plate AS {nameof(CustomerInvoiceResponse.VehiclePlate)},
            g.name AS {nameof(CustomerInvoiceResponse.GarageName)}

        FROM invoice inv
        INNER JOIN intervention i ON i.id = inv.intervention_id
        INNER JOIN vehicle v ON v.id = i.vehicle_id
        INNER JOIN garage g ON g.id = i.garage_id
        INNER JOIN invoice_status ins ON ins.id = inv.status_id

        WHERE i.customer_id = @CustomerId

        ORDER BY inv.issued_at DESC, inv.id DESC
        """;

    public CustomerQueryRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<PagedResponse<CustomerSummaryResponse>> GetCustomersAsync(
        CustomersRequestFilter filter,
        CancellationToken cancellationToken = default)
    {
        var where = new StringBuilder("""

            WHERE 1 = 1
            """);
        var parameters = new DynamicParameters();

        // Une seule zone de recherche : nom (dans les deux sens), e-mail, téléphone (chiffres) ou immatriculation.
        var search = filter.Search?.Trim() ?? string.Empty;
        if (search.Length > 0)
        {
            where.Append("""

                AND (
                    (c.first_name || ' ' || c.last_name) ILIKE @Text ESCAPE '\'
                    OR (c.last_name || ' ' || c.first_name) ILIKE @Text ESCAPE '\'
                    OR c.email ILIKE @Text ESCAPE '\'
                    OR EXISTS (SELECT 1 FROM vehicle v WHERE v.customer_id = c.id
                        AND replace(replace(upper(v.plate), '-', ''), ' ', '') LIKE @Plate ESCAPE '\')
                """);
            parameters.Add("Text", $"%{EscapeLike(search)}%");
            parameters.Add("Plate", $"%{EscapeLike(search.ToUpperInvariant().Replace("-", "").Replace(" ", ""))}%");

            // Téléphone : à partir de 3 chiffres, quel que soit le format saisi (06 12…, +33 6…).
            var digits = new string(search.Where(char.IsDigit).ToArray());
            if (digits.Length >= 3)
            {
                where.Append(" OR regexp_replace(coalesce(c.phone, ''), '\\D', '', 'g') LIKE @Digits");
                parameters.Add("Digits", $"%{digits}%");
            }

            where.Append(')');
        }

        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, CustomersRequestFilter.MaxPageSize);
        parameters.Add("Limit", pageSize);
        parameters.Add("Offset", (page - 1) * pageSize);

        var total = await _connection.ExecuteScalarAsync<int>(
            new CommandDefinition($"SELECT count(*){SummaryFrom}{where}", parameters, cancellationToken: cancellationToken));

        var items = await _connection.QueryAsync<CustomerSummaryResponse>(
            new CommandDefinition(
                $"""
                {SummaryColumns}{SummaryFrom}{where}

                ORDER BY lower(c.last_name), lower(c.first_name), c.id
                LIMIT @Limit OFFSET @Offset
                """,
                parameters,
                cancellationToken: cancellationToken));

        return new PagedResponse<CustomerSummaryResponse>
        {
            Items = items.ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<IReadOnlyList<CustomerInvoiceResponse>> GetInvoicesAsync(long customerId, CancellationToken cancellationToken = default) =>
        (await _connection.QueryAsync<CustomerInvoiceResponse>(
            new CommandDefinition(InvoicesSelect, new { CustomerId = customerId }, cancellationToken: cancellationToken))).ToList();

    /// <summary>Caractères spéciaux de LIKE pris au pied de la lettre.</summary>
    private static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
}
