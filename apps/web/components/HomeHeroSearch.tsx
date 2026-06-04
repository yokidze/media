'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchAutocompleteList } from '@/components/SearchAutocompleteList';
import { useSearchAutocomplete } from '@/components/useSearchAutocomplete';
import { useLanguage } from '@/components/LanguageProvider';
import type { SearchAutocompleteItem } from '@/lib/types';

interface HomeHeroSearchProps {
  initialQuery?: string;
}

export function HomeHeroSearch({ initialQuery = '' }: HomeHeroSearchProps): React.JSX.Element {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const { items, loading, hasQuery } = useSearchAutocomplete(query, 6);
  const { t } = useLanguage();

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

  const submit = (): void => {
    const next = query.trim();
    if (!next) return;
    setIsOpen(false);
    router.push(`/archive?q=${encodeURIComponent(next)}`);
  };

  const handleSelect = (item: SearchAutocompleteItem): void => {
    setQuery(item.title);
    setIsOpen(false);
    router.push(`/archive/${item.slug}`);
  };

  const showDropdown = isOpen && hasQuery;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
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
          placeholder={t('searchPlaceholderHero')}
          aria-label={t('searchPlaceholderHero')}
          className="h-14 w-full rounded-xl border border-slate-300 bg-white px-5 pr-14 text-base text-slate-900 shadow-sm transition focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="button"
          onClick={submit}
          aria-label={t('searchAction')}
          className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
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
  );
}
