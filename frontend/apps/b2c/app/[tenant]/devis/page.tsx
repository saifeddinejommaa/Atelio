import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { formatPlate, isValidPlate } from "@atelio/core/domain";
import QuoteRequestForm from "@/components/quote/QuoteRequestForm";
import { getServices } from "@/lib/garageService/ServiceQueries";
import { getSessionUser } from "@/lib/session";
import { resolveTenant } from "@/lib/tenant";
import { getSessionVehicles } from "@/lib/vehicle/VehicleQueries";
import { tenantPath } from "@/tenants";

export const metadata: Metadata = { title: "Demander un devis" };

export default async function QuotePage({ params, searchParams }: PageProps<"/[tenant]/devis">) {
  const tenant = await resolveTenant(params);
  const services = await getServices(tenant.slug);
  const query = await searchParams;

  // Pré-remplissage depuis une fiche prestation.
  const immat = typeof query.immat === "string" && isValidPlate(query.immat) ? formatPlate(query.immat) : "";
  const preselected =
    typeof query.prestation === "string" ? query.prestation.split(",").filter((code) => services.some((s) => s.slug === code)) : [];

  // Non connecté : on passe par la connexion, puis on revient ici avec les mêmes choix.
  const user = await getSessionUser(tenant.slug);
  if (!user) {
    const keep = new URLSearchParams();
    if (preselected.length) keep.set("prestation", preselected.join(","));
    if (immat) keep.set("immat", immat);
    const back = tenantPath(tenant, keep.size ? `/devis?${keep}` : "/devis");
    redirect(`${tenantPath(tenant, "/connexion")}?redirect=${encodeURIComponent(back)}`);
  }

  const vehicles = await getSessionVehicles(tenant.slug);

  return (
    <>
      <section className="bg-primary text-on-primary">
        <div className="mx-auto max-w-3xl px-4 py-10 lg:py-14">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Demander un devis</h1>
          <p className="mt-3 text-lg text-on-primary/80">
            Indiquez votre véhicule et vos besoins : notre garage établit votre devis et vous l&apos;envoie par e-mail.
          </p>
        </div>
      </section>
      <section className="bg-muted">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <QuoteRequestForm
            tenant={tenant.slug}
            user={user}
            services={services}
            vehicles={vehicles}
            initialPlate={immat}
            preselected={preselected}
          />
        </div>
      </section>
    </>
  );
}
