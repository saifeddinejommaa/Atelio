using Atelio.Application.Features.Appointments.Repositories;
using Atelio.Application.Features.Appointments.Requests;
using Atelio.Application.Features.Appointments.Responses;
using Dapper;
using System.Data;
using System.Text;

namespace Atelio.Infrastructure.Persistence.QueryRepositories;

public class AppointmentQueryRepository : IAppointmentQueryRepository
{
    private readonly IDbConnection _connection;

    // Rendez-vous avec garage, véhicule et services demandés.
    private const string AppointmentSelect = $"""
        SELECT
            a.id AS {nameof(AppointmentResponse.Id)},
            a.reference AS {nameof(AppointmentResponse.Reference)},
            a.customer_id AS {nameof(AppointmentResponse.CustomerId)},
            a.status AS {nameof(AppointmentResponse.Status)},
            a.scheduled_at AS {nameof(AppointmentResponse.ScheduledAt)},
            a.estimated_end_at AS {nameof(AppointmentResponse.EstimatedEndAt)},
            a.customer_notes AS {nameof(AppointmentResponse.CustomerNotes)},
            g.id AS {nameof(AppointmentResponse.GarageId)},
            g.name AS {nameof(AppointmentResponse.GarageName)},
            g.address_line || ', ' || g.postal_code || ' ' || g.city AS {nameof(AppointmentResponse.GarageAddress)},
            v.id AS {nameof(AppointmentResponse.VehicleId)},
            v.plate AS {nameof(AppointmentResponse.VehiclePlate)},
            COALESCE(srv.codes, ARRAY[]::text[]) AS {nameof(AppointmentResponse.ServiceCodes)},
            COALESCE(srv.names, ARRAY[]::text[]) AS {nameof(AppointmentResponse.ServiceNames)}

        FROM appointment a
        INNER JOIN garage g ON g.id = a.garage_id
        INNER JOIN vehicle v ON v.id = a.vehicle_id

        LEFT JOIN LATERAL (
            SELECT
                array_agg(s.code ORDER BY s.name) AS codes,
                array_agg(s.name ORDER BY s.name) AS names
            FROM appointment_service aps
            INNER JOIN service s ON s.id = aps.service_id
            WHERE aps.appointment_id = a.id
        ) srv ON TRUE
        """;

    public AppointmentQueryRepository(IDbConnection connection)
    {
        _connection = connection;
    }

    public async Task<IReadOnlyList<AppointmentResponse>> GetAppointmentsAsync(
        AppointmentsRequestFilter filter,
        CancellationToken cancellationToken = default)
    {
        var sql = new StringBuilder(AppointmentSelect);
        var parameters = new DynamicParameters();

        sql.Append("""

            WHERE 1 = 1
            """);

        if (filter.CustomerId.HasValue)
        {
            sql.Append(" AND a.customer_id = @CustomerId");
            parameters.Add("CustomerId", filter.CustomerId.Value);
        }

        if (filter.GarageId.HasValue)
        {
            sql.Append(" AND a.garage_id = @GarageId");
            parameters.Add("GarageId", filter.GarageId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            sql.Append(" AND a.status = @Status");
            parameters.Add("Status", filter.Status.Trim().ToLower());
        }

        if (filter.UpcomingOnly)
        {
            sql.Append(" AND a.scheduled_at >= now()");
        }

        sql.Append("""

            ORDER BY a.scheduled_at DESC
            """);

        return (await _connection.QueryAsync<AppointmentResponse>(
            new CommandDefinition(sql.ToString(), parameters, cancellationToken: cancellationToken))).ToList();
    }

    public async Task<AppointmentResponse?> GetByReferenceAsync(string reference, CancellationToken cancellationToken = default)
    {
        const string sql = $"""
            {AppointmentSelect}
            WHERE a.reference = @Reference
            """;

        return await _connection.QuerySingleOrDefaultAsync<AppointmentResponse>(
            new CommandDefinition(sql, new { Reference = reference.Trim().ToUpper() }, cancellationToken: cancellationToken));
    }
}
