"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import Icon from "@/components/Icon";
import { confirmBooking } from "@/lib/booking-actions";
import type { DaySlots, Garage } from "@/lib/garages";
import { computeQuote, lookupVehicle } from "@/lib/quote";
import type { Service } from "@/lib/services";
import type { SessionUser } from "@/lib/session";
import { tenantPath, type SiteTenant } from "@/tenants";

const steps = ["Prestations", "Véhicule", "Garage", "Créneau", "Infos garage"];

const symptomOptions = [
  "Bruit inhabituel",
  "Voyant allumé",
  "Vibrations",
  "Fuite",
  "Démarrage difficile",
  "Odeur suspecte",
  "La voiture tire d'un côté",
];

function parseDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const weekday = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });
const dayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const longDate = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export default function BookingFlow({
  tenant,
  services,
  garages,
  slots,
  preselected,
  initialPlate,
  initialGarage,
  user,
}: {
  tenant: SiteTenant;
  services: Service[];
  garages: Garage[];
  slots: Record<string, DaySlots[]>;
  preselected: string[];
  initialPlate: string;
  initialGarage: string;
  user: SessionUser;
}) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>(preselected);
  const [plate, setPlate] = useState(initialPlate);
  const [mileage, setMileage] = useState("");
  const [garageId, setGarageId] = useState(initialGarage);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [pending, startTransition] = useTransition();

  const chosen = services.filter((s) => selected.includes(s.slug));
  // Prix exact si le véhicule est identifié par son immatriculation, sinon prix « à partir de ».
  const vehicle = lookupVehicle(plate);
  const priceOf = (s: Service) => (vehicle ? computeQuote([s], vehicle.category).totalTTC : s.priceFrom);
  const pricePrefix = vehicle ? "" : "dès ";
  const total = chosen.reduce((sum, s) => sum + priceOf(s), 0);
  const garage = garages.find((g) => g.id === garageId);
  const days = garageId ? slots[garageId] : [];
  const day = days.find((d) => d.date === date);

  const canContinue = [
    selected.length > 0,
    /^[A-Z]{2}-?\d{3}-?[A-Z]{2}$/i.test(plate.trim()),
    !!garageId,
    !!date && !!time,
    notes.length <= 1000,
  ][step];

  function toggle(slug: string) {
    setSelected((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const result = await confirmBooking({
        tenant: tenant.slug,
        services: selected,
        plate,
        mileage,
        garageId,
        date,
        time,
        symptoms,
        notes,
      });
      if (result.ok) setReference(result.reference);
      else setError(result.error);
    });
  }

  if (reference) {
    return (
      <div className="mt-8 rounded-brand bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-on-secondary">
          <Icon name="check" className="h-8 w-8" />
        </span>
        <h2 className="mt-5 text-2xl font-extrabold">Votre rendez-vous est confirmé</h2>
        <p className="mt-2 text-zinc-600">
          Référence <strong>{reference}</strong>
        </p>
        <p className="mt-6 first-letter:uppercase">
          {longDate.format(parseDay(date))} à {time.replace(":", "h")}
          <br />
          {tenant.name} {garage?.city}, {garage?.address}
        </p>
        <Link
          href={tenantPath(tenant)}
          className="mt-8 inline-block rounded-brand bg-secondary px-7 py-3 font-semibold text-on-secondary hover:bg-secondary-dark"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="rounded-brand bg-white p-6 shadow-sm sm:p-8">
        {/* Étapes */}
        <ol className="mb-8 flex gap-2">
          {steps.map((label, i) => (
            <li key={label} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-secondary" : "bg-zinc-200"}`} />
              <p className={`mt-2 hidden text-xs sm:block ${i === step ? "font-semibold" : "text-zinc-500"}`}>
                {i + 1}. {label}
              </p>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <>
            <h2 className="text-xl font-bold">Quelles prestations souhaitez-vous ?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {services.map((s) => {
                const on = selected.includes(s.slug);
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => toggle(s.slug)}
                    aria-pressed={on}
                    className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                      on ? "border-secondary bg-muted" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <Icon name={s.icon} className="h-6 w-6 shrink-0 text-primary" />
                    <span className="flex-1">
                      <span className="block font-semibold">{s.name}</span>
                      <span className="block text-sm text-zinc-500">{pricePrefix}{priceOf(s)} € · {s.duration}</span>
                    </span>
                    {on && <Icon name="check" className="h-5 w-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold">Votre véhicule</h2>
            <label htmlFor="plate" className="mt-5 block text-sm font-medium">Immatriculation</label>
            <div className="mt-2 flex max-w-sm overflow-hidden rounded-lg border-2 border-primary">
              <span className="flex w-10 items-center justify-center bg-blue-700 text-xs font-bold text-white">F</span>
              <input
                id="plate"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="AB-123-CD"
                className="w-full px-3 py-3 text-lg font-bold tracking-widest outline-none"
              />
            </div>
            <label htmlFor="mileage" className="mt-5 block text-sm font-medium">
              Kilométrage <span className="font-normal text-zinc-500">(facultatif)</span>
            </label>
            <input
              id="mileage"
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value.replace(/\D/g, ""))}
              placeholder="ex. 85000"
              className="mt-2 w-full max-w-sm rounded-lg border border-zinc-300 px-3 py-3 outline-none focus:border-primary"
            />
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold">Choisissez votre garage</h2>
            <div className="mt-5 space-y-3">
              {garages.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setGarageId(g.id);
                    setDate("");
                    setTime("");
                  }}
                  aria-pressed={garageId === g.id}
                  className={`flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-colors ${
                    garageId === g.id ? "border-secondary bg-muted" : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <Icon name="pin" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>
                    <span className="block font-semibold">{tenant.name} {g.city}</span>
                    <span className="block text-sm text-zinc-600">{g.address}, {g.postalCode}</span>
                    <span className="block text-sm text-zinc-500">{g.hours}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-xl font-bold">Choisissez votre créneau</h2>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => {
                const dt = parseDay(d.date);
                const free = d.slots.some((s) => s.available);
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={!free}
                    onClick={() => {
                      setDate(d.date);
                      setTime("");
                    }}
                    className={`w-16 shrink-0 rounded-lg border-2 py-2 text-center text-sm capitalize transition-colors disabled:opacity-40 ${
                      date === d.date ? "border-secondary bg-muted font-semibold" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {weekday.format(dt)}
                    <span className="block font-bold">{dayMonth.format(dt)}</span>
                  </button>
                );
              })}
            </div>
            {day ? (
              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {day.slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setTime(s.time)}
                    className={`rounded-lg border-2 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:border-zinc-100 disabled:text-zinc-300 disabled:line-through ${
                      time === s.time ? "border-secondary bg-secondary text-on-secondary" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {s.time.replace(":", "h")}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-zinc-500">Sélectionnez un jour pour voir les horaires disponibles.</p>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-xl font-bold">Quelque chose à signaler au garage ?</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Facultatif : ces informations aident le garage à préparer votre venue.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {symptomOptions.map((label) => {
                const on = symptoms.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setSymptoms((cur) => (on ? cur.filter((s) => s !== label) : [...cur, label]))
                    }
                    className={`rounded-full border-2 px-4 py-2 text-sm transition-colors ${
                      on ? "border-secondary bg-secondary text-on-secondary" : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <label htmlFor="notes" className="mt-6 block text-sm font-medium">
              Précisions sur votre véhicule
            </label>
            <textarea
              id="notes"
              rows={4}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ex. bruit à l'avant quand je freine, depuis une semaine"
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-3 outline-none focus:border-primary"
            />
            <p className="mt-4 text-sm text-zinc-500">
              Le garage vous contactera si besoin au {user.phone} ou à {user.email}.
            </p>
            {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          </>
        )}

        <div className="mt-8 flex justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className={`rounded-brand border border-zinc-300 px-6 py-3 font-semibold hover:border-primary ${step === 0 ? "invisible" : ""}`}
          >
            Retour
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => setStep(step + 1)}
              className="rounded-brand bg-secondary px-8 py-3 font-semibold text-on-secondary transition-colors hover:bg-secondary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuer
            </button>
          ) : (
            <button
              type="button"
              disabled={!canContinue || pending}
              onClick={submit}
              className="rounded-brand bg-secondary px-8 py-3 font-semibold text-on-secondary transition-colors hover:bg-secondary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "Confirmation…" : "Confirmer le rendez-vous"}
            </button>
          )}
        </div>
      </div>

      {/* Récapitulatif */}
      <aside className="h-fit rounded-brand bg-white p-6 shadow-sm lg:sticky lg:top-32">
        <h2 className="font-bold">Récapitulatif</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="text-zinc-500">Prestations</dt>
            <dd>
              {chosen.length ? (
                <ul className="mt-1 space-y-1">
                  {chosen.map((s) => (
                    <li key={s.slug} className="flex justify-between gap-2">
                      {s.name}
                      <span className="whitespace-nowrap text-zinc-500">{pricePrefix}{priceOf(s)} €</span>
                    </li>
                  ))}
                </ul>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Véhicule</dt>
            <dd>{plate || "—"}{vehicle && ` · ${vehicle.make} ${vehicle.model}`}{mileage && ` · ${Number(mileage).toLocaleString("fr-FR")} km`}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Garage</dt>
            <dd>{garage ? `${tenant.name} ${garage.city}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Date</dt>
            <dd className="first-letter:uppercase">
              {date && time ? `${longDate.format(parseDay(date))} à ${time.replace(":", "h")}` : "—"}
            </dd>
          </div>
          {(symptoms.length > 0 || notes) && (
            <div>
              <dt className="text-zinc-500">À signaler</dt>
              <dd className="break-words">{[...symptoms, notes.trim()].filter(Boolean).join(" · ")}</dd>
            </div>
          )}
          <div>
            <dt className="text-zinc-500">Contact</dt>
            <dd>
              {user.name}
              <br />
              {user.phone}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex items-baseline justify-between border-t border-zinc-200 pt-4">
          <span className="text-sm text-zinc-500">Total estimé</span>
          <span className="text-2xl font-extrabold text-primary">{pricePrefix}{total} €</span>
        </div>
        <p className="mt-2 text-xs text-zinc-500">Paiement au garage, après l&apos;intervention.</p>
      </aside>
    </div>
  );
}
