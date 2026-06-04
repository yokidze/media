'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { t } = useLanguage();

  if (totalPages <= 1) {
    return <></>;
  }

  const navigate = (nextPage: number): void => {
    const search = new URLSearchParams(params.toString());
    search.set('page', String(nextPage));
    router.push(`${pathname}?${search.toString()}`);
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-3">
      <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => navigate(page - 1)}>
        {t('paginationPrev')}
      </button>
      <span className="text-sm text-slate-600">
        {t('paginationPage')} {page} {t('paginationOf')} {totalPages}
      </span>
      <button type="button" className="btn btn-secondary" disabled={page >= totalPages} onClick={() => navigate(page + 1)}>
        {t('paginationNext')}
      </button>
    </div>
  );
}
