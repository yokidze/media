'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { emitProfileUpdated } from '@/lib/profile-events';
import { formatDate } from '@/lib/utils';
import { useLanguage } from '@/components/LanguageProvider';
import { AccountAdminPanel } from '@/components/AccountAdminPanel';
import type { ContentSection } from '@/lib/types';

interface MeResponse {
  id: string;
  email: string;
  fullName: string;
  role?: 'admin' | 'teacher';
  roles?: string[];
  jobTitle: string | null;
  department: string | null;
  phone: string | null;
  profilePhotoUrl: string | null;
  mustChangePassword?: boolean;
  createdAt: string;
}

interface MyMaterial {
  id: string;
  slug: string;
  title: string;
  contentSection: ContentSection;
  publicationDate: string | null;
  archiveYear: number | null;
  status: 'DRAFT' | 'PUBLISHED';
  category: { id: string; name: string; nameRu?: string | null; nameKaz?: string | null } | null;
}

interface ProfileFormState {
  fullName: string;
  jobTitle: string;
  department: string;
  email: string;
  phone: string;
}

const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const AVATAR_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const createFormFromProfile = (profile: MeResponse): ProfileFormState => ({
  fullName: profile.fullName,
  jobTitle: profile.jobTitle ?? '',
  department: profile.department ?? '',
  email: profile.email,
  phone: profile.phone ?? ''
});

const hasImageUrl = (value: string | null | undefined): boolean => Boolean(value && value.trim().length > 0);

