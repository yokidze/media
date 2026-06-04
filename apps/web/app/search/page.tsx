import { redirect } from 'next/navigation';

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

export default async function SearchPage({ searchParams }: SearchPageProps): Promise<never> {
  const resolved = await searchParams;
  const query = serializeSearchParams(resolved);
  redirect(query ? `/archive?${query}` : '/archive');
}
