import { autoExpress } from "@atelio/core/data";
import type { TenantConfig } from "./types";

const config: TenantConfig = {
  ...autoExpress,
  domains: ["auto-express.com"],
  tagline: "Entretien rapide, sans rendez-vous ou en ligne.",
  contact: {
    phone: "0472000000",
    phoneLabel: "04 72 00 00 00",
    email: "bonjour@auto-express.fr",
  },
  content: {
    topBanner: "Entretien express en moins d'une heure",
    heroBadge: "35 centres en Auvergne-Rhône-Alpes",
    rating: "4,8/5 sur plus de 3 000 avis",
  },
};

export default config;
