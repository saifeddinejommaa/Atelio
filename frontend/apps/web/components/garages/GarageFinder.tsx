"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import type { Garage } from "@/lib/garages";
import { getService } from "@/lib/services";
import { tenantPath, type SiteTenant } from "@/tenants";

// Carte Google Maps sans clé API (iframe). Avant la mise en prod, passer à la Maps Embed API officielle :
// https://www.google.com/maps/embed/v1/place?key=<CLÉ>&q=<adresse>
function mapUrl(garage: Garage) {
  const query = `${garage.address}, ${garage.postalCode} ${garage.city.replace(/ \d+e$/, "")}, France`;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function GarageFinder({
  tenant,
  garages,
  initialQuery,
}: {
  tenant: SiteTenant;
  garages: Garage[];
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const results = garages.filter((g) => {
    const q = normalize(query.trim());
    return !q || normalize(`${g.city} ${g.postalCode} ${g.address}`).includes(q);
  });
  const [selectedId, setSelectedId] = useState(results[0]?.id ?? garages[0]?.id);
  const selected = garages.find((g) => g.id === selectedId) ?? results[0];

  return (
    <section className="bg-muted">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[24rem_1fr]">
        {/* Liste des garages */}
        <div className="flex flex-col gap-4 lg:h-[36rem]">
          <div className="flex items-center gap-2 rounded-brand bg-white px-4 shadow-sm">
            <Icon name="pin" className="h-5 w-5 text-zinc-400" />
            <label htmlFor="garage-search" className="sr-only">Ville ou code postal</label>
            <input
              id="garage-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                const q = normalize(e.target.value.trim());
                const first = garages.find((g) => normalize(`${g.city} ${g.postalCode} ${g.address}`).includes(q));
                if (first) setSelectedId(first.id);
              }}
              placeholder="Ville ou code postal"
              className="w-full py-3.5 outline-none"
            />
          </div>

          <p className="text-sm text-zinc-600">
            {results.length} garage{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
          </p>

          <ul className="space-y-3 lg:overflow-y-auto lg:pr-1">
            {results.map((g) => {
              const active = g.id === selected?.id;
              return (
                <li key={g.id}>
                  <div
                    className={`rounded-brand border-2 bg-white p-4 transition-colors ${
                      active ? "border-secondary" : "border-transparent"
                    }`}
                  >
                    <button type="button" onClick={() => setSelectedId(g.id)} className="w-full text-left">
                      <span className="block font-bold">{tenant.name} {g.city}</span>
                      <span className="mt-1 block text-sm text-zinc-600">
                        {g.address}, {g.postalCode}
                      </span>
                      <span className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500">
                        <Icon name="clock" className="h-4 w-4" /> {g.hours}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                        <Icon name="phone" className="h-4 w-4" /> {g.phone}
                      </span>
                    </button>
                    {active && (
                      <div className="mt-4 border-t border-zinc-100 pt-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Prestations</p>
                        <p className="mt-1 text-sm">
                          {g.services.length
                            ? g.services.map((s) => getService(s)?.name).filter(Boolean).join(", ")
                            : "Toutes nos prestations"}
                        </p>
                        <div className="mt-4 flex gap-2">
                          <Link
                            href={`${tenantPath(tenant, "/rendez-vous")}?garage=${g.id}`}
                            className="flex-1 rounded-brand bg-secondary py-2.5 text-center text-sm font-semibold text-on-secondary transition-colors hover:bg-secondary-dark"
                          >
                            Prendre rendez-vous
                          </Link>
                          <a
                            href={`tel:${g.phone.replace(/\s/g, "")}`}
                            className="rounded-brand border border-zinc-300 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary"
                          >
                            Appeler
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
            {results.length === 0 && (
              <li className="rounded-brand bg-white p-6 text-center text-sm text-zinc-600">
                Aucun garage ne correspond à « {query} ».
              </li>
            )}
          </ul>
        </div>

        {/* Carte */}
        <div className="order-first h-72 overflow-hidden rounded-brand bg-white shadow-sm lg:order-none lg:sticky lg:top-32 lg:h-[36rem]">
          {selected && (
            <iframe
              key={selected.id}
              title={`Carte : ${tenant.name} ${selected.city}`}
              src={mapUrl(selected)}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          )}
        </div>
      </div>
    </section>
  );
}
