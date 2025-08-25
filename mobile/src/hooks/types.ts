export interface PaginatedHooksResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  loadPage: (page?: number, replace?: boolean) => Promise<void>;
  refresh: () => Promise<void> | void;
  loadMore: () => void;
}

export interface FeedPage {
  items: any[];
  total: number;
  page: number;
  limit: number;
}
