import { OfferMockRepository } from "@atelio/core/data";
import { GetActiveOffers, type Offer } from "@atelio/core/domain";

/** Offres en cours. Données fictives de core en attendant GET /api/promotions. */
export function getActiveOffers(): Promise<Offer[]> {
  return new GetActiveOffers(new OfferMockRepository()).execute();
}
