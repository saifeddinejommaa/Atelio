import type {
  Appointment,
  AppointmentRequest,
  AppointmentStatus,
  BookedAppointment,
  InterventionStatus,
  StartCheck,
} from "../../domain";
import type { AppointmentCreatedDto, AppointmentDto, CreateAppointmentDto, StartCheckDto } from "../dto/AppointmentDto";

/** L'API renvoie des dates UTC, parfois sans le suffixe "Z". */
function utc(date: string): string {
  return /(Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
}

export function toAppointmentEntity(dto: AppointmentDto): Appointment {
  return {
    id: dto.id,
    reference: dto.reference,
    customerId: dto.customerId,
    customerFirstName: dto.customerFirstName,
    customerLastName: dto.customerLastName,
    customerPhone: dto.customerPhone,
    customerEmail: dto.customerEmail,
    // Ids fixes, partagés avec le backend : la conversion vers le type d'id est sûre.
    status: { id: dto.statusId as AppointmentStatus, label: dto.statusLabel },
    scheduledAt: utc(dto.scheduledAt),
    estimatedEndAt: utc(dto.estimatedEndAt),
    customerNotes: dto.customerNotes,
    garageId: dto.garageId,
    garageName: dto.garageName,
    garageAddress: dto.garageAddress,
    vehicleId: dto.vehicleId,
    vehiclePlate: dto.vehiclePlate,
    vehicleMake: dto.vehicleMake,
    vehicleModel: dto.vehicleModel,
    serviceCodes: dto.serviceCodes ?? [],
    serviceNames: dto.serviceNames ?? [],
    interventionId: dto.interventionId ?? null,
    interventionStatus:
      dto.interventionStatusId != null
        ? { id: dto.interventionStatusId as InterventionStatus, label: dto.interventionStatusLabel ?? "" }
        : null,
  };
}

export function toBookedAppointment(dto: AppointmentCreatedDto): BookedAppointment {
  return {
    id: dto.id,
    reference: dto.reference,
    scheduledAt: utc(dto.scheduledAt),
    estimatedEndAt: utc(dto.estimatedEndAt),
  };
}

export function toCreateAppointmentDto(request: AppointmentRequest): CreateAppointmentDto {
  return {
    customerId: request.customerId,
    garageId: request.garageId,
    serviceIds: request.serviceIds,
    scheduledAt: request.scheduledAt,
    vehicleId: request.vehicleId,
    plate: request.plate,
    mileage: request.mileage,
    customerNotes: request.customerNotes,
  };
}

export function toStartCheck(dto: StartCheckDto): StartCheck {
  return {
    possible: dto.possible,
    message: dto.message,
    startAt: utc(dto.startAt),
    estimatedEndAt: utc(dto.estimatedEndAt),
    employeeId: dto.employeeId,
    employeeName: dto.employeeName,
  };
}
