import type { Customer, CustomerFilter, CustomerInvoice, CustomerSummary } from "../entities/customer";
import type { Page } from "../entities/page";
import type { ICustomerRepository } from "../repositories/ICustomerRepository";

/** Clients du back-office, recherchés par nom, e-mail, téléphone ou immatriculation. */
export class GetCustomers {
  constructor(private readonly repository: ICustomerRepository) {}

  execute(filter: CustomerFilter = {}): Promise<Page<CustomerSummary>> {
    return this.repository.getCustomers({ ...filter, search: filter.search?.trim() || undefined });
  }
}

export class GetCustomer {
  constructor(private readonly repository: ICustomerRepository) {}

  execute(id: number): Promise<Customer | null> {
    return this.repository.getById(id);
  }
}

export class GetCustomerInvoices {
  constructor(private readonly repository: ICustomerRepository) {}

  execute(customerId: number): Promise<CustomerInvoice[]> {
    return this.repository.getInvoices(customerId);
  }
}
