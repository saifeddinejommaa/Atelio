"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findMockUser } from "@/lib/mock-users";
import { safeRedirect } from "@/lib/safe-redirect";
import { sessionCookieName } from "@/lib/session";
import { getTenant } from "@/tenants";

// Connexion de démonstration avec les comptes de lib/mock-users.ts,
// en attendant l'authentification de l'API .NET.

export type LoginState = { error: string; email: string } | null;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const tenant = getTenant(String(formData.get("tenant")));
  const email = String(formData.get("email") ?? "");
  if (!tenant) return { error: "Site inconnu.", email };

  const user = findMockUser(email, String(formData.get("password") ?? ""));
  if (!user) return { error: "E-mail ou mot de passe incorrect.", email };

  (await cookies()).set(sessionCookieName(tenant.slug), user.email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(safeRedirect(formData.get("redirectTo")));
}

export async function logout(formData: FormData) {
  const tenant = getTenant(String(formData.get("tenant")));
  if (tenant) (await cookies()).delete(sessionCookieName(tenant.slug));
  redirect(safeRedirect(formData.get("redirectTo")));
}
