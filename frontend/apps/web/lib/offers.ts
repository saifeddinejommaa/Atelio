import type { IconName } from "@/lib/services";

// Offres fictives en attendant l'API backend (chaque client gérera ses offres dans sa base).
export type Offer = {
  id: string;
  title: string;
  /** Accroche affichée en grand sur la carte (ex. "-20 %"). */
  highlight: string;
  description: string;
  /** Prestations concernées : le bouton de l'offre pré-remplit la prise de rendez-vous. */
  services: string[];
  icon: IconName;
  /** Dernier jour de validité, au format AAAA-MM-JJ. */
  validUntil: string;
  conditions: string;
};

export const offers: Offer[] = [
  {
    id: "freinage-20",
    title: "Freinage : -20 % sur les plaquettes",
    highlight: "-20 %",
    description:
      "Profitez de 20 % de remise sur le remplacement de vos plaquettes de frein avant ou arrière. Contrôle complet du système de freinage offert.",
    services: ["freinage"],
    icon: "brake",
    validUntil: "2026-11-30",
    conditions: "Remise appliquée sur les pièces et la main-d'œuvre. Non cumulable avec d'autres offres.",
  },
  {
    id: "pack-hiver",
    title: "Pack hiver : batterie + pneus",
    highlight: "-30 €",
    description:
      "Préparez votre voiture pour l'hiver : test de batterie gratuit et 30 € de remise immédiate pour tout montage de pneus réalisé avec un remplacement de batterie.",
    services: ["batterie", "pneus"],
    icon: "battery",
    validUntil: "2026-12-31",
    conditions: "Remise de 30 € TTC pour l'achat simultané d'une batterie et du montage de 2 pneus minimum.",
  },
];

/** Offres encore valides à la date donnée. */
export function getActiveOffers(today = new Date()): Offer[] {
  const iso = today.toISOString().slice(0, 10);
  return offers.filter((o) => o.validUntil >= iso);
}
