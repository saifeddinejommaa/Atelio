import type { Customer } from "../entities/customer";
import type { CustomerRepository } from "../repositories/customer-repository";

/** Client actif correspondant à l'e-mail (ex. celui du compte connecté). */
export class GetCustomerByEmail {
  constructor(private readonly repository: CustomerRepository) {}

  async execute(email: string): Promise<Customer | null> {
    const customer = await this.repository.getByEmail(email.trim().toLowerCase());
    return customer?.isActive ? customer : null;
  }
}
