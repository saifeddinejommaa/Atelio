import type {
  AppointmentStatus,
  InterventionStatus,
  InvoiceStatus,
  PaymentStatus,
  StatusOption,
  IStatusRepository,
} from "../../domain";
import type { StatusDto } from "../dto/StatusDto";
import type { ApiClient } from "../http/ApiClient";

export class StatusApiRepository implements IStatusRepository {
  constructor(private readonly api: ApiClient) {}

  getAppointmentStatuses() {
    return this.get<AppointmentStatus>("appointments");
  }

  getInterventionStatuses() {
    return this.get<InterventionStatus>("interventions");
  }

  getInvoiceStatuses() {
    return this.get<InvoiceStatus>("invoices");
  }

  getPaymentStatuses() {
    return this.get<PaymentStatus>("payments");
  }

  // Les ids sont fixes et partagés avec le backend : la conversion vers le type d'id est sûre.
  private async get<TId extends number>(table: string): Promise<StatusOption<TId>[]> {
    const dtos = await this.api.get<StatusDto[]>(`/statuses/${table}`);
    return (dtos ?? []).map((dto) => ({ id: dto.id as TId, label: dto.label, isActive: dto.isActive }));
  }
}
