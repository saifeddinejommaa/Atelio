import type { Brand } from "../../domain";

export const autoExpress: Brand = {
  slug: "auto-express",
  apiTenant: "auto-express",
  name: "Auto Express",
  logo: "/tenants/auto-express/logo.svg",
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
  // Données fictives, à remplacer par les vraies mentions de la société.
  legal: {
    companyName: "Auto Express SARL",
    address: "88 avenue Jean Jaurès, 69007 Lyon",
    siret: "987 654 321 00034",
    vatNumber: "FR98 987654321",
    capital: "50 000 €",
    rcs: "RCS Lyon 987 654 321",
  },
};
