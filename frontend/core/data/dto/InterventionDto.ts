/** Intervention telle que renvoyée par GET /api/interventions/{id}. */
export type InterventionDto = {
  id: number;
  /** Id et libellé de la table intervention_status. */
  statusId: number;
  statusLabel: string;
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceTotalTtc: number | null;
  paymentMethod: string | null;
  paidAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  /** Fin estimée (rendez-vous d'origine), pauses comprises. */
  estimatedEndAt: string | null;
  mileage: number | null;
  notes: string | null;
  appointmentId: number | null;
  appointmentReference: string | null;
  customerNotes: string | null;
  garageId: number;
  garageName: string;
  customerId: number;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  /** Mécanicien chargé (null si pas encore affecté). */
  employeeId: number | null;
  employeeFirstName: string | null;
  employeeLastName: string | null;
  vehicleId: number;
  vehiclePlate: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  services: {
    serviceId: number;
    code: string;
    name: string;
    durationMinutes: number;
    categoryId: number | null;
    categoryName: string | null;
    hourlyRate: number | null;
    uncertainDuration: boolean;
    quantity: number;
    unitPrice: number;
  }[];
  spareParts: { id: number; reference: string | null; name: string; quantity: number; unitPrice: number }[];
  kit: { serviceName: string; name: string }[];
};

/** Élément de GET /api/interventions. */
export type InterventionSummaryDto = {
  id: number;
  reference: string | null;
  statusId: number;
  statusLabel: string;
  startedAt: string | null;
  customerFirstName: string;
  customerLastName: string;
  vehiclePlate: string;
};
