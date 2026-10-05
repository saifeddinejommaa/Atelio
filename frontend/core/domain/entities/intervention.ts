import type { InterventionStatus, Status } from "./status";

/** Prestation réalisée dans une intervention. */
export type InterventionService = {
  serviceId: number;
  code: string;
  name: string;
  /** Temps de main-d'œuvre (temps passé saisi, sinon durée prévue). */
  durationMinutes: number;
  categoryId: number | null;
  categoryName: string | null;
  /** Taux horaire TTC de la catégorie. */
  hourlyRate: number | null;
  /** Durée incertaine (ex. « Autre ») : temps et type à saisir selon le mécanicien. */
  uncertainDuration: boolean;
  quantity: number;
  /** Prix unitaire TTC. */
  unitPrice: number;
};

/** Travail réalisé sur un véhicule, ouvert à partir d'un rendez-vous (ou non). */
export type Intervention = {
  id: number;
  /** En cours → terminée → facturée → clôturée (payée), ou annulée. */
  status: Status<InterventionStatus>;
  /** Facture émise (null avant facturation). */
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceTotalTtc: number | null;
  /** Règlement (null tant que non réglée). */
  paymentMethod: PaymentMethod | null;
  paidAt: string | null;
  /** ISO 8601 en UTC. */
  startedAt: string | null;
  finishedAt: string | null;
  /** Fin estimée (rendez-vous d'origine), pauses comprises. */
  estimatedEndAt: string | null;
  mileage: number | null;
  /** Notes internes du garage. */
  notes: string | null;
  appointmentId: number | null;
  appointmentReference: string | null;
  /** Message laissé par le client à la prise de rendez-vous. */
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
  services: InterventionService[];
  spareParts: SparePart[];
  /** Pièces à prévoir selon les prestations (kits). */
  kit: KitItem[];
};


/** Pièce ou fourniture utilisée (saisie par l'accueil). Prix TTC. */
export type SparePart = {
  id: number;
  reference: string | null;
  name: string;
  /** Décimale possible (ex. 4,5 L d'huile). */
  quantity: number;
  unitPrice: number;
};

/** Pièce ou fourniture à enregistrer. */
export type SparePartInput = Omit<SparePart, "id">;

/** Pièce à prévoir pour une prestation (kit, aide-mémoire). */
export type KitItem = {
  serviceName: string;
  name: string;
};

/** TVA de la réparation automobile (taux normal). */
export const VAT_RATE = 0.2;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Totaux TTC (prestations, pièces), et ventilation HT / TVA. */
export function interventionTotals(intervention: Pick<Intervention, "services" | "spareParts">) {
  const labour = round2(intervention.services.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0));
  const parts = round2(intervention.spareParts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0));
  const ttc = round2(labour + parts);
  const ht = round2(ttc / (1 + VAT_RATE));
  return { labour, parts, ttc, ht, vat: round2(ttc - ht) };
}

/** Catégorie de prestations (entretien, mécanique...) et son taux horaire de main-d'œuvre TTC. */
export type ServiceCategory = {
  id: number;
  code: string;
  name: string;
  hourlyRate: number;
};

/** Main-d'œuvre TTC : taux × temps, arrondie au centime. */
export function labourPrice(hourlyRate: number, minutes: number): number {
  return round2((hourlyRate * minutes) / 60);
}

/** Intervention dans la liste du back-office. */
export type InterventionSummary = {
  id: number;
  /** Référence du rendez-vous d'origine (null sans rendez-vous). */
  reference: string | null;
  status: Status<InterventionStatus>;
  startedAt: string | null;
  customerFirstName: string;
  customerLastName: string;
  vehiclePlate: string;
};

export type InterventionFilter = {
  garageId: number;
  statusId?: InterventionStatus;
  /** Référence, n° d'intervention, nom ou prénom du client. */
  search?: string;
};

export type PaymentMethod = "card" | "cash" | "transfer" | "check";
