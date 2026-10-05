import type { Offer } from "../entities/offer";
import type { OfferRepository } from "../repositories/offer-repository";

/** Offres encore valides à la date donnée. */
export class GetActiveOffers {
  constructor(private readonly repository: OfferRepository) {}

  async execute(today = new Date()): Promise<Offer[]> {
    const iso = today.toISOString().slice(0, 10);
    return (await this.repository.getOffers()).filter((o) => o.validUntil >= iso);
  }
}
