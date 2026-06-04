'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiFetch } from '@/lib/api';
import { StyledSelect } from '@/components/StyledSelect';
import { useLanguage } from '@/components/LanguageProvider';

type UserRole = 'admin' | 'teacher';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface EditableUser {
  fullName: string;
  email: string;
  role: UserRole;
}

interface UsersManagerProps {
  embedded?: boolean;
}

const compactButtonClass =
  'inline-flex items-center rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60';

export function UsersManager({ embedded = false }: UsersManagerProps): React.JSX.Element {
  const { language } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
  const [isBusy, setIsBusy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditableUser | null>(null);
  const [actionMenu, setActionMenu] = useState<{ userId: string; left: number; top: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [page, setPage] = useState(1);

  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const [form, setForm] = useState({
    email: '',
    fullName: '',
    temporaryPassword: '',
    role: 'teacher' as UserRole
  });

  const sectionTitle = useMemo(() => (embedded ? (language === 'kaz' ? 'Пайдаланушыларды басқару' : 'Управление пользователями') : language === 'kaz' ? 'Пайдаланушылар' : 'Пользователи'), [embedded, language]);
  const roleOptions = useMemo(
    () =>
      [
        { value: 'teacher', label: language === 'kaz' ? 'Оқытушы' : 'Преподаватель' },
        { value: 'admin', label: language === 'kaz' ? 'Әкімші' : 'Администратор' }
      ] as const,
    [language]
  );
  const roleFilterOptions = useMemo(
    () =>
      [
        { value: 'all', label: language === 'kaz' ? 'Барлық рөлдер' : 'Все роли' },
        { value: 'teacher', label: language === 'kaz' ? 'Оқытушылар' : 'Преподаватели' },
        { value: 'admin', label: language === 'kaz' ? 'Әкімшілер' : 'Администраторы' }
      ] as const,
    [language]
  );
  const roleLabel = (role: UserRole): string => (role === 'admin' ? (language === 'kaz' ? 'Әкімші' : 'Администратор') : language === 'kaz' ? 'Оқытушы' : 'Преподаватель');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const onDocumentPointerDown = (event: MouseEvent): void => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-users-action-menu]') && !target?.closest('[data-users-action-trigger]')) {
        setActionMenu(null);
      }
    };

    document.addEventListener('mousedown', onDocumentPointerDown);
    return () => {
      document.removeEventListener('mousedown', onDocumentPointerDown);
    };
  }, []);

  useEffect(() => {
    const closeMenu = (): void => setActionMenu(null);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);

    return () => {
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setActiveSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const load = async (nextPage = page): Promise<void> => {
    setIsLoading(true);

    const params = new URLSearchParams({
      page: String(nextPage),
      pageSize: '20'
    });

    const trimmedSearch = activeSearch.trim();
    if (trimmedSearch) params.set('search', trimmedSearch);
    if (roleFilter !== 'all') params.set('role', roleFilter);

    try {
      const response = await apiFetch<UsersResponse>(`/users?${params.toString()}`);
      setUsers(response.data);
      setMeta(response.meta);
      setError(null);
      setActionMenu(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Пайдаланушыларды жүктеу мүмкін болмады' : 'Не удалось загрузить пользователей');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
  }, [activeSearch, roleFilter]);

  useEffect(() => {
    void load(page);
  }, [page]);

  const handleSearchSubmit = (event: FormEvent): void => {
    event.preventDefault();
    setPage(1);
    setActiveSearch(searchInput.trim());
  };

  const createUser = async (): Promise<void> => {
    const email = form.email.trim();
    const fullName = form.fullName.trim();
    const temporaryPassword = form.temporaryPassword;

    if (!email) return setError(language === 'kaz' ? 'Пайдаланушының email мекенжайын енгізіңіз.' : 'Введите email пользователя.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(language === 'kaz' ? 'Дұрыс email енгізіңіз.' : 'Укажите корректный email.');
    if (fullName.length < 2) return setError(language === 'kaz' ? 'Т.А.Ә кемінде 2 таңбадан тұруы керек.' : 'ФИО должно содержать минимум 2 символа.');
    if (temporaryPassword.length < 8) return setError(language === 'kaz' ? 'Уақытша құпия сөз кемінде 8 таңбадан тұруы керек.' : 'Временный пароль должен быть не короче 8 символов.');

    setIsBusy(true);
    setError(null);

    try {
      await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify({
          email,
          fullName,
          role: form.role,
          temporaryPassword,
          isActive: true
        })
      });

      setForm({ email: '', fullName: '', temporaryPassword: '', role: 'teacher' });
      setShowCreateForm(false);
      setPage(1);
      await load(1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Пайдаланушыны құру мүмкін болмады.' : 'Не удалось создать пользователя.');
    } finally {
      setIsBusy(false);
    }
  };

  const startEdit = (user: User): void => {
    setEditingId(user.id);
    setEditForm({ fullName: user.fullName, email: user.email, role: user.role });
    setActionMenu(null);
  };

  const saveEdit = async (): Promise<void> => {
    if (!editingId || !editForm) return;

    setIsBusy(true);
    setError(null);

    try {
      await apiFetch(`/users/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: editForm.fullName.trim(),
          email: editForm.email.trim(),
          role: editForm.role
        })
      });

      setEditingId(null);
      setEditForm(null);
      await load(page);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Пайдаланушыны жаңарту мүмкін болмады.' : 'Не удалось обновить пользователя.');
    } finally {
      setIsBusy(false);
    }
  };

  const confirmResetPassword = async (): Promise<void> => {
    if (!resetPasswordUser) return;
    if (resetPasswordValue.trim().length < 8) {
      setError(language === 'kaz' ? 'Уақытша құпия сөз кемінде 8 таңбадан тұруы керек.' : 'Временный пароль должен содержать минимум 8 символов.');
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await apiFetch(`/users/${resetPasswordUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ temporaryPassword: resetPasswordValue.trim() })
      });

      setResetPasswordUser(null);
      setResetPasswordValue('');
      await load(page);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Құпия сөзді қалпына келтіру мүмкін болмады.' : 'Не удалось сбросить пароль.');
    } finally {
      setIsBusy(false);
    }
  };

  const removeUser = async (): Promise<void> => {
    if (!deleteUser) return;

    setIsBusy(true);
    setError(null);

    try {
      await apiFetch(`/users/${deleteUser.id}`, { method: 'DELETE' });
      setDeleteUser(null);
      if (users.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await load(page);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : language === 'kaz' ? 'Пайдаланушыны жою мүмкін болмады.' : 'Не удалось удалить пользователя.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{sectionTitle}</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          {language === 'kaz' ? 'Колледж пайдаланушыларын құру, өңдеу және қолжетімділікті бақылау.' : 'Создание, редактирование и контроль доступа пользователей колледжа.'}
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="card grid gap-2.5 p-3 md:grid-cols-3">
        <input
          className="input md:col-span-2"
          placeholder={language === 'kaz' ? 'Т.А.Ә немесе email бойынша іздеу' : 'Поиск по ФИО или email'}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />

        <StyledSelect
          value={roleFilter}
          placeholder={language === 'kaz' ? 'Рөл' : 'Роль'}
          options={roleFilterOptions as unknown as Array<{ value: string; label: string }>}
          onChange={(value) => {
            setPage(1);
            setRoleFilter(value as 'all' | UserRole);
          }}
        />

        <div className="md:col-span-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            className={compactButtonClass}
            disabled={isLoading || isBusy}
            onClick={() => {
              setSearchInput('');
              setActiveSearch('');
              setRoleFilter('all');
              setPage(1);
            }}
          >
            {language === 'kaz' ? 'Тазарту' : 'Сбросить'}
          </button>
        </div>
      </form>

      <div className="card p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-slate-600">{language === 'kaz' ? 'Жаңа пайдаланушы' : 'Новый пользователь'}</p>
          <button type="button" className={compactButtonClass} onClick={() => setShowCreateForm((state) => !state)}>
            {showCreateForm ? (language === 'kaz' ? 'Жасыру' : 'Скрыть') : language === 'kaz' ? 'Қосу' : 'Добавить'}
          </button>
        </div>

        {showCreateForm && (
          <div className="mt-2.5 grid gap-2.5 md:grid-cols-[1fr_1fr_1fr_220px_auto]">
            <input className="input" placeholder="Email" value={form.email} onChange={(event) => setForm((s) => ({ ...s, email: event.target.value }))} />
            <input className="input" placeholder={language === 'kaz' ? 'Т.А.Ә' : 'ФИО'} value={form.fullName} onChange={(event) => setForm((s) => ({ ...s, fullName: event.target.value }))} />
            <input
              className="input"
              type="password"
              placeholder={language === 'kaz' ? 'Уақытша құпия сөз' : 'Временный пароль'}
              value={form.temporaryPassword}
              onChange={(event) => setForm((s) => ({ ...s, temporaryPassword: event.target.value }))}
            />
            <StyledSelect
              value={form.role}
              placeholder={language === 'kaz' ? 'Рөл' : 'Роль'}
              options={roleOptions as unknown as Array<{ value: string; label: string }>}
              onChange={(value) => setForm((s) => ({ ...s, role: value as UserRole }))}
            />
            <button type="button" className="btn btn-primary" onClick={() => void createUser()} disabled={isBusy || isLoading}>
              {language === 'kaz' ? 'Қосу' : 'Добавить'}
            </button>
          </div>
        )}
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="card">
        <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Т.А.Ә' : 'ФИО'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Рөл' : 'Роль'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Бірінші кіру' : 'Первый вход'}</th>
              <th className="px-3 py-2">{language === 'kaz' ? 'Әрекеттер' : 'Действия'}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isEditing = editingId === user.id && editForm;
              return (
                <tr key={user.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-2">{isEditing ? <input className="input" value={editForm.email} onChange={(event) => setEditForm((s) => (s ? { ...s, email: event.target.value } : s))} /> : user.email}</td>

                  <td className="px-3 py-2">{isEditing ? <input className="input" value={editForm.fullName} onChange={(event) => setEditForm((s) => (s ? { ...s, fullName: event.target.value } : s))} /> : user.fullName}</td>

                  <td className="px-3 py-2">
                    {isEditing ? (
                      <StyledSelect
                        value={editForm.role}
                        placeholder={language === 'kaz' ? 'Рөл' : 'Роль'}
                        options={roleOptions as unknown as Array<{ value: string; label: string }>}
                        onChange={(value) => setEditForm((s) => (s ? { ...s, role: value as UserRole } : s))}
                      />
                    ) : (
                      roleLabel(user.role)
                    )}
                  </td>

                  <td className="px-3 py-2">{user.mustChangePassword ? (language === 'kaz' ? 'Ауыстыру қажет' : 'Требуется смена') : language === 'kaz' ? 'Орындалды' : 'ОК'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button type="button" className={compactButtonClass} onClick={() => void saveEdit()} disabled={isBusy || isLoading}>
                            {language === 'kaz' ? 'Сақтау' : 'Сохранить'}
                          </button>
                          <button
                            type="button"
                            className={compactButtonClass}
                            onClick={() => {
                              setEditingId(null);
                              setEditForm(null);
                            }}
                            disabled={isBusy || isLoading}
                          >
                            {language === 'kaz' ? 'Болдырмау' : 'Отмена'}
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="relative" data-users-action-menu>
                            <button
                              type="button"
                              data-users-action-trigger
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                              onClick={(event) => {
                                const target = event.currentTarget;
                                const rect = target.getBoundingClientRect();
                                const menuWidth = 208;
                                const menuHeight = 132;
                                const viewportPadding = 8;
                                const left = Math.max(
                                  viewportPadding,
                                  Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - viewportPadding)
                                );
                                const openUpward = rect.bottom + menuHeight + 8 > window.innerHeight;
                                const top = openUpward ? Math.max(viewportPadding, rect.top - menuHeight - 6) : rect.bottom + 6;

                                setActionMenu((current) => (current?.userId === user.id ? null : { userId: user.id, left, top }));
                              }}
                              disabled={isBusy || isLoading}
                              aria-label={language === 'kaz' ? 'Қосымша әрекеттер' : 'Дополнительные действия'}
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                                <path d="M6.5 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                              </svg>
                            </button>

                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                  {language === 'kaz' ? 'Пайдаланушылар табылмады.' : 'Пользователи не найдены.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {isMounted &&
        actionMenu &&
        createPortal(
          (() => {
            const menuUser = users.find((entry) => entry.id === actionMenu.userId);
            if (!menuUser) return null;

            return (
              <div
                data-users-action-menu
                className="fixed z-[120] w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                style={{ left: `${actionMenu.left}px`, top: `${actionMenu.top}px` }}
              >
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    setActionMenu(null);
                    startEdit(menuUser);
                  }}
                >
                  {language === 'kaz' ? 'Өңдеу' : 'Редактировать'}
                </button>
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  onClick={() => {
                    setActionMenu(null);
                    setResetPasswordUser(menuUser);
                    setResetPasswordValue('');
                  }}
                >
                  {language === 'kaz' ? 'Құпия сөзді қалпына келтіру' : 'Сбросить пароль'}
                </button>
                <button
                  type="button"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  onClick={() => {
                    setActionMenu(null);
                    setDeleteUser(menuUser);
                  }}
                >
                  {language === 'kaz' ? 'Жою' : 'Удалить'}
                </button>
              </div>
            );
          })(),
          document.body
        )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          {language === 'kaz' ? 'Барлығы' : 'Всего'}: <span className="font-semibold text-slate-900">{meta.total}</span>
        </span>
        <div className="flex items-center gap-1.5">
          <button type="button" className={compactButtonClass} disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>
            {language === 'kaz' ? 'Артқа' : 'Назад'}
          </button>
          <span className="px-1">{meta.page} / {Math.max(meta.totalPages, 1)}</span>
          <button type="button" className={compactButtonClass} disabled={page >= Math.max(meta.totalPages, 1) || isLoading} onClick={() => setPage((current) => current + 1)}>
            {language === 'kaz' ? 'Келесі' : 'Далее'}
          </button>
        </div>
      </div>

      {resetPasswordUser && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-900">{language === 'kaz' ? 'Құпия сөзді қалпына келтіру' : 'Сброс пароля'}</h4>
            <p className="mt-1 text-sm text-slate-500">
              {language === 'kaz' ? (
                <>Пайдаланушы үшін жаңа уақытша құпия сөзді енгізіңіз <span className="font-medium text-slate-700">{resetPasswordUser.email}</span>.</>
              ) : (
                <>Укажите новый временный пароль для пользователя <span className="font-medium text-slate-700">{resetPasswordUser.email}</span>.</>
              )}
            </p>

            <label className="mt-4 block space-y-1 text-sm">
              <span className="text-slate-600">{language === 'kaz' ? 'Уақытша құпия сөз' : 'Временный пароль'}</span>
              <input className="input" type="password" value={resetPasswordValue} onChange={(event) => setResetPasswordValue(event.target.value)} minLength={8} />
            </label>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                className={compactButtonClass}
                onClick={() => {
                  setResetPasswordUser(null);
                  setResetPasswordValue('');
                }}
                disabled={isBusy}
              >
                {language === 'kaz' ? 'Болдырмау' : 'Отмена'}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void confirmResetPassword()} disabled={isBusy}>
                {language === 'kaz' ? 'Растау' : 'Подтвердить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteUser && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h4 className="text-lg font-semibold text-slate-900">{language === 'kaz' ? 'Пайдаланушыны жою' : 'Удаление пользователя'}</h4>
            <p className="mt-1 text-sm text-slate-600">
              {language === 'kaz'
                ? `Пайдаланушыны жойғыңыз келетініне сенімдісіз бе: ${deleteUser.email}? Бұл әрекетті болдырмау мүмкін емес.`
                : `Вы уверены, что хотите удалить пользователя ${deleteUser.email}? Это действие нельзя отменить.`}
            </p>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" className={compactButtonClass} onClick={() => setDeleteUser(null)} disabled={isBusy}>
                {language === 'kaz' ? 'Болдырмау' : 'Отмена'}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void removeUser()} disabled={isBusy}>
                {language === 'kaz' ? 'Жою' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
