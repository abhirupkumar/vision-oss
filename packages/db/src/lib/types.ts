// Types stub - simplified for this package
export interface QueryFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  sort?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
}
