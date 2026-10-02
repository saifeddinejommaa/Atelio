import type { FontKey } from "@/lib/fonts";

// Configuration d'un client (marque blanche).
// Un fichier par client dans ce dossier, puis l'enregistrer dans tenants/index.ts.
export type TenantConfig = {
  /** Identifiant dans l'URL : https://<domaine>/<slug>/... */
  slug: string;
  /**
   * Domaines propres au client, sans "www." (ex. "auto-express.com").
   * Le site reste aussi accessible via <slug>.<TENANT_BASE_DOMAIN> et <domaine commun>/<slug>.
   */
  domains: string[];
  /** Nom affiché partout sur le site. */
  name: string;
  /** Logo dans public/tenants/<slug>/ (SVG ou PNG). */
  logo: string;
  /** Phrase d'accroche affichée dans le pied de page et les métadonnées. */
  tagline: string;
  theme: {
    /** Couleur principale : en-tête, pied de page, bandeau. */
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
    /** Police du site. */
    font: FontKey;
    /** Arrondi des boutons et cartes (ex. "0.75rem", "0"). */
    radius: string;
  };
  contact: {
    phone: string;
    phoneLabel: string;
    email: string;
  };
  /** Textes propres au client. */
  content: {
    topBanner: string;
    heroBadge: string;
    rating: string;
  };
};
