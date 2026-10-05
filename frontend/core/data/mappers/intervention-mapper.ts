import { interventionStages, type Intervention, type InterventionStage, type InterventionStatus, type InterventionSummary, type PaymentMethod } from "../../domain";
import type { InterventionDto, InterventionSummaryDto } from "../dto/intervention-dto";

const statuses: InterventionStatus[] = ["planned", "in_progress", "done", "cancelled"];

/** L'API renvoie des dates UTC, parfois sans le suffixe "Z". */
function utc(date: string | null): string | null {
  if (!date) return null;
  return /(Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
}

export function toInterventionEntity(dto: InterventionDto): Intervention {
  const status = dto.status.toLowerCase() as InterventionStatus;
  return {
    id: dto.id,
    status: statuses.includes(status) ? status : "planned",
    stage: toStage(dto.stage),
    invoiceId: dto.invoiceId ?? null,
    invoiceNumber: dto.invoiceNumber ?? null,
    invoiceTotalTtc: dto.invoiceTotalTtc ?? null,
    paymentMethod: (dto.paymentMethod?.toLowerCase() as PaymentMethod | undefined) ?? null,
    paidAt: utc(dto.paidAt ?? null),
    startedAt: utc(dto.startedAt),
    finishedAt: utc(dto.finishedAt),
    estimatedEndAt: utc(dto.estimatedEndAt),
    mileage: dto.mileage,
    notes: dto.notes,
    appointmentId: dto.appointmentId,
    appointmentReference: dto.appointmentReference,
    customerNotes: dto.customerNotes,
    garageId: dto.garageId,
    garageName: dto.garageName,
    customerId: dto.customerId,
    customerFirstName: dto.customerFirstName,
    customerLastName: dto.customerLastName,
    customerPhone: dto.customerPhone,
    customerEmail: dto.customerEmail,
    employeeId: dto.employeeId,
    employeeFirstName: dto.employeeFirstName,
    employeeLastName: dto.employeeLastName,
    vehicleId: dto.vehicleId,
    vehiclePlate: dto.vehiclePlate,
    vehicleMake: dto.vehicleMake,
    vehicleModel: dto.vehicleModel,
    services: (dto.services ?? []).map((s) => ({
      serviceId: s.serviceId,
      code: s.code,
      name: s.name,
      durationMinutes: s.durationMinutes,
      categoryId: s.categoryId,
      categoryName: s.categoryName,
      hourlyRate: s.hourlyRate,
      uncertainDuration: s.uncertainDuration ?? false,
      quantity: s.quantity,
      unitPrice: s.unitPrice,
    })),
    spareParts: (dto.spareParts ?? []).map((p) => ({
      id: p.id,
      reference: p.reference,
      name: p.name,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
    })),
    kit: (dto.kit ?? []).map((k) => ({ serviceName: k.serviceName, name: k.name })),
  };
}

export function toInterventionSummary(dto: InterventionSummaryDto): InterventionSummary {
  return {
    id: dto.id,
    reference: dto.reference,
    stage: toStage(dto.stage),
    startedAt: utc(dto.startedAt),
    customerFirstName: dto.customerFirstName,
    customerLastName: dto.customerLastName,
    vehiclePlate: dto.vehiclePlate,
  };
}

function toStage(stage: string | null | undefined): InterventionStage {
  const value = stage?.toLowerCase() as InterventionStage | undefined;
  return value && interventionStages.includes(value) ? value : "in_progress";
}
