import { gmg78 } from "@atelio/core/data";
import type { TenantConfig } from "./types";

// À compléter : domaine du site, coordonnées et textes réels de la société.
const config: TenantConfig = {
  ...gmg78,
  // Domaine propre (ex. "mon-garage.fr"). En attendant : gmg78.<TENANT_BASE_DOMAIN> ou /gmg78.
  domains: ["gmg78.com"],
  // tagline : indiquez la phrase d'accroche de la marque.
  contact: {
    phone: "0171483183",
    phoneLabel: "01 71 48 31 83",
    email: "garage.mg78440@gmail.com",
  },
  // Indiquez les textes de la marque : heroBadge (badge de l'accueil), rating (note des avis clients).
  content: {},
};

export default config;
