'use client';

import Link from 'next/link';
import { ArchiveItemCard } from '@/components/ArchiveItemCard';
import { FiltersPanel } from '@/components/FiltersPanel';
import { Pagination } from '@/components/Pagination';
import { SearchBox } from '@/components/SearchBox';
import { useLanguage } from '@/components/LanguageProvider';
import { AddMaterialButton } from '@/components/AddMaterialButton';
import { useManageAccess } from '@/components/useManageAccess';
import { SECTION_ORDER } from '@/lib/archive';
import type { ArchiveItem, ContentSection, PaginatedResponse } from '@/lib/types';

interface FilterOptions {
  years: number[];
  categories: Array<{ id: string; name: string }>;
  authors: Array<{ id: string; fullName: string }>;
  tags: Array<{ id: string; name: string }>;
  languages: string[];
  formats: string[];
  letters: string[];
  accessLevels: string[];
  materialTypes: string[];
  sections: ContentSection[];
  sectionCounts: Partial<Record<ContentSection, number>>;
}

interface ArchivePageContentProps {
  initialQuery: string;
  queryString: string;
  activeSection?: ContentSection;
  itemsResponse: PaginatedResponse<ArchiveItem>;
  filterOptions: FilterOptions;
}

export function ArchivePageContent({ initialQuery, queryString, activeSection, itemsResponse, filterOptions }: ArchivePageContentProps): React.JSX.Element {
  const { sectionLabel, t } = useLanguage();
  const canManage = useManageAccess();

  const buildSectionHref = (section?: ContentSection): string => {
    const search = new URLSearchParams(queryString);
    search.delete('page');

    if (section) {
      search.set('section', section);
    } else {
      search.delete('section');
    }

    const suffix = search.toString();
    return suffix ? `/archive?${suffix}` : '/archive';
  };

  const sectionItems = filterOptions.sections?.length > 0 ? filterOptions.sections : SECTION_ORDER;

  return (
    <div className="container-shell py-8 md:py-10">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-soft md:px-7 md:py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900">
            {t('catalogBackHome')}
          </Link>

          <nav aria-label={t('catalogBreadcrumbs')} className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition hover:text-slate-700">
              {t('catalogBreadcrumbHome')}
            </Link>
            <span className="text-slate-300">/</span>
            <span aria-current="page" className="text-slate-600">
              {t('catalogBreadcrumbCatalog')}
            </span>
          </nav>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('catalogTitle')}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {activeSection ? sectionLabel(activeSection) : t('catalogAllSections')} - {t('catalogFound')}: {itemsResponse.meta.total}
            </p>
          </div>
          <div className="w-full max-w-xl space-y-3">
            <SearchBox initialQuery={initialQuery} submitPath="/archive" liveSearch />
            <div className="flex justify-end">
              <AddMaterialButton canCreate={canManage} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={buildSectionHref(undefined)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              !activeSection ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t('catalogAllMaterials')}
          </Link>
          {sectionItems.map((section) => (
            <Link
              key={section}
              href={buildSectionHref(section)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeSection === section ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {sectionLabel(section)} ({filterOptions.sectionCounts?.[section] ?? 0})
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <FiltersPanel options={filterOptions} />

        <div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {itemsResponse.data.map((item) => (
              <ArchiveItemCard
                key={item.id}
                item={item}
                canManage={canManage}
                editableOptions={{
                  categories: filterOptions.categories,
                  materialTypes: filterOptions.materialTypes
                }}
              />
            ))}
          </div>

          {itemsResponse.data.length === 0 && <div className="card p-8 text-center text-slate-500">{t('catalogNoResults')}</div>}

          <Pagination page={itemsResponse.meta.page} totalPages={itemsResponse.meta.totalPages} />
        </div>
      </div>
    </div>
  );
}
