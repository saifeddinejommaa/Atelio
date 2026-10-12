import Link from "next/link";
import { tenantPath, type SiteTenant } from "@/tenants";

export default function Logo({ tenant }: { tenant: SiteTenant }) {
  return (
    <Link
      href={tenantPath(tenant)}
      className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight sm:text-2xl"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- logo client SVG/PNG de taille libre */}
      <img src={tenant.logo} alt="" className="h-10 w-auto" />
      {tenant.name}
    </Link>
  );
}
