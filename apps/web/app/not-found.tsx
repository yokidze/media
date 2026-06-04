'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

export default function NotFoundPage(): React.JSX.Element {
  const { language } = useLanguage();

  return (
    <div className="container-shell py-20 text-center">
      <p className="text-sm uppercase tracking-[0.12em] text-slate-500">404</p>
      <h1 className="mt-2 text-4xl font-bold">{language === 'kaz' ? 'Бет табылмады' : 'Страница не найдена'}</h1>
      <p className="mt-3 text-slate-600">
        {language === 'kaz' ? 'Сұралған материал жоқ немесе басқа жерге жылжытылған.' : 'Запрошенный материал отсутствует или был перемещён.'}
      </p>
      <Link href="/" className="btn btn-primary mt-6 inline-block">
        {language === 'kaz' ? 'Басты бетке оралу' : 'Вернуться на главную'}
      </Link>
    </div>
  );
}
