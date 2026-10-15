import LoadingState from "./LoadingState";

/**
 * Chargement d'une page (fichier loading.tsx de la route) : son titre tout de suite, puis une roue et un message
 * pendant que la page attend les données de l'API.
 */
export default function PageLoading({
  title,
  message,
  variant = "hero",
}: {
  /** Titre de la page ; absent quand il dépend des données (ex. nom de la prestation). */
  title?: string;
  /** Ex. « Chargement des offres… ». */
  message: string;
  /** hero : bandeau couleur de la marque (pages vitrine) ; muted : fond clair (espace client, réservation). */
  variant?: "hero" | "muted";
}) {
  const hero = variant === "hero";

  return (
    <>
      {hero && (
        <section className="bg-primary text-on-primary">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
            {title ? (
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
            ) : (
              <div className="h-10 w-64 max-w-full rounded-brand bg-on-primary/15" aria-hidden="true" />
            )}
          </div>
        </section>
      )}

      <section className={hero ? "" : "bg-muted"}>
        <div className="mx-auto max-w-7xl px-4 py-10 lg:py-14">
          {!hero && title && <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>}
          <LoadingState message={message} />
        </div>
      </section>
    </>
  );
}
