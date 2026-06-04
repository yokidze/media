export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export const paginated = <T>(data: T[], meta: PaginationMeta): { data: T[]; meta: PaginationMeta } => ({
  data,
  meta
});
