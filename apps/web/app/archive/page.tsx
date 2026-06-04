import { ArchivePageContent } from '@/components/ArchivePageContent';
import { serverGet } from '@/lib/server-api';
import { isContentSection, SECTION_ORDER } from '@/lib/archive';
import type { ArchiveItem, ContentSection, PaginatedResponse } from '@/lib/types';

interface ArchivePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

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

const serializeSearchParams = (params: Record<string, string | string[] | undefined>): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => search.append(key, entry));
    } else if (value) {
      search.set(key, value);
    }
  });

  return search.toString();
};

export default async function ArchivePage({ searchParams }: ArchivePageProps): Promise<React.JSX.Element> {
  const resolved = await searchParams;
  const query = serializeSearchParams(resolved);
  const sectionParam = typeof resolved.section === 'string' ? resolved.section : undefined;

  const activeSection: ContentSection | undefined = isContentSection(sectionParam) ? sectionParam : undefined;

  const [itemsResponse, filterOptions] = await Promise.all([
    serverGet<PaginatedResponse<ArchiveItem>>(`/archive-items?${query}`).catch(() => ({
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 }
    })),
    serverGet<FilterOptions>('/filters/options').catch(() => ({
      years: [],
      categories: [],
      authors: [],
      tags: [],
      languages: [],
      formats: [],
      letters: [],
      accessLevels: [],
      materialTypes: [],
      sections: SECTION_ORDER,
      sectionCounts: {} as Partial<Record<ContentSection, number>>
    }))
  ]);

  return (
    <ArchivePageContent
      initialQuery={typeof resolved.q === 'string' ? resolved.q : ''}
      queryString={query}
      activeSection={activeSection}
      itemsResponse={itemsResponse}
      filterOptions={filterOptions}
    />
  );
}
