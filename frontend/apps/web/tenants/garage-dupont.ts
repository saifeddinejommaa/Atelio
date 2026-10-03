import type { TenantConfig } from "./types";

const config: TenantConfig = {
  slug: "garage-dupont",
  domains: ["garage-dupont.fr"],
  apiTenant: "gmg",
  name: "Garage Dupont",
  logo: "/tenants/garage-dupont/logo.svg",
  tagline: "Votre garage de confiance depuis 1987, au juste prix.",
  theme: {
    primary: "#0b2545",
    secondary: "#f26b1d",
    onPrimary: "#ffffff",
    onSecondary: "#ffffff",
    text: "#14213d",
    muted: "#f4f6fa",
    font: "geist",
    radius: "1rem",
  },
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
