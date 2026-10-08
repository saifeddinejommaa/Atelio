using Atelio.Application.Common;
using Atelio.Application.Features.Interventions.Repositories;
using Atelio.Application.Features.Interventions.Requests;
using Atelio.Application.Features.Interventions.Responses;
using Atelio.Domain.Enums;
using Dapper;
using System.Data;
using System.Text;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class InterventionQueryRepository : IInterventionQueryRepository
{
    private readonly IDbConnection _connection;
    private readonly ITenantContext _tenant;

    // Intervention avec client, véhicule, garage et rendez-vous d'origine.
    private const string InterventionSelect = $"""
        SELECT
            i.id AS {nameof(InterventionResponse.Id)},
            i.status_id AS {nameof(InterventionResponse.StatusId)},
            ist.label AS {nameof(InterventionResponse.StatusLabel)},
            inv.id AS {nameof(InterventionResponse.InvoiceId)},
            inv.number AS {nameof(InterventionResponse.InvoiceNumber)},
            inv.total_ttc AS {nameof(InterventionResponse.InvoiceTotalTtc)},
            pay.method AS {nameof(InterventionResponse.PaymentMethod)},
            pay.paid_at AS {nameof(InterventionResponse.PaidAt)},
            i.started_at AS {nameof(InterventionResponse.StartedAt)},
            i.finished_at AS {nameof(InterventionResponse.FinishedAt)},
            a.estimated_end_at AS {nameof(InterventionResponse.EstimatedEndAt)},
            i.mileage AS {nameof(InterventionResponse.Mileage)},
            i.notes AS {nameof(InterventionResponse.Notes)},
            a.id AS {nameof(InterventionResponse.AppointmentId)},
            a.reference AS {nameof(InterventionResponse.AppointmentReference)},
            a.customer_notes AS {nameof(InterventionResponse.CustomerNotes)},
            g.id AS {nameof(InterventionResponse.GarageId)},
            g.name AS {nameof(InterventionResponse.GarageName)},
            c.id AS {nameof(InterventionResponse.CustomerId)},
            c.first_name AS {nameof(InterventionResponse.CustomerFirstName)},
            c.last_name AS {nameof(InterventionResponse.CustomerLastName)},
            c.phone AS {nameof(InterventionResponse.CustomerPhone)},
            c.email AS {nameof(InterventionResponse.CustomerEmail)},
            e.id AS {nameof(InterventionResponse.EmployeeId)},
            e.first_name AS {nameof(InterventionResponse.EmployeeFirstName)},
            e.last_name AS {nameof(InterventionResponse.EmployeeLastName)},
            v.id AS {nameof(InterventionResponse.VehicleId)},
            v.plate AS {nameof(InterventionResponse.VehiclePlate)},
            v.make AS {nameof(InterventionResponse.VehicleMake)},
            v.model AS {nameof(InterventionResponse.VehicleModel)}

        FROM intervention i
        INNER JOIN customer c ON c.id = i.customer_id
        INNER JOIN vehicle v ON v.id = i.vehicle_id
        INNER JOIN garage g ON g.id = i.garage_id
        INNER JOIN intervention_status ist ON ist.id = i.status_id
        LEFT JOIN appointment a ON a.id = i.appointment_id
        LEFT JOIN employee e ON e.id = i.employee_id
        LEFT JOIN invoice inv ON inv.intervention_id = i.id
        LEFT JOIN LATERAL (
            SELECT p.method, p.paid_at FROM payment p
            WHERE p.invoice_id = inv.id AND p.status_id = @PaymentSucceeded
            ORDER BY p.paid_at DESC
            LIMIT 1
        ) pay ON TRUE
        """;

    private const string ServicesSelect = $"""
        SELECT
            s.id AS {nameof(InterventionServiceResponse.ServiceId)},
            s.code AS {nameof(InterventionServiceResponse.Code)},
            s.name AS {nameof(InterventionServiceResponse.Name)},
            COALESCE(ins.labour_minutes, s.duration_minutes) AS {nameof(InterventionServiceResponse.DurationMinutes)},
            c.id AS {nameof(InterventionServiceResponse.CategoryId)},
            c.name AS {nameof(InterventionServiceResponse.CategoryName)},
            c.hourly_rate AS {nameof(InterventionServiceResponse.HourlyRate)},
            s.uncertain_duration AS {nameof(InterventionServiceResponse.UncertainDuration)},
            ins.quantity AS {nameof(InterventionServiceResponse.Quantity)},
            ins.unit_price AS {nameof(InterventionServiceResponse.UnitPrice)}

        FROM intervention_service ins
        INNER JOIN service s ON s.id = ins.service_id
        LEFT JOIN service_category c ON c.id = COALESCE(ins.category_id, s.category_id)

        WHERE ins.intervention_id = @Id

        ORDER BY s.name
        """;

    private const string SparePartsSelect = $"""
        SELECT
            p.id AS {nameof(SparePartResponse.Id)},
            p.reference AS {nameof(SparePartResponse.Reference)},
            p.name AS {nameof(SparePartResponse.Name)},
            p.quantity AS {nameof(SparePartResponse.Quantity)},
            p.unit_price AS {nameof(SparePartResponse.UnitPrice)}

        FROM spare_part p

        WHERE p.intervention_id = @Id

        ORDER BY p.created_at, p.id
        """;

    // Kits des prestations de l'intervention.
    private const string KitSelect = $"""
        SELECT
            s.name AS {nameof(KitItemResponse.ServiceName)},
            sp.name AS {nameof(KitItemResponse.Name)}

        FROM intervention_service ins
        INNER JOIN service s ON s.id = ins.service_id
        INNER JOIN service_part sp ON sp.service_id = ins.service_id

        WHERE ins.intervention_id = @Id

        ORDER BY s.name, sp.sort_order, sp.name
        """;

    // Liste : référence du rendez-vous, client, véhicule, statut (filtres et pagination ajoutés à la suite).
    private const string SummaryColumns = $"""
        SELECT
            i.id AS {nameof(InterventionSummaryResponse.Id)},
            a.reference AS {nameof(InterventionSummaryResponse.Reference)},
            i.status_id AS {nameof(InterventionSummaryResponse.StatusId)},
            ist.label AS {nameof(InterventionSummaryResponse.StatusLabel)},
            i.started_at AS {nameof(InterventionSummaryResponse.StartedAt)},
            c.first_name AS {nameof(InterventionSummaryResponse.CustomerFirstName)},
            c.last_name AS {nameof(InterventionSummaryResponse.CustomerLastName)},
            v.plate AS {nameof(InterventionSummaryResponse.VehiclePlate)}
        """;

    private const string SummaryFrom = """

        FROM intervention i
        INNER JOIN customer c ON c.id = i.customer_id
        INNER JOIN vehicle v ON v.id = i.vehicle_id
        INNER JOIN intervention_status ist ON ist.id = i.status_id
        LEFT JOIN appointment a ON a.id = i.appointment_id
        """;

    public InterventionQueryRepository(IDbConnection connection, ITenantContext tenant)
    {
        _connection = connection;
        _tenant = tenant;
    }

    public async Task<PagedResponse<InterventionSummaryResponse>> GetInterventionsAsync(
        InterventionsRequestFilter filter,
        CancellationToken cancellationToken = default)
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

        if (filter.StatusId.HasValue)
        {
            where.Append(" AND i.status_id = @StatusId");
            parameters.Add("StatusId", filter.StatusId.Value);
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
        var plate = Normalize(filter.Plate);
        if (plate.Length > 0)
        {
            where.Append(" AND replace(replace(upper(v.plate), '-', ''), ' ', '') LIKE @Plate ESCAPE '\\'");
            parameters.Add("Plate", $"%{EscapeLike(plate)}%");
        }

        // Jour de début, heure locale du garage : [jour 00:00, lendemain 00:00[ en UTC.
        if (filter.Date is DateOnly day)
        {
            where.Append(" AND i.started_at >= @FromUtc AND i.started_at < @ToUtc");
            parameters.Add("FromUtc", ToUtc(day));
            parameters.Add("ToUtc", ToUtc(day.AddDays(1)));
        }

        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, InterventionsRequestFilter.MaxPageSize);
        parameters.Add("Limit", pageSize);
        parameters.Add("Offset", (page - 1) * pageSize);

        var total = await _connection.ExecuteScalarAsync<int>(
            new CommandDefinition($"SELECT count(*){SummaryFrom}{where}", parameters, cancellationToken: cancellationToken));

        var items = await _connection.QueryAsync<InterventionSummaryResponse>(
            new CommandDefinition(
                $"""
                {SummaryColumns}{SummaryFrom}{where}

                ORDER BY i.started_at DESC NULLS LAST, i.id DESC
                LIMIT @Limit OFFSET @Offset
                """,
                parameters,
                cancellationToken: cancellationToken));

        return new PagedResponse<InterventionSummaryResponse>
        {
            Items = items.ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    private DateTime ToUtc(DateOnly localDay) =>
        TimeZoneInfo.ConvertTimeToUtc(localDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified), _tenant.TimeZone);

    /// <summary>Immatriculation sans tirets ni espaces, en majuscules.</summary>
    private static string Normalize(string? plate) =>
        (plate ?? string.Empty).ToUpperInvariant().Replace("-", "").Replace(" ", "");

    /// <summary>Caractères spéciaux de LIKE pris au pied de la lettre.</summary>
    private static string EscapeLike(string value) =>
        value.Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");

    public async Task<InterventionResponse?> GetByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var intervention = await _connection.QuerySingleOrDefaultAsync<InterventionResponse>(
            new CommandDefinition($"{InterventionSelect}\nWHERE i.id = @Id", new { Id = id, PaymentSucceeded = (int)PaymentStatus.Succeeded }, cancellationToken: cancellationToken));

        if (intervention is null)
        {
            return null;
        }

        intervention.Services = (await _connection.QueryAsync<InterventionServiceResponse>(
            new CommandDefinition(ServicesSelect, new { Id = id }, cancellationToken: cancellationToken))).ToList();

        intervention.SpareParts = (await _connection.QueryAsync<SparePartResponse>(
            new CommandDefinition(SparePartsSelect, new { Id = id }, cancellationToken: cancellationToken))).ToList();

        intervention.Kit = (await _connection.QueryAsync<KitItemResponse>(
            new CommandDefinition(KitSelect, new { Id = id }, cancellationToken: cancellationToken))).ToList();


        return intervention;
    }
}
