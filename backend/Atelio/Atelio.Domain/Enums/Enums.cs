namespace Atelio.Domain.Enums;

// Statuts : stockés en base par leur id (status_id), clé étrangère vers une table de statuts
// (id, label, is_active). Les valeurs ci-dessous sont les ids de ces tables : ne pas les renuméroter.

// Table appointment_status.
public enum AppointmentStatus { Pending = 1, Confirmed = 2, Cancelled = 3, Completed = 4, NoShow = 5 }

// Table intervention_status. Invoiced : facture émise ; Closed : facture réglée.
public enum InterventionStatus { Planned = 1, InProgress = 2, Done = 3, Invoiced = 4, Closed = 5, Cancelled = 6 }

// Table invoice_status.
public enum InvoiceStatus { Draft = 1, Issued = 2, Paid = 3, PartiallyPaid = 4, Cancelled = 5 }

// Table payment_status.
public enum PaymentStatus { Pending = 1, Succeeded = 2, Failed = 3, Refunded = 4 }

// Autres énumérations : stockées en base sous forme de texte en snake_case (ex. PaymentMethod.Card => "card"),
// conformément aux contraintes CHECK du schéma.

public enum PaymentMethod { Card, Cash, Transfer, Check, Online }

public enum EmployeeRole { Mechanic, Manager, Reception }

public enum AbsenceReason { Leave, Sick, Training, Other }

public enum VehicleFuel { Petrol, Diesel, Hybrid, Electric, Lpg, Other }

public enum VehicleCategory { City, Compact, Suv, Utility }

// Ligne de facture : main-d'œuvre ou pièce.
public enum InvoiceLineKind { Labour, Part }
