"use server";

import { redirect } from "next/navigation";
import { ApiError, CustomerAuthApiRepository } from "@atelio/core/data";
import { RegisterAccount, RequestLoginCode, ValidationError, VerifyLoginCode, type CustomerLogin } from "@atelio/core/domain";
import { apiClient } from "@/lib/api";
import { safeRedirect } from "@/lib/SafeRedirect";
import { closeSession, openSession } from "@/lib/session";
import { getTenant } from "@/tenants";

// Connexion par code envoyé par e-mail, en trois étapes :
// e-mail => code à 6 chiffres => (nouveau client seulement) prénom, nom, téléphone.

export type LoginState = {
  step: "email" | "code" | "signup";
  email: string;
  /** Preuve de l'e-mail vérifié, pour créer le compte (15 min). */
  signupToken?: string;
  error?: string;
  info?: string;
};

export async function loginStep(prev: LoginState, formData: FormData): Promise<LoginState> {
  const tenant = getTenant(String(formData.get("tenant")));
  if (!tenant) return { ...prev, error: "Site inconnu." };

  const repository = new CustomerAuthApiRepository(apiClient(tenant.apiTenant));
  const action = String(formData.get("action") ?? "");
  const redirectTo = safeRedirect(formData.get("redirectTo"));
  const email = String(formData.get("email") ?? prev.email);

  let login: CustomerLogin;
  try {
    switch (action) {
      case "send": {
        await new RequestLoginCode(repository).execute(email);
        return { step: "code", email: email.trim().toLowerCase(), info: `Un code vient d'être envoyé à ${email.trim()}.` };
      }
      case "change-email":
        return { step: "email", email: prev.email };
      case "verify":
        login = await new VerifyLoginCode(repository).execute(prev.email, String(formData.get("code") ?? ""));
        break;
      case "register":
        login = await new RegisterAccount(repository).execute(prev.signupToken ?? "", {
          firstName: String(formData.get("firstName") ?? ""),
          lastName: String(formData.get("lastName") ?? ""),
          phone: String(formData.get("phone") ?? ""),
        });
        break;
      default:
        return prev;
    }
  } catch (error) {
    // Garde l'e-mail saisi pour que le client n'ait pas à le retaper.
    return { ...prev, email: action === "send" ? email : prev.email, info: undefined, error: errorMessage(error) };
  }

  if (login.kind === "signup") return { step: "signup", email: prev.email, signupToken: login.signupToken };

  await openSession(tenant.slug, login);
  redirect(redirectTo);
}

export async function logout(formData: FormData) {
  const tenant = getTenant(String(formData.get("tenant")));
  if (tenant) await closeSession(tenant.slug);
  redirect(safeRedirect(formData.get("redirectTo")));
}

function errorMessage(error: unknown): string {
  if (error instanceof ValidationError) return error.message;
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return error.message;
  console.error("[api] connexion :", error);
  return "Le service est momentanément indisponible, merci de réessayer.";
}
