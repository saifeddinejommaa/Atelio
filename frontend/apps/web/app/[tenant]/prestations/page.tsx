import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import { services } from "@/lib/services";
import { resolveTenant } from "@/lib/tenant";
import { tenantPath } from "@/tenants";

export const metadata: Metadata = { title: "Nos prestations" };

export default async function ServicesPage({ params }: PageProps<"/[tenant]/prestations">) {
  const tenant = await resolveTenant(params);
  const href = (path: string) => tenantPath(tenant, path);

  return (
    <>
      <section className="bg-primary text-on-primary">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Nos prestations</h1>
          <p className="mt-4 max-w-2xl text-lg text-on-primary/80">
            Tout l&apos;entretien de votre véhicule chez {tenant.name}, avec des prix affichés à l&apos;avance.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <article key={s.slug} className="flex flex-col rounded-brand border border-zinc-200 p-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary">
              <Icon name={s.icon} />
            </span>
            <h2 className="mt-5 text-lg font-bold">
              <Link href={href(`/prestations/${s.slug}`)} className="hover:text-primary hover:underline">
                {s.name}
              </Link>
            </h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">{s.description}</p>
            <p className="mt-4 text-sm">
              à partir de <span className="text-2xl font-extrabold text-primary">{s.priceFrom} €</span>
            </p>
            <div className="mt-5 flex gap-2">
              <Link
                href={href(`/rendez-vous?prestation=${s.slug}`)}
                className="flex-1 rounded-brand bg-secondary py-2.5 text-center text-sm font-semibold text-on-secondary transition-colors hover:bg-secondary-dark"
              >
                Prendre rendez-vous
              </Link>
              <Link
                href={href(`/prestations/${s.slug}`)}
                className="rounded-brand border border-zinc-300 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary"
              >
                Détails
              </Link>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
