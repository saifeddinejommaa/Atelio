import type { Appointment, BookedAppointment, Customer, CustomerVehicle, IMyAccountRepository, MyAppointmentRequest } from "../../domain";
import { ApiError, type ApiClient } from "../http/ApiClient";
import type { AppointmentCreatedDto, AppointmentDto } from "../dto/AppointmentDto";
import type { CustomerDto } from "../dto/CustomerDto";
import type { VehicleDto } from "../dto/VehicleDto";
import { toAppointmentEntity, toBookedAppointment } from "../mappers/AppointmentMapper";
import { toCustomerEntity } from "../mappers/CustomerMapper";
import { toCustomerVehicle } from "../mappers/VehicleMapper";

/** Routes /me de l'API : le client vient du jeton de session de l'ApiClient (config.token). */
export class MyAccountApiRepository implements IMyAccountRepository {
  constructor(private readonly api: ApiClient) {}

  async getProfile(): Promise<Customer | null> {
    try {
      const customer = await this.api.get<CustomerDto>("/me");
      return customer && toCustomerEntity(customer);
    } catch (error) {
      // Jeton expiré ou compte désactivé : plus de session.
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  }

  async getAppointments(): Promise<Appointment[]> {
    return ((await this.api.get<AppointmentDto[]>("/me/appointments")) ?? []).map(toAppointmentEntity);
  }

  async getVehicles(): Promise<CustomerVehicle[]> {
    return ((await this.api.get<VehicleDto[]>("/me/vehicles")) ?? []).map(toCustomerVehicle);
  }

  async book(request: MyAppointmentRequest): Promise<BookedAppointment> {
    const created = await this.api.post<AppointmentCreatedDto>("/me/appointments", {
      garageId: request.garageId,
      serviceIds: request.serviceIds,
      scheduledAt: request.scheduledAt,
      vehicleId: request.vehicleId,
      plate: request.plate,
      mileage: request.mileage,
      customerNotes: request.customerNotes,
    });
    if (!created) throw new ApiError(500, "L'API n'a pas renvoyé le rendez-vous créé.");
    return toBookedAppointment(created);
  }

  async cancel(reference: string): Promise<void> {
    await this.api.post(`/me/appointments/${encodeURIComponent(reference)}/cancel`, {});
  }
}
