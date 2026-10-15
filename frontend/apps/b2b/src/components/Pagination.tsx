import { pageCount, type Page } from '@atelio/core/domain'

/** Pages à afficher : la première, la dernière, la courante et ses voisines ; « … » entre les trous. */
function pageNumbers(current: number, count: number): (number | '…')[] {
  const pages = [...new Set([1, current - 1, current, current + 1, count])].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b)
  return pages.flatMap((p, i) => (i > 0 && p - pages[i - 1] > 1 ? (['…', p] as const) : [p]))
}

/** « 21–40 sur 134 interventions » et ‹ 1 2 3 … 7 ›. noun : [singulier, pluriel]. */
export default function Pagination<T>({
  page,
  onChange,
  noun,
}: {
  page: Page<T>
  onChange: (page: number) => void
  noun: [string, string]
}) {
  const count = pageCount(page)
  const first = (page.page - 1) * page.pageSize + 1
  const last = Math.min(page.page * page.pageSize, page.total)
  const button = 'flex h-8 min-w-8 items-center justify-center rounded-brand px-2 text-sm font-semibold'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3">
      <p className="text-sm text-zinc-600">
        {first}–{last} sur {page.total} {page.total > 1 ? noun[1] : noun[0]}
      </p>
      {count > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Page précédente"
            disabled={page.page === 1}
            onClick={() => onChange(page.page - 1)}
            className={`${button} text-zinc-600 hover:bg-muted disabled:opacity-30`}
          >
            ‹
          </button>
          {pageNumbers(page.page, count).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="px-1 text-zinc-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === page.page ? 'page' : undefined}
                onClick={() => onChange(p)}
                className={`${button} ${p === page.page ? 'bg-primary text-on-primary' : 'text-zinc-700 hover:bg-muted'}`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            aria-label="Page suivante"
            disabled={page.page === count}
            onClick={() => onChange(page.page + 1)}
            className={`${button} text-zinc-600 hover:bg-muted disabled:opacity-30`}
          >
            ›
          </button>
        </nav>
      )}
    </div>
  )
}
