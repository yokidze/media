'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchAutocompleteList } from '@/components/SearchAutocompleteList';
import { useSearchAutocomplete } from '@/components/useSearchAutocomplete';
import { useLanguage } from '@/components/LanguageProvider';
import type { SearchAutocompleteItem } from '@/lib/types';

interface SearchBoxProps {
  initialQuery?: string;
  className?: string;
  submitPath?: string;
  liveSearch?: boolean;
  liveSearchDebounceMs?: number;
}

export function SearchBox({
  initialQuery = '',
  className,
  submitPath = '/archive',
  liveSearch = false,
  liveSearchDebounceMs = 400
}: SearchBoxProps): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const { items, loading, hasQuery } = useSearchAutocomplete(query, 6);
  const { t } = useLanguage();

  const buildHref = useMemo(
    () => (nextQuery: string): string => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');

      if (nextQuery) {
        params.set('q', nextQuery);
      } else {
        params.delete('q');
      }

      const suffix = params.toString();
      return suffix ? `${submitPath}?${suffix}` : submitPath;
    },
    [searchParams, submitPath]
  );

  useEffect(() => {
    const onDocumentPointerDown = (event: MouseEvent): void => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentPointerDown);
    return () => {
      document.removeEventListener('mousedown', onDocumentPointerDown);
    };
  }, []);

  useEffect(() => {
    if (!liveSearch) return;

    const timer = setTimeout(() => {
      const next = query.trim();
      const current = (searchParams.get('q') ?? '').trim();
      if (next === current) return;
      router.replace(buildHref(next), { scroll: false });
    }, liveSearchDebounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [buildHref, liveSearch, liveSearchDebounceMs, query, router, searchParams]);

  const submit = (value?: string): void => {
    const next = (value ?? query).trim();
    setIsOpen(false);
    router.push(buildHref(next));
  };

  const handleSelect = (item: SearchAutocompleteItem): void => {
    setQuery(item.title);
    setIsOpen(false);
    router.push(`/archive/${item.slug}`);
  };

  const showDropdown = isOpen && hasQuery;

  return (
    <div className={className}>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <input
            type="search"
            value={query}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                submit();
              }
              if (event.key === 'Escape') {
                setIsOpen(false);
              }
            }}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            aria-autocomplete="list"
            placeholder={t('searchPlaceholderCatalog')}
            className="input pr-11"
          />
          <button
            type="button"
            onClick={() => submit()}
            aria-label={t('searchAction')}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full z-40 mt-2">
            <SearchAutocompleteList query={query} loading={loading} items={items} onSelect={handleSelect} />
          </div>
        )}
      </div>
    </div>
  );
}
