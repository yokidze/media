'use client';

import Link from 'next/link';
import type { ArchiveItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { withClientApiPath } from '@/lib/config';

const PLACEHOLDER_STYLES: Record<ArchiveItem['contentSection'], { bg: string; accent: string }> = {
  ARTICLE: { bg: 'from-blue-50 via-slate-50 to-white', accent: 'text-blue-700' },
  TV_STORY: { bg: 'from-rose-50 via-slate-50 to-white', accent: 'text-rose-700' },
  EVENT_PHOTO: { bg: 'from-emerald-50 via-slate-50 to-white', accent: 'text-emerald-700' },
  METHODICAL_AUTHOR_PROGRAM: { bg: 'from-amber-50 via-slate-50 to-white', accent: 'text-amber-700' }
};

function MaterialIcon({ section }: { section: ArchiveItem['contentSection'] }): React.JSX.Element {
  if (section === 'TV_STORY') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m10 9 5 3-5 3V9Z" />
      </svg>
    );
  }

  if (section === 'EVENT_PHOTO') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M7 15 10 12l2.5 2.5L15 12l2 3" />
        <circle cx="9" cy="9" r="1.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8" aria-hidden="true">
      <path d="M7 4.5h7l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M14 4.5V8h3" />
      <path d="M9 12h6M9 15h4" />
    </svg>
  );
}

export function HomeLatestCard({ item }: { item: ArchiveItem }): React.JSX.Element {
  const imageFile = item.files.find((file) => file.mimeType.startsWith('image/'));
  const style = PLACEHOLDER_STYLES[item.contentSection];
  const { sectionTypeLabel } = useLanguage();

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg">
      <Link href={`/archive/${item.slug}`} className="group block">
        {imageFile ? (
          <div className="overflow-hidden">
            <img
              src={withClientApiPath(`/files/${imageFile.id}/view`)}
              alt={item.title}
              className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </div>
        ) : (
          <div className={`relative grid h-44 place-items-center bg-gradient-to-br ${style.bg}`}>
            <div className={`grid h-14 w-14 place-items-center rounded-2xl border border-white/80 bg-white/80 ${style.accent} shadow-sm`}>
              <MaterialIcon section={item.contentSection} />
            </div>
            <span className="absolute left-3 top-3 rounded-full border border-white/90 bg-white/85 px-2.5 py-1 text-xs font-medium text-slate-700">
              {sectionTypeLabel(item.contentSection)}
            </span>
          </div>
        )}

        <div className="space-y-2 p-4 md:p-5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">{sectionTypeLabel(item.contentSection)}</span>
            <span>{formatDate(item.publicationDate)}</span>
          </div>

          <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900 transition group-hover:text-brand-800">{item.title}</h3>
        </div>
      </Link>
    </article>
  );
}
