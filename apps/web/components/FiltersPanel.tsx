'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { StyledSelect } from '@/components/StyledSelect';
import type { MaterialType } from '@/lib/types';

interface FiltersPanelProps {
  options: {
    years: number[];
    categories: Array<{ id: string; name: string; nameRu?: string | null; nameKaz?: string | null }>;
    materialTypes: string[];
  };
}

const setMultiValue = (search: URLSearchParams, key: string, values: string[]): void => {
  if (values.length === 0) {
    search.delete(key);
    return;
  }

  search.set(key, values.join(','));
};

const parseMulti = (value: string | null): string[] => (value ? value.split(',').filter(Boolean) : []);

export function FiltersPanel({ options }: FiltersPanelProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { categoryLabel, materialTypeLabel, t } = useLanguage();

  const update = (mutator: (search: URLSearchParams) => void): void => {
    const search = new URLSearchParams(params.toString());
    mutator(search);
    search.delete('page');
    router.push(`${pathname}?${search.toString()}`);
  };

  const renderMulti = (key: string, values: Array<{ id: string; label: string }>, selected: string[]): React.JSX.Element => (
    <div className="max-h-44 space-y-2 overflow-auto pr-1">
      {values.map((entry) => (
        <label key={entry.id} className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={selected.includes(entry.id)}
            onChange={(event) => {
              const next = event.target.checked ? [...selected, entry.id] : selected.filter((value) => value !== entry.id);
              update((search) => setMultiValue(search, key, next));
            }}
          />
          <span>{entry.label}</span>
        </label>
      ))}
    </div>
  );

  const selectedCategories = parseMulti(params.get('categoryIds'));
  const selectedMaterialTypes = parseMulti(params.get('materialTypes'));
  const selectedYear = params.get('year') ?? '';

  return (
    <aside className="card h-fit space-y-5 p-4 md:p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">{t('filtersTitle')}</h2>
        <button
          type="button"
          className="text-xs font-semibold text-brand-700 hover:text-brand-800"
          onClick={() => {
            const search = new URLSearchParams(params.toString());
            const section = search.get('section');
            if (section) {
              router.push(`${pathname}?section=${section}`);
              return;
            }
            router.push(pathname);
          }}
        >
          {t('filtersReset')}
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">{t('filtersYear')}</p>
        <StyledSelect
          value={selectedYear}
          placeholder={t('filtersAllYears')}
          options={[
            { value: '', label: t('filtersAllYears') },
            ...options.years.map((year) => ({ value: String(year), label: String(year) }))
          ]}
          onChange={(nextValue) =>
            update((search) => {
              if (nextValue) search.set('year', nextValue);
              else search.delete('year');
            })
          }
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">{t('filtersCategories')}</p>
        {renderMulti(
          'categoryIds',
          options.categories.map((category) => ({ id: category.id, label: categoryLabel(category) })),
          selectedCategories
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">{t('filtersMaterialType')}</p>
        {renderMulti(
          'materialTypes',
          options.materialTypes.map((type) => ({ id: type, label: materialTypeLabel(type as MaterialType) })),
          selectedMaterialTypes
        )}
      </div>

    </aside>
  );
}
