'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }): React.JSX.Element {
  const { language } = useLanguage();

  return (
    <div className="container-shell py-20 text-center">
      <p className="text-sm uppercase tracking-[0.12em] text-red-500">{language === 'kaz' ? 'Қате' : 'Ошибка'}</p>
      <h1 className="mt-2 text-3xl font-bold">{language === 'kaz' ? 'Бетті жүктеу мүмкін болмады' : 'Не удалось загрузить страницу'}</h1>
      <p className="mt-3 text-slate-600">{error.message}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button type="button" className="btn btn-primary" onClick={() => reset()}>
          {language === 'kaz' ? 'Қайталау' : 'Повторить'}
        </button>
        <Link href="/" className="btn btn-secondary">
          {language === 'kaz' ? 'Басты бетке' : 'На главную'}
        </Link>
      </div>
    </div>
  );
}
