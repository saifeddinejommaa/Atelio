import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getServices } from "@/lib/garageService/ServiceQueries";
import { getActivePromotions } from "@/lib/promotion/PromotionQueries";
import { resolveTenant } from "@/lib/tenant";
import { tenantPath } from "@/tenants";

export const metadata: Metadata = { title: "Offres du moment" };

const longDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const percent = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

export default async function OffersPage({ params }: PageProps<"/[tenant]/offres">) {
  const tenant = await resolveTenant(params);
  const [offers, allServices] = await Promise.all([getActivePromotions(tenant.slug), getServices(tenant.slug)]);

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
              const endsOn = offer.endsOn?.split("-").map(Number);
              const service = allServices.find((s) => s.slug === offer.serviceCode);
              const icon = service?.icon ?? "wrench";
              return (
                <Card
                  as="article"
                  key={offer.id}
                  variant="outlined"
                  padding="none"
                  className="flex flex-col overflow-hidden shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4 bg-secondary p-6 text-on-secondary">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-on-secondary/15">
                      <Icon name={icon} className="h-6 w-6" />
                    </span>
                    <span className="text-4xl font-extrabold tracking-tight">-{percent.format(offer.discountPercent)} %</span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <h2 className="text-xl font-bold">{offer.title}</h2>
                    {offer.description && <p className="mt-3 leading-7 text-zinc-700">{offer.description}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        href={tenantPath(tenant, `/prestations/${offer.serviceCode}`)}
                        className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-primary hover:underline"
                      >
                        {offer.serviceName}
                      </Link>
                      <span className="text-sm">
                        <span className="text-zinc-500 line-through">{euro.format(offer.servicePrice)}</span>{" "}
                        <span className="font-bold">{euro.format(offer.discountedPrice)}</span>
                      </span>
                    </div>
                    {endsOn && (
                      <p className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
                        <Icon name="calendar" className="h-4 w-4" />
                        Valable jusqu&apos;au {longDate.format(new Date(endsOn[0], endsOn[1] - 1, endsOn[2]))}
                      </p>
                    )}
                    <p className="mt-2 flex-1 text-xs text-zinc-500">{offer.conditions}</p>
                    <Button
                      as={Link}
                      href={`${tenantPath(tenant, "/rendez-vous")}?prestation=${offer.serviceCode}`}
                      size="lg"
                      fullWidth
                      className="mt-6"
                    >
                      J&apos;en profite
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
