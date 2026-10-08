import { gmg78 } from "@atelio/core/data";
import type { TenantConfig } from "./types";

// À compléter : domaine du site, coordonnées et textes réels de la société.
const config: TenantConfig = {
  ...gmg78,
  // Domaine propre (ex. "mon-garage.fr"). En attendant : gmg78.<TENANT_BASE_DOMAIN> ou /gmg78.
  domains: ["gmg-78.com"],
  tagline: "À compléter",
  contact: {
    phone: "0171483183",
    phoneLabel: "01 71 48 31 83",
    email: "contact@exemple.fr",
  },
  content: {
    topBanner: "À compléter",
    heroBadge: "À compléter",
    rating: "À compléter",
  },
};

export default config;
