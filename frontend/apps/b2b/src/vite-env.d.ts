interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /** Domaine commun : chaque société est aussi accessible via <slug>.<domaine> (ex. gmg78.localhost). */
  readonly VITE_BRAND_BASE_DOMAIN?: string
  /** Tenant Microsoft Entra de Gustaya (connexion du personnel). */
  readonly VITE_ENTRA_TENANT_ID?: string
  /** Inscription d'application du back-office (application monopage). */
  readonly VITE_ENTRA_CLIENT_ID?: string
  /** Scope de l'API demandé dans le jeton, ex. api://<client id de l'API>/access_as_user. */
  readonly VITE_ENTRA_API_SCOPE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
