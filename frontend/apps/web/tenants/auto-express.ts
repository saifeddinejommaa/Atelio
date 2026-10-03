import type { TenantConfig } from "./types";

const config: TenantConfig = {
  slug: "auto-express",
  domains: ["auto-express.com"],
  apiTenant: "auto-express",
  name: "Auto Express",
  logo: "/tenants/auto-express/logo.svg",
  tagline: "Entretien rapide, sans rendez-vous ou en ligne.",
  theme: {
    primary: "#111111",
    secondary: "#ffd100",
    onPrimary: "#ffffff",
    onSecondary: "#111111",
    text: "#1a1a1a",
    muted: "#f6f6f2",
    font: "montserrat",
    radius: "0.25rem",
  },
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
