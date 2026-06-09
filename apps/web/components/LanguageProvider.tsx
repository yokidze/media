'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ContentSection, MaterialType } from '@/lib/types';
import {
  DEFAULT_LANGUAGE,
  HTML_LANG_BY_APP_LANGUAGE,
  isAppLanguage,
  LANGUAGE_STORAGE_KEY,
  MATERIAL_TYPE_LABELS_BY_LANGUAGE,
  SECTION_LABELS_BY_LANGUAGE,
  SECTION_TYPE_LABELS_BY_LANGUAGE,
  UI_DICTIONARIES,
  type AppLanguage,
  type UiTranslationKey
} from '@/lib/i18n';

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: UiTranslationKey) => string;
  sectionLabel: (section: ContentSection) => string;
  sectionTypeLabel: (section: ContentSection) => string;
  materialTypeLabel: (type: MaterialType) => string;
  categoryLabel: (category: string | { name: string; nameRu?: string | null; nameKaz?: string | null }) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [language, setLanguage] = useState<AppLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (isAppLanguage(stored)) {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = HTML_LANG_BY_APP_LANGUAGE[language];
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key) => UI_DICTIONARIES[language][key],
      sectionLabel: (section) => SECTION_LABELS_BY_LANGUAGE[language][section],
      sectionTypeLabel: (section) => SECTION_TYPE_LABELS_BY_LANGUAGE[language][section],
      materialTypeLabel: (type) => MATERIAL_TYPE_LABELS_BY_LANGUAGE[language][type],
      categoryLabel: (category) => {
        const name = typeof category === 'string' ? category : category.name;
        const localizedName = typeof category === 'string' ? null : language === 'kaz' ? category.nameKaz : category.nameRu;
        if (localizedName?.trim()) return localizedName.trim();

        const parts = name.split(/\s+\/\s+/).map((part) => part.trim()).filter(Boolean);
        if (parts.length !== 2) return name;
        return language === 'kaz' ? parts[0] : parts[1];
      }
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}
