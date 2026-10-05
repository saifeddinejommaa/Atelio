export { ApiClient, ApiError, type ApiConfig, type QueryParams } from "./http/api-client";

export type { ServiceDto } from "./dto/service-dto";
export type { CapacityPeriodDto, DayAvailabilityDto, GarageDto, MechanicDto, SlotCheckDto } from "./dto/garage-dto";
export type { AppointmentCreatedDto, AppointmentDto, CreateAppointmentDto, StartCheckDto } from "./dto/appointment-dto";
export type { CustomerDto } from "./dto/customer-dto";
export type { VehicleDto } from "./dto/vehicle-dto";
export type { InterventionDto, InterventionSummaryDto } from "./dto/intervention-dto";

export { ServiceApiRepository } from "./repositories/service-api-repository";
export { GarageApiRepository } from "./repositories/garage-api-repository";
export { AppointmentApiRepository } from "./repositories/appointment-api-repository";
export { CustomerApiRepository } from "./repositories/customer-api-repository";
export { VehicleApiRepository } from "./repositories/vehicle-api-repository";
export { InterventionApiRepository } from "./repositories/intervention-api-repository";

export { OfferMockRepository } from "./mocks/offer-mock-repository";
export { lookupVehicle } from "./mocks/vehicle-lookup";

export { autoExpress, brands, garageDupont, getBrand } from "./brands";

export type { AbsenceDto, DayScheduleDto, TeamMemberDto } from "./dto/team-dto";
export { TeamApiRepository } from "./repositories/team-api-repository";
export { InvoiceApiRepository, type InvoiceDto } from "./repositories/invoice-api-repository";
