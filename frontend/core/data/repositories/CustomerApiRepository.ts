import type { Customer, ICustomerRepository, NewCustomer } from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";
import type { CustomerDto } from "../dto/CustomerDto";
import { toCustomerEntity } from "../mappers/CustomerMapper";

export class CustomerApiRepository implements ICustomerRepository {
  constructor(private readonly api: ApiClient) {}

  async getByEmail(email: string): Promise<Customer | null> {
    const customer = await this.api.get<CustomerDto>("/customers/by-email", { email });
    return customer && toCustomerEntity(customer);
  }

  async findByPhone(phone: string): Promise<Customer[]> {
    const customers = await this.api.get<CustomerDto[]>("/customers/by-phone", { phone });
    return (customers ?? []).map(toCustomerEntity);
  }

  async create(customer: NewCustomer): Promise<number> {
    const id = await this.api.post<number>("/customers", customer);
    if (typeof id !== "number") throw new ApiError(500, "L'API n'a pas renvoyé le client créé.");
    return id;
  }
}
