import { AppointmentStatus } from "@atelio/core/domain";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CancelAppointmentButton from "@/components/appointments/CancelAppointmentButton";
import Icon from "@/components/Icon";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getMyAppointments } from "@/lib/appointment/AppointmentQueries";
import type { Appointment } from "@/lib/appointment/appointments";
import { getSessionUser } from "@/lib/session";
import { resolveTenant } from "@/lib/tenant";
import { tenantPath, type SiteTenant } from "@/tenants";

export const metadata: Metadata = { title: "Mes rendez-vous" };

export default async function MyAppointmentsPage({ params }: PageProps<"/[tenant]/mes-rendez-vous">) {
  const tenant = await resolveTenant(params);

  // Non connecté : on passe par la connexion, puis on revient ici.
  if (!(await getSessionUser(tenant.slug))) {
    const back = tenantPath(tenant, "/mes-rendez-vous");
    redirect(`${tenantPath(tenant, "/connexion")}?redirect=${encodeURIComponent(back)}`);
  }

  const result = await getMyAppointments(tenant.slug);

  return (
    <section className="bg-muted">
      <div className="mx-auto max-w-4xl px-4 py-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Mes rendez-vous</h1>
          <Button as={Link} href={tenantPath(tenant, "/rendez-vous")}>
            Prendre rendez-vous
          </Button>
        </div>

        {result.status === "unavailable" && (
          <Notice>Vos rendez-vous sont momentanément indisponibles, merci de réessayer dans quelques instants.</Notice>
        )}
        {result.status === "unknown-customer" && (
          <Notice>
            Votre compte client {tenant.name} est introuvable. Contactez-nous au {tenant.contact.phoneLabel}.
          </Notice>
        )}

        {result.status === "ok" && (
          <>
            <h2 className="mt-10 text-lg font-bold">À venir</h2>
            {result.upcoming.length === 0 ? (
              <Notice>Aucun rendez-vous à venir.</Notice>
            ) : (
              <ul className="mt-4 space-y-4">
                {result.upcoming.map((a) => (
                  <AppointmentCard key={a.reference} tenant={tenant} appointment={a} />
                ))}
              </ul>
            )}

            {result.past.length > 0 && (
              <>
                <h2 className="mt-10 text-lg font-bold">Historique</h2>
                <ul className="mt-4 space-y-4">
                  {result.past.map((a) => (
                    <AppointmentCard key={a.reference} tenant={tenant} appointment={a} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <Card as="p" className="mt-4 text-zinc-600">
      {children}
    </Card>
  );
}

function AppointmentCard({ tenant, appointment: a }: { tenant: SiteTenant; appointment: Appointment }) {
  const muted = a.status === AppointmentStatus.Cancelled || !a.upcoming;
  return (
    <Card as="li" className={muted ? "text-zinc-500" : undefined}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold first-letter:uppercase text-foreground">
            {a.date} à {a.time}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm">
            <Icon name="pin" className="h-4 w-4 shrink-0" />
            {tenant.name} {a.garageName}, {a.garageAddress}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            a.status === AppointmentStatus.Confirmed || a.status === AppointmentStatus.Pending
              ? "bg-secondary text-on-secondary"
              : a.status === AppointmentStatus.Cancelled || a.status === AppointmentStatus.NoShow
                ? "bg-red-50 text-red-700"
                : "bg-muted text-zinc-600"
          }`}
        >
          {a.statusLabel}
        </span>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-zinc-500">Prestations</dt>
          <dd>{a.services.join(", ") || "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Véhicule</dt>
          <dd>{a.plate}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Référence</dt>
          <dd className="font-mono">{a.reference}</dd>
        </div>
      </dl>
      {a.notes && <p className="mt-3 whitespace-pre-line text-sm">{a.notes}</p>}
      {a.cancellable && (
        <div className="mt-5 border-t border-zinc-100 pt-4">
          <CancelAppointmentButton tenant={tenant.slug} reference={a.reference} />
        </div>
      )}
    </Card>
  );
}
