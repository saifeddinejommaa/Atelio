import type { Customer } from "../entities/customer";
import { ValidationError } from "../errors";
import type { ICustomerRepository } from "../repositories/ICustomerRepository";
import { isValidPhone } from "../rules/phone";

/** Clients correspondant à un numéro de téléphone (liste vide si aucun). */
export class FindCustomersByPhone {
  constructor(private readonly repository: ICustomerRepository) {}

  async execute(phone: string): Promise<Customer[]> {
    if (!isValidPhone(phone)) throw new ValidationError("Numéro de téléphone invalide.");
    return this.repository.findByPhone(phone.trim());
  }
}
