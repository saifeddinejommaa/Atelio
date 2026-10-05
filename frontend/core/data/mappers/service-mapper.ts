import type { Service } from "../../domain";
import type { ServiceDto } from "../dto/service-dto";

export function toServiceEntity(dto: ServiceDto): Service {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    durationMinutes: dto.durationMinutes,
    uncertainDuration: dto.uncertainDuration ?? false,
    price: dto.price,
    discountPercent: dto.discountPercent,
    finalPrice: dto.finalPrice,
  };
}
