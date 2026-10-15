import { getBrand } from '@atelio/core/data'
import type { Brand } from '@atelio/core/domain'

// Chaque société ouvre le back-office sur son propre domaine, ex. https://pro.mon-garage.fr.
// En dev (ou sur un domaine commun), <slug>.<VITE_BRAND_BASE_DOMAIN> marche aussi : gmg78.localhost, sej.localhost.
// Pour une nouvelle société : ajouter son domaine ici (la marque elle-même est dans core, brands/).
// À compléter avec le domaine de chaque société, ex. { slug: 'gmg78', domain: 'pro.mon-garage.fr' }.
const domains: { slug: string; domain: string }[] = [
  { slug: 'gmg78', domain: 'app.gmg-78.com' },
  // TEMPORAIRE : test sur l'adresse technique Azure, à retirer une fois app.gmg-78.com branché.
  { slug: 'gmg78', domain: 'ca-atelio-b2b.thankfulcoast-11fdaee5.francecentral.azurecontainerapps.io' },
]/** Marque correspondant au nom d'hôte, ou null si le domaine n'est pas reconnu. */
export function resolveBrandByHost(hostname: string, baseDomain = import.meta.env.VITE_BRAND_BASE_DOMAIN): Brand | null {
  const host = hostname.toLowerCase().replace(/^www\./, '')

  const slug =
    domains.find((d) => d.domain === host)?.slug ??
    (baseDomain && host.endsWith(`.${baseDomain}`) ? host.slice(0, -(baseDomain.length + 1)) : undefined)

  return (slug && getBrand(slug)) || null
}

/** Marque de la page courante, déterminée une fois au chargement de l'app. */
export const currentBrand = resolveBrandByHost(window.location.hostname)
