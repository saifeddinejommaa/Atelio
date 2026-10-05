import type { Offer, OfferRepository } from "../../domain";

// Offres fictives en attendant de brancher GET /api/promotions (chaque marque gère ses offres dans sa base).
const offers: Offer[] = [
  {
    id: "freinage-20",
    title: "Freinage : -20 % sur les plaquettes",
    highlight: "-20 %",
    description:
      "Profitez de 20 % de remise sur le remplacement de vos plaquettes de frein avant ou arrière. Contrôle complet du système de freinage offert.",
    serviceCodes: ["freinage"],
    validUntil: "2026-11-30",
    conditions: "Remise appliquée sur les pièces et la main-d'œuvre. Non cumulable avec d'autres offres.",
  },
  {
    id: "pack-hiver",
    title: "Pack hiver : batterie + pneus",
    highlight: "-30 €",
    description:
      "Préparez votre voiture pour l'hiver : test de batterie gratuit et 30 € de remise immédiate pour tout montage de pneus réalisé avec un remplacement de batterie.",
    serviceCodes: ["batterie", "pneus"],
    validUntil: "2026-12-31",
    conditions: "Remise de 30 € TTC pour l'achat simultané d'une batterie et du montage de 2 pneus minimum.",
  },
];

export class OfferMockRepository implements OfferRepository {
  async getOffers(): Promise<Offer[]> {
    return offers;
  }
}
