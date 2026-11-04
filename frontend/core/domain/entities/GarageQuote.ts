/** Ligne figée d'un devis : copie de l'article (nom, description, prix HT). */
export type GarageQuoteLine = {
  articleId: number;
  name: string;
  description: string | null;
  quantity: number;
  unitPriceHt: number;
  /** HT. */
  total: number;
};

/** Devis établi par un garage pour un véhicule d'un client (articles du catalogue, prix HT). */
export type GarageQuote = {
  id: number;
  number: string;
  /** ISO 8601 en UTC. */
  createdAt: string;
  /** ISO 8601 en UTC. Renseigné : le devis a été envoyé au client et n'est plus modifiable. */
  sentAt: string | null;
  /** Importé sur une intervention : le devis n'est plus modifiable. */
  isImported: boolean;
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  customerId: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  vehicleId: number;
  vehiclePlate: string;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleVersion: string | null;
  garageName: string;
  garageAddress: string;
  garagePhone: string | null;
  lines: GarageQuoteLine[];
};

/** Devis dans la fiche client. */
export type GarageQuoteSummary = Pick<GarageQuote, "id" | "number" | "createdAt" | "totalHt" | "totalTtc" | "vehiclePlate" | "garageName">;

/** Devis à créer. */
export type NewGarageQuote = {
  customerId: number;
  vehicleId: number;
  /** Garage qui établit le devis (en-tête du document). */
  garageId: number;
  /** Demande du client traitée par ce devis, s'il y en a une. */
  quoteRequestId?: number;
  /** unitPriceHt : prix propre à ce devis, le catalogue ne change pas. */
  lines: { articleId: number; quantity: number; unitPriceHt?: number }[];
};

/** Modification d'un devis : véhicule et articles. */
export type GarageQuoteChanges = Pick<NewGarageQuote, "vehicleId" | "lines">;
