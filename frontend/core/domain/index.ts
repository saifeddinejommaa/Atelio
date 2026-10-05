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
export type { CustomerVehicle, VehicleFuel } from "./entities/customer-vehicle";
export type { Offer } from "./entities/offer";
export {
  AppointmentStatus,
  InterventionStatus,
  InvoiceStatus,
  PaymentStatus,
  type Status,
  type StatusOption,
} from "./entities/status";
export type { StatusRepository } from "./repositories/status-repository";
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

export type { ServiceRepository } from "./repositories/service-repository";
export type { AvailabilityQuery, GarageFilter, GarageRepository, SlotCheckQuery } from "./repositories/garage-repository";
export type { AppointmentFilter, AppointmentRepository } from "./repositories/appointment-repository";
export type { CustomerRepository } from "./repositories/customer-repository";
export type { OfferRepository } from "./repositories/offer-repository";
export type { VehicleRepository } from "./repositories/vehicle-repository";
export type { InterventionRepository } from "./repositories/intervention-repository";

export { GetServices } from "./usecases/get-services";
export { GetServiceByCode } from "./usecases/get-service-by-code";
export { GetGarages } from "./usecases/get-garages";
export { GetGarageAvailability } from "./usecases/get-garage-availability";
export { BookAppointment, MAX_NOTES_LENGTH } from "./usecases/book-appointment";
export { GetCustomerAppointments } from "./usecases/get-customer-appointments";
export { CancelAppointment } from "./usecases/cancel-appointment";
export { GetCustomerByEmail } from "./usecases/get-customer-by-email";
export { GetActiveOffers } from "./usecases/get-active-offers";
export { GetCustomerVehicles } from "./usecases/get-customer-vehicles";
export { GetGarageAppointments } from "./usecases/get-garage-appointments";
export { FindCustomersByPhone } from "./usecases/find-customers-by-phone";
export { CreateCustomer } from "./usecases/create-customer";
export {
  AbandonAppointment,
  CheckAppointmentStart,
  RescheduleAppointment,
  StartAppointment,
} from "./usecases/garage-appointment-actions";
export {
  AddSparePart,
  AssignInterventionEmployee,
  DeleteSparePart,
  GetIntervention,
  GetInterventions,
  GetServiceCategories,
  UpdateServiceLabour,
  UpdateSparePart,
} from "./usecases/get-intervention";
export { CheckSlot, GetGarageCapacity, GetGarageMechanics } from "./usecases/garage-planning";

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
export type { TeamRepository } from "./repositories/team-repository";
export { DeclareAbsence, DeleteAbsence, GetTeam, SaveEmployeeSchedule } from "./usecases/team";

export type { Invoice, InvoiceLine } from "./entities/invoice";
export type { InvoiceRepository } from "./repositories/invoice-repository";
export { FinishIntervention, GetInvoice, IssueInvoice, PayInvoice } from "./usecases/invoicing";
