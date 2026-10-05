import type { Brand } from "../../domain";

export const garageDupont: Brand = {
  slug: "garage-dupont",
  apiTenant: "gmg",
  name: "Garage Dupont",
  logo: "/tenants/garage-dupont/logo.svg",
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
  // Données fictives, à remplacer par les vraies mentions de la société.
  legal: {
    companyName: "Garage Dupont SAS",
    address: "42 rue de Vaugirard, 75015 Paris",
    siret: "123 456 789 00012",
    vatNumber: "FR12 123456789",
    capital: "10 000 €",
    rcs: "RCS Paris 123 456 789",
  },
};
