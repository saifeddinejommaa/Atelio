"use server";

import { ApiError, AppointmentApiRepository } from "@atelio/core/data";
import {
  BookAppointment,
  CancelAppointment,
  GetGarageAvailability,
  ValidationError,
  type DayAvailability,
} from "@atelio/core/domain";
import { apiClient } from "@/lib/api";
import { getSessionCustomer } from "@/lib/customer/customer-queries";
import { CachedGarageRepository } from "@/lib/garage/cached-garage-repository";
import { getServices } from "@/lib/garage-service/service-queries";
import { getSessionUser } from "@/lib/session";
import { getTenant, type TenantConfig } from "@/tenants";

// Actions appelées par le navigateur : on ne fait confiance ni à la forme ni au type des données reçues.

export type BookingRequest = {
  tenant: string;
  /** Codes des prestations choisies. */
  services: string[];
  /** Véhicule déjà enregistré par le client, ou null pour utiliser l'immatriculation saisie. */
  vehicleId: number | null;
  plate: string;
  mileage: string;
  garageId: number;
  /** "2026-10-05" */
  date: string;
  /** "09:30" */
  time: string;
  /** Symptômes cochés pour informer le garage. */
  symptoms: string[];
  /** Précisions libres pour le garage. */
  notes: string;
};

export type BookingResult = { ok: true; reference: string } | { ok: false; error: string };
export type AvailabilityResult = { ok: true; days: DayAvailability[] } | { ok: false; error: string };
export type CancelResult = { ok: true } | { ok: false; error: string };

/** Créneaux du garage pour la durée totale des prestations choisies. */
export async function loadAvailability(tenantSlug: string, garageId: number, serviceCodes: string[]): Promise<AvailabilityResult> {
  const tenant = getTenant(String(tenantSlug));
  if (!tenant) return { ok: false, error: "Site inconnu." };

  try {
    const serviceIds = await toServiceIds(tenant, list(serviceCodes));
    const days = await new GetGarageAvailability(new CachedGarageRepository(tenant.apiTenant)).execute({
      garageId: toId(garageId),
      serviceIds,
    });
    return { ok: true, days };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "créneaux") };
  }
}

/** Enregistre le rendez-vous du compte connecté. */
export async function confirmBooking(input: BookingRequest): Promise<BookingResult> {
  const req = normalize(input);
  const tenant = getTenant(req.tenant);
  if (!tenant) return { ok: false, error: "Site inconnu." };
  if (!(await getSessionUser(tenant.slug))) return { ok: false, error: "Veuillez vous reconnecter." };

  try {
    const customer = await getSessionCustomer(tenant.slug);
    if (!customer) return { ok: false, error: `Votre compte client ${tenant.name} est introuvable. Contactez le garage.` };

    const notes = [req.symptoms.length ? `Symptômes : ${req.symptoms.join(", ")}.` : "", req.notes.trim()]
      .filter(Boolean)
      .join("\n");

    const booked = await new BookAppointment(appointments(tenant)).execute({
      customerId: customer.id,
      garageId: toId(req.garageId),
      serviceIds: await toServiceIds(tenant, req.services),
      scheduledAt: `${req.date}T${req.time}`,
      // L'API vérifie que le véhicule appartient bien au client.
      vehicleId: req.vehicleId ?? undefined,
      plate: req.vehicleId ? undefined : req.plate,
      mileage: req.mileage ? Number(req.mileage) : undefined,
      customerNotes: notes || undefined,
    });
    return { ok: true, reference: booked.reference };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "prise de rendez-vous") };
  }
}

/** Annule un rendez-vous du compte connecté. */
export async function cancelAppointment(tenantSlug: string, reference: string): Promise<CancelResult> {
  const tenant = getTenant(String(tenantSlug));
  if (!tenant) return { ok: false, error: "Site inconnu." };

  try {
    const customer = await getSessionCustomer(tenant.slug);
    if (!customer) return { ok: false, error: "Veuillez vous reconnecter." };

    await new CancelAppointment(appointments(tenant)).execute(String(reference), customer.id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "annulation") };
  }
}

function appointments(tenant: TenantConfig) {
  return new AppointmentApiRepository(apiClient(tenant.apiTenant));
}

/** Codes des prestations => identifiants de l'API. */
async function toServiceIds(tenant: TenantConfig, codes: string[]): Promise<number[]> {
  const services = await getServices(tenant.slug);
  const ids = codes.map((code) => services.find((s) => s.slug === code)?.id);
  if (ids.length === 0 || ids.some((id) => id === undefined)) throw new ValidationError("Choisissez au moins une prestation.");
  return ids as number[];
}

function toId(value: unknown): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError("Choisissez un garage.");
  return id;
}

/** Erreur à afficher : message métier tel quel, message générique pour une panne. */
function errorMessage(error: unknown, context: string): string {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return error.message;
  console.error(`[api] ${context} :`, error);
  return "Le service est momentanément indisponible, merci de réessayer.";
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function normalize(input: unknown): BookingRequest {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    tenant: str(o.tenant),
    services: list(o.services),
    vehicleId: Number.isInteger(o.vehicleId) && (o.vehicleId as number) > 0 ? (o.vehicleId as number) : null,
    plate: str(o.plate),
    mileage: str(o.mileage),
    garageId: Number(o.garageId),
    date: str(o.date),
    time: str(o.time),
    symptoms: list(o.symptoms),
    notes: str(o.notes),
  };
}
