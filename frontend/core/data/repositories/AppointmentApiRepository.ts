import type {
  AbandonStatus,
  Appointment,
  AppointmentFilter,
  IAppointmentRepository,
  AppointmentRequest,
  BookedAppointment,
  StartCheck,
} from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";
import type { AppointmentCreatedDto, AppointmentDto, StartCheckDto } from "../dto/AppointmentDto";
import { toAppointmentEntity, toBookedAppointment, toCreateAppointmentDto, toStartCheck } from "../mappers/AppointmentMapper";

export class AppointmentApiRepository implements IAppointmentRepository {
  constructor(private readonly api: ApiClient) {}

  async getAppointments(filter: AppointmentFilter): Promise<Appointment[]> {
    const appointments = await this.api.get<AppointmentDto[]>("/appointments", {
      customerId: filter.customerId,
      garageId: filter.garageId,
      statusId: filter.statusId,
      upcomingOnly: filter.upcomingOnly,
      from: filter.from,
      to: filter.to,
    });
    return (appointments ?? []).map(toAppointmentEntity);
  }

  async getByReference(reference: string): Promise<Appointment | null> {
    const appointment = await this.api.get<AppointmentDto>(`/appointments/${encodeURIComponent(reference)}`);
    return appointment && toAppointmentEntity(appointment);
  }

  async book(request: AppointmentRequest): Promise<BookedAppointment> {
    const created = await this.api.post<AppointmentCreatedDto>("/appointments", toCreateAppointmentDto(request));
    if (!created) throw new ApiError(500, "L'API n'a pas renvoyé le rendez-vous créé.");
    return toBookedAppointment(created);
  }

  async cancel(reference: string, customerId: number): Promise<void> {
    await this.api.post(`/appointments/${encodeURIComponent(reference)}/cancel`, { customerId });
  }

  async reschedule(reference: string, scheduledAt: string): Promise<void> {
    await this.api.post(`/appointments/${encodeURIComponent(reference)}/reschedule`, { scheduledAt });
  }

  async abandon(reference: string, status: AbandonStatus): Promise<void> {
    await this.api.post(`/appointments/${encodeURIComponent(reference)}/abandon`, { statusId: status });
  }

  async start(reference: string, startAt?: string): Promise<number> {
    const result = await this.api.post<{ interventionId: number }>(`/appointments/${encodeURIComponent(reference)}/start`, { startAt });
    if (!result) throw new ApiError(500, "L'API n'a pas renvoyé l'intervention créée.");
    return result.interventionId;
  }

  async checkStart(reference: string, startAt?: string): Promise<StartCheck> {
    const result = await this.api.get<StartCheckDto>(`/appointments/${encodeURIComponent(reference)}/start-check`, { startAt });
    if (!result) throw new ApiError(404, `Rendez-vous ${reference} introuvable.`);
    return toStartCheck(result);
  }
}
