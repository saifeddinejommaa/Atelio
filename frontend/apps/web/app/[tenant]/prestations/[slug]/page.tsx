import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import { getService, services } from "@/lib/services";
import { resolveTenant } from "@/lib/tenant";
import { tenantPath } from "@/tenants";

export async function generateMetadata({ params }: PageProps<"/[tenant]/prestations/[slug]">): Promise<Metadata> {
  const service = getService((await params).slug);
  return service ? { title: service.name, description: service.description } : {};
}

export default async function ServicePage({ params }: PageProps<"/[tenant]/prestations/[slug]">) {
  const tenant = await resolveTenant(params);
  const service = getService((await params).slug);
  if (!service) notFound();

  const href = (path: string) => tenantPath(tenant, path);
  const bookingHref = href(`/rendez-vous?prestation=${service.slug}`);
  const others = services.filter((s) => s.slug !== service.slug).slice(0, 4);

  return (
    <>
      <section className="bg-primary text-on-primary">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
          <nav className="text-sm text-on-primary/70" aria-label="Fil d'Ariane">
            <Link href={href("/")} className="hover:text-secondary">Accueil</Link>
            <span className="mx-2">/</span>
            <Link href={href("/prestations")} className="hover:text-secondary">Nos prestations</Link>
            <span className="mx-2">/</span>
            <span className="text-on-primary">{service.name}</span>
          </nav>
          <div className="mt-6 flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-brand bg-secondary text-on-secondary">
              <Icon name={service.icon} className="h-7 w-7" />
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{service.name}</h1>
          </div>
          <p className="mt-5 max-w-2xl text-lg text-on-primary/80">{service.intro}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1fr_22rem]">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Ce qui est compris</h2>
          <ul className="mt-6 space-y-3">
            {service.includes.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <h2 className="mt-12 text-2xl font-extrabold tracking-tight">Quand faire cette prestation ?</h2>
          <p className="mt-4 leading-7 text-zinc-700">{service.when}</p>
        </div>

        {/* Encadré prix + réservation */}
        <aside className="h-fit rounded-brand border border-zinc-200 p-6 shadow-sm lg:sticky lg:top-32">
          <p className="text-sm text-zinc-500">À partir de</p>
          <p className="text-4xl font-extrabold text-primary">{service.priceFrom} €</p>
          <p className="mt-1 text-sm text-zinc-500">TTC, pièces et main-d&apos;œuvre comprises</p>

          <p className="mt-5 flex items-center gap-2 text-sm">
            <Icon name="clock" className="h-5 w-5 text-primary" />
            Durée indicative : <strong>{service.duration}</strong>
          </p>

          <Link
            href={bookingHref}
            className="mt-6 block rounded-brand bg-secondary py-3.5 text-center font-semibold text-on-secondary transition-colors hover:bg-secondary-dark"
          >
            Prendre rendez-vous
          </Link>
          <Link
            href={href(`/devis?prestation=${service.slug}`)}
            className="mt-3 block rounded-brand border border-primary py-3.5 text-center font-semibold text-primary transition-colors hover:bg-muted"
          >
            Obtenir un devis précis
          </Link>
          <p className="mt-4 text-center text-sm text-zinc-500">
            Une question ?{" "}
            <a href={`tel:${tenant.contact.phone}`} className="font-semibold text-primary">
              {tenant.contact.phoneLabel}
            </a>
          </p>
        </aside>
      </section>

      <section className="bg-muted">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-2xl font-extrabold tracking-tight">Autres prestations</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((s) => (
              <Link
                key={s.slug}
                href={href(`/prestations/${s.slug}`)}
                className="rounded-brand border border-zinc-200 bg-white p-5 transition-colors hover:border-secondary"
              >
                <span className="flex items-center gap-3 font-bold">
                  <Icon name={s.icon} className="h-5 w-5 text-primary" />
                  {s.name}
                </span>
                <span className="mt-2 block text-sm text-zinc-600">à partir de {s.priceFrom} €</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
