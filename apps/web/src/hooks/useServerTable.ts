"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

export type SortDirection = "asc" | "desc";

export interface ServerTableState<TSortBy extends string> {
  page: number;
  search: string;
  sortBy: TSortBy;
  sortDir: SortDirection;
}

export interface ServerTableActions<TSortBy extends string> {
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  toggleSort: (column: TSortBy) => void;
  setSort: (sortBy: TSortBy, sortDir: SortDirection) => void;
  reset: () => void;
}

export interface UseServerTableOptions<TSortBy extends string> {
  defaultSortBy: TSortBy;
  defaultSortDir?: SortDirection;
  debounceMs?: number;
}

export interface UseServerTableReturn<TSortBy extends string> {
  /** Current state (with debounced search for queries) */
  state: ServerTableState<TSortBy>;
  /** Immediate search value for input binding */
  searchInput: string;
  /** Actions to modify state */
  actions: ServerTableActions<TSortBy>;
  /** Query params ready for tRPC (page converted to offset) */
  queryParams: {
    offset: number;
    search: string | undefined;
    sortBy: TSortBy;
    sortDir: SortDirection;
  };
}

export function useServerTable<TSortBy extends string>(
  options: UseServerTableOptions<TSortBy>,
  itemsPerPage: number,
): UseServerTableReturn<TSortBy> {
  const { defaultSortBy, defaultSortDir = "desc", debounceMs = 400 } = options;

  // Core state
  const [page, setPageState] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<TSortBy>(defaultSortBy);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);

  // Debounce search
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevDebouncedSearch = useRef(debouncedSearch);

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchInput, debounceMs]);

  // Reset page when debounced search actually changes
  useEffect(() => {
    if (debouncedSearch !== prevDebouncedSearch.current) {
      setPageState(0);
      prevDebouncedSearch.current = debouncedSearch;
    }
  }, [debouncedSearch]);

  // Actions
  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);
  }, []);

  const setSearch = useCallback((search: string) => {
    setSearchInput(search);
  }, []);

  const toggleSort = useCallback(
    (column: TSortBy) => {
      if (sortBy === column) {
        // Toggle direction
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        // New column, default to desc
        setSortBy(column);
        setSortDir("desc");
      }
      // Reset to first page on sort change
      setPageState(0);
    },
    [sortBy],
  );

  const setSort = useCallback(
    (newSortBy: TSortBy, newSortDir: SortDirection) => {
      setSortBy(newSortBy);
      setSortDir(newSortDir);
      setPageState(0);
    },
    [],
  );

  const reset = useCallback(() => {
    setPageState(0);
    setSearchInput("");
    setDebouncedSearch("");
    setSortBy(defaultSortBy);
    setSortDir(defaultSortDir);
  }, [defaultSortBy, defaultSortDir]);

  // Memoized state object
  const state = useMemo<ServerTableState<TSortBy>>(
    () => ({
      page,
      search: debouncedSearch,
      sortBy,
      sortDir,
    }),
    [page, debouncedSearch, sortBy, sortDir],
  );

  // Memoized actions object
  const actions = useMemo<ServerTableActions<TSortBy>>(
    () => ({
      setPage,
      setSearch,
      toggleSort,
      setSort,
      reset,
    }),
    [setPage, setSearch, toggleSort, setSort, reset],
  );

  // Query params for tRPC
  const queryParams = useMemo(
    () => ({
      offset: page * itemsPerPage,
      search: debouncedSearch || undefined,
      sortBy,
      sortDir,
    }),
    [page, itemsPerPage, debouncedSearch, sortBy, sortDir],
  );

  return {
    state,
    searchInput,
    actions,
    queryParams,
  };
}
