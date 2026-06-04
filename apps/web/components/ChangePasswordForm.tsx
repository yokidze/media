'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useLanguage } from '@/components/LanguageProvider';

export function ChangePasswordForm(): React.JSX.Element {
  const router = useRouter();
  const { language } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const text = useMemo(
    () =>
      language === 'kaz'
        ? {
            shortPassword: 'Жаңа құпия сөз кемінде 8 таңбадан тұруы керек.',
            mismatch: 'Құпия сөз растауы сәйкес келмейді.',
            failed: 'Құпия сөзді өзгерту мүмкін болмады',
            title: 'Құпия сөзді өзгерту',
            subtitle: 'Бірінші кіру кезінде уақытша құпия сөзді міндетті түрде өзгерту керек.',
            current: 'Ағымдағы құпия сөз',
            next: 'Жаңа құпия сөз',
            repeat: 'Жаңа құпия сөзді қайталаңыз',
            saving: 'Сақтап жатырмыз...',
            submit: 'Жаңа құпия сөзді сақтау'
          }
        : {
            shortPassword: 'Новый пароль должен содержать минимум 8 символов.',
            mismatch: 'Подтверждение пароля не совпадает.',
            failed: 'Не удалось изменить пароль',
            title: 'Смена пароля',
            subtitle: 'Для первого входа необходимо изменить временный пароль.',
            current: 'Текущий пароль',
            next: 'Новый пароль',
            repeat: 'Повторите новый пароль',
            saving: 'Сохраняем...',
            submit: 'Сохранить новый пароль'
          },
    [language]
  );

  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(text.shortPassword);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(text.mismatch);
      return;
    }

    setIsSaving(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      router.push('/account');
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : text.failed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">{text.title}</h1>
      <p className="text-sm text-slate-600">{text.subtitle}</p>

      <label className="space-y-1 text-sm">
        <span className="text-slate-600">{text.current}</span>
        <input type="password" className="input" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
      </label>

      <label className="space-y-1 text-sm">
        <span className="text-slate-600">{text.next}</span>
        <input type="password" className="input" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={8} />
      </label>

      <label className="space-y-1 text-sm">
        <span className="text-slate-600">{text.repeat}</span>
        <input
          type="password"
          className="input"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={8}
        />
      </label>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn btn-primary w-full" disabled={isSaving}>
        {isSaving ? text.saving : text.submit}
      </button>
    </form>
  );
}
