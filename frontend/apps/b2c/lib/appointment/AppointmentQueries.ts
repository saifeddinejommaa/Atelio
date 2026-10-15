import { MyAccountApiRepository } from "@atelio/core/data";
import { GetMyAppointments } from "@atelio/core/domain";
import { toAppointment, type Appointment } from "@/lib/appointment/appointments";
import { sessionApiClient } from "@/lib/session";

export type MyAppointments =
  | { status: "ok"; upcoming: Appointment[]; past: Appointment[] }
  | { status: "unknown-customer" }
  | { status: "unavailable" };

/** Rendez-vous du compte connecté : à venir (le plus proche d'abord), puis passés ou annulés. */
export async function getMyAppointments(tenantSlug: string): Promise<MyAppointments> {
  const api = await sessionApiClient(tenantSlug);
  if (!api) return { status: "unknown-customer" };

  try {
    const all = (await new GetMyAppointments(new MyAccountApiRepository(api)).execute()).map((a) => toAppointment(a));
    return {
      status: "ok",
      upcoming: all.filter((a) => a.upcoming).reverse(),
      past: all.filter((a) => !a.upcoming),
    };
  } catch (error) {
    console.error(`[api] rendez-vous indisponibles pour ${tenantSlug} :`, error);
    return { status: "unavailable" };
  }
}
