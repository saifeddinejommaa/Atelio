import Link from "next/link";
import Logo from "@/components/Logo";
import type { Service } from "@/lib/services";
import { tenantPath, type SiteTenant } from "@/tenants";

export default function Footer({ tenant, services }: { tenant: SiteTenant; services: Service[] }) {
  const columns = [
    {
      title: "Nos prestations",
      links: services.slice(0, 6).map((s) => ({ path: `/prestations/${s.slug}`, label: s.name })),
    },
    {
      title: "Services",
      links: [
        { path: "/rendez-vous", label: "Prendre rendez-vous" },
        { path: "/devis", label: "Devis en ligne" },
        { path: "/garages", label: "Trouver un garage" },
        { path: "/offres", label: "Offres du moment" },
      ],
    },
    {
      title: tenant.name,
      links: [
        { path: "/a-propos", label: "Qui sommes-nous ?" },
        { path: "/contact", label: "Nous contacter" },
        { path: "/mentions-legales", label: "Mentions légales" },
        { path: "/confidentialite", label: "Confidentialité" },
      ],
    },
  ];

  return (
    <footer className="bg-primary print:hidden text-on-primary/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="text-on-primary">
          <Logo tenant={tenant} />
          <p className="mt-4 text-sm leading-6 text-on-primary/80">{tenant.tagline}</p>
          <p className="mt-3 text-sm text-on-primary/80">
            <a href={`tel:${tenant.contact.phone}`} className="hover:text-secondary">
              {tenant.contact.phoneLabel}
            </a>
            <br />
            <a href={`mailto:${tenant.contact.email}`} className="hover:text-secondary">
              {tenant.contact.email}
            </a>
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <p className="font-semibold text-on-primary">{col.title}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {col.links.map((link) => (
                <li key={link.path}>
                  <Link href={tenantPath(tenant, link.path)} className="hover:text-secondary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-on-primary/10 py-5 text-center text-xs">
        © {new Date().getFullYear()} {tenant.name}. Tous droits réservés.
      </div>
    </footer>
  );
}
