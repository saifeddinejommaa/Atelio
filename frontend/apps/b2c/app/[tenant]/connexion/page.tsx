import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import Card from "@/components/ui/Card";
import { safeRedirect } from "@/lib/safe-redirect";
import { getSessionUser } from "@/lib/session";
import { resolveTenant } from "@/lib/tenant";
import { tenantPath } from "@/tenants";

export const metadata: Metadata = { title: "Se connecter" };

export default async function LoginPage({ params, searchParams }: PageProps<"/[tenant]/connexion">) {
  const tenant = await resolveTenant(params);
  // Page à rouvrir après la connexion (ex. la prise de rendez-vous).
  const { redirect: target } = await searchParams;
  const redirectTo = safeRedirect(target, tenantPath(tenant));

  if (await getSessionUser(tenant.slug)) redirect(redirectTo);

  const fromBooking = redirectTo.includes("/rendez-vous");

  return (
    <section className="bg-muted px-4 py-16">
      <Card padding="lg" className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold tracking-tight">Se connecter</h1>
        <p className="mt-2 text-sm text-zinc-600">
          {fromBooking
            ? "Connectez-vous pour prendre rendez-vous, vous serez redirigé juste après."
            : `Accédez à vos rendez-vous et devis ${tenant.name}.`}
        </p>

        <LoginForm tenant={tenant.slug} redirectTo={redirectTo} />

        {/* Compte de démonstration, à retirer quand l'API .NET gérera l'authentification */}
        <p className="mt-6 rounded-lg bg-muted p-3 text-sm text-zinc-600">
          Compte de démo : <strong>test@test.com</strong> / <strong>0000</strong>
        </p>
      </Card>
    </section>
  );
}
