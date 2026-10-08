export type { Service } from "./entities/service";
export { garageOffers, type DayAvailability, type CapacityPeriod, type Garage, type Mechanic, type Slot, type SlotCheck } from "./entities/garage";
export type { Customer, NewCustomer } from "./entities/customer";
export {
  canMarkNoShow,
  canReschedule,
  canStart,
  appointmentDisplayStatus,
  isCancellable,
  isOpen,
  type AbandonStatus,
  type AppointmentDisplayStatus,
  type Appointment,
  type AppointmentRequest,
  type BookedAppointment,
  type StartCheck,
} from "./entities/appointment";
export type { Vehicle, VehicleCategory } from "./entities/vehicle";
export type { CustomerVehicle, VehicleFuel } from "./entities/CustomerVehicle";
export type { Offer } from "./entities/offer";
export {
  AppointmentStatus,
  InterventionStatus,
  InvoiceStatus,
  PaymentStatus,
  type Status,
  type StatusOption,
} from "./entities/status";
export type { IStatusRepository } from "./repositories/IStatusRepository";
export { GetAppointmentStatuses, GetInterventionStatuses } from "./usecases/statuses";
export {
  interventionTotals,
  labourPrice,
  VAT_RATE,
  type Intervention,
  type InterventionFilter,
  type InterventionService,
  type InterventionSummary,
  type KitItem,
  type PaymentMethod,
  type ServiceCategory,
  type SparePart,
  type SparePartInput,
} from "./entities/intervention";
export type { Brand, BrandFont, BrandLegal, BrandTheme } from "./entities/brand";
export { ValidationError } from "./errors";

export { formatPlate, isValidPlate, PLATE_PATTERN } from "./rules/plate";
export { isValidPhone } from "./rules/phone";
export { computeQuote, vehicleCategories, type Quote, type QuoteLine } from "./rules/quote";

export type { IServiceRepository } from "./repositories/IServiceRepository";
export type { AvailabilityQuery, GarageFilter, IGarageRepository, SlotCheckQuery } from "./repositories/IGarageRepository";
export type { AppointmentFilter, IAppointmentRepository } from "./repositories/IAppointmentRepository";
export type { ICustomerRepository } from "./repositories/ICustomerRepository";
export type { IOfferRepository } from "./repositories/IOfferRepository";
export type { IVehicleRepository } from "./repositories/IVehicleRepository";
export type { IInterventionRepository } from "./repositories/IInterventionRepository";

export { GetServices } from "./usecases/GetServices";
export { GetServiceByCode } from "./usecases/GetServiceByCode";
export { GetGarages } from "./usecases/GetGarages";
export { GetGarageAvailability } from "./usecases/GetGarageAvailability";
export { BookAppointment, MAX_NOTES_LENGTH } from "./usecases/BookAppointment";
export { GetCustomerAppointments } from "./usecases/GetCustomerAppointments";
export { CancelAppointment } from "./usecases/CancelAppointment";
export { GetCustomerByEmail } from "./usecases/GetCustomerByEmail";
export { GetActiveOffers } from "./usecases/GetActiveOffers";
export { GetCustomerVehicles } from "./usecases/GetCustomerVehicles";
export { GetGarageAppointments } from "./usecases/GetGarageAppointments";
export { FindCustomersByPhone } from "./usecases/FindCustomersByPhone";
export { CreateCustomer } from "./usecases/CreateCustomer";
export {
  AbandonAppointment,
  CheckAppointmentStart,
  RescheduleAppointment,
  StartAppointment,
} from "./usecases/GarageAppointmentActions";
export {
  AddSparePart,
  AssignInterventionEmployee,
  DeleteSparePart,
  GetIntervention,
  GetInterventions,
  GetServiceCategories,
  UpdateServiceLabour,
  UpdateSparePart,
} from "./usecases/GetIntervention";
export { CheckSlot, GetGarageCapacity, GetGarageMechanics } from "./usecases/GaragePlanning";

export {
  dayMinutes,
  isoDayOfWeek,
  memberDay,
  weeklyHours,
  type Absence,
  type AbsenceReason,
  type DaySchedule,
  type EmployeeRole,
  type NewAbsence,
  type TeamMember,
} from "./entities/team";
export type { ITeamRepository } from "./repositories/ITeamRepository";
export { DeclareAbsence, DeleteAbsence, GetTeam, SaveEmployeeSchedule } from "./usecases/team";

export type { Invoice, InvoiceLine } from "./entities/invoice";
export { pageCount, type Page } from "./entities/page";
export type { IInvoiceRepository } from "./repositories/IInvoiceRepository";
export { FinishIntervention, GetInvoice, IssueInvoice, PayInvoice } from "./usecases/invoicing";
