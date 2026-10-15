import type { Brand } from '@atelio/core/domain'
import { useState } from 'react'

/** Écran de connexion du personnel (compte Microsoft), aux couleurs de la marque. */
export default function SignInPage({ brand, onSignIn }: { brand: Brand; onSignIn?: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm">
        <img src={brand.logo} alt="" className="mx-auto h-14 w-auto" />
        <h1 className="mt-5 text-xl font-extrabold tracking-tight">{brand.name} · Espace pro</h1>
        {onSignIn ? (
          <>
            <p className="mt-2 text-sm text-zinc-600">Connectez-vous avec le compte Microsoft sur lequel vous avez reçu l'invitation.</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setBusy(true)
                void onSignIn()
              }}
              className="mt-6 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {busy ? 'Redirection…' : 'Se connecter avec Microsoft'}
            </button>
          </>
        ) : (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-left text-sm text-amber-800">
            La connexion n'est pas configurée : renseignez VITE_ENTRA_TENANT_ID, VITE_ENTRA_CLIENT_ID et VITE_ENTRA_API_SCOPE (voir .env.example).
          </p>
        )}
      </div>
    </div>
  )
}
