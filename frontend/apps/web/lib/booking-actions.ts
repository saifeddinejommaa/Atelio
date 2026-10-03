"use server";

import { getGarages } from "@/lib/garages";
import { getServices } from "@/lib/api/services";
import { getSessionUser } from "@/lib/session";
import { getTenant } from "@/tenants";

export type BookingRequest = {
  tenant: string;
  services: string[];
  plate: string;
  mileage: string;
  garageId: string;
  date: string;
  time: string;
  /** Symptômes cochés pour informer le garage. */
  symptoms: string[];
  /** Précisions libres pour le garage. */
  notes: string;
};

export type BookingResult = { ok: true; reference: string } | { ok: false; error: string };

// En attendant l'API .NET : on valide la demande et on renvoie une référence fictive.
// Plus tard, cette action appellera l'API du client, qui enregistrera le rendez-vous dans sa base
// avec les coordonnées du compte connecté.
export async function confirmBooking(input: BookingRequest): Promise<BookingResult> {
  // Les données viennent du navigateur : on ne fait confiance ni à leur forme ni à leur type.
  const req = normalize(input);
  const tenant = getTenant(req.tenant);
  if (!tenant) return { ok: false, error: "Client inconnu." };
  const user = await getSessionUser(tenant.slug);
  if (!user) return { ok: false, error: "Veuillez vous reconnecter." };

  const known = await getServices(tenant.slug);
  if (req.services.length === 0 || !req.services.every((code) => known.some((s) => s.slug === code)))
    return { ok: false, error: "Choisissez au moins une prestation." };
  if (!/^[A-Z]{2}-?\d{3}-?[A-Z]{2}$/i.test(req.plate.trim()))
    return { ok: false, error: "Immatriculation invalide (format AB-123-CD)." };
  if (!(await getGarages(tenant.slug)).some((g) => g.id === req.garageId)) return { ok: false, error: "Choisissez un garage." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(req.date) || !/^\d{2}:\d{2}$/.test(req.time))
    return { ok: false, error: "Choisissez un créneau." };
  if (req.notes.length > 1000) return { ok: false, error: "Votre message est trop long (1000 caractères max)." };

  const reference = `RDV-${Date.now().toString(36).toUpperCase()}`;
  return { ok: true, reference };
}

function normalize(input: unknown): BookingRequest {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const list = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
  return {
    tenant: str(o.tenant),
    services: list(o.services),
    plate: str(o.plate),
    mileage: str(o.mileage),
    garageId: str(o.garageId),
    date: str(o.date),
    time: str(o.time),
    symptoms: list(o.symptoms),
    notes: str(o.notes),
  };
}
