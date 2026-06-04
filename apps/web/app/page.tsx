import { HomePageContent } from '@/components/HomePageContent';
import { serverGet } from '@/lib/server-api';
import type { ArchiveItem, PaginatedResponse } from '@/lib/types';

const emptyResponse: PaginatedResponse<ArchiveItem> = {
  data: [],
  meta: { page: 1, pageSize: 6, total: 0, totalPages: 0 }
};

export default async function HomePage(): Promise<React.JSX.Element> {
  const latest = await serverGet<PaginatedResponse<ArchiveItem>>('/archive-items?page=1&pageSize=6&sortBy=newest').catch(() => emptyResponse);

  return <HomePageContent latestItems={latest.data} />;
}
