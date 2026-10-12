"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import { logout } from "@/lib/AuthActions";
import { priceLabel, type Service } from "@/lib/garageService/services";
import type { SessionUser } from "@/lib/session";
import { tenantPath, type SiteTenant } from "@/tenants";

const navLinks = [
  { path: "/garages", label: "Trouver un garage" },
  { path: "/devis", label: "Devis en ligne" },
  { path: "/offres", label: "Offres du moment" },
];

export default function Header({
  tenant,
  user,
  services,
}: {
  tenant: SiteTenant;
  user: SessionUser | null;
  services: Service[];
}) {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const href = (path: string) => tenantPath(tenant, path);

  // Ferme le menu après un clic : l'en-tête reste affiché pendant la navigation.
  const closeServices = () => {
    setServicesOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
  };

  return (
    <header className="sticky top-0 z-50 print:hidden border-b border-on-primary/10 bg-primary text-on-primary">
      <div className="hidden bg-primary-light text-xs sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <span>{tenant.content.topBanner}</span>
          <a href={`tel:${tenant.contact.phone}`} className="flex items-center gap-1.5 hover:text-secondary">
            <Icon name="phone" className="h-3.5 w-3.5" />
            {tenant.contact.phoneLabel}
          </a>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-4">
        <Logo tenant={tenant} />

        <nav className="hidden items-center gap-7 text-sm font-medium lg:flex">
          {/* Menu déroulant des prestations : s'ouvre au survol ou au clavier, se ferme au clic */}
          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
            onFocus={() => setServicesOpen(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) setServicesOpen(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setServicesOpen(false);
            }}
          >
            <button
              type="button"
              className="flex items-center gap-1 py-2 hover:text-secondary"
              aria-haspopup="true"
              aria-expanded={servicesOpen}
              onClick={() => setServicesOpen(true)}
            >
              Nos prestations
              <svg viewBox="0 0 20 20" fill="currentColor" className={`h-4 w-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`} aria-hidden="true">
                <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4Z" />
              </svg>
            </button>
            <div
              className={`absolute left-1/2 top-full w-[40rem] -translate-x-1/2 pt-3 transition-opacity ${
                servicesOpen ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              <div className="grid grid-cols-2 gap-1 rounded-brand bg-white p-3 text-foreground shadow-xl ring-1 ring-black/5">
                {services.map((s) => (
                  <Link
                    key={s.slug}
                    href={href(`/prestations/${s.slug}`)}
                    className="flex items-center gap-3 rounded-lg p-3 hover:bg-muted"
                    onClick={closeServices}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                      <Icon name={s.icon} className="h-5 w-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">{s.name}</span>
                      <span className="block text-xs text-zinc-500">{priceLabel(s)}</span>
                    </span>
                  </Link>
                ))}
                <Link
                  href={href("/prestations")}
                  className="col-span-2 mt-1 rounded-lg bg-muted p-3 text-center font-semibold text-primary hover:underline"
                  onClick={closeServices}
                >
                  Voir toutes les prestations
                </Link>
              </div>
            </div>
          </div>

          {navLinks.map((link) => (
            <Link key={link.path} href={href(link.path)} className="hover:text-secondary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <AccountLink tenant={tenant} user={user} className="hidden md:flex" />
          {/* max-sm:hidden plutôt que hidden : il l'emporte sur le inline-flex du bouton */}
          <Button as={Link} href={href("/rendez-vous")} size="sm" className="max-sm:hidden">
            Prendre rendez-vous
          </Button>
          <button
            type="button"
            className="lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} className="h-7 w-7" />
          </button>
        </div>
      </div>

      {open && (
        <nav className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-on-primary/10 px-4 pb-4 lg:hidden">
          <p className="pt-3 text-xs font-semibold uppercase tracking-wider text-on-primary/60">Nos prestations</p>
          {services.map((s) => (
            <Link
              key={s.slug}
              href={href(`/prestations/${s.slug}`)}
              className="flex justify-between py-2.5 hover:text-secondary"
              onClick={() => setOpen(false)}
            >
              {s.name}
              <span className="text-sm text-on-primary/60">{priceLabel(s, "dès ")}</span>
            </Link>
          ))}
          <div className="my-2 border-t border-on-primary/10" />
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={href(link.path)}
              className="block py-3 font-medium hover:text-secondary"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <AccountLink tenant={tenant} user={user} className="flex py-3 md:hidden" />
          <Button as={Link} href={href("/rendez-vous")} fullWidth className="mt-2" onClick={() => setOpen(false)}>
            Prendre rendez-vous
          </Button>
        </nav>
      )}
    </header>
  );
}

function AccountLink({
  tenant,
  user,
  className,
}: {
  tenant: SiteTenant;
  user: SessionUser | null;
  className: string;
}) {
  if (!user) {
    return (
      <Link
        href={tenantPath(tenant, "/connexion")}
        className={`${className} items-center gap-2 text-sm font-medium hover:text-secondary`}
      >
        <UserIcon />
        Se connecter
      </Link>
    );
  }

  return (
    <div className={`${className} group relative items-center`}>
      <button type="button" className="flex items-center gap-2 text-sm font-medium hover:text-secondary">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-on-secondary">
          {user.name.charAt(0).toUpperCase()}
        </span>
        {user.name}
      </button>
      <div className="invisible absolute right-0 top-full z-10 pt-2 opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="w-44 rounded-brand bg-white p-2 text-foreground shadow-xl ring-1 ring-black/5">
          <Link href={tenantPath(tenant, "/mes-rendez-vous")} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
            Mes rendez-vous
          </Link>
          <form action={logout}>
            <input type="hidden" name="tenant" value={tenant.slug} />
            <input type="hidden" name="redirectTo" value={tenantPath(tenant)} />
            <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted">
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
    </svg>
  );
}
