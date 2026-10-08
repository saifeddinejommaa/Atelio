import type { Service as ServiceEntity } from "@atelio/core/domain";

/** Prestation telle qu'affichée sur le site : données de l'API + contenu de présentation. */
export type Service = {
  id: number;
  slug: string;
  name: string;
  description: string;
  /** Prix « à partir de » TTC, promotion déduite (null si non renseigné). */
  priceFrom: number | null;
  /** Prix TTC avant promotion. */
  basePrice: number;
  /** Remise en cours (ex. 20 pour -20 %), null si aucune. */
  discountPercent: number | null;
  durationMinutes: number;
  /** Durée lisible, ex. "1 h 30". */
  duration: string;
  icon: IconName;
  /** Texte de présentation de la page dédiée. */
  intro: string;
  /** Ce qui est compris dans la prestation. */
  includes: string[];
  /** Quand faire la prestation. */
  when: string;
};

export type IconName =
  | "oil"
  | "brake"
  | "tire"
  | "snow"
  | "battery"
  | "wrench"
  | "shield"
  | "exhaust";

/** Contenu éditorial par code de service (icône, textes de la fiche). Le reste vient de l'API. */
type ServiceContent = {
  slug: string;
  icon: IconName;
  intro: string;
  includes: string[];
  when: string;
};

const content: ServiceContent[] = [
  {
    slug: "vidange",
    icon: "oil",
    intro:
      "La vidange remplace l'huile moteur usagée et le filtre à huile. Elle protège votre moteur de l'usure et limite la consommation de carburant.",
    includes: [
      "Huile moteur adaptée à votre véhicule",
      "Remplacement du filtre à huile",
      "Contrôle des niveaux (liquide de refroidissement, lave-glace, freins)",
      "Contrôle visuel de 20 points de sécurité",
      "Mise à jour du carnet d'entretien",
    ],
    when: "Tous les 15 000 à 30 000 km, ou au moins une fois par an, selon votre véhicule.",
  },
  {
    slug: "freinage",
    icon: "brake",
    intro:
      "Un freinage en bon état, c'est votre sécurité. Nous contrôlons et remplaçons plaquettes, disques et liquide de frein avec des pièces de qualité.",
    includes: [
      "Contrôle gratuit du système de freinage",
      "Remplacement des plaquettes avant ou arrière",
      "Contrôle de l'usure des disques",
      "Essai sur route après intervention",
    ],
    when: "Dès que vous entendez un grincement, sentez des vibrations ou si le voyant s'allume.",
  },
  {
    slug: "pneus",
    icon: "tire",
    intro:
      "Vos pneus sont le seul contact de votre voiture avec la route. Nous vous conseillons les bons pneus et les montons dans les règles de l'art.",
    includes: [
      "Démontage et montage des pneus",
      "Valve neuve et équilibrage",
      "Contrôle de la pression",
      "Recyclage des pneus usagés",
    ],
    when: "Quand la profondeur des sculptures approche 1,6 mm, ou à chaque changement de saison.",
  },
  {
    slug: "climatisation",
    icon: "snow",
    intro:
      "Une climatisation entretenue refroidit mieux, consomme moins et évite les mauvaises odeurs dans l'habitacle.",
    includes: [
      "Contrôle d'étanchéité du circuit",
      "Recharge en gaz réfrigérant",
      "Désinfection du circuit",
      "Contrôle de la température de sortie",
    ],
    when: "Tous les 2 ans, ou si l'air soufflé n'est plus assez froid.",
  },
  {
    slug: "batterie",
    icon: "battery",
    intro:
      "Démarrage difficile ? Nous testons gratuitement votre batterie et la remplaçons si besoin par une batterie adaptée à votre véhicule.",
    includes: [
      "Test gratuit de la batterie et de l'alternateur",
      "Batterie neuve garantie 2 ans",
      "Pose et réinitialisation des équipements électroniques",
      "Recyclage de l'ancienne batterie",
    ],
    when: "Tous les 4 à 5 ans, ou dès les premiers signes de démarrage difficile.",
  },
  {
    slug: "revision",
    icon: "wrench",
    intro:
      "La révision suit le programme d'entretien de votre constructeur. Elle est réalisée avec des pièces de qualité d'origine et préserve votre garantie.",
    includes: [
      "Vidange et remplacement des filtres prévus au programme",
      "Contrôle complet selon le carnet constructeur",
      "Diagnostic électronique",
      "Tampon du carnet d'entretien",
    ],
    when: "Selon le kilométrage ou l'échéance indiqués dans votre carnet d'entretien.",
  },
  {
    slug: "controle-technique",
    icon: "shield",
    intro:
      "Évitez la contre-visite : nous vérifions les principaux points du contrôle technique et vous indiquons ce qui doit être corrigé.",
    includes: [
      "Contrôle de l'éclairage et de la signalisation",
      "Contrôle du freinage et de la direction",
      "Contrôle des pneus et des suspensions",
      "Compte rendu détaillé",
    ],
    when: "Dans le mois qui précède votre contrôle technique.",
  },
  {
    slug: "echappement",
    icon: "exhaust",
    intro:
      "Un échappement abîmé fait du bruit, pollue davantage et peut vous coûter le contrôle technique. Nous le diagnostiquons et le réparons.",
    includes: [
      "Diagnostic de la ligne d'échappement",
      "Remplacement du silencieux ou du catalyseur",
      "Nettoyage du filtre à particules si besoin",
      "Contrôle des fixations",
    ],
    when: "Si vous entendez un bruit inhabituel ou si le voyant moteur s'allume.",
  },
];

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

/** Complète une prestation du domaine avec son contenu de présentation (s'il existe). */
export function toService(entity: ServiceEntity): Service {
  const extra = content.find((c) => c.slug === entity.code);
  return {
    id: entity.id,
    slug: entity.code,
    name: entity.name,
    description: entity.description ?? "",
    priceFrom: entity.finalPrice,
    basePrice: entity.price,
    discountPercent: entity.discountPercent,
    durationMinutes: entity.durationMinutes,
    duration: formatDuration(entity.durationMinutes),
    icon: extra?.icon ?? "wrench",
    intro: extra?.intro ?? entity.description ?? "",
    includes: extra?.includes ?? [],
    when: extra?.when ?? "",
  };
}

/** « à partir de 69 € » ou « Sur devis » si le service n'a pas de prix. */
export function priceLabel(service: Service, prefix = "à partir de "): string {
  return service.priceFrom === null ? "Sur devis" : `${prefix}${formatEuro(service.priceFrom)}`;
}

/** 71.2 => "71,20 €", 69 => "69 €". */
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
