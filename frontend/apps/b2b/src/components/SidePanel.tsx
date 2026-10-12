import type { ReactNode } from 'react'

/** Panneau latéral à droite, au-dessus de la page (fond grisé : clic pour fermer). */
export default function SidePanel({
  title,
  wide = false,
  subtitle,
  onClose,
  footer,
  children,
}: {
  title: string
  /** Panneau plus large (formulaires en tableau). */
  wide?: boolean
  subtitle?: ReactNode
  onClose: () => void
  /** Zone fixe en bas (boutons d'action). */
  footer?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 cursor-default bg-black/30" />
      <aside className={`relative flex h-full w-full flex-col bg-white shadow-2xl ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <header className="border-b border-zinc-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              {subtitle && <div className="mt-1 text-sm text-zinc-600">{subtitle}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-brand px-2 py-1 text-xl leading-none text-zinc-400 hover:bg-muted hover:text-zinc-700"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        </header>
        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="border-t border-zinc-200 px-6 py-4">{footer}</div>}
      </aside>
    </div>
  )
}
