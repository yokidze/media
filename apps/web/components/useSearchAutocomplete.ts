'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { SearchAutocompleteItem } from '@/lib/types';

interface ArchiveItemsResponse {
  query: string;
  results: SearchAutocompleteItem[];
}

export function useSearchAutocomplete(query: string, limit = 6): {
  items: SearchAutocompleteItem[];
  loading: boolean;
  hasQuery: boolean;
} {
  const [items, setItems] = useState<SearchAutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasQuery, setHasQuery] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    const nextHasQuery = trimmed.length >= 2;

    setHasQuery(nextHasQuery);

    if (!nextHasQuery) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await apiFetch<ArchiveItemsResponse>(`/search/autocomplete?q=${encodeURIComponent(trimmed)}&limit=${limit}`, {
          signal: controller.signal
        });

        setItems(response.results ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setItems([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, limit]);

  return { items, loading, hasQuery };
}
