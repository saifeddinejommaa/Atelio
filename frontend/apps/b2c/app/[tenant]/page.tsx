import Link from "next/link";
import Icon from "@/components/Icon";
import { getServices } from "@/lib/garage-service/service-queries";
import ServicePrice from "@/components/ServicePrice";
import { resolveTenant } from "@/lib/tenant";
import { tenantPath } from "@/tenants";

const reassurances = [
  { icon: "euro", title: "Prix clairs", text: "Le prix annoncé est celui que vous payez, pièces et main-d'œuvre comprises." },
  { icon: "shield", title: "Garantie constructeur", text: "Nos entretiens respectent le carnet et préservent votre garantie." },
  { icon: "clock", title: "Rendez-vous rapide", text: "Un créneau dès demain dans la plupart de nos garages." },
  { icon: "check", title: "Pièces de qualité", text: "Pièces d'origine ou de qualité équivalente, garanties 1 an." },
] as const;

const reviews = [
  { name: "Claire M.", city: "Lyon", text: "Rendez-vous pris en deux minutes, voiture prête à l'heure et prix conforme au devis. Parfait." },
  { name: "Karim B.", city: "Lille", text: "Changement de plaquettes rapide, l'équipe m'a bien expliqué ce qui avait été fait." },
  { name: "Sophie L.", city: "Nantes", text: "Enfin un garage où l'on ne découvre pas la facture en sortant. Je recommande." },
];

export default async function Home({ params }: PageProps<"/[tenant]">) {
  const tenant = await resolveTenant(params);
  const services = await getServices(tenant.slug);
  const href = (path: string) => tenantPath(tenant, path);

  const steps = [
    { icon: "car", title: "Choisissez votre prestation", text: "Indiquez votre véhicule et le service dont vous avez besoin." },
    { icon: "pin", title: "Sélectionnez un garage", text: "Trouvez le garage le plus proche de chez vous." },
    { icon: "calendar", title: "Réservez votre créneau", text: "Choisissez le jour et l'heure, la confirmation est immédiate." },
  ] as const;

  return (
    <>
      {/* Bandeau principal */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary text-on-primary">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--tenant-secondary)_22%,transparent),transparent)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <p className="inline-block rounded-full bg-on-primary/10 px-3 py-1 text-sm font-medium">
              {tenant.content.heroBadge}
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              L&apos;entretien de votre voiture, <span className="text-secondary">au juste prix.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-on-primary/80">
              Vidange, freins, pneus, climatisation : réservez en ligne chez {tenant.name} dans le garage le
              plus proche et connaissez le prix avant de venir.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={href("/rendez-vous")}
                className="rounded-brand bg-secondary px-7 py-3.5 font-semibold text-on-secondary transition-colors hover:bg-secondary-dark"
              >
                Prendre rendez-vous
              </Link>
              <Link
                href={href("/devis")}
                className="rounded-brand border border-on-primary/30 px-7 py-3.5 font-semibold transition-colors hover:bg-on-primary/10"
              >
                Obtenir un devis
              </Link>
            </div>
          </div>

          <form
            action={href("/devis")}
            className="rounded-brand bg-white p-6 text-foreground shadow-2xl sm:p-8"
          >
            <h2 className="text-xl font-bold">Votre devis en 1 minute</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Saisissez votre immatriculation pour un prix adapté à votre véhicule.
            </p>

            <label htmlFor="immat" className="mt-6 block text-sm font-medium">
              Immatriculation
            </label>
            <div className="mt-2 flex overflow-hidden rounded-lg border-2 border-primary">
              <span className="flex w-10 flex-col items-center justify-center bg-blue-700 text-xs font-bold text-white">
                F
              </span>
              <input
                id="immat"
                name="immat"
                placeholder="AB-123-CD"
                className="w-full px-3 py-3 text-lg font-bold uppercase tracking-widest outline-none"
              />
            </div>

            <label htmlFor="prestation" className="mt-5 block text-sm font-medium">
              Prestation
            </label>
            <select
              id="prestation"
              name="prestation"
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 outline-none focus:border-primary"
            >
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="mt-6 w-full rounded-brand bg-secondary py-3.5 font-semibold text-on-secondary transition-colors hover:bg-secondary-dark"
            >
              Voir mon prix
            </button>
          </form>
        </div>
      </section>

      {/* Prestations */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Nos prestations</h2>
            <p className="mt-2 text-zinc-600">Tout l&apos;entretien de votre véhicule, au même endroit.</p>
          </div>
          <Link href={href("/prestations")} className="font-semibold text-primary underline-offset-4 hover:underline">
            Voir toutes les prestations →
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <Link
              key={s.slug}
              href={href(`/prestations/${s.slug}`)}
              className="group rounded-brand border border-zinc-200 p-6 transition-colors hover:border-secondary"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary group-hover:bg-secondary group-hover:text-on-secondary">
                <Icon name={s.icon} />
              </span>
              <h3 className="mt-5 font-bold">{s.name}</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{s.description}</p>
              <ServicePrice service={s} />
            </Link>
          ))}
        </div>
      </section>

      {/* Engagements */}
      <section className="bg-muted">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {reassurances.map((r) => (
            <div key={r.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                <Icon name={r.icon} className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-bold">{r.title}</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight">Réservez en 3 étapes</h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-brand bg-primary text-on-primary">
                <Icon name={step.icon} className="h-7 w-7" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-sm font-bold text-on-secondary">
                  {i + 1}
                </span>
              </span>
              <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 max-w-xs text-zinc-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trouver un garage */}
      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid items-center gap-8 rounded-brand bg-primary p-8 text-on-primary sm:p-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">{tenant.name}, près de chez vous</h2>
            <p className="mt-3 text-on-primary/80">
              Retrouvez les horaires, les prestations et les disponibilités du garage le plus proche.
            </p>
          </div>
          <form action={href("/garages")} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="ville" className="sr-only">
              Ville ou code postal
            </label>
            <div className="flex flex-1 items-center gap-2 rounded-brand bg-white px-5 text-foreground">
              <Icon name="pin" className="h-5 w-5 text-zinc-400" />
              <input
                id="ville"
                name="q"
                placeholder="Ville ou code postal"
                className="w-full py-3.5 outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-brand bg-secondary px-7 py-3.5 font-semibold text-on-secondary transition-colors hover:bg-secondary-dark"
            >
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Avis clients */}
      <section className="bg-muted">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight">Ils nous font confiance</h2>
            <p className="mt-2 text-zinc-600">{tenant.content.rating}</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.name} className="rounded-brand bg-white p-6 shadow-sm">
                <div className="flex gap-0.5 text-secondary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon key={i} name="star" filled className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="mt-4 leading-7 text-zinc-700">« {r.text} »</blockquote>
                <figcaption className="mt-4 text-sm font-semibold">
                  {r.name} <span className="font-normal text-zinc-500">· {r.city}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
