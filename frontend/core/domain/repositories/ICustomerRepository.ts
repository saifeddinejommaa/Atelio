import type { Customer, CustomerFilter, CustomerInvoice, CustomerSummary, NewCustomer } from "../entities/customer";
import type { Page } from "../entities/page";

export interface ICustomerRepository {
  /** Clients par nom, page par page (back-office). */
  getCustomers(filter: CustomerFilter): Promise<Page<CustomerSummary>>;
  getById(id: number): Promise<Customer | null>;
  getByEmail(email: string): Promise<Customer | null>;
  /** Clients dont le numéro correspond, quel que soit le format (plusieurs possibles : famille). */
  findByPhone(phone: string): Promise<Customer[]>;
  /** Factures du client, des plus récentes aux plus anciennes. */
  getInvoices(customerId: number): Promise<CustomerInvoice[]>;
  /** Crée le client et renvoie son identifiant. */
  create(customer: NewCustomer): Promise<number>;
  update(id: number, customer: NewCustomer): Promise<void>;
}
