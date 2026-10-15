import type {
  Customer,
  CustomerFilter,
  CustomerInvoice,
  CustomerSummary,
  ICustomerRepository,
  InvoiceStatus,
  NewCustomer,
  Page,
} from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";
import type { CustomerDto, CustomerInvoiceDto, CustomerSummaryDto } from "../dto/CustomerDto";
import type { PageDto } from "../dto/PageDto";
import { toCustomerEntity } from "../mappers/CustomerMapper";

/** L'API renvoie des dates UTC, parfois sans le suffixe "Z". */
function utc(date: string): string {
  return /(Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}Z`;
}

export class CustomerApiRepository implements ICustomerRepository {
  constructor(private readonly api: ApiClient) {}

  async getCustomers(filter: CustomerFilter): Promise<Page<CustomerSummary>> {
    const page = await this.api.get<PageDto<CustomerSummaryDto>>("/customers", {
      search: filter.search,
      page: filter.page,
      pageSize: filter.pageSize,
    });
    return {
      items: (page?.items ?? []).map((c) => ({
        ...toCustomerEntity(c),
        plates: c.plates,
        lastVisitAt: c.lastVisitAt ? utc(c.lastVisitAt) : null,
        invoiceCount: c.invoiceCount,
      })),
      total: page?.total ?? 0,
      page: page?.page ?? 1,
      pageSize: page?.pageSize ?? filter.pageSize ?? 20,
    };
  }

  async getById(id: number): Promise<Customer | null> {
    const customer = await this.api.get<CustomerDto>(`/customers/${id}`);
    return customer && toCustomerEntity(customer);
  }

  async getByEmail(email: string): Promise<Customer | null> {
    const customer = await this.api.get<CustomerDto>("/customers/by-email", { email });
    return customer && toCustomerEntity(customer);
  }

  async findByPhone(phone: string): Promise<Customer[]> {
    const customers = await this.api.get<CustomerDto[]>("/customers/by-phone", { phone });
    return (customers ?? []).map(toCustomerEntity);
  }

  async getInvoices(customerId: number): Promise<CustomerInvoice[]> {
    const invoices = await this.api.get<CustomerInvoiceDto[]>(`/customers/${customerId}/invoices`);
    return (invoices ?? []).map((i) => ({
      id: i.id,
      number: i.number,
      issuedAt: utc(i.issuedAt),
      totalHt: i.totalHt,
      totalTtc: i.totalTtc,
      // Ids fixes, partagés avec le backend : la conversion vers le type d'id est sûre.
      status: { id: i.statusId as InvoiceStatus, label: i.statusLabel },
      interventionId: i.interventionId,
      vehiclePlate: i.vehiclePlate,
      garageName: i.garageName,
    }));
  }

  async create(customer: NewCustomer): Promise<number> {
    const id = await this.api.post<number>("/customers", customer);
    if (typeof id !== "number") throw new ApiError(500, "L'API n'a pas renvoyé le client créé.");
    return id;
  }

  async update(id: number, customer: NewCustomer): Promise<void> {
    await this.api.put(`/customers/${id}`, customer);
  }
}
