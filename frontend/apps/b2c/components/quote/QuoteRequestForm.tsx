"use client";

import { useState, useTransition } from "react";
import { MAX_NOTES_LENGTH } from "@atelio/core/domain";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import type { Service } from "@/lib/garageService/services";
import { sendQuoteRequest } from "@/lib/quote/QuoteRequestActions";
import type { SessionUser } from "@/lib/session";
import type { Vehicle } from "@/lib/vehicle/vehicles";

const field = "mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-3 outline-none focus:border-primary";

/** Demande de devis du client connecté : véhicule, prestations et message, traités ensuite par le garage. */
export default function QuoteRequestForm({
  tenant,
  user,
  services,
  vehicles,
  initialPlate,
  preselected,
}: {
  tenant: string;
  user: SessionUser;
  services: Service[];
  vehicles: Vehicle[];
  initialPlate: string;
  preselected: string[];
}) {
  const [plate, setPlate] = useState(initialPlate || (vehicles.length === 1 ? vehicles[0].plate : ""));
  const [selected, setSelected] = useState<string[]>(preselected);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggle(slug: string) {
    setSelected((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await sendQuoteRequest(tenant, plate, selected, message);
      if (result.ok) setSent(true);
      else setError(result.error);
    });
  }

  if (sent) {
    return (
      <Card padding="responsive" className="text-center" role="status">
        <h2 className="text-xl font-bold">Nous avons bien reçu votre demande</h2>
        <p className="mt-2 text-zinc-600">
          Nous la traitons et vous recevrez un devis par e-mail dans les plus brefs délais.
        </p>
      </Card>
    );
  }

  return (
    <Card as="form" padding="responsive" onSubmit={submit} className="space-y-6">
      <div>
        <label htmlFor="plate" className="block text-sm font-medium">
          Immatriculation
        </label>
        <input
          id="plate"
          required
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder="Indiquez votre immatriculation"
          className={`${field} font-semibold uppercase tracking-wider placeholder:font-normal placeholder:normal-case placeholder:tracking-normal`}
        />
        {vehicles.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {vehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setPlate(v.plate)}
                aria-pressed={plate === v.plate}
                className={`rounded-full border px-3 py-1 text-sm ${plate === v.plate ? "border-primary bg-primary text-on-primary" : "border-zinc-300 bg-white"}`}
              >
                {v.plate}
              </button>
            ))}
          </div>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Prestations souhaitées</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {services.map((s) => (
            <label key={s.slug} className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-300 bg-white px-3 py-3 has-[:checked]:border-primary">
              <input type="checkbox" checked={selected.includes(s.slug)} onChange={() => toggle(s.slug)} className="h-4 w-4 accent-primary" />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="message" className="block text-sm font-medium">
          Message <span className="font-normal text-zinc-500">(facultatif)</span>
        </label>
        <textarea
          id="message"
          rows={4}
          maxLength={MAX_NOTES_LENGTH}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Indiquez toute précision utile pour votre devis"
          className={field}
        />
      </div>

      <div className="rounded-lg bg-muted p-4 text-sm">
        <p className="font-medium">Vos coordonnées</p>
        <p className="mt-1 text-zinc-600">
          {user.name}
          {user.email && ` · ${user.email}`}
          {user.phone && ` · ${user.phone}`}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth loading={pending} loadingText="Envoi…" disabled={selected.length === 0}>
        Envoyer ma demande
      </Button>
    </Card>
  );
}
