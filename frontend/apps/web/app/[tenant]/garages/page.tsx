import type { Metadata } from "next";
import GarageFinder from "@/components/garages/GarageFinder";
import { getGarages } from "@/lib/garages";
import { resolveTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Trouver un garage" };

export default async function GaragesPage({ params, searchParams }: PageProps<"/[tenant]/garages">) {
  const tenant = await resolveTenant(params);
  const { q } = await searchParams;
  const garages = await getGarages(tenant.slug);

  return (
    <>
      <section className="bg-primary text-on-primary">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:py-12">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Trouver un garage</h1>
          <p className="mt-3 max-w-2xl text-lg text-on-primary/80">
            {garages.length} garages {tenant.name} pour vous accueillir.
          </p>
        </div>
      </section>
      <GarageFinder tenant={tenant} garages={garages} initialQuery={typeof q === "string" ? q.slice(0, 60) : ""} />
    </>
  );
}
