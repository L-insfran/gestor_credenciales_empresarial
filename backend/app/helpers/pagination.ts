import type { HttpContext } from '@adonisjs/core/http'

export function parsePagination(request: HttpContext['request']) {
  const page = Math.max(1, Number.parseInt(String(request.input('page', 1)), 10) || 1)
  const rawPer = Number.parseInt(String(request.input('perPage', 10)), 10) || 10
  const perPage = Math.min(100, Math.max(1, rawPer))
  return { page, perPage }
}

export function paginationMeta(paginator: {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  hasMorePages: boolean
}) {
  return {
    total: paginator.total,
    perPage: paginator.perPage,
    currentPage: paginator.currentPage,
    lastPage: paginator.lastPage,
    firstPage: paginator.firstPage,
    hasMorePages: paginator.hasMorePages,
  }
}
