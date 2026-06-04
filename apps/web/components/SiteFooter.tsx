'use client';

import { useLanguage } from '@/components/LanguageProvider';

export function SiteFooter(): React.JSX.Element {
  const { t } = useLanguage();

  return (
    <footer className="mt-12 border-t border-slate-200 bg-white/90">
      <div className="container-shell grid gap-4 py-8 text-sm text-slate-600 md:grid-cols-2">
        <div>
          <div className="flex items-center gap-2">
            <img src="/assets/LOGO_NEW.png" alt={t('appTitle')} className="h-7 w-auto shrink-0" />
            <p className="font-semibold text-slate-900">{t('appTitle')}</p>
          </div>
          <p className="mt-1">{t('footerDescription')}</p>
        </div>
        <div>
          <p className="font-semibold text-slate-900">{t('footerContacts')}</p>
          <p className="mt-1">
            {t('footerArchiveDepartment')}: archive@college.local
          </p>
          <p>
            {t('footerPhone')}: +7 (700) 000-00-00
          </p>
        </div>
      </div>
    </footer>
  );
}
