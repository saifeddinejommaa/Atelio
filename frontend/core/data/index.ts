export { ApiClient, ApiError, type ApiConfig, type QueryParams } from "./http/ApiClient";

export type { ServiceDto } from "./dto/ServiceDto";
export type { CapacityPeriodDto, DayAvailabilityDto, GarageDto, MechanicDto, SlotCheckDto } from "./dto/GarageDto";
export type { AppointmentCreatedDto, AppointmentDto, CreateAppointmentDto, StartCheckDto } from "./dto/AppointmentDto";
export type { CustomerDto } from "./dto/CustomerDto";
export type { VehicleDto } from "./dto/VehicleDto";
export type { InterventionDto, InterventionSummaryDto } from "./dto/InterventionDto";

export { ServiceApiRepository } from "./repositories/ServiceApiRepository";
export { GarageApiRepository } from "./repositories/GarageApiRepository";
export { AppointmentApiRepository } from "./repositories/AppointmentApiRepository";
export { CustomerApiRepository } from "./repositories/CustomerApiRepository";
export { VehicleApiRepository } from "./repositories/VehicleApiRepository";
export { InterventionApiRepository } from "./repositories/InterventionApiRepository";

export { OfferMockRepository } from "./mocks/OfferMockRepository";
export { lookupVehicle } from "./mocks/VehicleLookup";

export { brands, getBrand, gmg78, sej } from "./brands";

export type { AbsenceDto, DayScheduleDto, TeamMemberDto } from "./dto/TeamDto";
export { TeamApiRepository } from "./repositories/TeamApiRepository";
export { InvoiceApiRepository, type InvoiceDto } from "./repositories/InvoiceApiRepository";
export type { StatusDto } from "./dto/StatusDto";
export type { PageDto } from "./dto/PageDto";
export { StatusApiRepository } from "./repositories/StatusApiRepository";
