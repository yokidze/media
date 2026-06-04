'use client';

import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import type { SearchAutocompleteItem } from '@/lib/types';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedText({ text, query }: { text: string; query: string }): React.JSX.Element {
  const trimmed = query.trim();
  if (!trimmed) return <>{text}</>;

  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'ig');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={`${part}-${index}`} className="rounded bg-brand-100 px-0.5 text-inherit">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}

function TypeIcon({ section }: { section: SearchAutocompleteItem['contentSection'] }): React.JSX.Element {
  if (section === 'TV_STORY') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m10 9 5 3-5 3V9Z" />
      </svg>
    );
  }

  if (section === 'EVENT_PHOTO') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M7 15 10 12l2.5 2.5L15 12l2 3" />
        <circle cx="9" cy="9" r="1.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
      <path d="M7 4.5h7l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M14 4.5V8h3" />
      <path d="M9 12h6M9 15h4" />
    </svg>
  );
}

interface SearchAutocompleteListProps {
  query: string;
  loading: boolean;
  items: SearchAutocompleteItem[];
  onSelect: (item: SearchAutocompleteItem) => void;
}

export function SearchAutocompleteList({ query, loading, items, onSelect }: SearchAutocompleteListProps): React.JSX.Element {
  const { sectionTypeLabel, t } = useLanguage();

  if (loading) {
    return <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">{t('autocompleteSearching')}</div>;
  }

  if (items.length === 0) {
    return <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-lg">{t('autocompleteEmpty')}</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
      <ul role="listbox" aria-label={t('autocompleteAria')} className="max-h-96 overflow-y-auto">
        {items.map((item) => {
          const dateText = item.publicationDate ? formatDate(item.publicationDate) : item.archiveYear ? `${item.archiveYear}` : '';

          return (
            <li key={item.id} role="option">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(item)}
                className="flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
              >
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                  <TypeIcon section={item.contentSection} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">
                    <HighlightedText text={item.title} query={query} />
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {sectionTypeLabel(item.contentSection)}
                    {dateText ? ` • ${dateText}` : ''}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
