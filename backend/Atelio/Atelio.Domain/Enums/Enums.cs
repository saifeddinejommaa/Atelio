namespace Atelio.Domain.Enums;

// Stockés en base sous forme de texte en snake_case (ex. NoShow => "no_show"),
// conformément aux contraintes CHECK du schéma.

public enum AppointmentStatus { Pending, Confirmed, Cancelled, Completed, NoShow }

public enum InterventionStatus { Planned, InProgress, Done, Cancelled }

public enum InvoiceStatus { Draft, Issued, Paid, PartiallyPaid, Cancelled }

public enum PaymentMethod { Card, Cash, Transfer, Check, Online }

public enum PaymentStatus { Pending, Succeeded, Failed, Refunded }

public enum EmployeeRole { Mechanic, Manager, Reception }

public enum AbsenceReason { Leave, Sick, Training, Other }

public enum VehicleFuel { Petrol, Diesel, Hybrid, Electric, Lpg, Other }

public enum VehicleCategory { City, Compact, Suv, Utility }

// Ligne de facture : main-d'œuvre ou pièce.
public enum InvoiceLineKind { Labour, Part }
