import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fonts } from "@/lib/fonts";
import { getServices } from "@/lib/garageService/ServiceQueries";
import { getSessionUser } from "@/lib/session";
import { resolveTenant } from "@/lib/tenant";
import { getTenant } from "@/tenants";

export async function generateMetadata({ params }: LayoutProps<"/[tenant]">): Promise<Metadata> {
  const tenant = getTenant((await params).tenant);
  if (!tenant) return {};
  return {
    title: { default: tenant.name, template: `%s | ${tenant.name}` },
    description: tenant.tagline,
    icons: { icon: tenant.logo },
  };
}

export default async function TenantLayout({ children, params }: LayoutProps<"/[tenant]">) {
  const tenant = await resolveTenant(params);

  const services = await getServices(tenant.slug);
  const { theme } = tenant;
  const themeVars = {
    "--tenant-primary": theme.primary,
    "--tenant-secondary": theme.secondary,
    "--tenant-on-primary": theme.onPrimary,
    "--tenant-on-secondary": theme.onSecondary,
    "--tenant-text": theme.text,
    "--tenant-muted": theme.muted,
    "--tenant-font": fonts[theme.font].style.fontFamily,
    "--tenant-radius": theme.radius,
  } as React.CSSProperties;

  return (
    <div style={themeVars} className="flex flex-1 flex-col bg-white font-sans text-foreground">
      <Header tenant={tenant} user={await getSessionUser(tenant.slug)} services={services} />
      <main className="flex-1">{children}</main>
      <Footer tenant={tenant} services={services} />
    </div>
  );
}
