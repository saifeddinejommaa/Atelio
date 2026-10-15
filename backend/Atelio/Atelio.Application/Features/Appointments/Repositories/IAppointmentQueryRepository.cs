using Atelio.Application.Features.Appointments.Requests;
using Atelio.Application.Features.Appointments.Responses;

namespace Atelio.Application.Features.Appointments.Repositories;

public interface IAppointmentQueryRepository
{
    Task<IReadOnlyList<AppointmentResponse>> GetAppointmentsAsync(
        AppointmentsRequestFilter filter,
        CancellationToken cancellationToken = default);

    Task<AppointmentResponse?> GetByReferenceAsync(
        string reference,
        CancellationToken cancellationToken = default);
}
