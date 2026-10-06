interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /** Domaine commun : chaque société est aussi accessible via <slug>.<domaine> (ex. gmg78.localhost). */
  readonly VITE_BRAND_BASE_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
