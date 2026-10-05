import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/components/Icon";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getServiceBySlug, getServices } from "@/lib/garage-service/service-queries";
import { formatEuro, priceLabel } from "@/lib/garage-service/services";
import { resolveTenant } from "@/lib/tenant";
import { tenantPath } from "@/tenants";

export async function generateMetadata({ params }: PageProps<"/[tenant]/prestations/[slug]">): Promise<Metadata> {
  const { tenant, slug } = await params;
  const service = await getServiceBySlug(tenant, slug);
  return service ? { title: service.name, description: service.description } : {};
}

export default async function ServicePage({ params }: PageProps<"/[tenant]/prestations/[slug]">) {
  const tenant = await resolveTenant(params);
  const { slug } = await params;
  const services = await getServices(tenant.slug);
  const service = services.find((s) => s.slug === slug);
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
          {service.includes.length === 0 && !service.when && (
            <p className="leading-7 text-zinc-700">{service.description}</p>
          )}

          {service.includes.length > 0 && (
            <>
          <h2 className="text-2xl font-extrabold tracking-tight">Ce qui est compris</h2>
          <ul className="mb-12 mt-6 space-y-3">
            {service.includes.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
                  <Icon name="check" className="h-4 w-4" />
                </span>
                {item}
              </li>
            ))}
          </ul>
            </>
          )}

          {service.when && (
            <>
              <h2 className="text-2xl font-extrabold tracking-tight">Quand faire cette prestation ?</h2>
              <p className="mt-4 leading-7 text-zinc-700">{service.when}</p>
            </>
          )}
        </div>

        {/* Encadré prix + réservation */}
        <Card as="aside" variant="outlined" sticky className="shadow-sm">
          {service.priceFrom !== null && <p className="text-sm text-zinc-500">À partir de</p>}
          <p className="text-4xl font-extrabold text-primary">{priceLabel(service, "")}</p>
          {service.discountPercent !== null && (
            <p className="mt-1 text-sm">
              <span className="text-zinc-400 line-through">{formatEuro(service.basePrice)}</span>
              <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-on-secondary">
                -{service.discountPercent} %
              </span>
            </p>
          )}
          <p className="mt-1 text-sm text-zinc-500">TTC, pièces et main-d&apos;œuvre comprises</p>

          <p className="mt-5 flex items-center gap-2 text-sm">
            <Icon name="clock" className="h-5 w-5 text-primary" />
            Durée indicative : <strong>{service.duration}</strong>
          </p>

          <Button as={Link} href={bookingHref} size="lg" fullWidth className="mt-6">
            Prendre rendez-vous
          </Button>
          <Button as={Link} href={href(`/devis?prestation=${service.slug}`)} variant="outline" size="lg" fullWidth className="mt-3">
            Obtenir un devis précis
          </Button>
          <p className="mt-4 text-center text-sm text-zinc-500">
            Une question ?{" "}
            <a href={`tel:${tenant.contact.phone}`} className="font-semibold text-primary">
              {tenant.contact.phoneLabel}
            </a>
          </p>
        </Card>
      </section>

      <section className="bg-muted">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <h2 className="text-2xl font-extrabold tracking-tight">Autres prestations</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((s) => (
              <Card as={Link} key={s.slug} href={href(`/prestations/${s.slug}`)} variant="interactive" padding="sm">
                <span className="flex items-center gap-3 font-bold">
                  <Icon name={s.icon} className="h-5 w-5 text-primary" />
                  {s.name}
                </span>
                <span className="mt-2 block text-sm text-zinc-600">{priceLabel(s)}</span>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
