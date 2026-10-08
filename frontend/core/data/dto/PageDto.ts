/** Page de résultats renvoyée par l'API (PagedResponse). */
export type PageDto<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
