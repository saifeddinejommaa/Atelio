import type { ComponentPropsWithoutRef, ElementType } from "react";

/**
 * surface : carte blanche ombrée, sur un fond gris (bg-muted).
 * outlined : carte bordée, sur un fond blanc.
 * interactive : carte bordée cliquable (lien), la bordure prend la couleur secondaire au survol.
 */
export type CardVariant = "surface" | "outlined" | "interactive";

/** none : le contenu gère son padding (ex. bandeau pleine largeur) ; responsive : p-6 puis p-8 dès sm. */
export type CardPadding = "none" | "sm" | "md" | "lg" | "responsive";

const variants: Record<CardVariant, string> = {
  surface: "bg-white shadow-sm",
  outlined: "border border-zinc-200 bg-white",
  interactive: "border border-zinc-200 bg-white transition-colors hover:border-secondary",
};

const paddings: Record<CardPadding, string> = {
  none: "",
  sm: "p-5",
  md: "p-6",
  lg: "p-8",
  responsive: "p-6 sm:p-8",
};

type CardProps<T extends ElementType> = {
  /** Balise ou composant rendu (div par défaut) : "li", "article", "aside", Link… */
  as?: T;
  variant?: CardVariant;
  padding?: CardPadding;
  /** Encadré récapitulatif qui reste visible au défilement (grand écran). */
  sticky?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/** Carte de la marque : l'arrondi suit le thème du tenant (rounded-brand). */
export default function Card<T extends ElementType = "div">({
  as,
  variant = "surface",
  padding = "md",
  sticky = false,
  className,
  ...props
}: CardProps<T>) {
  const Component: ElementType = as ?? "div";
  const classes = ["rounded-brand", variants[variant], paddings[padding], sticky && "h-fit lg:sticky lg:top-32", className]
    .filter(Boolean)
    .join(" ");
  return <Component className={classes} {...props} />;
}
