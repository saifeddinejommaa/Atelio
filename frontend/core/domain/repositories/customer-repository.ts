import type { Customer, NewCustomer } from "../entities/customer";

export interface CustomerRepository {
  getByEmail(email: string): Promise<Customer | null>;
  /** Clients dont le numéro correspond, quel que soit le format (plusieurs possibles : famille). */
  findByPhone(phone: string): Promise<Customer[]>;
  /** Crée le client et renvoie son identifiant. */
  create(customer: NewCustomer): Promise<number>;
}
