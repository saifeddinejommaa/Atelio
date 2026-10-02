"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import { tenantPath, type SiteTenant } from "@/tenants";

const navLinks = [
  { path: "/prestations", label: "Nos prestations" },
  { path: "/garages", label: "Trouver un garage" },
  { path: "/devis", label: "Devis en ligne" },
  { path: "/offres", label: "Offres du moment" },
];

export default function Header({ tenant }: { tenant: SiteTenant }) {
  const [open, setOpen] = useState(false);
  const href = (path: string) => tenantPath(tenant, path);

  return (
    <header className="sticky top-0 z-50 border-b border-on-primary/10 bg-primary text-on-primary">
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
          {navLinks.map((link) => (
            <Link key={link.path} href={href(link.path)} className="hover:text-secondary">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={href("/rendez-vous")}
            className="hidden rounded-brand bg-secondary px-5 py-2.5 text-sm font-semibold text-on-secondary transition-colors hover:bg-secondary-dark sm:inline-block"
          >
            Prendre rendez-vous
          </Link>
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
        <nav className="border-t border-on-primary/10 px-4 pb-4 lg:hidden">
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
          <Link
            href={href("/rendez-vous")}
            className="mt-2 block rounded-brand bg-secondary px-5 py-3 text-center font-semibold text-on-secondary"
            onClick={() => setOpen(false)}
          >
            Prendre rendez-vous
          </Link>
        </nav>
      )}
    </header>
  );
}
