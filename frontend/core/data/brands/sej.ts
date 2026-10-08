import type { Brand } from "../../domain";

// À compléter : charte (couleurs, police, logo) et mentions légales réelles de la société.
export const sej: Brand = {
  slug: "sej",
  apiTenant: "sej",
  name: "SEJ",
  logo: "/tenants/sej/logo.svg",
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
  legal: {
    companyName: "À compléter",
    address: "À compléter",
    siret: "À compléter",
    vatNumber: "À compléter",
    capital: "À compléter",
    rcs: "À compléter",
  },
};
