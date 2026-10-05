import type { ComponentPropsWithoutRef, ElementType } from "react";

/**
 * Variantes nommées par rôle (pas par couleur) :
 * primary : action principale, couleur d'accent de la marque (secondary dans le thème).
 * secondary : action secondaire, bordure neutre.
 * outline : bordure et texte à la couleur de la marque.
 * inverse : sur un fond foncé (bandeau primary).
 * danger : action destructrice (annulation).
 */
export type ButtonVariant = "primary" | "secondary" | "outline" | "inverse" | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center rounded-brand text-center font-semibold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary " +
  "disabled:cursor-not-allowed disabled:opacity-40";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-secondary text-on-secondary hover:bg-secondary-dark",
  secondary: "border border-zinc-300 hover:border-primary",
  outline: "border border-primary text-primary hover:bg-muted",
  inverse: "border border-on-primary/30 hover:bg-on-primary/10",
  danger: "border border-zinc-300 hover:border-red-600 hover:text-red-700",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5 text-sm",
  md: "px-6 py-3",
  lg: "px-7 py-3.5",
};

type ButtonProps<T extends ElementType> = {
  /** Balise ou composant rendu (button par défaut) : Link pour une navigation. */
  as?: T;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Action en cours : le bouton est désactivé et affiche loadingText s'il est fourni. */
  loading?: boolean;
  loadingText?: string;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

/** Bouton (ou lien) de la marque : couleurs et arrondi suivent le thème du tenant. */
export default function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  loadingText,
  className,
  children,
  ...props
}: ButtonProps<T>) {
  const Component: ElementType = as ?? "button";
  const isButton = Component === "button";
  const classes = [base, variants[variant], sizes[size], fullWidth && "w-full", className].filter(Boolean).join(" ");

  return (
    <Component
      className={classes}
      // Un <button> sans type soumet le formulaire : on force "button" sauf si type est précisé.
      {...(isButton && { type: "button" })}
      {...props}
      {...(isButton && loading && { disabled: true })}
      aria-busy={loading || undefined}
    >
      {loading && loadingText ? loadingText : children}
    </Component>
  );
}
