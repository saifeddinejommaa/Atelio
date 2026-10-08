import type { NewCustomer } from "../entities/customer";
import { ValidationError } from "../errors";
import type { ICustomerRepository } from "../repositories/ICustomerRepository";
import { isValidPhone } from "../rules/phone";

/** Crée une fiche client et renvoie son identifiant. */
export class CreateCustomer {
  constructor(private readonly repository: ICustomerRepository) {}

  async execute(customer: NewCustomer): Promise<number> {
    const firstName = customer.firstName.trim();
    const lastName = customer.lastName.trim();
    const email = customer.email?.trim() || undefined;

    if (!firstName) throw new ValidationError("Le prénom est obligatoire.");
    if (!lastName) throw new ValidationError("Le nom est obligatoire.");
    if (!isValidPhone(customer.phone)) throw new ValidationError("Numéro de téléphone invalide.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("Adresse e-mail invalide.");

    return this.repository.create({ firstName, lastName, phone: customer.phone.trim(), email });
  }
}
