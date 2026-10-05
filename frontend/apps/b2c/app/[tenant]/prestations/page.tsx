import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getServices } from "@/lib/garage-service/service-queries";
import ServicePrice from "@/components/ServicePrice";
import { resolveTenant } from "@/lib/tenant";
import { tenantPath } from "@/tenants";

export const metadata: Metadata = { title: "Nos prestations" };

export default async function ServicesPage({ params }: PageProps<"/[tenant]/prestations">) {
  const tenant = await resolveTenant(params);
  const services = await getServices(tenant.slug);
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

      {services.length === 0 && (
        <p className="mx-auto max-w-7xl px-4 py-14 text-center text-zinc-600">
          Nos prestations sont momentanément indisponibles. Merci de réessayer dans quelques instants.
        </p>
      )}

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Card as="article" key={s.slug} variant="outlined" className="flex flex-col">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-primary">
              <Icon name={s.icon} />
            </span>
            <h2 className="mt-5 text-lg font-bold">
              <Link href={href(`/prestations/${s.slug}`)} className="hover:text-primary hover:underline">
                {s.name}
              </Link>
            </h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-zinc-600">{s.description}</p>
            <ServicePrice service={s} size="text-2xl" />
            <div className="mt-5 flex gap-2">
              <Button as={Link} href={href(`/rendez-vous?prestation=${s.slug}`)} size="sm" className="flex-1">
                Prendre rendez-vous
              </Button>
              <Button as={Link} href={href(`/prestations/${s.slug}`)} variant="secondary" size="sm">
                Détails
              </Button>
            </div>
          </Card>
        ))}
      </section>
    </>
  );
}
