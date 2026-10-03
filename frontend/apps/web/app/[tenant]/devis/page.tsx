import type { Metadata } from "next";
import QuoteBuilder from "@/components/quote/QuoteBuilder";
import { getServices } from "@/lib/api/services";
import { resolveTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Devis en ligne" };

export default async function QuotePage({ params, searchParams }: PageProps<"/[tenant]/devis">) {
  const tenant = await resolveTenant(params);
  const services = await getServices(tenant.slug);
  const query = await searchParams;

  // Pré-remplissage depuis le formulaire de l'accueil ou une fiche prestation.
  const immat = typeof query.immat === "string" ? query.immat.slice(0, 12) : "";
  const preselected =
    typeof query.prestation === "string" ? query.prestation.split(",").filter((code) => services.some((s) => s.slug === code)) : [];

  return (
    <>
      <section className="bg-primary text-on-primary">
        <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Devis en ligne</h1>
          <p className="mt-3 max-w-2xl text-lg text-on-primary/80">
            Votre prix exact en 1 minute, selon votre véhicule. Gratuit et sans engagement.
          </p>
        </div>
      </section>
      <section className="bg-muted">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <QuoteBuilder tenant={tenant} services={services} initialPlate={immat} preselected={preselected} />
        </div>
      </section>
    </>
  );
}
