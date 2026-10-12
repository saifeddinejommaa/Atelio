/** Une page de résultats et le nombre total d'éléments correspondant aux filtres. */
export type Page<T> = {
  items: T[];
  total: number;
  /** Numéro de page, à partir de 1. */
  page: number;
  pageSize: number;
};

/** Nombre de pages (au moins 1). */
export function pageCount(page: Pick<Page<unknown>, "total" | "pageSize">): number {
  return Math.max(1, Math.ceil(page.total / page.pageSize));
}
