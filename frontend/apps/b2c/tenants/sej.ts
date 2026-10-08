import { sej } from "@atelio/core/data";
import type { TenantConfig } from "./types";

// À compléter : domaine du site, coordonnées et textes réels de la société.
const config: TenantConfig = {
  ...sej,
  // Domaine propre (ex. "mon-garage.fr"). En attendant : sej.<TENANT_BASE_DOMAIN> ou /sej.
  domains: [],
  tagline: "À compléter",
  contact: {
    phone: "0000000000",
    phoneLabel: "00 00 00 00 00",
    email: "contact@exemple.fr",
  },
  content: {
    topBanner: "À compléter",
    heroBadge: "À compléter",
    rating: "À compléter",
  },
};

export default config;
