/** Domaine qui ne correspond à aucune société. */
export default function UnknownSitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">Espace introuvable</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Cette adresse ne correspond à aucun espace pro. Vérifiez l&apos;adresse fournie par votre société.
        </p>
      </div>
    </div>
  )
}
