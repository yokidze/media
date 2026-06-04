'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import type { ArchiveItem, PaginatedResponse } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { StyledSelect } from '@/components/StyledSelect';
import { useLanguage } from '@/components/LanguageProvider';

interface FilterOptionsResponse {
  categories: Array<{ id: string; name: string }>;
  authors: Array<{ id: string; fullName: string }>;
  materialTypes: string[];
}

type StatusFilter = 'all' | 'PUBLISHED' | 'DRAFT';

export function AdminItemsTable(): React.JSX.Element {
  const { language, materialTypeLabel, sectionLabel } = useLanguage();
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [options, setOptions] = useState<FilterOptionsResponse | null>(null);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });

  const [isLoading, setIsLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [materialType, setMaterialType] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadOptions = async (): Promise<void> => {
    try {
      const response = await apiFetch<FilterOptionsResponse>('/filters/options');
      setOptions({
        categories: response.categories ?? [],
        authors: response.authors ?? [],
        materialTypes: response.materialTypes ?? []
      });
    } catch {
      setOptions({ categories: [], authors: [], materialTypes: [] });
    }
  };

  const loadItems = async (nextPage = page): Promise<void> => {
    setIsLoading(true);

    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: '20',
      sortBy: 'newest'
    });

    if (searchValue.trim()) params.set('q', searchValue.trim());
    if (status !== 'all') params.set('status', status);
    if (materialType) params.set('materialTypes', materialType);
    if (categoryId) params.set('categoryIds', categoryId);
    if (authorId) params.set('authorIds', authorId);

    try {
      const response = await apiFetch<PaginatedResponse<ArchiveItem>>(`/archive-items?${params.toString()}`);
      setItems(response.data);
      setMeta(response.meta);
      setSelected([]);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Материалдарды жүктеу мүмкін болмады' : 'Не удалось загрузить материалы');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOptions();
  }, []);

  useEffect(() => {
    void loadItems(page);
  }, [page, searchValue, status, materialType, categoryId, authorId]);

  const allSelected = useMemo(() => items.length > 0 && selected.length === items.length, [items.length, selected.length]);

  const toggle = (id: string): void => {
    setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const runBulk = async (action: 'publish' | 'draft' | 'delete'): Promise<void> => {
    if (selected.length === 0) return;

    setIsBusy(true);
    setError(null);

    try {
      await apiFetch('/archive-items/bulk', {
        method: 'POST',
        body: JSON.stringify({ ids: selected, action })
      });
      await loadItems(page);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Жаппай әрекетті орындау мүмкін болмады' : 'Не удалось выполнить массовое действие');
    } finally {
      setIsBusy(false);
    }
  };

  const toggleStatus = async (item: ArchiveItem): Promise<void> => {
    setIsBusy(true);
    setError(null);

    try {
      await apiFetch(`/archive-items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })
      });
      await loadItems(page);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Материал мәртебесін жаңарту мүмкін болмады' : 'Не удалось обновить статус материала');
    } finally {
      setIsBusy(false);
    }
  };

  const removeItem = async (): Promise<void> => {
    if (!deleteId) return;

    setIsBusy(true);
    setError(null);

    try {
      await apiFetch(`/archive-items/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      if (items.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadItems(page);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Материалды жою мүмкін болмады' : 'Не удалось удалить материал');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{language === 'kaz' ? 'Материалдарды басқару' : 'Управление материалами'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {language === 'kaz' ? 'Архив материалдары бойынша іздеу, сүзу, модерация және жаппай әрекеттер.' : 'Поиск, фильтрация, модерация и массовые действия по архивным материалам.'}
          </p>
        </div>
        <Link href="/admin/items/new" className="btn btn-primary">
          {language === 'kaz' ? 'Материал қосу' : 'Добавить материал'}
        </Link>
      </div>

      <div className="card grid gap-3 p-4 md:grid-cols-5">
        <input className="input md:col-span-2" placeholder={language === 'kaz' ? 'Атауы бойынша іздеу' : 'Поиск по названию'} value={query} onChange={(event) => setQuery(event.target.value)} />

        <StyledSelect
          value={status}
          placeholder={language === 'kaz' ? 'Мәртебе' : 'Статус'}
          options={
            [
              { value: 'all', label: language === 'kaz' ? 'Барлық мәртебелер' : 'Все статусы' },
              { value: 'PUBLISHED', label: language === 'kaz' ? 'Жарияланған' : 'Опубликовано' },
              { value: 'DRAFT', label: language === 'kaz' ? 'Жобалар' : 'Черновики' }
            ] as Array<{ value: string; label: string }>
          }
          onChange={(value) => {
            setPage(1);
            setStatus(value as StatusFilter);
          }}
        />

        <StyledSelect
          value={materialType}
          placeholder={language === 'kaz' ? 'Материал түрі' : 'Тип материала'}
          options={[
            { value: '', label: language === 'kaz' ? 'Барлық түрлер' : 'Все типы' },
            ...(options?.materialTypes ?? []).map((type) => ({
              value: type,
              label: materialTypeLabel(type as ArchiveItem['materialType'])
            }))
          ]}
          onChange={(value) => {
            setPage(1);
            setMaterialType(value);
          }}
        />

        <StyledSelect
          value={categoryId}
          placeholder={language === 'kaz' ? 'Санат' : 'Категория'}
          options={[{ value: '', label: language === 'kaz' ? 'Барлық санаттар' : 'Все категории' }, ...(options?.categories ?? []).map((category) => ({ value: category.id, label: category.name }))]}
          onChange={(value) => {
            setPage(1);
            setCategoryId(value);
          }}
        />

        <StyledSelect
          value={authorId}
          placeholder={language === 'kaz' ? 'Авторы' : 'Автор'}
          options={[{ value: '', label: language === 'kaz' ? 'Барлық авторлар' : 'Все авторы' }, ...(options?.authors ?? []).map((author) => ({ value: author.id, label: author.fullName }))]}
          onChange={(value) => {
            setPage(1);
            setAuthorId(value);
          }}
        />

        <div className="md:col-span-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setPage(1);
              setSearchValue(query.trim());
            }}
            disabled={isLoading || isBusy}
          >
            {language === 'kaz' ? 'Іздеу' : 'Найти'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setQuery('');
              setSearchValue('');
              setStatus('all');
              setMaterialType('');
              setCategoryId('');
              setAuthorId('');
              setPage(1);
            }}
            disabled={isLoading || isBusy}
          >
            {language === 'kaz' ? 'Тазарту' : 'Сбросить'}
          </button>
        </div>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-slate-600">
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(event) => setSelected(event.target.checked ? items.map((item) => item.id) : [])}
                />
              </th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Атауы' : 'Название'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Бөлім' : 'Раздел'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Түрі' : 'Тип'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Санат' : 'Категория'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Мәртебе' : 'Статус'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Күні' : 'Дата'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Әрекеттер' : 'Действия'}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />
                </td>
                <td className="px-3 py-2 font-medium">{item.title}</td>
                <td className="px-3 py-2">{sectionLabel(item.contentSection)}</td>
                <td className="px-3 py-2">{materialTypeLabel(item.materialType)}</td>
                <td className="px-3 py-2">{item.category?.name ?? '—'}</td>
                <td className="px-3 py-2">{item.status === 'PUBLISHED' ? (language === 'kaz' ? 'Жарияланған' : 'Опубликован') : language === 'kaz' ? 'Жоба' : 'Черновик'}</td>
                <td className="px-3 py-2">{formatDate(item.publicationDate)}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/items/${item.id}`} className="text-brand-700 hover:text-brand-800">
                      {language === 'kaz' ? 'Өңдеу' : 'Редактировать'}
                    </Link>
                    <button type="button" className="text-slate-700 hover:text-slate-900" onClick={() => void toggleStatus(item)} disabled={isBusy}>
                      {item.status === 'PUBLISHED' ? (language === 'kaz' ? 'Жобаға ауыстыру' : 'В черновик') : language === 'kaz' ? 'Жариялау' : 'Опубликовать'}
                    </button>
                    <button type="button" className="text-red-700 hover:text-red-800" onClick={() => setDeleteId(item.id)} disabled={isBusy}>
                      {language === 'kaz' ? 'Жою' : 'Удалить'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {!isLoading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                  {language === 'kaz' ? 'Материалдар табылмады.' : 'Материалы не найдены.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={() => void runBulk('publish')} disabled={selected.length === 0 || isBusy}>
            {language === 'kaz' ? 'Жаппай жариялау' : 'Массово опубликовать'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void runBulk('draft')} disabled={selected.length === 0 || isBusy}>
            {language === 'kaz' ? 'Жаппай жобаға ауыстыру' : 'Массово в черновик'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void runBulk('delete')} disabled={selected.length === 0 || isBusy}>
            {language === 'kaz' ? 'Жаппай жою' : 'Массово удалить'}
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-600">
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

      {deleteId && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-900">{language === 'kaz' ? 'Материалды жою' : 'Удаление материала'}</h4>
            <p className="mt-1 text-sm text-slate-600">{language === 'kaz' ? 'Материалды жойғыңыз келетініне сенімдісіз бе? Бұл әрекетті болдырмау мүмкін емес.' : 'Вы уверены, что хотите удалить материал? Это действие нельзя отменить.'}</p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteId(null)} disabled={isBusy}>
                {language === 'kaz' ? 'Болдырмау' : 'Отмена'}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void removeItem()} disabled={isBusy}>
                {language === 'kaz' ? 'Жою' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