export function AccountOverview(): React.JSX.Element {
  const router = useRouter();
  const { categoryLabel, sectionTypeLabel, t, language } = useLanguage();
  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [myMaterials, setMyMaterials] = useState<MyMaterial[]>([]);
  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isAvatarRemoving, setIsAvatarRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const applyProfile = (next: MeResponse): void => {
    setProfile(next);
    setForm(createFormFromProfile(next));
    emitProfileUpdated({ fullName: next.fullName, profilePhotoUrl: next.profilePhotoUrl });
  };

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        const [meResponse, myMaterialsResponse] = await Promise.all([
          apiFetch<MeResponse>('/auth/me'),
          apiFetch<MyMaterial[]>('/auth/me/materials')
        ]);

        if (meResponse.mustChangePassword) {
          router.replace('/account/change-password');
          return;
        }

        applyProfile(meResponse);
        setMyMaterials(myMaterialsResponse);
        setError(null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : t('accountLoadFailed'));
      }
    };

    void load();
  }, [router, t]);

  const initials = useMemo(() => {
    if (!profile) return 'PM';

    const parts = profile.fullName
      .split(' ')
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (parts.length === 0) return 'PM';
    return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
  }, [profile]);

  const isAdmin = profile?.role === 'admin' || profile?.roles?.includes('ADMIN') || false;

  const cancelEdit = (): void => {
    if (!profile) return;
    setForm(createFormFromProfile(profile));
    setIsEditing(false);
    setSaveError(null);
    setSaveMessage(null);
  };

  const saveProfile = async (): Promise<void> => {
    if (!form) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const updated = await apiFetch<MeResponse>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          jobTitle: form.jobTitle.trim() || null,
          department: form.department.trim() || null,
          email: form.email.trim(),
          phone: form.phone.trim() || null
        })
      });

      applyProfile(updated);
      setIsEditing(false);
      setSaveMessage(t('accountProfileUpdated'));
    } catch (requestError) {
      const fallback = t('accountSaveFailed');
      setSaveError(requestError instanceof Error ? `${fallback}: ${requestError.message}` : fallback);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File): Promise<void> => {
    if (!AVATAR_ALLOWED_TYPES.has(file.type)) {
      setAvatarError(t('accountAvatarInvalidType'));
      return;
    }

    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      setAvatarError(t('accountAvatarTooLarge'));
      return;
    }

    setIsAvatarUploading(true);
    setAvatarError(null);
    setSaveMessage(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const updated = await apiFetch<MeResponse>('/auth/me/avatar', {
        method: 'POST',
        body: formData,
        headers: {}
      });

      applyProfile(updated);
    } catch (requestError) {
      const fallback = t('accountAvatarUploadFailed');
      setAvatarError(requestError instanceof Error ? `${fallback}: ${requestError.message}` : fallback);
    } finally {
      setIsAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  const removeAvatar = async (): Promise<void> => {
    setIsAvatarRemoving(true);
    setAvatarError(null);
    setSaveMessage(null);

    try {
      const updated = await apiFetch<MeResponse>('/auth/me/avatar', {
        method: 'DELETE'
      });

      applyProfile(updated);
    } catch (requestError) {
      const fallback = t('accountAvatarDeleteFailed');
      setAvatarError(requestError instanceof Error ? `${fallback}: ${requestError.message}` : fallback);
    } finally {
      setIsAvatarRemoving(false);
    }
  };

  const logout = async (): Promise<void> => {
    setError(null);
    setIsLoggingOut(true);
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors on client side; redirect to login anyway.
    } finally {
      emitProfileUpdated({ fullName: '', profilePhotoUrl: null });
      router.push('/login');
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  if (error) {
    return (
      <div className="card p-6 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/login" className="mt-3 inline-block text-brand-700 hover:text-brand-800">
          {t('accountLoginAction')}
        </Link>
      </div>
    );
  }

  if (!profile || !form) {
    return <div className="card p-6 text-center text-slate-500">{t('accountLoading')}</div>;
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="mb-5 space-y-2">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-slate-900">
            {t('accountBackHome')}
          </Link>

          <nav aria-label={t('accountBreadcrumbs')} className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="transition hover:text-slate-700">
              {t('catalogBreadcrumbHome')}
            </Link>
            <span className="text-slate-300">/</span>
            <span aria-current="page" className="text-slate-600">
              {t('accountBreadcrumbProfile')}
            </span>
          </nav>
        </div>

        <h1 className="text-2xl font-bold">{t('accountTitle')}</h1>
        <div className="mt-5 flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{t('accountSectionMain')}</h2>
          <div className="flex items-center gap-3">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-slate-400 transition hover:text-slate-600 hover:underline"
              >
                {t('accountEditProfile')}
              </button>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              disabled={isLoggingOut}
              className="text-xs font-medium text-slate-400 transition hover:text-slate-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? `${t('accountLogout')}...` : t('accountLogout')}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-5 md:grid-cols-[170px_1fr]">
          <div>
            <div className="grid place-items-start">
              {hasImageUrl(profile.profilePhotoUrl) ? (
                <img src={profile.profilePhotoUrl ?? ''} alt={profile.fullName} className="h-28 w-28 rounded-2xl border border-slate-200 object-cover" />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-2xl border border-slate-200 bg-slate-100 text-2xl font-semibold text-slate-700">{initials}</div>
              )}
            </div>

            <input
              ref={avatarInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) {
                  void handleAvatarUpload(selected);
                }
              }}
            />

            {isEditing && (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isAvatarUploading || isAvatarRemoving}
                  >
                    {isAvatarUploading ? t('accountAvatarUploading') : hasImageUrl(profile.profilePhotoUrl) ? t('accountAvatarChange') : t('accountAvatarUpload')}
                  </button>

                  {hasImageUrl(profile.profilePhotoUrl) && (
                    <button type="button" className="btn btn-secondary" onClick={() => void removeAvatar()} disabled={isAvatarUploading || isAvatarRemoving}>
                      {isAvatarRemoving ? t('accountAvatarRemoving') : t('accountAvatarRemove')}
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500">{t('accountAvatarHint')}</p>
                {avatarError && <p className="mt-2 text-sm text-red-600">{avatarError}</p>}
              </>
            )}
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">{language === 'kaz' ? 'Т.А.Ә' : 'ФИО'}</dt>
              <dd className="font-medium text-slate-900">{profile.fullName}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('accountEmail')}</dt>
              <dd className="font-medium text-slate-900">{profile.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('accountJobTitle')}</dt>
              <dd className="font-medium text-slate-900">{profile.jobTitle || t('accountNotSpecified')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('accountDepartment')}</dt>
              <dd className="font-medium text-slate-900">{profile.department || t('accountNotSpecified')}</dd>
            </div>
            <div>
              <dt className="text-slate-500">{t('accountPhone')}</dt>
              <dd className="font-medium text-slate-900">{profile.phone || t('accountNotSpecified')}</dd>
            </div>
          </dl>
        </div>

        {isEditing && (
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
            <p className="text-sm text-slate-500">{t('accountEditHint')}</p>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-slate-600">{language === 'kaz' ? 'Т.А.Ә' : 'ФИО'}</span>
                <input
                  className="input"
                  value={form.fullName}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, fullName: event.target.value } : prev))}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-600">{t('accountJobTitle')}</span>
                <input
                  className="input"
                  value={form.jobTitle}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, jobTitle: event.target.value } : prev))}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-600">{t('accountDepartment')}</span>
                <input
                  className="input"
                  value={form.department}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, department: event.target.value } : prev))}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-600">{t('accountEmail')}</span>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, email: event.target.value } : prev))}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-600">{t('accountPhoneOptional')}</span>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => (prev ? { ...prev, phone: event.target.value } : prev))}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className="btn btn-primary" onClick={() => void saveProfile()} disabled={isSaving}>
                {isSaving ? `${t('accountSaveProfile')}...` : t('accountSaveProfile')}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit} disabled={isSaving}>
                {t('accountCancelEdit')}
              </button>
            </div>
          </div>
        )}

        {saveError && <p className="mt-4 text-sm text-red-600">{saveError}</p>}
        {saveMessage && <p className="mt-4 text-sm text-emerald-600">{saveMessage}</p>}
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">
            {t('accountSectionMaterials')} ({myMaterials.length})
          </h2>
          <Link href="/archive" className="btn btn-secondary">
            {t('homeGoToCatalog')}
          </Link>
        </div>

        {myMaterials.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">{t('accountNoMaterials')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {myMaterials.map((item) => (
              <li key={item.id} className="rounded-lg border border-slate-200 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {sectionTypeLabel(item.contentSection)}
                      {item.publicationDate ? ` • ${formatDate(item.publicationDate)}` : item.archiveYear ? ` • ${item.archiveYear}` : ''}
                      {item.category ? ` • ${categoryLabel(item.category)}` : ''}
                    </p>
                  </div>

                  <Link href={`/archive/${item.slug}`} className="shrink-0 text-sm font-semibold text-brand-700 hover:text-brand-800">
                    {t('accountOpenMaterial')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin && <AccountAdminPanel />}

    </div>
  );
}
