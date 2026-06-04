'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/components/LanguageProvider';

interface AccessSummaryResponse {
  roles: {
    admin: {
      activeUsers: number;
      capabilities: string[];
    };
    teacher: {
      activeUsers: number;
      capabilities: string[];
    };
  };
}

const CAPABILITIES_KAZ_MAP: Record<string, string> = {
  'Управление пользователями': 'Пайдаланушыларды басқару',
  'Управление материалами': 'Материалдарды басқару',
  'Управление категориями': 'Санаттарды басқару',
  'Доступ к журналу действий': 'Әрекеттер журналына қолжетімділік',
  'Импорт и экспорт': 'Импорт және экспорт',
  'Создание и редактирование своих материалов': 'Өз материалдарын құру және өңдеу',
  'Доступ к профилю и каталогу': 'Профиль мен каталогқа қолжетімділік'
};

const localizeCapability = (capability: string, language: 'rus' | 'kaz'): string => {
  if (language === 'rus') return capability;
  return CAPABILITIES_KAZ_MAP[capability] ?? capability;
};

export function AccessManager(): React.JSX.Element {
  const { language } = useLanguage();
  const [data, setData] = useState<AccessSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AccessSummaryResponse>('/admin/access-summary')
      .then((response) => {
        setData(response);
        setError(null);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Рөлдер мен қолжетімділікті жүктеу мүмкін болмады' : 'Не удалось загрузить роли и доступы');
      });
  }, [language]);

  if (error) {
    return <div className="card p-5 text-red-700">{error}</div>;
  }

  if (!data) {
    return <div className="card p-5 text-slate-500">{language === 'kaz' ? 'Рөлдер мен қолжетімділік жүктелуде...' : 'Загружаем роли и доступы...'}</div>;
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{language === 'kaz' ? 'Рөлдер мен қолжетімділік' : 'Роли и доступы'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {language === 'kaz' ? 'Әкімші мен оқытушы арасындағы құқықтарды бөлу.' : 'Разграничение прав между администратором и преподавателем.'}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{language === 'kaz' ? 'Әкімші' : 'Администратор'}</h2>
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{data.roles.admin.activeUsers}</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {data.roles.admin.capabilities.map((capability) => (
              <li key={capability}>• {localizeCapability(capability, language)}</li>
            ))}
          </ul>
        </article>

        <article className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{language === 'kaz' ? 'Оқытушы' : 'Преподаватель'}</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{data.roles.teacher.activeUsers}</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {data.roles.teacher.capabilities.map((capability) => (
              <li key={capability}>• {localizeCapability(capability, language)}</li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
