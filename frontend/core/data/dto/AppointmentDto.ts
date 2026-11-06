/** Rendez-vous tel que renvoyé par GET /api/appointments. */
export type AppointmentDto = {
  id: number;
  reference: string;
  customerId: number;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  /** Id et libellé de la table appointment_status. */
  statusId: number;
  statusLabel: string;
  scheduledAt: string;
  estimatedEndAt: string | null;
  customerNotes: string | null;
  garageId: number;
  garageName: string;
  garageAddress: string;
  vehicleId: number;
  vehiclePlate: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  serviceCodes: string[];
  serviceNames: string[];
  /** Intervention ouverte à partir du rendez-vous (null si pas encore lancé). */
  interventionId: number | null;
  /** Id et libellé de la table intervention_status. */
  interventionStatusId: number | null;
  interventionStatusLabel: string | null;
  estimatedMinutes: number | null;
  interventionEmployeeId: number | null;
};

/** Corps de POST /api/appointments. */
export type CreateAppointmentDto = {
  customerId: number;
  garageId: number;
  serviceIds: number[];
  estimatedMinutes?: number;
  scheduledAt: string;
  vehicleId?: number;
  plate?: string;
  mileage?: number;
  customerNotes?: string;
};

/** Réponse de POST /api/appointments. */
export type AppointmentCreatedDto = {
  id: number;
  reference: string;
  scheduledAt: string;
  estimatedEndAt: string | null;
};

/** Réponse de GET /api/appointments/{ref}/start-check. */
export type StartCheckDto = {
  possible: boolean;
  message: string | null;
  startAt: string;
  estimatedEndAt: string | null;
  employeeId: number | null;
  employeeName: string | null;
};
