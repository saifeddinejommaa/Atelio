import { garageDupont } from "@atelio/core/data";
import type { TenantConfig } from "./types";

const config: TenantConfig = {
  ...garageDupont,
  domains: ["garage-dupont.fr"],
  tagline: "Votre garage de confiance depuis 1987, au juste prix.",
  contact: {
    phone: "0145000000",
    phoneLabel: "01 45 00 00 00",
    email: "contact@garage-dupont.fr",
  },
  content: {
    topBanner: "Devis gratuit et prix affichés, sans surprise",
    heroBadge: "12 garages en Île-de-France",
    rating: "4,7/5 de satisfaction client",
  },
};

export default config;
