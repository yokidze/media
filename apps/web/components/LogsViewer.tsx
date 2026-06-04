'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { StyledSelect } from '@/components/StyledSelect';
import { useLanguage } from '@/components/LanguageProvider';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  createdAt: string;
  user?: { fullName?: string | null; email?: string } | null;
}

interface AuditResponse {
  data: AuditLog[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function LogsViewer(): React.JSX.Element {
  const { language } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 30, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const load = async (nextPage = page): Promise<void> => {
    setIsLoading(true);

    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: '30'
    });

    if (activeQuery.trim()) params.set('q', activeQuery.trim());
    if (action) params.set('action', action);
    if (entityType) params.set('entityType', entityType);

    try {
      const response = await apiFetch<AuditResponse>(`/admin/audit-logs?${params.toString()}`);
      setLogs(response.data);
      setMeta(response.meta);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Әрекет журналын жүктеу мүмкін болмады' : 'Не удалось загрузить журнал действий');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load(page);
  }, [page, activeQuery, action, entityType, language]);

  const uniqueActions = Array.from(new Set(logs.map((entry) => entry.action))).sort();
  const uniqueEntities = Array.from(new Set(logs.map((entry) => entry.entityType))).sort();

  const applyFilters = (event: FormEvent): void => {
    event.preventDefault();
    setPage(1);
    setActiveQuery(query.trim());
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{language === 'kaz' ? 'Әрекет журналы' : 'Журнал действий'}</h1>
        <p className="mt-1 text-sm text-slate-500">{language === 'kaz' ? 'Әкімші әрекеттері мен жүйедегі негізгі өзгерістер аудиті.' : 'Аудит действий администраторов и ключевых изменений в системе.'}</p>
      </header>

      <form onSubmit={applyFilters} className="card grid gap-3 p-4 md:grid-cols-4">
        <input className="input md:col-span-2" placeholder={language === 'kaz' ? 'Әрекет, мән немесе user/email бойынша іздеу' : 'Поиск по действию, сущности, user/email'} value={query} onChange={(event) => setQuery(event.target.value)} />

        <StyledSelect
          value={action}
          placeholder={language === 'kaz' ? 'Кез келген әрекет' : 'Любое действие'}
          options={[{ value: '', label: language === 'kaz' ? 'Кез келген әрекет' : 'Любое действие' }, ...uniqueActions.map((item) => ({ value: item, label: item }))]}
          onChange={(value) => {
            setPage(1);
            setAction(value);
          }}
        />

        <StyledSelect
          value={entityType}
          placeholder={language === 'kaz' ? 'Кез келген мән' : 'Любая сущность'}
          options={[{ value: '', label: language === 'kaz' ? 'Кез келген мән' : 'Любая сущность' }, ...uniqueEntities.map((item) => ({ value: item, label: item }))]}
          onChange={(value) => {
            setPage(1);
            setEntityType(value);
          }}
        />

        <div className="md:col-span-4 flex flex-wrap gap-2">
          <button type="submit" className="btn btn-secondary" disabled={isLoading}>
            {language === 'kaz' ? 'Қолдану' : 'Применить'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isLoading}
            onClick={() => {
              setQuery('');
              setActiveQuery('');
              setAction('');
              setEntityType('');
              setPage(1);
            }}
          >
            {language === 'kaz' ? 'Тазарту' : 'Сбросить'}
          </button>
        </div>
      </form>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">{language === 'kaz' ? 'Күні' : 'Дата'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Пайдаланушы' : 'Пользователь'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Әрекет' : 'Действие'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Мән' : 'Сущность'}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="px-3 py-2">{formatDate(log.createdAt)}</td>
                <td className="px-3 py-2">{log.user?.fullName ?? log.user?.email ?? (language === 'kaz' ? 'Жүйе' : 'Система')}</td>
                <td className="px-3 py-2">{log.action}</td>
                <td className="px-3 py-2">
                  {log.entityType}
                  {log.entityId ? ` (${log.entityId})` : ''}
                </td>
              </tr>
            ))}
            {!isLoading && logs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  {language === 'kaz' ? 'Жазбалар табылмады.' : 'Записи не найдены.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
        <button type="button" className="btn btn-secondary" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>
          {language === 'kaz' ? 'Артқа' : 'Назад'}
        </button>
        <span>
          {language === 'kaz' ? `Бет ${meta.page} / ${Math.max(meta.totalPages, 1)}` : `Страница ${meta.page} из ${Math.max(meta.totalPages, 1)}`}
        </span>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={page >= Math.max(meta.totalPages, 1) || isLoading}
          onClick={() => setPage((current) => current + 1)}
        >
          {language === 'kaz' ? 'Келесі' : 'Далее'}
        </button>
      </div>
    </div>
  );
}
