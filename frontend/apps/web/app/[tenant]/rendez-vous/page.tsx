import type { Metadata } from "next";
import { redirect } from "next/navigation";
import BookingFlow from "@/components/booking/BookingFlow";
import { getGarages, getSlots } from "@/lib/garages";
import { formatPlate, PLATE_PATTERN } from "@/lib/quote";
import { getService, services } from "@/lib/services";
import { getSessionUser } from "@/lib/session";
import { resolveTenant } from "@/lib/tenant";
import { tenantPath } from "@/tenants";

export const metadata: Metadata = { title: "Prendre rendez-vous" };

export default async function BookingPage({ params, searchParams }: PageProps<"/[tenant]/rendez-vous">) {
  const tenant = await resolveTenant(params);
  const query = await searchParams;
  // Pré-remplissage depuis une fiche prestation ou un devis : ?prestation=freinage,vidange&immat=AB-123-CD
  const preselected =
    typeof query.prestation === "string" ? query.prestation.split(",").filter((s) => getService(s)) : [];
  const immat = typeof query.immat === "string" && PLATE_PATTERN.test(query.immat) ? formatPlate(query.immat) : "";

  // Non connecté : on passe par la connexion, puis on revient ici avec les mêmes choix.
  const user = await getSessionUser(tenant.slug);
  if (!user) {
    const keep = new URLSearchParams();
    if (preselected.length) keep.set("prestation", preselected.join(","));
    if (immat) keep.set("immat", immat);
    if (typeof query.garage === "string" && /^[a-z0-9-]{1,40}$/.test(query.garage)) keep.set("garage", query.garage);
    const back = tenantPath(tenant, keep.size ? `/rendez-vous?${keep}` : "/rendez-vous");
    redirect(`${tenantPath(tenant, "/connexion")}?redirect=${encodeURIComponent(back)}`);
  }

  const garages = await getGarages(tenant.slug);
  const slots = Object.fromEntries(garages.map((g) => [g.id, getSlots(g.id)]));
  // Garage choisi depuis la page « Trouver un garage ».
  const initialGarage = typeof query.garage === "string" && garages.some((g) => g.id === query.garage) ? query.garage : "";

  return (
    <section className="bg-muted">
      <div className="mx-auto max-w-5xl px-4 py-10 lg:py-14">
        <h1 className="text-3xl font-extrabold tracking-tight">Prendre rendez-vous</h1>
        <p className="mt-2 text-zinc-600">Bonjour {user.name}, réservez votre créneau en quelques étapes.</p>
        <BookingFlow
          tenant={tenant}
          services={services}
          garages={garages}
          slots={slots}
          preselected={preselected}
          initialPlate={immat}
          initialGarage={initialGarage}
          user={user}
        />
      </div>
    </section>
  );
}
