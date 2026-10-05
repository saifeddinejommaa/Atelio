import { interventionStages } from "../../domain";
import type {
  Appointment,
  AppointmentRequest,
  AppointmentStatus,
  BookedAppointment,
  InterventionStage,
  StartCheck,
} from "../../domain";
import type { AppointmentCreatedDto, AppointmentDto, CreateAppointmentDto, StartCheckDto } from "../dto/appointment-dto";

const statuses: AppointmentStatus[] = ["pending", "confirmed", "cancelled", "completed", "no_show"];

/** L'API renvoie des dates UTC, parfois sans le suffixe "Z". */
function utc(date: string): string {
  return /(Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
}

function toStatus(status: string): AppointmentStatus {
  const value = status.toLowerCase() as AppointmentStatus;
  return statuses.includes(value) ? value : "pending";
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
    status: toStatus(dto.status),
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
    interventionStage: toInterventionStage(dto.interventionStage),
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

function toInterventionStage(stage: string | null | undefined): InterventionStage | null {
  const value = stage?.toLowerCase() as InterventionStage | undefined;
  return value && interventionStages.includes(value) ? value : null;
}
