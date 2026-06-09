'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DatePickerInput } from '@/components/DatePickerInput';
import { StyledSelect } from '@/components/StyledSelect';
import { apiFetch } from '@/lib/api';
import { toSectionFromMaterialType } from '@/lib/archive';
import type { ArchiveItem, MaterialType } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { withClientApiPath } from '@/lib/config';

interface ArchiveItemCardProps {
  item: ArchiveItem;
  canManage?: boolean;
  editableOptions?: {
    categories: Array<{ id: string; name: string; nameRu?: string | null; nameKaz?: string | null }>;
    materialTypes: string[];
  };
}

const isMaterialType = (value: string): value is MaterialType => {
  return ['DOCUMENT', 'ARTICLE', 'NEWSPAPER', 'BOOKLET', 'UMKD', 'IMAGE', 'VIDEO', 'AUDIO', 'SCAN', 'OTHER'].includes(value);
};

const friendlyManageError = (error: unknown, fallback: string, language: 'rus' | 'kaz'): string => {
  const message = error instanceof Error ? error.message : '';
  const normalized = message.toLowerCase();

  if (normalized.includes('csrf')) {
    return language === 'kaz' ? 'Сессия жаңартылды. Бетті жаңартып, қайта көріңіз.' : 'Сессия обновилась. Обновите страницу и попробуйте снова.';
  }

  if (normalized.includes('forbidden')) {
    return language === 'kaz' ? 'Бұл әрекетке сізде құқық жоқ.' : 'У вас нет прав для этого действия.';
  }

  if (normalized.includes('unique') || normalized.includes('already exists')) {
    return language === 'kaz' ? 'Мұндай атаумен материал бұрыннан бар. Басқа атау көрсетіңіз.' : 'Материал с таким названием уже существует. Укажите другое название.';
  }

  if (message.trim()) {
    return message;
  }

  return fallback;
};

