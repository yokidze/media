'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/components/LanguageProvider';
import { useTheme } from '@/components/ThemeProvider';
import { PROFILE_UPDATED_EVENT, type ProfileUpdatedDetail } from '@/lib/profile-events';
import { LANGUAGE_UI_LABELS, type AppLanguage } from '@/lib/i18n';

interface MeHeaderResponse {
  fullName: string;
  profilePhotoUrl: string | null;
}

type AuthState = 'loading' | 'authenticated' | 'guest';

const initialsFromName = (fullName: string | null | undefined): string => {
  if (!fullName) return 'PM';

  const parts = fullName
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return 'PM';
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
};

export function SiteHeader(): React.JSX.Element {
  const pathname = usePathname();
  const profileActive = pathname.startsWith('/account');
  const loginActive = pathname.startsWith('/login');
  const hideAuthActions = pathname.startsWith('/login');
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async (): Promise<void> => {
      try {
        const me = await apiFetch<MeHeaderResponse>('/auth/me');
        if (!active) return;

        setProfilePhotoUrl(me.profilePhotoUrl);
        setFullName(me.fullName);
        setAuthState('authenticated');
      } catch {
        if (!active) return;
        setProfilePhotoUrl(null);
        setFullName('');
        setAuthState('guest');
      }
    };

    const handleProfileUpdated = (event: Event): void => {
      const detail = (event as CustomEvent<ProfileUpdatedDetail>).detail;
      if (!detail) return;
      setProfilePhotoUrl(detail.profilePhotoUrl);
      setFullName(detail.fullName);
      setAuthState(detail.fullName ? 'authenticated' : 'guest');
    };

    void load();
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);

    return () => {
      active = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated as EventListener);
    };
  }, [pathname]);

  useEffect(() => {
    setThemeReady(true);
  }, []);

  const profileInitials = useMemo(() => initialsFromName(fullName), [fullName]);
  const nextLanguage: AppLanguage = language === 'rus' ? 'kaz' : 'rus';
  const currentTheme = themeReady ? theme : 'light';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="container-shell py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img src="/assets/LOGO_NEW.png" alt={language === 'kaz' ? 'Колледж логотипі' : 'Логотип колледжа'} className="h-9 w-auto shrink-0" />
            <span className="min-w-0 truncate text-lg font-semibold text-slate-900">{t('appTitle')}</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={currentTheme === 'light' ? t('themeDark') : t('themeLight')}
              title={currentTheme === 'light' ? t('themeDark') : t('themeLight')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              {currentTheme === 'light' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2.5V5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                  <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.7 6.7 0 0 0 10.7 10.7Z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => setLanguage(nextLanguage)}
              aria-label={language === 'kaz' ? `${LANGUAGE_UI_LABELS[nextLanguage]} тіліне ауыстыру` : `Сменить язык на ${LANGUAGE_UI_LABELS[nextLanguage]}`}
              title={language === 'kaz' ? `${LANGUAGE_UI_LABELS[nextLanguage]} тіліне ауыстыру` : `Сменить язык на ${LANGUAGE_UI_LABELS[nextLanguage]}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <span>{LANGUAGE_UI_LABELS[language]}</span>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5" aria-hidden="true">
                <path d="M6 4.5h8M6 10h8M6 15.5h8" />
              </svg>
            </button>

            {!hideAuthActions && authState === 'authenticated' ? (
              <Link
                href="/account"
                className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                  profileActive ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={t('headerProfile')} className="h-6 w-6 rounded-full border border-slate-200 object-cover" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">{profileInitials}</span>
                )}
                <span>{t('headerProfile')}</span>
              </Link>
            ) : !hideAuthActions && authState === 'guest' ? (
              <Link
                href="/login"
                className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition ${
                  loginActive ? 'bg-brand-700 text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {t('headerLogin')}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
