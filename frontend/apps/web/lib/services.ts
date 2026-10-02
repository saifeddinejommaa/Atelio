export type Service = {
  slug: string;
  name: string;
  description: string;
  priceFrom: number;
  icon: IconName;
  /** Durée indicative de l'intervention. */
  duration: string;
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

// Données fictives en attendant l'API backend.
export const services: Service[] = [
  {
    slug: "vidange",
    name: "Vidange & entretien",
    description: "Huile moteur, filtres et points de contrôle selon le carnet constructeur.",
    priceFrom: 69,
    icon: "oil",
    duration: "45 min",
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
    name: "Freinage",
    description: "Plaquettes, disques et liquide de frein contrôlés et remplacés.",
    priceFrom: 89,
    icon: "brake",
    duration: "1 h",
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
    name: "Pneus",
    description: "Montage, équilibrage, géométrie et stockage de vos pneus.",
    priceFrom: 49,
    icon: "tire",
    duration: "45 min",
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
    name: "Climatisation",
    description: "Recharge, désinfection et diagnostic du circuit de clim.",
    priceFrom: 79,
    icon: "snow",
    duration: "1 h",
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
    name: "Batterie",
    description: "Test gratuit et remplacement de batterie en moins de 30 minutes.",
    priceFrom: 99,
    icon: "battery",
    duration: "30 min",
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
    name: "Révision constructeur",
    description: "Révision complète qui préserve votre garantie constructeur.",
    priceFrom: 149,
    icon: "wrench",
    duration: "2 h",
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
    name: "Pré-contrôle technique",
    description: "Vérification des points clés avant votre passage au contrôle.",
    priceFrom: 29,
    icon: "shield",
    duration: "30 min",
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
    name: "Échappement",
    description: "Silencieux, catalyseur et filtre à particules diagnostiqués.",
    priceFrom: 119,
    icon: "exhaust",
    duration: "1 h 30",
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

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
