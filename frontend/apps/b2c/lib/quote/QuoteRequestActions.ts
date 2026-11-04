"use server";

import { ApiError, MyAccountApiRepository } from "@atelio/core/data";
import { RequestMyQuote, ValidationError } from "@atelio/core/domain";
import { getServices } from "@/lib/garageService/ServiceQueries";
import { sessionApiClient } from "@/lib/session";
import { getTenant } from "@/tenants";

export type QuoteRequestResult = { ok: true } | { ok: false; error: string };

/** Envoie la demande de devis du compte connecté au garage. */
export async function sendQuoteRequest(tenantSlug: string, plate: string, serviceCodes: string[], message: string): Promise<QuoteRequestResult> {
  // Action appelée par le navigateur : on ne fait confiance ni à la forme ni au type des données reçues.
  const tenant = getTenant(String(tenantSlug));
  if (!tenant) return { ok: false, error: "Site inconnu." };

  const api = await sessionApiClient(tenant.slug);
  if (!api) return { ok: false, error: "Veuillez vous reconnecter." };

  try {
    const services = await getServices(tenant.slug);
    const codes = Array.isArray(serviceCodes) ? serviceCodes : [];
    await new RequestMyQuote(new MyAccountApiRepository(api)).execute({
      plate: String(plate),
      serviceIds: services.filter((s) => codes.includes(s.slug)).map((s) => s.id),
      message: String(message),
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof ValidationError) return { ok: false, error: error.message };
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) return { ok: false, error: error.message };
    console.error("[api] demande de devis :", error);
    return { ok: false, error: "Le service est momentanément indisponible, merci de réessayer." };
  }
}
