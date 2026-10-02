"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import {
  computeQuote,
  formatPlate,
  lookupVehicle,
  vehicleCategories,
  type CategoryId,
  type Vehicle,
} from "@/lib/quote";
import type { Service } from "@/lib/services";
import { tenantPath, type SiteTenant } from "@/tenants";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function QuoteBuilder({
  tenant,
  services,
  initialPlate,
  preselected,
}: {
  tenant: SiteTenant;
  services: Service[];
  initialPlate: string;
  preselected: string[];
}) {
  const [plate, setPlate] = useState(initialPlate.toUpperCase());
  const [vehicle, setVehicle] = useState<Vehicle | null>(() => lookupVehicle(initialPlate));
  const [plateError, setPlateError] = useState(initialPlate && !lookupVehicle(initialPlate) ? "Immatriculation invalide (format AB-123-CD)." : "");
  const [manual, setManual] = useState(false);
  const [category, setCategory] = useState<CategoryId>(vehicle?.category ?? "citadine");
  const [selected, setSelected] = useState<string[]>(preselected);

  const vehicleKnown = !!vehicle || manual;
  const chosen = vehicleKnown ? services.filter((s) => selected.includes(s.slug)) : [];
  const quote = computeQuote(chosen, category);
  const categoryLabel = vehicleCategories.find((c) => c.id === category)?.label;

  function identify(e: React.FormEvent) {
    e.preventDefault();
    const found = lookupVehicle(plate);
    if (!found) {
      setVehicle(null);
      setPlateError("Immatriculation invalide (format AB-123-CD).");
      return;
    }
    setPlateError("");
    setManual(false);
    setVehicle(found);
    setCategory(found.category);
    setPlate(formatPlate(plate));
  }

  function toggle(slug: string) {
    setSelected((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  }

  const bookingParams = new URLSearchParams({ prestation: selected.join(",") });
  if (vehicle) bookingParams.set("immat", plate);
  const bookingHref = `${tenantPath(tenant, "/rendez-vous")}?${bookingParams}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        {/* 1. Véhicule */}
        <div className="rounded-brand bg-white p-6 shadow-sm sm:p-8">
          <h2 className="flex items-center gap-3 text-xl font-bold">
            <StepNumber n={1} /> Votre véhicule
          </h2>

          {!manual && (
            <form onSubmit={identify} className="mt-5">
              <label htmlFor="quote-plate" className="block text-sm font-medium">Immatriculation</label>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 overflow-hidden rounded-lg border-2 border-primary sm:max-w-xs">
                  <span className="flex w-10 items-center justify-center bg-blue-700 text-xs font-bold text-white">F</span>
                  <input
                    id="quote-plate"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    placeholder="AB-123-CD"
                    className="w-full px-3 py-3 text-lg font-bold tracking-widest outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-brand bg-primary px-6 py-3 font-semibold text-on-primary transition-opacity hover:opacity-90"
                >
                  Identifier
                </button>
              </div>
              {plateError && <p className="mt-2 text-sm text-red-600">{plateError}</p>}
            </form>
          )}

          {vehicle && !manual && (
            <div className="mt-5 flex items-center gap-4 rounded-lg bg-muted p-4">
              <Icon name="car" className="h-8 w-8 shrink-0 text-primary" />
              <div className="text-sm">
                <p className="font-bold">
                  {vehicle.make} {vehicle.model}
                </p>
                <p className="text-zinc-600">
                  {vehicle.year} · {vehicle.fuel} · {categoryLabel}
                </p>
              </div>
            </div>
          )}

          {manual && (
            <div className="mt-5">
              <p className="text-sm font-medium">Type de véhicule</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {vehicleCategories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={category === c.id}
                    onClick={() => setCategory(c.id)}
                    className={`rounded-lg border-2 p-3 text-left text-sm font-medium transition-colors ${
                      category === c.id ? "border-secondary bg-muted" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setManual(!manual);
              setVehicle(null);
              setPlateError("");
            }}
            className="mt-4 text-sm font-medium text-primary underline underline-offset-4"
          >
            {manual ? "Saisir mon immatriculation" : "Je n'ai pas mon immatriculation"}
          </button>
        </div>

        {/* 2. Prestations */}
        <div className={`rounded-brand bg-white p-6 shadow-sm sm:p-8 ${vehicleKnown ? "" : "pointer-events-none opacity-50"}`}>
          <h2 className="flex items-center gap-3 text-xl font-bold">
            <StepNumber n={2} /> Vos prestations
          </h2>
          {!vehicleKnown && <p className="mt-2 text-sm text-zinc-500">Identifiez d&apos;abord votre véhicule.</p>}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {services.map((s) => {
              const on = selected.includes(s.slug);
              const price = computeQuote([s], category).totalTTC;
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => toggle(s.slug)}
                  aria-pressed={on}
                  disabled={!vehicleKnown}
                  className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                    on ? "border-secondary bg-muted" : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <Icon name={s.icon} className="h-6 w-6 shrink-0 text-primary" />
                  <span className="flex-1">
                    <span className="block font-semibold">{s.name}</span>
                    <span className="block text-sm text-zinc-500">{euro.format(price)} · {s.duration}</span>
                  </span>
                  {on && <Icon name="check" className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Devis */}
      <aside className="h-fit rounded-brand bg-white p-6 shadow-sm lg:sticky lg:top-32">
        <h2 className="text-lg font-bold">Votre devis</h2>
        <p className="text-sm text-zinc-500">
          {vehicle ? `${vehicle.make} ${vehicle.model} · ${plate}` : manual ? categoryLabel : "Véhicule non renseigné"}
        </p>

        {quote.lines.length === 0 ? (
          <p className="mt-6 text-sm text-zinc-500">Sélectionnez une ou plusieurs prestations pour voir votre prix.</p>
        ) : (
          <>
            <ul className="mt-5 space-y-4 text-sm">
              {quote.lines.map((l) => (
                <li key={l.service.slug}>
                  <div className="flex justify-between gap-2 font-semibold">
                    {l.service.name}
                    <span>{euro.format(l.total)}</span>
                  </div>
                  <div className="mt-0.5 flex justify-between text-xs text-zinc-500">
                    <span>Pièces {euro.format(l.parts)} · Main-d&apos;œuvre {euro.format(l.labour)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-1 border-t border-zinc-200 pt-4 text-sm">
              <div className="flex justify-between text-zinc-500">
                <dt>Total HT</dt>
                <dd>{euro.format(quote.totalHT)}</dd>
              </div>
              <div className="flex justify-between text-zinc-500">
                <dt>TVA 20 %</dt>
                <dd>{euro.format(quote.vat)}</dd>
              </div>
              <div className="flex items-baseline justify-between pt-2">
                <dt className="font-semibold">Total TTC</dt>
                <dd className="text-3xl font-extrabold text-primary">{euro.format(quote.totalTTC)}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-zinc-500">
              Prix garanti 30 jours chez {tenant.name}, pièces et main-d&apos;œuvre comprises.
            </p>

            <Link
              href={bookingHref}
              className="mt-6 block rounded-brand bg-secondary py-3.5 text-center font-semibold text-on-secondary transition-colors hover:bg-secondary-dark"
            >
              Prendre rendez-vous
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="mt-3 w-full rounded-brand border border-zinc-300 py-3 text-sm font-semibold transition-colors hover:border-primary"
            >
              Imprimer le devis
            </button>
          </>
        )}
      </aside>
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold text-on-secondary">
      {n}
    </span>
  );
}
