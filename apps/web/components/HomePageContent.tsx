'use client';

import Link from 'next/link';
import { HomeHeroSearch } from '@/components/HomeHeroSearch';
import { HomeLatestCard } from '@/components/HomeLatestCard';
import { AddMaterialButton } from '@/components/AddMaterialButton';
import { useLanguage } from '@/components/LanguageProvider';
import type { ArchiveItem, ContentSection } from '@/lib/types';

const QUICK_LINK_SECTIONS: ContentSection[] = ['ARTICLE', 'TV_STORY', 'EVENT_PHOTO'];

function HeroQuickLinkIcon({ section }: { section: ContentSection }): React.JSX.Element {
  if (section === 'TV_STORY') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m10 9 5 3-5 3V9Z" />
      </svg>
    );
  }

  if (section === 'EVENT_PHOTO') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M7 15 10 12l2.5 2.5L15 12l2 3" />
        <circle cx="9" cy="9" r="1.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5" aria-hidden="true">
      <path d="M7 4.5h7l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 19V6a1.5 1.5 0 0 1 1.5-1.5Z" />
      <path d="M14 4.5V8h3" />
      <path d="M9 12h6M9 15h4" />
    </svg>
  );
}

export function HomePageContent({ latestItems }: { latestItems: ArchiveItem[] }): React.JSX.Element {
  const { sectionLabel, t } = useLanguage();

  return (
    <div className="container-shell py-7 md:py-10">
      <section className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-slate-200/90 bg-white/90 px-5 py-8 text-center shadow-soft md:px-10 md:py-10">
        <div
          className="pointer-events-none absolute -left-16 -top-20 h-44 w-44 rounded-full bg-brand-100/60 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-amber-100/60 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative">
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">{t('homeDescription')}</p>
        </div>

        <div className="relative mx-auto mt-6 w-full max-w-3xl">
          <HomeHeroSearch />
        </div>

        <div className="relative mx-auto mt-6 w-full max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('homeQuickLinks')}</p>
          <div className="grid gap-2.5 sm:grid-cols-3 md:gap-3">
            {QUICK_LINK_SECTIONS.map((section) => (
              <Link
                key={section}
                href={`/archive?section=${section}`}
                className="group flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-brand-50 group-hover:text-brand-700">
                  <HeroQuickLinkIcon section={section} />
                </span>
                <span className="text-left">{sectionLabel(section)}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap items-center justify-center gap-y-2">
          <Link
            href="/archive"
            className="group inline-flex items-center gap-3 rounded-2xl bg-brand-700 px-7 py-4 text-white shadow-md shadow-brand-900/20 transition hover:-translate-y-0.5 hover:bg-brand-800"
          >
            <span className="text-left">
              <span className="block text-base font-semibold">{t('homeGoToCatalog')}</span>
              <span className="block text-xs text-brand-100">{t('homeSeeAllMaterials')}</span>
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5 transition group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m13 7 6 5-6 5" />
            </svg>
          </Link>
          <AddMaterialButton variant="subtle" className="ml-4 opacity-75 hover:opacity-100 md:ml-6" />
        </div>
      </section>

      <section className="mt-10 border-t border-slate-200/80 pt-9 md:mt-14 md:pt-11">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{t('homeNewPublications')}</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{t('homeLatestMaterials')}</h2>
          </div>
          <Link href="/archive?sortBy=newest" className="text-sm font-semibold text-brand-700 transition hover:text-brand-800">
            {t('homeSeeAll')}
          </Link>
        </div>

        {latestItems.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {latestItems.map((item) => (
              <HomeLatestCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">{t('homeNoMaterials')}</p>
        )}
      </section>
    </div>
  );
}
