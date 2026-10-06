import type { Brand } from "../../domain";

// À compléter : charte (couleurs, police, logo) et mentions légales réelles de la société.
export const gmg78: Brand = {
  slug: "gmg78",
  apiTenant: "gmg",
  name: "GMG78",
  logo: "/tenants/gmg78/logo.svg",
  theme: {
    // Bleu et jaune du logo.
    primary: "#2f86c8",
    secondary: "#f2e93a",
    onPrimary: "#ffffff",
    // Texte foncé : le blanc est illisible sur le jaune.
    onSecondary: "#14213d",
    text: "#14213d",
    muted: "#f4f6fa",
    font: "geist",
    radius: "1rem",
  },
  legal: {
    companyName: "GMG78",
    address: "11 Rue des Longues Raies 78440  Gargenville",
    siret: "À compléter",
    vatNumber: "À compléter",
    capital: "À compléter",
    rcs: "À compléter",
  },
};
