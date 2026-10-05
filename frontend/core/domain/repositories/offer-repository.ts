import type { Offer } from "../entities/offer";

export interface OfferRepository {
  getOffers(): Promise<Offer[]>;
}
