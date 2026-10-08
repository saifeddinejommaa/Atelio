import { cookies } from "next/headers";
import { findMockUserByEmail } from "@/lib/MockUsers";

// Session de démonstration en attendant l'authentification de l'API .NET :
// l'e-mail du compte est stocké dans un cookie propre à chaque marque blanche.
export type SessionUser = { name: string; email: string; phone: string };

export function sessionCookieName(tenantSlug: string) {
  return `session_${tenantSlug}`;
}

export async function getSessionUser(tenantSlug: string): Promise<SessionUser | null> {
  const email = (await cookies()).get(sessionCookieName(tenantSlug))?.value;
  const user = email ? findMockUserByEmail(email) : undefined;
  return user ? { name: user.name, email: user.email, phone: user.phone } : null;
}
