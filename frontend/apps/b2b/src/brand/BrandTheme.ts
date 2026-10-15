import type { Brand, BrandFont } from '@atelio/core/domain'
import type { CSSProperties } from 'react'

// Mêmes polices que le site b2c (next/font), chargées ici depuis Google Fonts.
const fontFamilies: Record<BrandFont, { family: string; query: string }> = {
  geist: { family: 'Geist', query: 'Geist:wght@400;500;600;700;800' },
  inter: { family: 'Inter', query: 'Inter:wght@400;500;600;700;800' },
  montserrat: { family: 'Montserrat', query: 'Montserrat:wght@400;500;600;700;800' },
  poppins: { family: 'Poppins', query: 'Poppins:wght@400;500;600;700;800' },
  roboto: { family: 'Roboto', query: 'Roboto:wght@400;500;700;900' },
}

/** Variables CSS de la charte (voir index.css), comme sur le site b2c. */
export function themeStyle(brand: Brand): CSSProperties {
  const { theme } = brand
  return {
    '--tenant-primary': theme.primary,
    '--tenant-secondary': theme.secondary,
    '--tenant-on-primary': theme.onPrimary,
    '--tenant-on-secondary': theme.onSecondary,
    '--tenant-text': theme.text,
    '--tenant-muted': theme.muted,
    '--tenant-font': `'${fontFamilies[theme.font].family}', system-ui, sans-serif`,
    '--tenant-radius': theme.radius,
  } as CSSProperties
}

/** Charge la police de la marque, et met son nom et une clé à molette à ses couleurs dans l'onglet du navigateur. */
export function applyBrandToDocument(brand: Brand) {
  const fontHref = `https://fonts.googleapis.com/css2?family=${fontFamilies[brand.theme.font].query}&display=swap`
  setLink('brand-font', 'stylesheet', fontHref)
  setLink('brand-icon', 'icon', wrenchIcon(brand))
  document.title = `${brand.name} · Espace pro`
}

/** Icône de l'onglet : clé à molette sur un carré à la couleur de la marque (le logo est trop large pour 16 px). */
function wrenchIcon(brand: Brand) {
  const { primary, onPrimary } = brand.theme
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect width="32" height="32" rx="7" fill="${primary}"/>` +
    `<path transform="translate(4 4)" fill="none" stroke="${onPrimary}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ` +
    `d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>` +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function setLink(id: string, rel: string, href: string) {
  let link = document.getElementById(id) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = id
    link.rel = rel
    document.head.appendChild(link)
  }
  link.href = href
}
