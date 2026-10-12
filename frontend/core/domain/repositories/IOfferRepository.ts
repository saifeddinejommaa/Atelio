import type { Offer } from "../entities/offer";

export interface IOfferRepository {
  getOffers(): Promise<Offer[]>;
}
