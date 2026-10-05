import { NextResponse, type NextRequest } from "next/server";
import { getTenantByHost, TENANT_BASE_HEADER } from "@/tenants";

// Accès à un client par son domaine (auto-express.com) ou un sous-domaine
// (auto-express.<TENANT_BASE_DOMAIN>) : on réécrit l'URL vers /<slug>/... sans
// changer ce que voit le visiteur. Sur le domaine commun, l'accès /<slug>/... reste possible.
export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const tenant = getTenantByHost(host, process.env.TENANT_BASE_DOMAIN);
  if (!tenant) {
    // Accès par /<slug>/... : on ignore un éventuel en-tête envoyé par le navigateur.
    const headers = new Headers(request.headers);
    headers.delete(TENANT_BASE_HEADER);
    return NextResponse.next({ request: { headers } });
  }

  const { pathname, search } = request.nextUrl;
  const prefix = `/${tenant.slug}`;

  // Ancien lien avec le slug sur le domaine du client : on le retire de l'URL.
  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(prefix.length) || "/";
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? prefix : `${prefix}${pathname}`;
  url.search = search;

  const headers = new Headers(request.headers);
  headers.set(TENANT_BASE_HEADER, "");
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Tout sauf les fichiers internes de Next.js et les fichiers statiques (logos, images...).
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
