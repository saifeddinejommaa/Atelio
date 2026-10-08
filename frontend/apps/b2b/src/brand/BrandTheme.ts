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

/** Charge la police de la marque, et met son nom et son logo dans l'onglet du navigateur. */
export function applyBrandToDocument(brand: Brand) {
  const fontHref = `https://fonts.googleapis.com/css2?family=${fontFamilies[brand.theme.font].query}&display=swap`
  setLink('brand-font', 'stylesheet', fontHref)
  setLink('brand-icon', 'icon', brand.logo)
  document.title = `${brand.name} · Espace pro`
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
