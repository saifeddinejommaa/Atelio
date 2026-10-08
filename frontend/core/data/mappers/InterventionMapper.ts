import type { Intervention, InterventionStatus, InterventionSummary, PaymentMethod, Status } from "../../domain";
import type { InterventionDto, InterventionSummaryDto } from "../dto/InterventionDto";

/** Ids fixes, partagés avec le backend : la conversion vers le type d'id est sûre. */
function toStatus(dto: { statusId: number; statusLabel: string }): Status<InterventionStatus> {
  return { id: dto.statusId as InterventionStatus, label: dto.statusLabel };
}

/** L'API renvoie des dates UTC, parfois sans le suffixe "Z". */
function utc(date: string | null): string | null {
  if (!date) return null;
  return /(Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
}

export function toInterventionEntity(dto: InterventionDto): Intervention {
  return {
    id: dto.id,
    status: toStatus(dto),
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
    status: toStatus(dto),
    startedAt: utc(dto.startedAt),
    customerFirstName: dto.customerFirstName,
    customerLastName: dto.customerLastName,
    vehiclePlate: dto.vehiclePlate,
  };
}
