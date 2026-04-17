const PER_PAGE_OPTIONS = [10, 25, 50, 100]

export default function PaginationBar({ meta, perPage, onPageChange, onPerPageChange }) {
  if (!meta) return null

  const { total, currentPage, lastPage } = meta
  const canPrev = currentPage > 1
  const canNext = currentPage < lastPage

  const btnClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-surface-600 dark:bg-surface-800 dark:text-slate-200 dark:hover:bg-surface-700'

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-surface-700 dark:bg-surface-900/50 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <span className="whitespace-nowrap font-medium">Mostrar</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="whitespace-nowrap">por página</span>
      </label>

      <p className="text-center text-sm text-slate-500 dark:text-slate-400 sm:text-left">
        Página <span className="font-semibold text-slate-800 dark:text-slate-200">{currentPage}</span> de{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">{lastPage}</span>
        <span className="mx-1 text-slate-400">·</span>
        <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span> registro
        {total !== 1 ? 's' : ''}
      </p>

      <div className="flex justify-center gap-2 sm:justify-end">
        <button type="button" className={btnClass} disabled={!canPrev} onClick={() => onPageChange(currentPage - 1)}>
          Anterior
        </button>
        <button type="button" className={btnClass} disabled={!canNext} onClick={() => onPageChange(currentPage + 1)}>
          Siguiente
        </button>
      </div>
    </div>
  )
}
