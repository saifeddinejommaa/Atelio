import { AppointmentApiRepository } from "@atelio/core/data";
import { GetCustomerAppointments } from "@atelio/core/domain";
import { apiClient } from "@/lib/api";
import { toAppointment, type Appointment } from "@/lib/appointment/appointments";
import { getSessionCustomer } from "@/lib/customer/CustomerQueries";
import { getTenant } from "@/tenants";

export type MyAppointments =
  | { status: "ok"; upcoming: Appointment[]; past: Appointment[] }
  | { status: "unknown-customer" }
  | { status: "unavailable" };

/** Rendez-vous du compte connecté : à venir (le plus proche d'abord), puis passés ou annulés. */
export async function getMyAppointments(tenantSlug: string): Promise<MyAppointments> {
  const tenant = getTenant(tenantSlug);
  if (!tenant) return { status: "unknown-customer" };

  try {
    const customer = await getSessionCustomer(tenant.slug);
    if (!customer) return { status: "unknown-customer" };

    const repository = new AppointmentApiRepository(apiClient(tenant.apiTenant));
    const all = (await new GetCustomerAppointments(repository).execute(customer.id)).map((a) => toAppointment(a));
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
