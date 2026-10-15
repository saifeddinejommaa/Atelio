export type { ManagedService, Service, ServiceInput } from "./entities/service";
export { garageOffers, type DayAvailability, type CapacityPeriod, type Garage, type Mechanic, type Slot, type SlotCheck } from "./entities/garage";
export type { Customer, CustomerFilter, CustomerInvoice, CustomerSummary, NewCustomer } from "./entities/customer";
export { GetCustomer, GetCustomerInvoices, GetCustomers } from "./usecases/GetCustomers";
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
export {
  fuelLabels,
  gearboxLabels,
  type CustomerVehicle,
  type VehicleDetails,
  type VehicleFuel,
  type VehicleGearbox,
} from "./entities/CustomerVehicle";
export {
  localIsoDate,
  promotionState,
  type Promotion,
  type PromotionInput,
  type PromotionState,
} from "./entities/Promotion";
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
  articleTotal,
  interventionTotals,
  labourPrice,
  VAT_RATE,
  type Intervention,
  type InterventionArticle,
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
export type { IManagedServiceRepository } from "./repositories/IManagedServiceRepository";
export type { AvailabilityQuery, GarageFilter, IGarageRepository, SlotCheckQuery } from "./repositories/IGarageRepository";
export type { AppointmentFilter, IAppointmentRepository } from "./repositories/IAppointmentRepository";
export type { ICustomerRepository } from "./repositories/ICustomerRepository";
export type { IPromotionRepository } from "./repositories/IPromotionRepository";
export type { IVehicleRepository } from "./repositories/IVehicleRepository";
export type { IInterventionRepository } from "./repositories/IInterventionRepository";

export { GetServices } from "./usecases/GetServices";
export { CreateService, DeleteService, GetManagedServices, SetServiceActive, UpdateService } from "./usecases/ManageServices";
export { GetServiceByCode } from "./usecases/GetServiceByCode";
export { GetGarages } from "./usecases/GetGarages";
export { GetGarageAvailability } from "./usecases/GetGarageAvailability";
export { BookAppointment, BookMyAppointment, MAX_NOTES_LENGTH } from "./usecases/BookAppointment";
export type { CustomerLogin, MyAppointmentRequest, NewAccount } from "./entities/CustomerLogin";
export type { ICustomerAuthRepository } from "./repositories/ICustomerAuthRepository";
export type { IMyAccountRepository } from "./repositories/IMyAccountRepository";
export { RegisterAccount, RequestLoginCode, VerifyLoginCode } from "./usecases/CustomerLogin";
export { CancelMyAppointment, GetMyAppointments, GetMyProfile, GetMyVehicles } from "./usecases/MyAccount";
export { GetCustomerAppointments } from "./usecases/GetCustomerAppointments";
export { CancelAppointment } from "./usecases/CancelAppointment";
export { GetCustomerByEmail } from "./usecases/GetCustomerByEmail";
export { CreatePromotion, GetActivePromotions, GetPromotions, SetPromotionActive, UpdatePromotion } from "./usecases/Promotions";
export { GetCustomerVehicles, GetVehicle, UpdateVehicleDetails } from "./usecases/GetCustomerVehicles";
export { GetGarageAppointments } from "./usecases/GetGarageAppointments";
export { FindCustomersByPhone } from "./usecases/FindCustomersByPhone";
export { CreateCustomer, UpdateCustomer } from "./usecases/CreateCustomer";
export {
  AbandonAppointment,
  CheckAppointmentStart,
  RescheduleAppointment,
  StartAppointment,
} from "./usecases/GarageAppointmentActions";
export {
  AddInterventionArticle,
  AddSparePart,
  AssignInterventionEmployee,
  DeleteInterventionArticle,
  DeleteSparePart,
  UpdateInterventionArticle,
  GetIntervention,
  ImportQuote,
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
  type NewTeamMember,
  type TeamMember,
} from "./entities/team";
export type { ITeamRepository } from "./repositories/ITeamRepository";
export type { StaffMember, StaffRole } from "./entities/StaffMember";
export type { IStaffRepository } from "./repositories/IStaffRepository";
export { GetCurrentStaff } from "./usecases/Staff";
export {
  AddTeamMember,
  DeactivateTeamMember,
  DeclareAbsence,
  DeleteAbsence,
  GetTeam,
  SaveEmployeeSchedule,
} from "./usecases/team";

export type { Article, ArticleFilter, ArticleInput } from "./entities/Article";
export type { IArticleRepository } from "./repositories/IArticleRepository";
export { CreateArticle, GetArticles, SetArticleActive, UpdateArticle } from "./usecases/Articles";

export type { GarageQuote, GarageQuoteLine, GarageQuoteSummary, NewGarageQuote } from "./entities/GarageQuote";
export type { IQuoteRepository } from "./repositories/IQuoteRepository";
export { CreateQuote, GetCustomerQuotes, GetQuote, SendQuote } from "./usecases/Quotes";

export type { Invoice, InvoiceDocument, InvoiceFilter, InvoiceLine, InvoicePage, InvoicePayment, InvoiceSummary } from "./entities/invoice";
export { pageCount, type Page } from "./entities/page";
export type { IInvoiceRepository } from "./repositories/IInvoiceRepository";
export {
  FinishIntervention,
  GenerateInvoicePdf,
  GetInvoice,
  GetInvoicePdf,
  GetInvoices,
  IssueInvoice,
  PayInvoice,
} from "./usecases/invoicing";
