/** Polices disponibles pour les marques (Google Fonts). */
export type BrandFont = "geist" | "inter" | "montserrat" | "poppins" | "roboto";

/** Charte graphique d'une marque, appliquée au site client (b2c) et au back-office (b2b). */
export type BrandTheme = {
  /** Couleur principale : en-tête, pied de page, menu. */
  primary: string;
  /** Couleur secondaire : boutons, liens, mises en avant. */
  secondary: string;
  /** Couleur du texte posé sur la couleur principale. */
  onPrimary: string;
  /** Couleur du texte posé sur la couleur secondaire. */
  onSecondary: string;
  /** Couleur du texte courant. */
  text: string;
  /** Fond des sections alternées. */
  muted: string;
  font: BrandFont;
  /** Arrondi des boutons et cartes (ex. "0.75rem", "0"). */
  radius: string;
};

/** Marque blanche. */
export type Brand = {
  /** Identifiant de la marque, ex. "garage-dupont". */
  slug: string;
  /** Identifiant de la marque côté API (en-tête X-Tenant, voir Tenancy:Tenants de l'API). */
  apiTenant: string;
  /** Nom affiché partout. */
  name: string;
  /** URL du logo (SVG ou PNG), ex. "/tenants/garage-dupont/logo.svg". */
  logo: string;
  theme: BrandTheme;
  /** Mentions légales de la société (factures). */
  legal: BrandLegal;
};

/** Mentions légales de la société, imprimées sur les factures. */
export type BrandLegal = {
  /** Raison sociale et forme juridique, ex. "Garage Dupont SAS". */
  companyName: string;
  /** Adresse du siège. */
  address: string;
  siret: string;
  /** N° de TVA intracommunautaire. */
  vatNumber: string;
  /** Capital social, ex. "10 000 €". */
  capital: string;
  /** Immatriculation au RCS, ex. "RCS Paris 123 456 789". */
  rcs: string;
};
