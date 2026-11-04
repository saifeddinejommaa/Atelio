/** Demande de devis d'un client, à traiter par le garage. */
export type QuoteRequest = {
  id: number;
  /** ISO 8601 en UTC. */
  createdAt: string;
  customerId: number;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  vehicleId: number;
  vehiclePlate: string;
  /** Noms des prestations souhaitées, séparés par des virgules. */
  services: string;
  message: string | null;
  /** Devis établi par le garage : renseigné, la demande est traitée. */
  quoteId: number | null;
  quoteNumber: string | null;
  /** Renseigné : le devis a été envoyé au client. */
  quoteSentAt: string | null;
};

/** Demande envoyée par le client connecté : le client vient de la session, pas de la requête. */
export type NewQuoteRequest = {
  plate: string;
  serviceIds: number[];
  message?: string;
};
