import type { ReactNode } from 'react'

type Icon = 'edit' | 'disable' | 'enable' | 'delete'

const icons: Record<Icon, ReactNode> = {
  // Crayon.
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  // Œil barré : ne plus afficher.
  disable: (
    <>
      <path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.7 2.7" />
      <path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </>
  ),
  // Œil : afficher de nouveau.
  enable: (
    <>
      <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  // Corbeille.
  delete: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </>
  ),
}

const tones: Record<Icon, string> = {
  edit: 'text-zinc-500 hover:bg-muted hover:text-zinc-900',
  disable: 'text-zinc-500 hover:bg-amber-50 hover:text-amber-700',
  enable: 'text-zinc-500 hover:bg-emerald-50 hover:text-emerald-700',
  delete: 'text-zinc-500 hover:bg-red-50 hover:text-red-700',
}

/** Action d'une ligne de tableau sous forme d'icône ; label : infobulle et nom lu par les lecteurs d'écran. */
export default function IconButton({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: Icon
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-brand transition-colors disabled:opacity-40 ${tones[icon]}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
        {icons[icon]}
      </svg>
    </button>
  )
}
