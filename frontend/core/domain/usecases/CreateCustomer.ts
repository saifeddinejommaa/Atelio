import type { NewCustomer } from "../entities/customer";
import { ValidationError } from "../errors";
import type { ICustomerRepository } from "../repositories/ICustomerRepository";
import { isValidPhone } from "../rules/phone";

/** Vérifie une fiche client saisie et la nettoie (e-mail facultatif). */
function checkCustomer(customer: NewCustomer): NewCustomer {
  const firstName = customer.firstName.trim();
  const lastName = customer.lastName.trim();
  const email = customer.email?.trim() || undefined;

  if (!firstName) throw new ValidationError("Le prénom est obligatoire.");
  if (!lastName) throw new ValidationError("Le nom est obligatoire.");
  if (!isValidPhone(customer.phone)) throw new ValidationError("Numéro de téléphone invalide.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError("Adresse e-mail invalide.");

  return { firstName, lastName, phone: customer.phone.trim(), email };
}

/** Crée une fiche client et renvoie son identifiant. */
export class CreateCustomer {
  constructor(private readonly repository: ICustomerRepository) {}

  async execute(customer: NewCustomer): Promise<number> {
    return this.repository.create(checkCustomer(customer));
  }
}

/** Modifie les coordonnées d'un client (l'API vérifie que l'e-mail n'est pas déjà pris). */
export class UpdateCustomer {
  constructor(private readonly repository: ICustomerRepository) {}

  async execute(id: number, customer: NewCustomer): Promise<void> {
    return this.repository.update(id, checkCustomer(customer));
  }
}
