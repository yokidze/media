'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/components/LanguageProvider';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

interface CategoryForm {
  name: string;
  description: string;
}

export function CategoriesManager(): React.JSX.Element {
  const { language } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CategoryForm>({ name: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>({ name: '', description: '' });
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const load = async (): Promise<void> => {
    setIsLoading(true);

    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());

    try {
      const data = await apiFetch<Category[]>(`/categories${params.toString() ? `?${params.toString()}` : ''}`);
      setCategories(data);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Санаттарды жүктеу мүмкін болмады' : 'Не удалось загрузить категории');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [query]);

  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.name.localeCompare(b.name, language === 'kaz' ? 'kk' : 'ru')), [categories, language]);

  const createCategory = async (): Promise<void> => {
    if (createForm.name.trim().length < 2) {
      setError(language === 'kaz' ? 'Санат атауы кемінде 2 таңбадан тұруы керек.' : 'Название категории должно содержать минимум 2 символа.');
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || null
        })
      });

      setCreateForm({ name: '', description: '' });
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Санатты құру мүмкін болмады' : 'Не удалось создать категорию');
    } finally {
      setIsBusy(false);
    }
  };

  const startEdit = (category: Category): void => {
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description ?? ''
    });
  };

  const saveEdit = async (): Promise<void> => {
    if (!editingId) return;
    if (editForm.name.trim().length < 2) {
      setError(language === 'kaz' ? 'Санат атауы кемінде 2 таңбадан тұруы керек.' : 'Название категории должно содержать минимум 2 символа.');
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await apiFetch(`/categories/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null
        })
      });

      setEditingId(null);
      setEditForm({ name: '', description: '' });
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Санатты жаңарту мүмкін болмады' : 'Не удалось обновить категорию');
    } finally {
      setIsBusy(false);
    }
  };

  const removeCategory = async (): Promise<void> => {
    if (!deleteCategory) return;

    setIsBusy(true);
    setError(null);

    try {
      await apiFetch(`/categories/${deleteCategory.id}`, { method: 'DELETE' });
      setDeleteCategory(null);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Санатты жою мүмкін болмады' : 'Не удалось удалить категорию');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{language === 'kaz' ? 'Санаттар' : 'Категории'}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {language === 'kaz' ? 'Материал санаттарын басқару: құру, өңдеу және жою.' : 'Управление категориями материалов: создание, редактирование и удаление.'}
        </p>
      </header>

      <div className="card grid gap-3 p-4 md:grid-cols-[1fr_auto]">
        <input className="input" placeholder={language === 'kaz' ? 'Санатты іздеу' : 'Поиск категории'} value={query} onChange={(event) => setQuery(event.target.value)} />
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setQuery('');
          }}
          disabled={isLoading || isBusy}
        >
          {language === 'kaz' ? 'Тазарту' : 'Сбросить'}
        </button>
      </div>

      <div className="card grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto]">
        <input
          className="input"
          placeholder={language === 'kaz' ? 'Санат атауы' : 'Название категории'}
          value={createForm.name}
          onChange={(event) => setCreateForm((state) => ({ ...state, name: event.target.value }))}
        />
        <input
          className="input"
          placeholder={language === 'kaz' ? 'Сипаттама' : 'Описание'}
          value={createForm.description}
          onChange={(event) => setCreateForm((state) => ({ ...state, description: event.target.value }))}
        />
        <button type="button" className="btn btn-primary" onClick={() => void createCategory()} disabled={isBusy || isLoading}>
          {language === 'kaz' ? 'Қосу' : 'Добавить'}
        </button>
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">{language === 'kaz' ? 'Атауы' : 'Название'}</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Сипаттама' : 'Описание'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Әрекеттер' : 'Действия'}</th>
            </tr>
          </thead>
          <tbody>
            {sortedCategories.map((category) => {
              const isEditing = editingId === category.id;
              return (
                <tr key={category.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2">
                    {isEditing ? (
                      <input className="input" value={editForm.name} onChange={(event) => setEditForm((state) => ({ ...state, name: event.target.value }))} />
                    ) : (
                      category.name
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{category.slug}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {isEditing ? (
                      <input
                        className="input"
                        value={editForm.description}
                        onChange={(event) => setEditForm((state) => ({ ...state, description: event.target.value }))}
                      />
                    ) : (
                      category.description ?? '—'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      {isEditing ? (
                        <>
                          <button type="button" className="btn btn-primary" onClick={() => void saveEdit()} disabled={isBusy}>
                            {language === 'kaz' ? 'Сақтау' : 'Сохранить'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setEditingId(null);
                              setEditForm({ name: '', description: '' });
                            }}
                            disabled={isBusy}
                          >
                            {language === 'kaz' ? 'Болдырмау' : 'Отмена'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="btn btn-secondary" onClick={() => startEdit(category)} disabled={isBusy}>
                            {language === 'kaz' ? 'Өңдеу' : 'Редактировать'}
                          </button>
                          <button type="button" className="btn btn-secondary" onClick={() => setDeleteCategory(category)} disabled={isBusy}>
                            {language === 'kaz' ? 'Жою' : 'Удалить'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!isLoading && sortedCategories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  {language === 'kaz' ? 'Санаттар табылмады.' : 'Категории не найдены.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteCategory && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-900">{language === 'kaz' ? 'Санатты жою' : 'Удаление категории'}</h4>
            <p className="mt-1 text-sm text-slate-600">
              {language === 'kaz' ? `«${deleteCategory.name}» санатын жойғыңыз келе ме? Бұл әрекетті болдырмау мүмкін емес.` : `Удалить категорию «${deleteCategory.name}»? Это действие нельзя отменить.`}
            </p>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteCategory(null)} disabled={isBusy}>
                {language === 'kaz' ? 'Болдырмау' : 'Отмена'}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void removeCategory()} disabled={isBusy}>
                {language === 'kaz' ? 'Жою' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
