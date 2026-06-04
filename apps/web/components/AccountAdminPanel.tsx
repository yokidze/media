'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

export function AccountAdminPanel(): React.JSX.Element {
  const { language } = useLanguage();

  return (
    <section className="card p-5">
      <h2 className="text-xl font-semibold text-slate-900">{language === 'kaz' ? 'Әкімші панелі' : 'Панель администратора'}</h2>
      <p className="mt-1 text-sm text-slate-600">
        {language === 'kaz'
          ? 'Пайдаланушыларды және баптауларды басқару жеке әкімшілік панельде қолжетімді.'
          : 'Управление пользователями и настройками доступно в отдельной административной панели.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin" className="btn btn-primary">
          {language === 'kaz' ? 'Панельді ашу' : 'Открыть панель'}
        </Link>
        <Link href="/admin/users" className="btn btn-secondary">
          {language === 'kaz' ? 'Пайдаланушылар' : 'Пользователи'}
        </Link>
      </div>
    </section>
  );
}
