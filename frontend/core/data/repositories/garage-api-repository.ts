import type {
  AvailabilityQuery,
  DayAvailability,
  Garage,
  GarageFilter,
  GarageRepository,
  Mechanic,
  CapacityPeriod,
  SlotCheck,
  SlotCheckQuery,
} from "../../domain";
import type { ApiClient } from "../http/api-client";
import type { CapacityPeriodDto, DayAvailabilityDto, GarageDto, MechanicDto, SlotCheckDto } from "../dto/garage-dto";
import { toCapacityPeriod, toDayAvailability, toGarageEntity, toMechanic, toSlotCheck } from "../mappers/garage-mapper";

export class GarageApiRepository implements GarageRepository {
  constructor(private readonly api: ApiClient) {}

  async getGarages(filter: GarageFilter = {}): Promise<Garage[]> {
    const garages = await this.api.get<GarageDto[]>("/garages", {
      search: filter.search,
      serviceCode: filter.serviceCode,
    });
    return (garages ?? []).map(toGarageEntity);
  }

  async getAvailability(query: AvailabilityQuery): Promise<DayAvailability[]> {
    const days = await this.api.get<DayAvailabilityDto[]>(`/garages/${query.garageId}/availability`, {
      serviceIds: query.serviceIds,
      from: query.from,
      days: query.days,
    });
    return (days ?? []).map(toDayAvailability);
  }

  async getCapacity(garageId: number, from: string, to: string): Promise<CapacityPeriod[]> {
    const periods = await this.api.get<CapacityPeriodDto[]>(`/garages/${garageId}/capacity`, { from, to });
    return (periods ?? []).map(toCapacityPeriod);
  }

  async checkSlot(query: SlotCheckQuery): Promise<SlotCheck> {
    const result = await this.api.get<SlotCheckDto>(`/garages/${query.garageId}/slot-check`, {
      scheduledAt: query.scheduledAt,
      serviceIds: query.serviceIds,
      excludeAppointment: query.excludeAppointment,
    });
    return result ? toSlotCheck(result) : { available: false, message: "Garage introuvable.", durationMinutes: 0, estimatedEndAt: null, warning: null };
  }

  async getMechanics(garageId: number): Promise<Mechanic[]> {
    const mechanics = await this.api.get<MechanicDto[]>(`/garages/${garageId}/mechanics`);
    return (mechanics ?? []).map(toMechanic);
  }
}
