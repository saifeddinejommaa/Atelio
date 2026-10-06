import type { Brand } from "@atelio/core/domain";

// Configuration d'un client (marque blanche) pour le site b2c.
// La charte graphique (nom, logo, couleurs, police) vient de core (@atelio/core/data, brands/),
// partagée avec le back-office b2b. Ce fichier n'ajoute que ce qui est propre au site client.
export type TenantConfig = Brand & {
  /**
   * Domaines propres au client, sans "www." (ex. "mon-garage.fr").
   * Le site reste aussi accessible via <slug>.<TENANT_BASE_DOMAIN> et <domaine commun>/<slug>.
   */
  domains: string[];
  /** Phrase d'accroche affichée dans le pied de page et les métadonnées. */
  tagline: string;
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
