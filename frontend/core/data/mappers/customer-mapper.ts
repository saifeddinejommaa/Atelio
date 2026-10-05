import type { Customer } from "../../domain";
import type { CustomerDto } from "../dto/customer-dto";

export function toCustomerEntity(dto: CustomerDto): Customer {
  return {
    id: dto.id,
    firstName: dto.firstName,
    lastName: dto.lastName,
    email: dto.email,
    phone: dto.phone,
    isActive: dto.isActive,
  };
}
