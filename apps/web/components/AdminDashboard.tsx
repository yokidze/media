'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';

interface OverviewResponse {
  totals: {
    users: number;
    usersActive: number;
    usersBlocked: number;
    materials: number;
    publishedMaterials: number;
    draftMaterials: number;
    categories: number;
    tags: number;
    auditLogsToday: number;
  };
  latestActions: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
    user: { fullName: string | null; email: string } | null;
  }>;
}

export function AdminDashboard(): React.JSX.Element {
  const { language } = useLanguage();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<OverviewResponse>('/admin/overview')
      .then((response) => {
        setData(response);
        setError(null);
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Әкімші панелінің шолуын жүктеу мүмкін болмады' : 'Не удалось загрузить обзор админ-панели');
      });
  }, [language]);

  if (error) {
    return <div className="card p-4 text-red-700">{error}</div>;
  }

  if (!data) {
    return <div className="card p-4 text-slate-500">{language === 'kaz' ? 'Панель шолуы жүктелуде...' : 'Загружаем обзор панели...'}</div>;
  }

  return (
    <div className="space-y-6">
      <header className="card p-5">
        <h1 className="text-2xl font-bold text-slate-900">{language === 'kaz' ? 'Жүйе шолуы' : 'Обзор системы'}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {language === 'kaz' ? 'Пайдаланушылар, материалдар және жүйе белсенділігі бойынша негізгі көрсеткіштер.' : 'Ключевые показатели по пользователям, материалам и активности в системе.'}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={language === 'kaz' ? 'Пайдаланушылар' : 'Пользователи'} value={data.totals.users} />
        <StatCard label={language === 'kaz' ? 'Материалдар' : 'Материалы'} value={data.totals.materials} />
        <StatCard label={language === 'kaz' ? 'Санаттар' : 'Категории'} value={data.totals.categories} />
        <StatCard label={language === 'kaz' ? 'Бүгінгі әрекеттер' : 'Действий за сегодня'} value={data.totals.auditLogsToday} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900">{language === 'kaz' ? 'Пайдаланушы мәртебелері' : 'Статусы пользователей'}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="flex items-center justify-between">
              <span>{language === 'kaz' ? 'Белсенді' : 'Активные'}</span>
              <span className="font-semibold">{data.totals.usersActive}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>{language === 'kaz' ? 'Бұғатталған' : 'Заблокированные'}</span>
              <span className="font-semibold">{data.totals.usersBlocked}</span>
            </li>
          </ul>
          <Link href="/admin/users" className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800">
            {language === 'kaz' ? 'Пайдаланушыларға өту' : 'Перейти к пользователям'}
          </Link>
        </article>

        <article className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900">{language === 'kaz' ? 'Материал мәртебелері' : 'Статусы материалов'}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="flex items-center justify-between">
              <span>{language === 'kaz' ? 'Жарияланған' : 'Опубликованные'}</span>
              <span className="font-semibold">{data.totals.publishedMaterials}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>{language === 'kaz' ? 'Жобалар (модерацияда)' : 'Черновики (на модерации)'}</span>
              <span className="font-semibold">{data.totals.draftMaterials}</span>
            </li>
            <li className="flex items-center justify-between">
              <span>{language === 'kaz' ? 'Тегтер' : 'Теги'}</span>
              <span className="font-semibold">{data.totals.tags}</span>
            </li>
          </ul>
          <Link href="/admin/items" className="mt-4 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-800">
            {language === 'kaz' ? 'Материалдарға өту' : 'Перейти к материалам'}
          </Link>
        </article>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">{language === 'kaz' ? 'Соңғы әрекеттер' : 'Последние действия'}</h2>
          <Link href="/admin/logs" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            {language === 'kaz' ? 'Журналды ашу' : 'Открыть журнал'}
          </Link>
        </div>

        <ul className="mt-3 space-y-2">
          {data.latestActions.length === 0 && <li className="text-sm text-slate-500">{language === 'kaz' ? 'Әзірге әрекеттер жоқ.' : 'Действий пока нет.'}</li>}
          {data.latestActions.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium text-slate-900">
                  {entry.action} • {entry.entityType}
                  {entry.entityId ? ` (${entry.entityId})` : ''}
                </div>
                <div className="text-xs text-slate-500">{formatDate(entry.createdAt)}</div>
              </div>
              <div className="mt-1 text-xs text-slate-500">{entry.user?.fullName ?? entry.user?.email ?? (language === 'kaz' ? 'Жүйе' : 'Система')}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
