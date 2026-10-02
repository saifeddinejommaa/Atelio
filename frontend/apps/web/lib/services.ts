export type Service = {
  slug: string;
  name: string;
  description: string;
  priceFrom: number;
  icon: IconName;
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
  },
  {
    slug: "freinage",
    name: "Freinage",
    description: "Plaquettes, disques et liquide de frein contrôlés et remplacés.",
    priceFrom: 89,
    icon: "brake",
  },
  {
    slug: "pneus",
    name: "Pneus",
    description: "Montage, équilibrage, géométrie et stockage de vos pneus.",
    priceFrom: 49,
    icon: "tire",
  },
  {
    slug: "climatisation",
    name: "Climatisation",
    description: "Recharge, désinfection et diagnostic du circuit de clim.",
    priceFrom: 79,
    icon: "snow",
  },
  {
    slug: "batterie",
    name: "Batterie",
    description: "Test gratuit et remplacement de batterie en moins de 30 minutes.",
    priceFrom: 99,
    icon: "battery",
  },
  {
    slug: "revision",
    name: "Révision constructeur",
    description: "Révision complète qui préserve votre garantie constructeur.",
    priceFrom: 149,
    icon: "wrench",
  },
  {
    slug: "controle-technique",
    name: "Pré-contrôle technique",
    description: "Vérification des points clés avant votre passage au contrôle.",
    priceFrom: 29,
    icon: "shield",
  },
  {
    slug: "echappement",
    name: "Échappement",
    description: "Silencieux, catalyseur et filtre à particules diagnostiqués.",
    priceFrom: 119,
    icon: "exhaust",
  },
];
