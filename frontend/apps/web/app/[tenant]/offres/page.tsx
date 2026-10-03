import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import { getActiveOffers } from "@/lib/offers";
import { getServices } from "@/lib/api/services";
import { resolveTenant } from "@/lib/tenant";
import { tenantPath } from "@/tenants";

export const metadata: Metadata = { title: "Offres du moment" };

const longDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function OffersPage({ params }: PageProps<"/[tenant]/offres">) {
  const tenant = await resolveTenant(params);
  const offers = getActiveOffers();
  const allServices = await getServices(tenant.slug);

  return (
    <>
      <section className="bg-primary text-on-primary">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Offres du moment</h1>
          <p className="mt-4 max-w-2xl text-lg text-on-primary/80">
            Les promotions en cours chez {tenant.name}, à réserver directement en ligne.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14">
        {offers.length === 0 ? (
          <p className="text-center text-zinc-600">Aucune offre en cours pour le moment, revenez bientôt.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {offers.map((offer) => {
              const [y, m, d] = offer.validUntil.split("-").map(Number);
              const services = allServices.filter((s) => offer.services.includes(s.slug));
              return (
                <article key={offer.id} className="flex flex-col overflow-hidden rounded-brand border border-zinc-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-4 bg-secondary p-6 text-on-secondary">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-on-secondary/15">
                      <Icon name={offer.icon} className="h-6 w-6" />
                    </span>
                    <span className="text-4xl font-extrabold tracking-tight">{offer.highlight}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-xl font-bold">{offer.title}</h2>
                    <p className="mt-3 leading-7 text-zinc-700">{offer.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {services.map((s) => (
                        <Link
                          key={s.slug}
                          href={tenantPath(tenant, `/prestations/${s.slug}`)}
                          className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary hover:underline"
                        >
                          {s.name}
                        </Link>
                      ))}
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
                      <Icon name="calendar" className="h-4 w-4" />
                      Valable jusqu&apos;au {longDate.format(new Date(y, m - 1, d))}
                    </p>
                    <p className="mt-2 flex-1 text-xs text-zinc-500">{offer.conditions}</p>
                    <Link
                      href={`${tenantPath(tenant, "/rendez-vous")}?prestation=${offer.services.join(",")}`}
                      className="mt-6 block rounded-brand bg-secondary py-3.5 text-center font-semibold text-on-secondary transition-colors hover:bg-secondary-dark"
                    >
                      J&apos;en profite
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
