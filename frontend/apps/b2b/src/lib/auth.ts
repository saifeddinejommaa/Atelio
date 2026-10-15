import {
  BrowserAuthError,
  createStandardPublicClientApplication,
  InteractionRequiredAuthError,
  type AccountInfo,
  type IPublicClientApplication,
} from '@azure/msal-browser'

// Connexion du personnel avec son compte Microsoft (invité du tenant Gustaya, Microsoft Entra ID).
// Réglages : VITE_ENTRA_TENANT_ID, VITE_ENTRA_CLIENT_ID (back-office) et VITE_ENTRA_API_SCOPE (scope de l'API).

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID
const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID
const apiScope = import.meta.env.VITE_ENTRA_API_SCOPE

export type StaffSession = {
  account: AccountInfo
  /** Jeton d'accès à l'API, renouvelé sans interaction tant que la session Microsoft est valide. */
  getToken: () => Promise<string>
  logout: () => Promise<void>
}

export type AuthStart =
  | { status: 'signed-in'; session: StaffSession }
  | { status: 'signed-out'; login: () => Promise<void> }
  | { status: 'misconfigured' }

/** Ouvre MSAL, termine un retour de connexion Microsoft, et indique si une personne est connectée. */
export async function startAuth(): Promise<AuthStart> {
  if (!tenantId || !clientId || !apiScope) return { status: 'misconfigured' }

  const msal = await createStandardPublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      // Chaque marque a son domaine : on revient toujours sur celui de la page.
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    // Session conservée entre les onglets et après fermeture du navigateur.
    cache: { cacheLocation: 'localStorage' },
  })

  const result = await msal.handleRedirectPromise()
  const account = result?.account ?? msal.getActiveAccount() ?? msal.getAllAccounts()[0]
  const scopes = [apiScope]

  if (!account) {
    return { status: 'signed-out', login: () => msal.loginRedirect({ scopes, prompt: 'select_account' }) }
  }

  msal.setActiveAccount(account)
  return { status: 'signed-in', session: session(msal, account, scopes) }
}

function session(msal: IPublicClientApplication, account: AccountInfo, scopes: string[]): StaffSession {
  return {
    account,
    async getToken() {
      try {
        return (await msal.acquireTokenSilent({ scopes, account })).accessToken
      } catch (error) {
        // Renouvellement silencieux impossible (session Microsoft expirée, consentement requis, délai dépassé...) :
        // passage par la page Microsoft, qui revient seule ici si la session y est encore ouverte.
        if (error instanceof InteractionRequiredAuthError || error instanceof BrowserAuthError) {
          await msal.acquireTokenRedirect({ scopes, account })
        }
        throw error
      }
    },
    logout: () => msal.logoutRedirect({ account }),
  }
}
