import type { CapacityPeriod, DayAvailability, Garage, Mechanic, SlotCheck } from "../../domain";
import type { CapacityPeriodDto, DayAvailabilityDto, GarageDto, MechanicDto, SlotCheckDto } from "../dto/GarageDto";

export function toGarageEntity(dto: GarageDto): Garage {
  return {
    id: dto.id,
    name: dto.name,
    addressLine: dto.addressLine,
    postalCode: dto.postalCode,
    city: dto.city,
    country: dto.country,
    latitude: dto.latitude,
    longitude: dto.longitude,
    phone: dto.phone,
    email: dto.email,
    openingTime: dto.openingTime,
    closingTime: dto.closingTime,
    openDays: dto.openDays ?? [],
    serviceCodes: dto.serviceCodes ?? [],
  };
}

export function toDayAvailability(dto: DayAvailabilityDto): DayAvailability {
  return { date: dto.date, slots: dto.slots.map((s) => ({ time: s.time, available: s.available })) };
}

/** L'API renvoie des dates UTC, parfois sans le suffixe "Z". */
function utc(date: string): string {
  return /(Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
}

export function toCapacityPeriod(dto: CapacityPeriodDto): CapacityPeriod {
  return { start: utc(dto.start), end: utc(dto.end), free: dto.free, total: dto.total };
}

export function toSlotCheck(dto: SlotCheckDto): SlotCheck {
  return {
    available: dto.available,
    message: dto.message,
    durationMinutes: dto.durationMinutes,
    estimatedEndAt: dto.estimatedEndAt ? utc(dto.estimatedEndAt) : null,
    warning: dto.warning,
  };
}

export function toMechanic(dto: MechanicDto): Mechanic {
  return { id: dto.id, firstName: dto.firstName, lastName: dto.lastName };
}
