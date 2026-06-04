'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { apiFetch } from '@/lib/api';
import { emitProfileUpdated } from '@/lib/profile-events';
import { useLanguage } from '@/components/LanguageProvider';

const buildSchema = (language: 'rus' | 'kaz') =>
  z.object({
    email: z.string().email(language === 'kaz' ? 'Email пішімі қате.' : 'Некорректный формат email.'),
    password: z.string().min(8, language === 'kaz' ? 'Құпия сөз кемінде 8 таңбадан тұруы керек.' : 'Пароль должен содержать минимум 8 символов.')
  });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: 'admin' | 'teacher';
    mustChangePassword: boolean;
  };
  csrfToken: string;
}

interface MeResponse {
  id: string;
}

export function LoginForm(): React.JSX.Element {
  const router = useRouter();
  const { language } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const schema = useMemo(() => buildSchema(language), [language]);

  const text = useMemo(
    () =>
      language === 'kaz'
        ? {
            loginFailed: 'Кіру мүмкін болмады',
            checkingSession: 'Сессия тексерілуде...',
            title: 'Жүйеге кіру',
            subtitle: 'Архив қызметкерлері мен әкімшілері үшін.',
            password: 'Құпия сөз',
            loading: 'Кіру орындалуда...',
            submit: 'Кіру'
          }
        : {
            loginFailed: 'Не удалось войти',
            checkingSession: 'Проверяем сессию...',
            title: 'Вход в систему',
            subtitle: 'Для сотрудников и администраторов архива.',
            password: 'Пароль',
            loading: 'Выполняется вход...',
            submit: 'Войти'
          },
    [language]
  );

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  useEffect(() => {
    const checkSession = async (): Promise<void> => {
      try {
        await apiFetch<MeResponse>('/auth/me');
        router.replace('/');
        router.refresh();
      } catch {
        setIsCheckingSession(false);
      }
    };

    void checkSession();
  }, [router]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values)
      });

      emitProfileUpdated({ fullName: response.user.fullName, profilePhotoUrl: null });

      if (response.user.mustChangePassword) {
        router.push('/account/change-password');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : text.loginFailed);
    } finally {
      setIsLoading(false);
    }
  });

  if (isCheckingSession) {
    return <div className="card mx-auto max-w-md p-6 text-center text-slate-600">{text.checkingSession}</div>;
  }

  return (
    <form onSubmit={onSubmit} className="card mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">{text.title}</h1>
      <p className="text-sm text-slate-600">{text.subtitle}</p>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <input id="email" type="email" className="input" {...register('email')} />
        {formState.errors.email && <p className="mt-1 text-xs text-red-600">{formState.errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          {text.password}
        </label>
        <input id="password" type="password" className="input" {...register('password')} />
        {formState.errors.password && <p className="mt-1 text-xs text-red-600">{formState.errors.password.message}</p>}
      </div>

      {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
        {isLoading ? text.loading : text.submit}
      </button>
    </form>
  );
}