export function ArchiveItemCard({ item, canManage = false, editableOptions }: ArchiveItemCardProps): React.JSX.Element {
  const primary = item.files.find((file) => file.isPrimary) ?? item.files[0];
  const { categoryLabel, materialTypeLabel, sectionLabel, t, language } = useLanguage();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [publicationDate, setPublicationDate] = useState(item.publicationDate ? item.publicationDate.slice(0, 10) : '');
  const [categoryId, setCategoryId] = useState(item.category?.id ?? '');
  const [materialType, setMaterialType] = useState<string>(item.materialType);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const categories = editableOptions?.categories ?? [];
  const materialTypes = editableOptions?.materialTypes ?? [];

  useEffect(() => {
    if (!menuOpen) return;

    const handleOutside = (event: MouseEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [menuOpen]);

  const resetForm = (): void => {
    setTitle(item.title);
    setDescription(item.description);
    setPublicationDate(item.publicationDate ? item.publicationDate.slice(0, 10) : '');
    setCategoryId(item.category?.id ?? '');
    setMaterialType(item.materialType);
    setError(null);
  };

  const canSubmit = useMemo(() => {
    return title.trim().length >= 2 && description.trim().length >= 10;
  }, [title, description]);

  const submitEdit = async (): Promise<void> => {
    const nextTitle = title.trim();
    const nextDescription = description.trim();

    if (nextTitle.length < 2) {
      setError(t('cardManageValidationTitle'));
      return;
    }

    if (nextDescription.length < 10) {
      setError(t('cardManageValidationDescription'));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload: Record<string, unknown> = {
        title: nextTitle,
        description: nextDescription
      };

      if (materialType !== item.materialType && isMaterialType(materialType)) {
        payload.materialType = materialType;
        payload.contentSection = toSectionFromMaterialType(materialType);
      }

      if (categoryId !== (item.category?.id ?? '')) {
        payload.categoryId = categoryId || null;
      }

      const initialDate = item.publicationDate ? item.publicationDate.slice(0, 10) : '';
      if (publicationDate !== initialDate) {
        if (!publicationDate) {
          payload.publicationDate = null;
          payload.archiveYear = null;
        } else {
          const parsedDate = new Date(publicationDate);
          payload.publicationDate = parsedDate.toISOString();
          payload.archiveYear = parsedDate.getFullYear();
        }
      }

      await apiFetch<ArchiveItem>(`/archive-items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      setEditOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(friendlyManageError(requestError, t('cardManageSaveFailed'), language));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteItem = async (): Promise<void> => {
    setIsDeleting(true);
    setError(null);

    try {
      await apiFetch(`/archive-items/${item.id}`, { method: 'DELETE' });
      setDeleteOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(friendlyManageError(requestError, t('cardManageDeleteFailed'), language));
    } finally {
      setIsDeleting(false);
      setMenuOpen(false);
    }
  };

  const openDetails = (): void => {
    router.push(`/archive/${item.slug}`);
  };

  const handleCardClick = (event: React.MouseEvent<HTMLElement>): void => {
    const target = event.target as HTMLElement;
    if (target.closest('a, button, input, textarea, select, [role="button"]')) {
      return;
    }

    openDetails();
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openDetails();
  };

  return (
    <>
      <article
        className="card cursor-pointer overflow-hidden transition hover:-translate-y-0.5 hover:shadow-soft"
        role="link"
        tabIndex={0}
        aria-label={language === 'kaz' ? `Материалды ашу: ${item.title}` : `Открыть материал: ${item.title}`}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">{sectionLabel(item.contentSection)}</span>
            <div className="flex items-center gap-2">
              {item.archiveYear ? <span className="text-xs text-slate-500">{item.archiveYear}</span> : null}
              {canManage && (
                <div ref={menuRef} className="relative">
                  <button
                    type="button"
                    className="grid h-7 w-7 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                    onClick={() => setMenuOpen((current) => !current)}
                    aria-label={t('cardManageOpenMenu')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden="true">
                      <path d="m4 20 4.2-1L18 9.2a2.1 2.1 0 1 0-3-3L5.2 16 4 20Z" />
                      <path d="m13.5 7.5 3 3" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-8 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                      <button
                        type="button"
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
                        onClick={() => {
                          resetForm();
                          setMenuOpen(false);
                          setEditOpen(true);
                        }}
                      >
                        {t('cardManageEdit')}
                      </button>
                      <button
                        type="button"
                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50"
                        onClick={() => {
                          setMenuOpen(false);
                          setDeleteOpen(true);
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? t('cardManageDeleting') : t('cardManageDelete')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-slate-900">
            <Link href={`/archive/${item.slug}`} className="hover:text-brand-700">
              {item.title}
            </Link>
          </h3>

          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.description}</p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
            <span>
              {t('cardType')}: {materialTypeLabel(item.materialType)}
            </span>
            <span>
              {t('cardDate')}: {formatDate(item.publicationDate)}
            </span>
            <span>
              {t('cardCategory')}: {item.category ? categoryLabel(item.category) : t('cardNoCategory')}
            </span>
            <span>
              {t('cardViews')}: {item.viewsCount}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">{item.author?.fullName ?? t('cardAuthorUnknown')}</span>
            {primary ? (
              <Link href={withClientApiPath(`/files/${primary.id}/download`)} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                {t('cardDownload')}
              </Link>
            ) : (
              <span className="text-xs text-slate-400">{t('cardNoFile')}</span>
            )}
          </div>
        </div>
      </article>

      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-6">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-6">
            <h3 className="text-xl font-semibold text-slate-900">{t('cardManageEditTitle')}</h3>

            <div className="mt-4 grid gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-800">{t('cardManageTitle')}</label>
                <input className="input" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>

              <div className="textarea-shell">
                <label className="mb-1 block text-sm font-medium text-slate-800">{t('cardManageDescription')}</label>
                <textarea className="input textarea-field min-h-[110px]" value={description} onChange={(event) => setDescription(event.target.value)} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-800">{t('cardManageDate')}</label>
                  <DatePickerInput value={publicationDate} onChange={setPublicationDate} />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-800">{t('cardManageCategory')}</label>
                  <StyledSelect
                    value={categoryId}
                    placeholder={t('cardManageNoCategory')}
                    options={[
                      { value: '', label: t('cardManageNoCategory') },
                      ...categories.map((category) => ({ value: category.id, label: categoryLabel(category) }))
                    ]}
                    onChange={setCategoryId}
                  />
                </div>
              </div>

              <div className="max-w-sm">
                <label className="mb-1 block text-sm font-medium text-slate-800">{t('cardManageMaterialType')}</label>
                <StyledSelect
                  value={materialType}
                  placeholder={t('cardManageMaterialType')}
                  options={materialTypes.map((type) => ({
                    value: type,
                    label: isMaterialType(type) ? materialTypeLabel(type) : type
                  }))}
                  onChange={setMaterialType}
                />
              </div>

              {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditOpen(false);
                  setError(null);
                }}
                disabled={isSaving}
              >
                {t('cardManageCancel')}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void submitEdit()} disabled={!canSubmit || isSaving}>
                {isSaving ? t('cardManageSaving') : t('cardManageSave')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl md:p-6">
            <h3 className="text-xl font-semibold text-slate-900">{t('cardManageDeleteTitle')}</h3>
            <p className="mt-2 text-sm text-slate-600">{t('cardManageDeleteConfirm')}</p>

            {error && <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setDeleteOpen(false);
                  setError(null);
                }}
                disabled={isDeleting}
              >
                {t('cardManageCancel')}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void deleteItem()} disabled={isDeleting}>
                {isDeleting ? t('cardManageDeleting') : t('cardManageDelete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
